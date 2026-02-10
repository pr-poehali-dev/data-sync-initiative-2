import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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

  const handleSetTimer = (userId: number) => {
    const now = new Date();
    const targetDate = new Date(
      now.getTime() +
        timerSettings.days * 24 * 60 * 60 * 1000 +
        timerSettings.hours * 60 * 60 * 1000 +
        timerSettings.minutes * 60 * 1000 +
        timerSettings.seconds * 1000
    );

    localStorage.setItem(`timer_user${userId}`, targetDate.toISOString());
    
    toast({
      title: 'Таймер установлен',
      description: `Таймер для пользователя ${userId} успешно установлен`,
    });

    setSelectedUser(null);
    setTimerSettings({ days: 0, hours: 0, minutes: 0, seconds: 0 });
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

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="users">Пользователи</TabsTrigger>
            <TabsTrigger value="settings">Настройки</TabsTrigger>
          </TabsList>

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
                        <CardDescription className="text-xs">
                          Таймер: {getUserTimer(userId)}
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
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => setSelectedUser(userId)} className="w-full">
                            <Icon name="Clock" size={14} className="mr-2" />
                            Установить таймер
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
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
