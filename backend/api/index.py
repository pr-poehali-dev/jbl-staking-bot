"""API для работы с пользователями, стейкингом и транзакциями"""
import json
import os
import psycopg2
from datetime import datetime, timedelta
from decimal import Decimal

def get_db_connection():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def get_schema():
    return os.environ.get('MAIN_DB_SCHEMA', 'public')

def generate_referral_code():
    import random
    import string
    return 'JBL-' + ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))

def handler(event: dict, context) -> dict:
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Authorization',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    path = event.get('queryStringParameters', {}).get('action', '')
    
    try:
        if path == 'get_user' and method == 'POST':
            return get_or_create_user(event)
        elif path == 'stake' and method == 'POST':
            return create_stake(event)
        elif path == 'unstake' and method == 'POST':
            return unstake(event)
        elif path == 'deposit' and method == 'POST':
            return deposit(event)
        elif path == 'get_stats' and method == 'POST':
            return get_user_stats(event)
        elif path == 'get_referrals' and method == 'POST':
            return get_referrals(event)
        else:
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Endpoint not found'})
            }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)})
        }

def get_or_create_user(event):
    data = json.loads(event.get('body', '{}'))
    wallet_address = data.get('wallet_address')
    telegram_id = data.get('telegram_id')
    referred_by = data.get('referred_by')
    
    if not wallet_address:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'wallet_address required'})
        }
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    schema = get_schema()
    
    cur.execute(f"SELECT * FROM {schema}.users WHERE wallet_address = %s", (wallet_address,))
    user = cur.fetchone()
    
    if not user:
        referral_code = generate_referral_code()
        
        cur.execute(f"""
            INSERT INTO {schema}.users (wallet_address, telegram_id, referral_code, referred_by)
            VALUES (%s, %s, %s, %s)
            RETURNING id, wallet_address, telegram_id, referral_code, balance, total_staked, total_earned, referral_earnings
        """, (wallet_address, telegram_id, referral_code, referred_by))
        
        user = cur.fetchone()
        
        if referred_by:
            cur.execute(f"SELECT id FROM {schema}.users WHERE referral_code = %s", (referred_by,))
            referrer = cur.fetchone()
            if referrer:
                cur.execute(f"""
                    INSERT INTO {schema}.referrals (referrer_id, referred_id)
                    VALUES (%s, %s)
                """, (referrer[0], user[0]))
        
        conn.commit()
    
    result = {
        'id': user[0],
        'wallet_address': user[1],
        'telegram_id': user[2],
        'referral_code': user[3],
        'balance': float(user[4]) if user[4] else 0,
        'total_staked': float(user[5]) if user[5] else 0,
        'total_earned': float(user[6]) if user[6] else 0,
        'referral_earnings': float(user[7]) if user[7] else 0
    }
    
    cur.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps(result)
    }

def create_stake(event):
    data = json.loads(event.get('body', '{}'))
    wallet_address = data.get('wallet_address')
    amount = Decimal(str(data.get('amount', 0)))
    
    if not wallet_address or amount <= 0:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Invalid parameters'})
        }
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    schema = get_schema()
    
    cur.execute(f"SELECT id, balance FROM {schema}.users WHERE wallet_address = %s", (wallet_address,))
    user = cur.fetchone()
    
    if not user or Decimal(str(user[1])) < amount:
        cur.close()
        conn.close()
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Insufficient balance'})
        }
    
    user_id, balance = user[0], Decimal(str(user[1]))
    
    apy = Decimal('12.00')
    daily_reward = (amount * apy / Decimal('100') / Decimal('365'))
    end_date = datetime.now() + timedelta(days=30)
    
    cur.execute(f"""
        INSERT INTO {schema}.stakes (user_id, amount, apy, end_date, daily_reward, status)
        VALUES (%s, %s, %s, %s, %s, %s)
        RETURNING id
    """, (user_id, float(amount), float(apy), end_date, float(daily_reward), 'active'))
    
    stake_id = cur.fetchone()[0]
    
    new_balance = balance - amount
    cur.execute(f"""
        UPDATE {schema}.users SET balance = %s, total_staked = total_staked + %s, updated_at = CURRENT_TIMESTAMP
        WHERE id = %s
    """, (float(new_balance), float(amount), user_id))
    
    cur.execute(f"""
        INSERT INTO {schema}.transactions (user_id, type, amount, status, description)
        VALUES (%s, %s, %s, %s, %s)
    """, (user_id, 'stake', float(amount), 'completed', f'Staked {amount} TON'))
    
    owner_commission = amount * Decimal('0.005')
    
    conn.commit()
    cur.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({
            'stake_id': stake_id,
            'amount': float(amount),
            'daily_reward': float(daily_reward),
            'end_date': end_date.isoformat(),
            'commission': float(owner_commission)
        })
    }

