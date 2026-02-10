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
  const [balance, setBalance] = useState<number>(0);
  const [coefficient, setCoefficient] = useState<number>(1);
  const username = localStorage.getItem('username');

  useEffect(() => {
    const userRole = localStorage.getItem('userRole');
    const userId = localStorage.getItem('userId');
    
    if (userRole !== 'user' || userId !== id) {
      navigate('/');
      return;
    }

    const savedTimer = localStorage.getItem(`timer_user${id}`);
    if (savedTimer) {
      setTimerDate(new Date(savedTimer));
    }

    const savedBalance = localStorage.getItem(`balance_user${id}`);
    if (savedBalance) {
      setBalance(parseFloat(savedBalance));
    }

    const savedCoefficient = localStorage.getItem(`coefficient_user${id}`);
    if (savedCoefficient) {
      setCoefficient(parseFloat(savedCoefficient));
    }
  }, [id, navigate]);

  useEffect(() => {
    if (!timerDate) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const target = new Date(timerDate).getTime();
      const difference = target - now;

      if (difference > 0) {
        const totalSeconds = Math.floor(difference / 1000);
        const calculatedBalance = totalSeconds * coefficient;
        setBalance(calculatedBalance);
        localStorage.setItem(`balance_user${id}`, calculatedBalance.toString());
      } else {
        setBalance(0);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [timerDate, coefficient, id]);

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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon name="Wallet" size={24} />
                Баланс
              </CardTitle>
              <CardDescription>Ваши внесённые средства</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-5xl font-bold text-primary">
                {balance.toFixed(2)} ₽
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Формула: Баланс = Секунды × {coefficient}
              </p>
            </CardContent>
          </Card>

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
                <span className="text-muted-foreground">Коэффициент:</span>
                <span className="font-medium">{coefficient}</span>
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