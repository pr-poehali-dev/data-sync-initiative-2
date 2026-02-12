import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TimersOverview from '@/components/admin/TimersOverview';

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [timerSettings, setTimerSettings] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [coefficients, setCoefficients] = useState<{ [key: number]: number }>({});
  const [selectedUserForTopup, setSelectedUserForTopup] = useState<number | null>(null);
  const [topupAmount, setTopupAmount] = useState<string>('');
  const [topupHistory, setTopupHistory] = useState<Array<{
    id: number;
    user_id: number;
    username?: string;
    amount: number;
    admin_name: string;
    created_at: string;
  }>>([]);

  useEffect(() => {
    const loadedCoefficients: { [key: number]: number } = {};
    for (let i = 1; i <= 20; i++) {
      const savedCoeff = localStorage.getItem(`coefficient_user${i}`);
      loadedCoefficients[i] = savedCoeff ? parseFloat(savedCoeff) : 1;
    }
    setCoefficients(loadedCoefficients);
    loadTopupHistory();
  }, []);

  const loadTopupHistory = async () => {
    try {
      console.log('[LOAD_TOPUP_HISTORY] Requesting history...');
      const response = await fetch('https://functions.poehali.dev/a23898cb-270c-4d21-8199-e4efe343c233', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_topup_history' })
      });

      console.log('[LOAD_TOPUP_HISTORY] Response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (response.ok) {
        const data = await response.json();
        console.log('[LOAD_TOPUP_HISTORY] Data loaded:', data.length, 'records');
        setTopupHistory(data);
      } else {
        const errorText = await response.text();
        console.error('[LOAD_TOPUP_HISTORY] Error response:', errorText);
      }
    } catch (error: unknown) {
      console.error('[LOAD_TOPUP_HISTORY] Exception:', error);
    }
  };

  useEffect(() => {
    const userRole = localStorage.getItem('userRole');
    if (userRole !== 'admin') {
      navigate('/');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('userRole');
    localStorage.removeItem('username');
    navigate('/');
  };

  const handleSetTimer = async (userId: number) => {
    const totalMinutes = 
      timerSettings.days * 24 * 60 +
      timerSettings.hours * 60 +
      timerSettings.minutes +
      timerSettings.seconds / 60;

    const balance = totalMinutes * (coefficients[userId] || 1);

    try {
      const response = await fetch('https://functions.poehali.dev/a23898cb-270c-4d21-8199-e4efe343c233', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start_timer',
          user_id: userId,
          balance: balance,
          coefficient: coefficients[userId] || 1
        })
      });

      if (response.ok) {
        toast({
          title: 'Таймер установлен',
          description: `Таймер для пользователя ${userId} успешно установлен`,
        });

        setSelectedUser(null);
        setTimerSettings({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      } else {
        throw new Error('Ошибка установки таймера');
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось установить таймер',
        variant: 'destructive',
      });
      console.error(error);
    }
  };

  const handleSetCoefficient = (userId: number, coefficient: number) => {
    localStorage.setItem(`coefficient_user${userId}`, coefficient.toString());
    setCoefficients({ ...coefficients, [userId]: coefficient });
    
    toast({
      title: 'Коэффициент установлен',
      description: `Коэффициент для пользователя ${userId}: ${coefficient} ₽/мин`,
    });
  };

  const getUserBalance = (userId: number) => {
    const savedBalance = localStorage.getItem(`balance_user${userId}`);
    if (savedBalance) {
      return parseFloat(savedBalance).toFixed(2);
    }
    return '0.00';
  };

  const handleTopupBalance = async (userId: number) => {
    const amount = parseFloat(topupAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: 'Ошибка',
        description: 'Введите корректную сумму',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch('https://functions.poehali.dev/a23898cb-270c-4d21-8199-e4efe343c233', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_balance',
          user_id: userId,
          amount: amount,
          admin_name: localStorage.getItem('username') || 'admin'
        })
      });

      if (response.ok) {
        toast({
          title: 'Баланс пополнен',
          description: `+${amount} ₽ для пользователя ${userId}`,
        });

        setSelectedUserForTopup(null);
        setTopupAmount('');
        loadTopupHistory();
      } else {
        const errorText = await response.text();
        console.error('[ADD_BALANCE] Response error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText };
        }
        
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error: unknown) {
      console.error('[ADD_BALANCE] Exception:', error);
      const errorMessage = error instanceof Error ? error.message : 'Не удалось пополнить баланс';
      toast({
        title: 'Ошибка',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const getUserTimer = (userId: number) => {
    const savedTimer = localStorage.getItem(`timer_user${userId}`);
    if (savedTimer) {
      const targetDate = new Date(savedTimer);
      const now = new Date();
      const diff = targetDate.getTime() - now.getTime();
      
      if (diff > 0) {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / 1000 / 60) % 60);
        return `${days}д ${hours}ч ${minutes}м`;
      }
    }
    return 'Не установлен';
  };

  const users = Array.from({ length: 20 }, (_, i) => i + 1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="container mx-auto p-4 md:p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Панель администратора</h1>
            <p className="text-muted-foreground mt-1">Управление личными кабинетами</p>
          </div>
          <Button onClick={handleLogout} variant="outline">
            <Icon name="LogOut" size={16} className="mr-2" />
            Выход
          </Button>
        </div>

        <div className="mb-6">
          <Button onClick={() => navigate('/company-settings')} variant="outline">
            <Icon name="Settings" size={16} className="mr-2" />
            Настройки компании (Печать и подпись)
          </Button>
        </div>

        <Tabs defaultValue="timers" className="space-y-6">
          <TabsList className="grid w-full max-w-3xl grid-cols-4">
            <TabsTrigger value="timers">Таймеры</TabsTrigger>
            <TabsTrigger value="users">Пользователи</TabsTrigger>
            <TabsTrigger value="history">История</TabsTrigger>
            <TabsTrigger value="settings">Настройки</TabsTrigger>
          </TabsList>

          <TabsContent value="timers" className="space-y-4">
            <TimersOverview />
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Список пользователей</CardTitle>
                <CardDescription>Управление таймерами для всех 20 личных кабинетов</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {users.map((userId) => (
                    <Card key={userId} className="border-2">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Пользователь {userId}</CardTitle>
                        <CardDescription className="text-xs space-y-1">
                          <div>Таймер: {getUserTimer(userId)}</div>
                          <div>Баланс: {getUserBalance(userId)} ₽</div>
                          <div>Коэф: {coefficients[userId] || 1}</div>
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {selectedUser === userId ? (
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <Label className="text-xs">Дни</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  value={timerSettings.days}
                                  onChange={(e) =>
                                    setTimerSettings({ ...timerSettings, days: parseInt(e.target.value) || 0 })
                                  }
                                  className="h-8"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Часы</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  max="23"
                                  value={timerSettings.hours}
                                  onChange={(e) =>
                                    setTimerSettings({ ...timerSettings, hours: parseInt(e.target.value) || 0 })
                                  }
                                  className="h-8"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Минуты</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  max="59"
                                  value={timerSettings.minutes}
                                  onChange={(e) =>
                                    setTimerSettings({ ...timerSettings, minutes: parseInt(e.target.value) || 0 })
                                  }
                                  className="h-8"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Секунды</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  max="59"
                                  value={timerSettings.seconds}
                                  onChange={(e) =>
                                    setTimerSettings({ ...timerSettings, seconds: parseInt(e.target.value) || 0 })
                                  }
                                  className="h-8"
                                />
                              </div>
                            </div>
                            <div>
                              <Label className="text-xs">Коэффициент (руб/мин)</Label>
                              <Input
                                type="number"
                                step="0.01"
                                value={coefficients[userId] || 1}
                                onChange={(e) => handleSetCoefficient(userId, parseFloat(e.target.value) || 1)}
                                className="h-8"
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => handleSetTimer(userId)} className="flex-1">
                                <Icon name="Check" size={14} className="mr-1" />
                                Сохранить
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => setSelectedUser(null)}>
                                <Icon name="X" size={14} />
                              </Button>
                            </div>
                          </div>
                        ) : selectedUserForTopup === userId ? (
                          <div className="space-y-2">
                            <div>
                              <Label className="text-xs">Сумма пополнения (₽)</Label>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={topupAmount}
                                onChange={(e) => setTopupAmount(e.target.value)}
                                placeholder="100.00"
                                className="h-8"
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => handleTopupBalance(userId)} className="flex-1">
                                <Icon name="Plus" size={14} className="mr-1" />
                                Пополнить
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => {
                                setSelectedUserForTopup(null);
                                setTopupAmount('');
                              }}>
                                <Icon name="X" size={14} />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Button size="sm" variant="outline" onClick={() => setSelectedUser(userId)} className="w-full">
                              <Icon name="Clock" size={14} className="mr-2" />
                              Установить таймер
                            </Button>
                            <Button size="sm" variant="default" onClick={() => setSelectedUserForTopup(userId)} className="w-full">
                              <Icon name="Wallet" size={14} className="mr-2" />
                              Пополнить баланс
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>История пополнений</CardTitle>
                <CardDescription>Все операции пополнения баланса пользователей</CardDescription>
              </CardHeader>
              <CardContent>
                {topupHistory.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">История пополнений пуста</div>
                ) : (
                  <div className="space-y-2">
                    {topupHistory.map((record) => (
                      <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium">
                            Пользователь {record.user_id}
                            {record.username && ` (${record.username})`}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(record.created_at).toLocaleString('ru-RU')}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-sm text-muted-foreground">
                            {record.admin_name}
                          </div>
                          <div className="font-semibold text-green-600">
                            +{record.amount.toFixed(2)} ₽
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Настройки системы</CardTitle>
                <CardDescription>Дополнительные параметры управления</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Настройки будут доступны в следующей версии</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;