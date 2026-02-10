import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Timer from '@/components/Timer';
import Icon from '@/components/ui/icon';

const Cabinet = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [timerDate, setTimerDate] = useState<Date | null>(null);
  const username = localStorage.getItem('username');

  useEffect(() => {
    const userRole = localStorage.getItem('userRole');
    const userId = localStorage.getItem('userId');
    
    if (userRole !== 'user' || userId !== id) {
      navigate('/');
      return;
    }

    // Загружаем таймер из localStorage
    const savedTimer = localStorage.getItem(`timer_user${id}`);
    if (savedTimer) {
      setTimerDate(new Date(savedTimer));
    }
  }, [id, navigate]);

  const handleLogout = () => {
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="container mx-auto p-4 md:p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Личный кабинет #{id}</h1>
            <p className="text-muted-foreground mt-1">Добро пожаловать, {username}</p>
          </div>
          <Button onClick={handleLogout} variant="outline">
            <Icon name="LogOut" size={16} className="mr-2" />
            Выход
          </Button>
        </div>

        <div className="grid gap-6">
          {timerDate ? (
            <Timer targetDate={timerDate} title="Ваш таймер" />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Таймер не установлен</CardTitle>
                <CardDescription>
                  Администратор ещё не установил для вас таймер
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center p-12 text-muted-foreground">
                  <Icon name="Clock" size={48} />
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Информация</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">ID пользователя:</span>
                <span className="font-medium">{id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Статус:</span>
                <span className="font-medium text-green-600">Активен</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Cabinet;
