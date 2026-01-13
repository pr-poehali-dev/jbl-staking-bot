const API_URL = 'https://functions.poehali.dev/61161417-096d-471f-9cb6-ee7c77824130';

export interface User {
  id: number;
  wallet_address: string;
  telegram_id?: number;
  referral_code: string;
  balance: number;
  total_staked: number;
  total_earned: number;
  referral_earnings: number;
}

export interface Stake {
  id: number;
  amount: number;
  daily_reward: number;
  start_date: string;
  end_date: string;
  days_remaining: number;
  current_reward: number;
}

export interface UserStats {
  balance: number;
  total_staked: number;
  total_earned: number;
  referral_earnings: number;
  active_stakes: Stake[];
}

export interface ReferralStats {
  total_referrals: number;
  total_earned: number;
}

async function apiCall(action: string, data: any) {
  const response = await fetch(`${API_URL}?action=${action}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'API request failed');
  }

  return response.json();
}

export async function getOrCreateUser(
  wallet_address: string,
  telegram_id?: number,
  referred_by?: string
): Promise<User> {
  return apiCall('get_user', { wallet_address, telegram_id, referred_by });
}

export async function createStake(wallet_address: string, amount: number) {
  return apiCall('stake', { wallet_address, amount });
}

export async function unstakeTokens(wallet_address: string, stake_id: number) {
  return apiCall('unstake', { wallet_address, stake_id });
}

export async function depositTokens(
  wallet_address: string,
  amount: number,
  ton_hash?: string
) {
  return apiCall('deposit', { wallet_address, amount, ton_hash });
}

export async function getUserStats(wallet_address: string): Promise<UserStats> {
  return apiCall('get_stats', { wallet_address });
}

export async function getReferralStats(
  wallet_address: string
): Promise<ReferralStats> {
  return apiCall('get_referrals', { wallet_address });
}
