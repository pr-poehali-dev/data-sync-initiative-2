import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Timer from '@/components/Timer';
import Icon from '@/components/ui/icon';

interface TopupHistoryEntry {
  date: string;
  amount: number;
  admin: string;
}

const Cabinet = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [timerDate, setTimerDate] = useState<Date | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [coefficient, setCoefficient] = useState<number>(1);
  const [calculatedTimerDate, setCalculatedTimerDate] = useState<Date | null>(null);
  const [topupHistory, setTopupHistory] = useState<TopupHistoryEntry[]>([]);
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

    const savedHistory = localStorage.getItem(`topup_history_user${id}`);
    if (savedHistory) {
      setTopupHistory(JSON.parse(savedHistory));
    }
  }, [id, navigate]);

  useEffect(() => {
    const manualBalance = localStorage.getItem(`manual_balance_user${id}`);
    const manualBalanceValue = manualBalance ? parseFloat(manualBalance) : 0;
    
    setBalance(manualBalanceValue);
    
    if (coefficient > 0 && manualBalanceValue > 0) {
      const totalMinutes = manualBalanceValue / coefficient;
      const totalMilliseconds = totalMinutes * 60 * 1000;
      const newTimerDate = new Date(Date.now() + totalMilliseconds);
      setCalculatedTimerDate(newTimerDate);
      localStorage.setItem(`timer_user${id}`, newTimerDate.toISOString());
    } else {
      setCalculatedTimerDate(null);
    }
  }, [coefficient, id]);

  useEffect(() => {
    if (!calculatedTimerDate || coefficient <= 0) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const target = new Date(calculatedTimerDate).getTime();
      const difference = target - now;

      if (difference > 0) {
        const totalMinutes = difference / 1000 / 60;
        const currentBalance = totalMinutes * coefficient;
        setBalance(currentBalance);
        localStorage.setItem(`balance_user${id}`, currentBalance.toString());
      } else {
        setBalance(0);
        localStorage.setItem(`balance_user${id}`, '0');
        setCalculatedTimerDate(null);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [calculatedTimerDate, coefficient, id]);

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
                Формула: Баланс = Минуты × {coefficient} ₽/мин
              </p>
              {calculatedTimerDate && (
                <p className="text-xs text-muted-foreground mt-1">
                  Осталось времени: {Math.floor((new Date(calculatedTimerDate).getTime() - Date.now()) / 1000 / 60)} мин
                </p>
              )}
            </CardContent>
          </Card>

          {calculatedTimerDate ? (
            <Timer targetDate={calculatedTimerDate} title="Ваш таймер" />
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
                <span className="font-medium">{coefficient} ₽/мин</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Статус:</span>
                <span className="font-medium text-green-600">Активен</span>
              </div>
            </CardContent>
          </Card>

          {topupHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="History" size={20} />
                  История пополнений
                </CardTitle>
                <CardDescription>Все пополнения баланса</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topupHistory.slice().reverse().map((entry, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/10 p-2 rounded-full">
                          <Icon name="Plus" size={16} className="text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">+{entry.amount.toFixed(2)} ₽</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(entry.date).toLocaleString('ru-RU')}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {entry.admin}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Cabinet;