def unstake(event):
    data = json.loads(event.get('body', '{}'))
    wallet_address = data.get('wallet_address')
    stake_id = data.get('stake_id')
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    schema = get_schema()
    
    cur.execute(f"SELECT id FROM {schema}.users WHERE wallet_address = %s", (wallet_address,))
    user = cur.fetchone()
    
    if not user:
        cur.close()
        conn.close()
        return {
            'statusCode': 404,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'User not found'})
        }
    
    user_id = user[0]
    
    cur.execute(f"""
        SELECT amount, daily_reward, start_date, end_date, status 
        FROM {schema}.stakes WHERE id = %s AND user_id = %s
    """, (stake_id, user_id))
    
    stake = cur.fetchone()
    
    if not stake or stake[4] != 'active':
        cur.close()
        conn.close()
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Invalid stake'})
        }
    
    amount, daily_reward, start_date, end_date, _ = stake
    amount = Decimal(str(amount))
    daily_reward = Decimal(str(daily_reward))
    
    days_staked = (datetime.now() - start_date).days
    total_reward = daily_reward * Decimal(str(days_staked))
    
    if datetime.now() < end_date:
        total_reward = total_reward * Decimal('0.9')
    
    total_return = amount + total_reward
    
    cur.execute(f"""
        UPDATE {schema}.stakes SET status = %s, total_reward = %s, withdrawn_at = CURRENT_TIMESTAMP
        WHERE id = %s
    """, ('withdrawn', float(total_reward), stake_id))
    
    cur.execute(f"""
        UPDATE {schema}.users SET balance = balance + %s, total_earned = total_earned + %s, updated_at = CURRENT_TIMESTAMP
        WHERE id = %s
    """, (float(total_return), float(total_reward), user_id))
    
    cur.execute(f"""
        INSERT INTO {schema}.transactions (user_id, type, amount, status, description)
        VALUES (%s, %s, %s, %s, %s)
    """, (user_id, 'unstake', float(total_return), 'completed', f'Unstaked {amount} TON + {total_reward} TON reward'))
    
    conn.commit()
    cur.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({
            'amount': float(amount),
            'reward': float(total_reward),
            'total': float(total_return)
        })
    }

def deposit(event):
    data = json.loads(event.get('body', '{}'))
    wallet_address = data.get('wallet_address')
    amount = Decimal(str(data.get('amount', 0)))
    ton_hash = data.get('ton_hash', '')
    
    if not wallet_address or amount <= 0:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Invalid parameters'})
        }
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    schema = get_schema()
    
    cur.execute(f"SELECT id FROM {schema}.users WHERE wallet_address = %s", (wallet_address,))
    user = cur.fetchone()
    
    if not user:
        cur.close()
        conn.close()
        return {
            'statusCode': 404,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'User not found'})
        }
    
    user_id = user[0]
    
    cur.execute(f"""
        UPDATE {schema}.users SET balance = balance + %s, updated_at = CURRENT_TIMESTAMP
        WHERE id = %s
    """, (float(amount), user_id))
    
    cur.execute(f"""
        INSERT INTO {schema}.transactions (user_id, type, amount, ton_hash, status, description)
        VALUES (%s, %s, %s, %s, %s, %s)
    """, (user_id, 'deposit', float(amount), ton_hash, 'completed', f'Deposit {amount} TON'))
    
    conn.commit()
    cur.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'success': True, 'amount': float(amount)})
    }

def get_user_stats(event):
    data = json.loads(event.get('body', '{}'))
    wallet_address = data.get('wallet_address')
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    schema = get_schema()
    
    cur.execute(f"""
        SELECT balance, total_staked, total_earned, referral_earnings
        FROM {schema}.users WHERE wallet_address = %s
    """, (wallet_address,))
    
    user = cur.fetchone()
    
    if not user:
        cur.close()
        conn.close()
        return {
            'statusCode': 404,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'User not found'})
        }
    
    cur.execute(f"""
        SELECT id, amount, daily_reward, start_date, end_date, status, total_reward
        FROM {schema}.stakes WHERE user_id = (SELECT id FROM {schema}.users WHERE wallet_address = %s) AND status = 'active'
    """, (wallet_address,))
    
    stakes = cur.fetchall()
    
    active_stakes = []
    for stake in stakes:
        days_staked = (datetime.now() - stake[3]).days
        current_reward = float(stake[2]) * days_staked
        
        active_stakes.append({
            'id': stake[0],
            'amount': float(stake[1]),
            'daily_reward': float(stake[2]),
            'start_date': stake[3].isoformat(),
            'end_date': stake[4].isoformat(),
            'days_remaining': (stake[4] - datetime.now()).days,
            'current_reward': current_reward
        })
    
    result = {
        'balance': float(user[0]) if user[0] else 0,
        'total_staked': float(user[1]) if user[1] else 0,
        'total_earned': float(user[2]) if user[2] else 0,
        'referral_earnings': float(user[3]) if user[3] else 0,
        'active_stakes': active_stakes
    }
    
    cur.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps(result)
    }

def get_referrals(event):
    data = json.loads(event.get('body', '{}'))
    wallet_address = data.get('wallet_address')
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    schema = get_schema()
    
    cur.execute(f"""
        SELECT COUNT(*), COALESCE(SUM(reward_earned), 0)
        FROM {schema}.referrals 
        WHERE referrer_id = (SELECT id FROM {schema}.users WHERE wallet_address = %s)
    """, (wallet_address,))
    
    result = cur.fetchone()
    
    cur.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({
            'total_referrals': result[0] if result else 0,
            'total_earned': float(result[1]) if result and result[1] else 0
        })
    }