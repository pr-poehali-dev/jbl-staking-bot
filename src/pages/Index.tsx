import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [balance, setBalance] = useState(10000);
  const [stakedAmount, setStakedAmount] = useState(5000);
  const [stakeInput, setStakeInput] = useState('');
  const [referralCode] = useState('JBL-' + Math.random().toString(36).substr(2, 6).toUpperCase());
  const [referrals, setReferrals] = useState(3);
  const { toast } = useToast();

  const totalValue = balance + stakedAmount;
  const stakingAPY = 12;
  const commission = 0.5;
  const estimatedReward = (stakedAmount * stakingAPY / 100 / 12).toFixed(2);

  const handleStake = () => {
    const amount = parseFloat(stakeInput);
    if (amount > 0 && amount <= balance) {
      setBalance(balance - amount);
      setStakedAmount(stakedAmount + amount);
      setStakeInput('');
      toast({
        title: "Стейкинг успешен! 🚀",
        description: `${amount} JBL застейканы на 1 месяц`,
      });
    } else {
      toast({
        title: "Ошибка",
        description: "Недостаточно средств",
        variant: "destructive"
      });
    }
  };

  const handleUnstake = () => {
    const amount = parseFloat(stakeInput);
    if (amount > 0 && amount <= stakedAmount) {
      setBalance(balance + amount);
      setStakedAmount(stakedAmount - amount);
      setStakeInput('');
      toast({
        title: "Вывод успешен! ✅",
        description: `${amount} JBL выведены в кошелек`,
      });
    }
  };

  const copyReferralCode = () => {
    navigator.clipboard.writeText(referralCode);
    toast({
      title: "Скопировано! 📋",
      description: "Реферальный код скопирован",
    });
  };

  return (
    <div className="min-h-screen blockchain-bg relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-secondary/10 pointer-events-none" />
      
      <div className="container mx-auto px-4 py-8 relative z-10">
        <header className="mb-8 text-center">
          <h1 className="text-5xl font-bold mb-2 text-glow animate-float">JBL STAKING</h1>
          <p className="text-muted-foreground">Децентрализованная платформа стейкинга</p>
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-6xl mx-auto">
          <TabsList className="grid w-full grid-cols-5 glass-effect mb-8">
            <TabsTrigger value="home" className="data-[state=active]:bg-primary/20">
              <Icon name="Home" className="mr-2 h-4 w-4" />
              Главная
            </TabsTrigger>
            <TabsTrigger value="staking" className="data-[state=active]:bg-primary/20">
              <Icon name="Coins" className="mr-2 h-4 w-4" />
              Стейкинг
            </TabsTrigger>
            <TabsTrigger value="wallet" className="data-[state=active]:bg-primary/20">
              <Icon name="Wallet" className="mr-2 h-4 w-4" />
              Кошелек
            </TabsTrigger>
            <TabsTrigger value="profile" className="data-[state=active]:bg-primary/20">
              <Icon name="User" className="mr-2 h-4 w-4" />
              Профиль
            </TabsTrigger>
            <TabsTrigger value="support" className="data-[state=active]:bg-primary/20">
              <Icon name="MessageCircle" className="mr-2 h-4 w-4" />
              Поддержка
            </TabsTrigger>
          </TabsList>

          <TabsContent value="home" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-6 glass-effect card-3d animate-pulse-glow">
                <div className="flex items-center justify-between mb-4">
                  <Icon name="TrendingUp" className="h-8 w-8 text-primary" />
                  <Badge className="bg-primary/20">Live</Badge>
                </div>
                <h3 className="text-2xl font-bold mb-1">{totalValue.toLocaleString()} JBL</h3>
                <p className="text-muted-foreground text-sm">Общая стоимость портфеля</p>
              </Card>

              <Card className="p-6 glass-effect card-3d animate-pulse-glow">
                <div className="flex items-center justify-between mb-4">
                  <Icon name="Lock" className="h-8 w-8 text-secondary" />
                  <Badge className="bg-secondary/20">{stakingAPY}% APY</Badge>
                </div>
                <h3 className="text-2xl font-bold mb-1">{stakedAmount.toLocaleString()} JBL</h3>
                <p className="text-muted-foreground text-sm">В стейкинге</p>
              </Card>

              <Card className="p-6 glass-effect card-3d animate-pulse-glow">
                <div className="flex items-center justify-between mb-4">
                  <Icon name="Zap" className="h-8 w-8 text-yellow-500" />
                  <Badge className="bg-yellow-500/20">30 дней</Badge>
                </div>
                <h3 className="text-2xl font-bold mb-1">+{estimatedReward} JBL</h3>
                <p className="text-muted-foreground text-sm">Ожидаемая прибыль</p>
              </Card>
            </div>

            <Card className="p-8 glass-effect gradient-border">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-bold mb-2 text-glow">Стейкинг JBL</h2>
                  <p className="text-muted-foreground">Зарабатывайте пассивный доход на блокчейне</p>
                </div>
                <Icon name="Rocket" className="h-16 w-16 text-primary animate-float" />
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-muted/20 rounded-lg">
                  <Icon name="Percent" className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <p className="text-2xl font-bold">{stakingAPY}%</p>
                  <p className="text-xs text-muted-foreground">Годовая доходность</p>
                </div>
                <div className="text-center p-4 bg-muted/20 rounded-lg">
                  <Icon name="Calendar" className="h-6 w-6 mx-auto mb-2 text-secondary" />
                  <p className="text-2xl font-bold">30</p>
                  <p className="text-xs text-muted-foreground">Дней блокировки</p>
                </div>
                <div className="text-center p-4 bg-muted/20 rounded-lg">
                  <Icon name="DollarSign" className="h-6 w-6 mx-auto mb-2 text-green-500" />
                  <p className="text-2xl font-bold">{commission}%</p>
                  <p className="text-xs text-muted-foreground">Комиссия</p>
                </div>
                <div className="text-center p-4 bg-muted/20 rounded-lg">
                  <Icon name="Users" className="h-6 w-6 mx-auto mb-2 text-yellow-500" />
                  <p className="text-2xl font-bold">1.2K</p>
                  <p className="text-xs text-muted-foreground">Активных стейкеров</p>
                </div>
              </div>

              <Button onClick={() => setActiveTab('staking')} className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90" size="lg">
                <Icon name="Rocket" className="mr-2 h-5 w-5" />
                Начать стейкинг
              </Button>
            </Card>
          </TabsContent>

          <TabsContent value="staking" className="space-y-6">
            <Card className="p-8 glass-effect gradient-border">
              <h2 className="text-3xl font-bold mb-6 text-glow">Управление стейкингом</h2>
              
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Доступно для стейкинга</span>
                    <span className="font-bold">{balance.toLocaleString()} JBL</span>
                  </div>
                  <Progress value={(balance / totalValue) * 100} className="h-2" />
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-muted-foreground">В стейкинге</span>
                    <span className="font-bold">{stakedAmount.toLocaleString()} JBL</span>
                  </div>
                  <Progress value={(stakedAmount / totalValue) * 100} className="h-2 bg-secondary/20" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                  <Card className="p-6 glass-effect">
                    <h3 className="text-xl font-bold mb-4 flex items-center">
                      <Icon name="ArrowUp" className="mr-2 h-5 w-5 text-primary" />
                      Застейкать
                    </h3>
                    <Input
                      type="number"
                      placeholder="Сумма JBL"
                      value={stakeInput}
                      onChange={(e) => setStakeInput(e.target.value)}
                      className="mb-4 border-primary/30"
                    />
                    <Button onClick={handleStake} className="w-full bg-primary hover:bg-primary/90">
                      Застейкать JBL
                    </Button>
                  </Card>

                  <Card className="p-6 glass-effect">
                    <h3 className="text-xl font-bold mb-4 flex items-center">
                      <Icon name="ArrowDown" className="mr-2 h-5 w-5 text-secondary" />
                      Вывести
                    </h3>
                    <Input
                      type="number"
                      placeholder="Сумма JBL"
                      value={stakeInput}
                      onChange={(e) => setStakeInput(e.target.value)}
                      className="mb-4 border-secondary/30"
                    />
                    <Button onClick={handleUnstake} className="w-full bg-secondary hover:bg-secondary/90">
                      Вывести JBL
                    </Button>
                  </Card>
                </div>

                <Card className="p-6 bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/30">
                  <div className="flex items-start space-x-4">
                    <Icon name="Info" className="h-6 w-6 text-primary mt-1" />
                    <div>
                      <h4 className="font-bold mb-2">Условия стейкинга</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Минимальный период блокировки: 30 дней</li>
                        <li>• Комиссия платформы: {commission}% от награды</li>
                        <li>• Награды начисляются ежедневно</li>
                        <li>• Досрочный вывод с потерей 10% награды</li>
                      </ul>
                    </div>
                  </div>
                </Card>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="wallet" className="space-y-6">
            <Card className="p-8 glass-effect gradient-border">
              <h2 className="text-3xl font-bold mb-6 text-glow">Кошелек</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <Card className="p-6 glass-effect">
                  <div className="flex items-center justify-between mb-4">
                    <Icon name="Wallet" className="h-10 w-10 text-primary" />
                    <Badge className="bg-green-500/20 text-green-500">Активен</Badge>
                  </div>
                  <h3 className="text-sm text-muted-foreground mb-2">Баланс кошелька</h3>
                  <p className="text-4xl font-bold mb-4">{balance.toLocaleString()} JBL</p>
                  <Button className="w-full bg-primary/20 hover:bg-primary/30">
                    <Icon name="Plus" className="mr-2 h-4 w-4" />
                    Пополнить
                  </Button>
                </Card>

                <Card className="p-6 glass-effect">
                  <div className="flex items-center justify-between mb-4">
                    <Icon name="Lock" className="h-10 w-10 text-secondary" />
                    <Badge className="bg-secondary/20">Заблокировано</Badge>
                  </div>
                  <h3 className="text-sm text-muted-foreground mb-2">В стейкинге</h3>
                  <p className="text-4xl font-bold mb-4">{stakedAmount.toLocaleString()} JBL</p>
                  <Button className="w-full bg-secondary/20 hover:bg-secondary/30">
                    <Icon name="Unlock" className="mr-2 h-4 w-4" />
                    Управлять
                  </Button>
                </Card>
              </div>

              <div>
                <h3 className="text-xl font-bold mb-4 flex items-center">
                  <Icon name="History" className="mr-2 h-5 w-5" />
                  История транзакций
                </h3>
                <div className="space-y-3">
                  {[
                    { type: 'stake', amount: 1000, date: '2026-01-13', status: 'completed' },
                    { type: 'reward', amount: 41.67, date: '2026-01-12', status: 'completed' },
                    { type: 'unstake', amount: 500, date: '2026-01-10', status: 'completed' },
                    { type: 'deposit', amount: 5000, date: '2026-01-08', status: 'completed' },
                  ].map((tx, i) => (
                    <Card key={i} className="p-4 glass-effect hover:bg-muted/10 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <Icon 
                            name={tx.type === 'stake' ? 'ArrowUp' : tx.type === 'unstake' ? 'ArrowDown' : tx.type === 'reward' ? 'Gift' : 'Plus'} 
                            className={`h-8 w-8 ${tx.type === 'stake' ? 'text-primary' : tx.type === 'reward' ? 'text-yellow-500' : 'text-secondary'}`}
                          />
                          <div>
                            <p className="font-semibold">
                              {tx.type === 'stake' ? 'Стейкинг' : tx.type === 'unstake' ? 'Вывод' : tx.type === 'reward' ? 'Награда' : 'Пополнение'}
                            </p>
                            <p className="text-sm text-muted-foreground">{tx.date}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${tx.type === 'unstake' ? 'text-red-500' : 'text-green-500'}`}>
                            {tx.type === 'unstake' ? '-' : '+'}{tx.amount} JBL
                          </p>
                          <Badge variant="outline" className="text-xs">{tx.status}</Badge>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="profile" className="space-y-6">
            <Card className="p-8 glass-effect gradient-border">
              <h2 className="text-3xl font-bold mb-6 text-glow">Профиль</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-6 glass-effect">
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="h-16 w-16 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center">
                      <Icon name="User" className="h-8 w-8" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Стейкер #8742</h3>
                      <p className="text-sm text-muted-foreground">Участник с 08.01.2026</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Общая прибыль</p>
                      <p className="text-2xl font-bold text-green-500">+{estimatedReward} JBL</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Уровень</p>
                      <div className="flex items-center space-x-2">
                        <Badge className="bg-primary/20">Silver Staker</Badge>
                        <Icon name="Award" className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 glass-effect bg-gradient-to-br from-primary/10 to-secondary/10">
                  <h3 className="text-xl font-bold mb-4 flex items-center">
                    <Icon name="Users" className="mr-2 h-5 w-5 text-primary" />
                    Реферальная программа
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Ваш реферальный код</p>
                      <div className="flex space-x-2">
                        <Input value={referralCode} readOnly className="font-mono bg-muted/20" />
                        <Button onClick={copyReferralCode} size="icon" className="bg-primary/20 hover:bg-primary/30">
                          <Icon name="Copy" className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-muted/20 rounded-lg text-center">
                        <p className="text-3xl font-bold text-primary">{referrals}</p>
                        <p className="text-xs text-muted-foreground">Рефералов</p>
                      </div>
                      <div className="p-4 bg-muted/20 rounded-lg text-center">
                        <p className="text-3xl font-bold text-green-500">+{(referrals * 25).toFixed(0)}</p>
                        <p className="text-xs text-muted-foreground">Бонус JBL</p>
                      </div>
                    </div>

                    <div className="p-4 bg-primary/10 rounded-lg border border-primary/30">
                      <p className="text-sm">
                        <Icon name="Gift" className="inline h-4 w-4 mr-1" />
                        Получайте <span className="font-bold text-primary">5%</span> от стейкинга рефералов!
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="support" className="space-y-6">
            <Card className="p-8 glass-effect gradient-border">
              <h2 className="text-3xl font-bold mb-6 text-glow">Поддержка</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card className="p-6 glass-effect hover:bg-muted/10 transition-colors cursor-pointer">
                  <Icon name="MessageCircle" className="h-10 w-10 text-primary mb-4" />
                  <h3 className="font-bold mb-2">Telegram</h3>
                  <p className="text-sm text-muted-foreground">Быстрая поддержка в чате</p>
                </Card>

                <Card className="p-6 glass-effect hover:bg-muted/10 transition-colors cursor-pointer">
                  <Icon name="Mail" className="h-10 w-10 text-secondary mb-4" />
                  <h3 className="font-bold mb-2">Email</h3>
                  <p className="text-sm text-muted-foreground">support@jblstaking.io</p>
                </Card>

                <Card className="p-6 glass-effect hover:bg-muted/10 transition-colors cursor-pointer">
                  <Icon name="FileText" className="h-10 w-10 text-yellow-500 mb-4" />
                  <h3 className="font-bold mb-2">FAQ</h3>
                  <p className="text-sm text-muted-foreground">База знаний</p>
                </Card>
              </div>

              <Card className="p-6 glass-effect">
                <h3 className="text-xl font-bold mb-4">Частые вопросы</h3>
                <div className="space-y-4">
                  {[
                    { q: 'Как начать стейкинг?', a: 'Подключите кошелек, выберите сумму и нажмите "Застейкать JBL"' },
                    { q: 'Когда я получу награду?', a: 'Награды начисляются ежедневно и доступны после окончания периода блокировки' },
                    { q: 'Можно ли вывести досрочно?', a: 'Да, но с потерей 10% накопленной награды' },
                    { q: 'Как работает реферальная программа?', a: 'Получайте 5% от стейкинга приглашенных пользователей' },
                  ].map((faq, i) => (
                    <Card key={i} className="p-4 glass-effect">
                      <h4 className="font-semibold mb-2 flex items-center">
                        <Icon name="HelpCircle" className="h-4 w-4 mr-2 text-primary" />
                        {faq.q}
                      </h4>
                      <p className="text-sm text-muted-foreground pl-6">{faq.a}</p>
                    </Card>
                  ))}
                </div>
              </Card>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <div className="fixed bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-primary animate-pulse" />
    </div>
  );
};

export default Index;
