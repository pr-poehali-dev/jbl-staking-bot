import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { useTonConnect } from '@/hooks/useTonConnect';
import { createStake, depositTokens, unstakeTokens, getReferralStats } from '@/lib/api';

const Index = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [stakeInput, setStakeInput] = useState('');
  const [referrals, setReferrals] = useState(0);
  const [referralEarnings, setReferralEarnings] = useState(0);
  const { toast } = useToast();
  const { isConnected, walletAddress, user, stats, loading, connectWallet, disconnectWallet, refreshData } = useTonConnect();

  const stakingAPY = 12;
  const commission = 0.5;

  const balance = stats?.balance || 0;
  const stakedAmount = stats?.total_staked || 0;
  const totalValue = balance + stakedAmount;
  const activeStakes = stats?.active_stakes || [];
  const totalReward = activeStakes.reduce((sum, stake) => sum + stake.current_reward, 0);

  useEffect(() => {
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();
      tg.setHeaderColor('#1A1F2C');
      tg.setBackgroundColor('#1A1F2C');
    }
  }, []);

  useEffect(() => {
    if (walletAddress) {
      loadReferralStats();
    }
  }, [walletAddress]);

  const loadReferralStats = async () => {
    if (!walletAddress) return;
    try {
      const refStats = await getReferralStats(walletAddress);
      setReferrals(refStats.total_referrals);
      setReferralEarnings(refStats.total_earned);
    } catch (error) {
      console.error('Failed to load referral stats:', error);
    }
  };

  const handleConnect = async () => {
    try {
      await connectWallet();
      toast({
        title: "TON Кошелек подключен! 💎",
        description: "Добро пожаловать в JBL Staking",
      });
    } catch (error) {
      toast({
        title: "Ошибка подключения",
        description: "Не удалось подключить кошелек",
        variant: "destructive"
      });
    }
  };

  const handleDisconnect = () => {
    disconnectWallet();
    toast({
      title: "Кошелек отключен",
      description: "До новых встреч!",
    });
  };

  const getReferralLink = () => {
    return `https://t.me/jbl_staking_bot?start=${user?.referral_code || ''}`;
  };

  const shareReferral = () => {
    const link = getReferralLink();
    const text = `Присоединяйся к JBL Staking! 🚀\nПолучи 12% годовых в TON\nМой код: ${user?.referral_code}`;
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`;
    window.open(shareUrl, '_blank');
  };

  const handleStake = async () => {
    if (!isConnected || !walletAddress) {
      toast({
        title: "Подключите кошелек",
        description: "Сначала подключите TON кошелек",
        variant: "destructive"
      });
      return;
    }

    const amount = parseFloat(stakeInput);
    if (amount <= 0 || isNaN(amount)) {
      toast({
        title: "Ошибка",
        description: "Введите корректную сумму",
        variant: "destructive"
      });
      return;
    }

    if (amount > balance) {
      toast({
        title: "Недостаточно средств",
        description: balance === 0 ? "Пополните баланс" : `Доступно: ${balance.toFixed(2)} TON`,
        variant: "destructive"
      });
      return;
    }

    try {
      await createStake(walletAddress, amount);
      setStakeInput('');
      await refreshData();
      toast({
        title: "Стейкинг успешен! 🚀",
        description: `${amount} TON застейканы на 30 дней`,
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось застейкать токены",
        variant: "destructive"
      });
    }
  };

  const handleUnstake = async (stakeId: number) => {
    if (!walletAddress) return;

    try {
      const result = await unstakeTokens(walletAddress, stakeId);
      await refreshData();
      toast({
        title: "Вывод успешен! ✅",
        description: `Выведено ${result.amount.toFixed(2)} TON + ${result.reward.toFixed(2)} TON награда`,
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось вывести токены",
        variant: "destructive"
      });
    }
  };

  const copyReferralCode = () => {
    const link = getReferralLink();
    navigator.clipboard.writeText(link);
    toast({
      title: "Скопировано! 📋",
      description: "Реферальная ссылка скопирована",
    });
  };

  const handleDeposit = async () => {
    if (!walletAddress) return;

    const amount = parseFloat(stakeInput);
    if (amount <= 0 || isNaN(amount)) {
      toast({
        title: "Ошибка",
        description: "Введите корректную сумму",
        variant: "destructive"
      });
      return;
    }

    try {
      await depositTokens(walletAddress, amount);
      setStakeInput('');
      await refreshData();
      toast({
        title: "Пополнение успешно! 💰",
        description: `+${amount} TON на баланс`,
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось пополнить баланс",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen blockchain-bg relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-secondary/10 pointer-events-none" />
      
      <div className="container mx-auto px-4 py-6 relative z-10 max-w-6xl">
        <header className="mb-6 text-center">
          <div className="flex items-center justify-center mb-4 animate-float">
            <div className="h-16 w-16 rounded-full bg-gradient-to-r from-[#0098EA] to-primary flex items-center justify-center mr-3">
              <Icon name="Gem" className="h-8 w-8" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-glow">JBL STAKING</h1>
          </div>
          <p className="text-muted-foreground mb-4">Стейкинг TON с доходностью 12% годовых</p>
          
          {!isConnected ? (
            <Button 
              onClick={handleConnect} 
              disabled={loading}
              size="lg"
              className="bg-gradient-to-r from-[#0098EA] to-primary hover:opacity-90 animate-pulse-glow"
            >
              <Icon name="Wallet" className="mr-2 h-5 w-5" />
              {loading ? 'Подключение...' : 'Подключить TON Кошелек'}
            </Button>
          ) : (
            <div className="flex flex-col items-center space-y-2">
              <Badge className="bg-green-500/20 text-green-400 px-4 py-2">
                <Icon name="CheckCircle" className="mr-2 h-4 w-4" />
                {walletAddress.substring(0, 8)}...{walletAddress.slice(-6)}
              </Badge>
              <Button 
                onClick={handleDisconnect} 
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
              >
                Отключить
              </Button>
            </div>
          )}
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 glass-effect mb-6">
            <TabsTrigger value="home" className="data-[state=active]:bg-primary/20">
              <Icon name="Home" className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="staking" className="data-[state=active]:bg-primary/20">
              <Icon name="Coins" className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="wallet" className="data-[state=active]:bg-primary/20">
              <Icon name="Wallet" className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="profile" className="data-[state=active]:bg-primary/20">
              <Icon name="User" className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="support" className="data-[state=active]:bg-primary/20">
              <Icon name="MessageCircle" className="h-4 w-4" />
            </TabsTrigger>
          </TabsList>

          <TabsContent value="home" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4 glass-effect card-3d animate-pulse-glow">
                <div className="flex items-center justify-between mb-3">
                  <Icon name="TrendingUp" className="h-6 w-6 text-[#0098EA]" />
                  <Badge className="bg-primary/20 text-xs">Live</Badge>
                </div>
                <h3 className="text-xl font-bold mb-1">{totalValue.toFixed(2)} TON</h3>
                <p className="text-muted-foreground text-xs">Общая стоимость</p>
              </Card>

              <Card className="p-4 glass-effect card-3d animate-pulse-glow">
                <div className="flex items-center justify-between mb-3">
                  <Icon name="Lock" className="h-6 w-6 text-secondary" />
                  <Badge className="bg-secondary/20 text-xs">{stakingAPY}% APY</Badge>
                </div>
                <h3 className="text-xl font-bold mb-1">{stakedAmount.toFixed(2)} TON</h3>
                <p className="text-muted-foreground text-xs">В стейкинге</p>
              </Card>

              <Card className="p-4 glass-effect card-3d animate-pulse-glow">
                <div className="flex items-center justify-between mb-3">
                  <Icon name="Zap" className="h-6 w-6 text-yellow-500" />
                  <Badge className="bg-yellow-500/20 text-xs">Награда</Badge>
                </div>
                <h3 className="text-xl font-bold mb-1">+{totalReward.toFixed(4)} TON</h3>
                <p className="text-muted-foreground text-xs">Текущая прибыль</p>
              </Card>
            </div>

            {!isConnected && (
              <Card className="p-6 glass-effect gradient-border text-center">
                <Icon name="Wallet" className="h-16 w-16 mx-auto mb-4 text-primary animate-float" />
                <h2 className="text-2xl font-bold mb-2">Подключите TON кошелек</h2>
                <p className="text-muted-foreground mb-4">Начните зарабатывать на стейкинге TON</p>
                <Button onClick={handleConnect} size="lg" className="bg-gradient-to-r from-[#0098EA] to-primary">
                  Подключить
                </Button>
              </Card>
            )}

            {isConnected && (
              <Card className="p-6 glass-effect gradient-border">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold mb-2 text-glow">Стейкинг TON</h2>
                    <p className="text-muted-foreground text-sm">Зарабатывайте пассивный доход</p>
                  </div>
                  <Icon name="Gem" className="h-12 w-12 text-primary animate-float" />
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <div className="text-center p-3 bg-muted/20 rounded-lg">
                    <Icon name="Percent" className="h-5 w-5 mx-auto mb-1 text-primary" />
                    <p className="text-lg font-bold">{stakingAPY}%</p>
                    <p className="text-xs text-muted-foreground">Годовых</p>
                  </div>
                  <div className="text-center p-3 bg-muted/20 rounded-lg">
                    <Icon name="Calendar" className="h-5 w-5 mx-auto mb-1 text-secondary" />
                    <p className="text-lg font-bold">30</p>
                    <p className="text-xs text-muted-foreground">Дней</p>
                  </div>
                  <div className="text-center p-3 bg-muted/20 rounded-lg">
                    <Icon name="DollarSign" className="h-5 w-5 mx-auto mb-1 text-green-500" />
                    <p className="text-lg font-bold">{commission}%</p>
                    <p className="text-xs text-muted-foreground">Комиссия</p>
                  </div>
                  <div className="text-center p-3 bg-muted/20 rounded-lg">
                    <Icon name="Users" className="h-5 w-5 mx-auto mb-1 text-yellow-500" />
                    <p className="text-lg font-bold">1.2K</p>
                    <p className="text-xs text-muted-foreground">Стейкеров</p>
                  </div>
                </div>

                <Button onClick={() => setActiveTab('staking')} className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90">
                  <Icon name="Rocket" className="mr-2 h-5 w-5" />
                  Начать стейкинг
                </Button>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="staking" className="space-y-4">
            {!isConnected ? (
              <Card className="p-6 glass-effect gradient-border text-center">
                <Icon name="Wallet" className="h-16 w-16 mx-auto mb-4 text-primary" />
                <h2 className="text-2xl font-bold mb-2">Подключите кошелек</h2>
                <p className="text-muted-foreground mb-4">Для стейкинга необходим TON кошелек</p>
                <Button onClick={handleConnect} size="lg" className="bg-gradient-to-r from-[#0098EA] to-primary">
                  Подключить
                </Button>
              </Card>
            ) : (
              <>
                <Card className="p-6 glass-effect gradient-border">
                  <h2 className="text-2xl font-bold mb-4 text-glow">Управление стейкингом</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Доступно</span>
                        <span className="font-bold">{balance.toFixed(2)} TON</span>
                      </div>
                      <Progress value={totalValue > 0 ? (balance / totalValue) * 100 : 0} className="h-2" />
                    </div>

                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-muted-foreground">В стейкинге</span>
                        <span className="font-bold">{stakedAmount.toFixed(2)} TON</span>
                      </div>
                      <Progress value={totalValue > 0 ? (stakedAmount / totalValue) * 100 : 0} className="h-2" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-6">
                      <Card className="p-4 glass-effect">
                        <h3 className="text-sm font-bold mb-3 flex items-center">
                          <Icon name="Plus" className="mr-2 h-4 w-4 text-green-500" />
                          Пополнить
                        </h3>
                        <Input
                          type="number"
                          placeholder="Сумма TON"
                          value={stakeInput}
                          onChange={(e) => setStakeInput(e.target.value)}
                          className="mb-3 text-sm"
                        />
                        <Button onClick={handleDeposit} className="w-full bg-green-500/20 hover:bg-green-500/30 text-sm">
                          Пополнить
                        </Button>
                      </Card>

                      <Card className="p-4 glass-effect col-span-1 md:col-span-2">
                        <h3 className="text-sm font-bold mb-3 flex items-center">
                          <Icon name="ArrowUp" className="mr-2 h-4 w-4 text-primary" />
                          Застейкать
                        </h3>
                        <Input
                          type="number"
                          placeholder="Сумма TON"
                          value={stakeInput}
                          onChange={(e) => setStakeInput(e.target.value)}
                          className="mb-3 text-sm"
                        />
                        <Button onClick={handleStake} className="w-full bg-primary/20 hover:bg-primary/30 text-sm">
                          Застейкать TON
                        </Button>
                      </Card>
                    </div>

                    {activeStakes.length > 0 && (
                      <div className="mt-6">
                        <h3 className="text-lg font-bold mb-3">Активные стейки</h3>
                        <div className="space-y-3">
                          {activeStakes.map((stake) => (
                            <Card key={stake.id} className="p-4 glass-effect">
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <p className="text-lg font-bold">{stake.amount.toFixed(2)} TON</p>
                                  <p className="text-xs text-muted-foreground">
                                    Осталось {stake.days_remaining} дней
                                  </p>
                                </div>
                                <Badge className="bg-green-500/20 text-green-500">
                                  +{stake.current_reward.toFixed(4)} TON
                                </Badge>
                              </div>
                              <Button 
                                onClick={() => handleUnstake(stake.id)}
                                variant="outline"
                                size="sm"
                                className="w-full"
                              >
                                <Icon name="ArrowDown" className="mr-2 h-4 w-4" />
                                Вывести
                              </Button>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}

                    <Card className="p-4 bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/30">
                      <div className="flex items-start space-x-3">
                        <Icon name="Info" className="h-5 w-5 text-primary mt-0.5" />
                        <div>
                          <h4 className="font-bold mb-2 text-sm">Условия стейкинга</h4>
                          <ul className="text-xs text-muted-foreground space-y-1">
                            <li>• Период блокировки: 30 дней</li>
                            <li>• Комиссия: {commission}% от награды</li>
                            <li>• Награды ежедневно</li>
                            <li>• Досрочный вывод: -10% награды</li>
                          </ul>
                        </div>
                      </div>
                    </Card>
                  </div>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="wallet" className="space-y-4">
            {!isConnected ? (
              <Card className="p-6 glass-effect gradient-border text-center">
                <Icon name="Wallet" className="h-16 w-16 mx-auto mb-4 text-primary" />
                <h2 className="text-2xl font-bold mb-2">Подключите кошелек</h2>
                <Button onClick={handleConnect} size="lg" className="bg-gradient-to-r from-[#0098EA] to-primary">
                  Подключить
                </Button>
              </Card>
            ) : (
              <Card className="p-6 glass-effect gradient-border">
                <h2 className="text-2xl font-bold mb-4 text-glow">Кошелек</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <Card className="p-5 glass-effect">
                    <div className="flex items-center justify-between mb-3">
                      <Icon name="Wallet" className="h-8 w-8 text-primary" />
                      <Badge className="bg-green-500/20 text-green-500 text-xs">Активен</Badge>
                    </div>
                    <h3 className="text-xs text-muted-foreground mb-2">Баланс</h3>
                    <p className="text-3xl font-bold mb-3">{balance.toFixed(2)} TON</p>
                    <Button onClick={() => setActiveTab('staking')} className="w-full bg-primary/20 hover:bg-primary/30 text-sm">
                      <Icon name="Plus" className="mr-2 h-4 w-4" />
                      Пополнить
                    </Button>
                  </Card>

                  <Card className="p-5 glass-effect">
                    <div className="flex items-center justify-between mb-3">
                      <Icon name="Lock" className="h-8 w-8 text-secondary" />
                      <Badge className="bg-secondary/20 text-xs">Стейкинг</Badge>
                    </div>
                    <h3 className="text-xs text-muted-foreground mb-2">В стейкинге</h3>
                    <p className="text-3xl font-bold mb-3">{stakedAmount.toFixed(2)} TON</p>
                    <Button onClick={() => setActiveTab('staking')} className="w-full bg-secondary/20 hover:bg-secondary/30 text-sm">
                      <Icon name="ArrowRight" className="mr-2 h-4 w-4" />
                      Управлять
                    </Button>
                  </Card>
                </div>

                <div>
                  <h3 className="text-lg font-bold mb-3 flex items-center">
                    <Icon name="History" className="mr-2 h-5 w-5" />
                    Активные стейки
                  </h3>
                  {activeStakes.length === 0 ? (
                    <Card className="p-6 glass-effect text-center">
                      <Icon name="Inbox" className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                      <p className="text-muted-foreground text-sm">Нет активных стейков</p>
                    </Card>
                  ) : (
                    <div className="space-y-2">
                      {activeStakes.map((stake) => (
                        <Card key={stake.id} className="p-3 glass-effect">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <Icon name="Lock" className="h-6 w-6 text-primary" />
                              <div>
                                <p className="font-semibold text-sm">{stake.amount.toFixed(2)} TON</p>
                                <p className="text-xs text-muted-foreground">
                                  Осталось {stake.days_remaining} дней
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-green-500 text-sm">
                                +{stake.current_reward.toFixed(4)} TON
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {stake.daily_reward.toFixed(6)}/день
                              </p>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="profile" className="space-y-4">
            {!isConnected ? (
              <Card className="p-6 glass-effect gradient-border text-center">
                <Icon name="User" className="h-16 w-16 mx-auto mb-4 text-primary" />
                <h2 className="text-2xl font-bold mb-2">Подключите кошелек</h2>
                <Button onClick={handleConnect} size="lg" className="bg-gradient-to-r from-[#0098EA] to-primary">
                  Подключить
                </Button>
              </Card>
            ) : (
              <Card className="p-6 glass-effect gradient-border">
                <h2 className="text-2xl font-bold mb-4 text-glow">Профиль</h2>
                
                <div className="grid grid-cols-1 gap-4">
                  <Card className="p-5 glass-effect">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="h-14 w-14 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center">
                        <Icon name="User" className="h-7 w-7" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold">Стейкер #{user?.id}</h3>
                        <p className="text-xs text-muted-foreground">{walletAddress.substring(0, 12)}...</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Прибыль</p>
                        <p className="text-xl font-bold text-green-500">+{(stats?.total_earned || 0).toFixed(4)} TON</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Уровень</p>
                        <Badge className="bg-primary/20">
                          <Icon name="Award" className="mr-1 h-3 w-3" />
                          {stakedAmount > 100 ? 'Gold' : stakedAmount > 10 ? 'Silver' : 'Starter'}
                        </Badge>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-5 glass-effect bg-gradient-to-br from-primary/10 to-secondary/10">
                    <h3 className="text-lg font-bold mb-3 flex items-center">
                      <Icon name="Users" className="mr-2 h-5 w-5 text-primary" />
                      Реферальная программа
                    </h3>
                    
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Ваша реферальная ссылка</p>
                        <div className="flex space-x-2">
                          <Input value={getReferralLink()} readOnly className="font-mono text-xs bg-muted/20" />
                          <Button onClick={copyReferralCode} size="icon" className="bg-primary/20 hover:bg-primary/30 shrink-0">
                            <Icon name="Copy" className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-muted/20 rounded-lg text-center">
                          <p className="text-2xl font-bold text-primary">{referrals}</p>
                          <p className="text-xs text-muted-foreground">Рефералов</p>
                        </div>
                        <div className="p-3 bg-muted/20 rounded-lg text-center">
                          <p className="text-2xl font-bold text-green-500">+{referralEarnings.toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">Заработано</p>
                        </div>
                      </div>

                      <Button onClick={shareReferral} className="w-full bg-[#0098EA]/20 hover:bg-[#0098EA]/30">
                        <Icon name="Share2" className="mr-2 h-4 w-4" />
                        Поделиться в Telegram
                      </Button>

                      <div className="p-3 bg-primary/10 rounded-lg border border-primary/30">
                        <p className="text-xs flex items-center">
                          <Icon name="Gift" className="inline h-4 w-4 mr-1" />
                          Получайте <span className="font-bold text-primary mx-1">5%</span> от стейкинга рефералов!
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="support" className="space-y-4">
            <Card className="p-6 glass-effect gradient-border">
              <h2 className="text-2xl font-bold mb-4 text-glow">Поддержка</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                <Card className="p-4 glass-effect hover:bg-muted/10 transition-colors cursor-pointer">
                  <Icon name="MessageCircle" className="h-8 w-8 text-[#0098EA] mb-3" />
                  <h3 className="font-bold mb-1 text-sm">Telegram</h3>
                  <p className="text-xs text-muted-foreground">Чат поддержки</p>
                </Card>

                <Card className="p-4 glass-effect hover:bg-muted/10 transition-colors cursor-pointer">
                  <Icon name="Mail" className="h-8 w-8 text-secondary mb-3" />
                  <h3 className="font-bold mb-1 text-sm">Email</h3>
                  <p className="text-xs text-muted-foreground">support@jbl.io</p>
                </Card>

                <Card className="p-4 glass-effect hover:bg-muted/10 transition-colors cursor-pointer">
                  <Icon name="FileText" className="h-8 w-8 text-yellow-500 mb-3" />
                  <h3 className="font-bold mb-1 text-sm">FAQ</h3>
                  <p className="text-xs text-muted-foreground">База знаний</p>
                </Card>
              </div>

              <Card className="p-5 glass-effect">
                <h3 className="text-lg font-bold mb-3">Частые вопросы</h3>
                <div className="space-y-3">
                  {[
                    { q: 'Как начать стейкинг?', a: 'Подключите TON кошелек и выберите сумму для стейкинга' },
                    { q: 'Когда я получу награду?', a: 'Награды начисляются ежедневно в течение 30 дней' },
                    { q: 'Можно ли вывести досрочно?', a: 'Да, но с потерей 10% накопленной награды' },
                    { q: 'Как работают рефералы?', a: 'Получайте 5% от стейкинга приглашенных пользователей' },
                  ].map((faq, i) => (
                    <Card key={i} className="p-3 glass-effect">
                      <h4 className="font-semibold text-sm mb-1 flex items-center">
                        <Icon name="HelpCircle" className="h-4 w-4 mr-2 text-primary" />
                        {faq.q}
                      </h4>
                      <p className="text-xs text-muted-foreground pl-6">{faq.a}</p>
                    </Card>
                  ))}
                </div>
              </Card>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <div className="fixed bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0098EA] via-primary to-secondary animate-pulse" />
    </div>
  );
};

export default Index;
