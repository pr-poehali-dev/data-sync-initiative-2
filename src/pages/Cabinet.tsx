import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import BalanceCard from '@/components/cabinet/BalanceCard';
import PaymentSection from '@/components/cabinet/PaymentSection';
import NotificationsCard from '@/components/cabinet/NotificationsCard';

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
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [notificationSent, setNotificationSent] = useState<boolean>(false);
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

    const savedEmail = localStorage.getItem(`email_user${id}`);
    if (savedEmail) {
      setEmail(savedEmail);
    }

    const savedPhone = localStorage.getItem(`phone_user${id}`);
    if (savedPhone) {
      setPhone(savedPhone);
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

        if (currentBalance < 1000 && !notificationSent && (email || phone)) {
          sendNotification(currentBalance);
          setNotificationSent(true);
          localStorage.setItem(`notification_sent_user${id}`, 'true');
        }

        if (currentBalance >= 1000 && notificationSent) {
          setNotificationSent(false);
          localStorage.removeItem(`notification_sent_user${id}`);
        }
      } else {
        setBalance(0);
        localStorage.setItem(`balance_user${id}`, '0');
        setCalculatedTimerDate(null);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [calculatedTimerDate, coefficient, id, email, phone, notificationSent]);

  const sendNotification = async (currentBalance: number) => {
    try {
      await fetch('https://functions.poehali.dev/2c3a82fb-8150-45ce-a65b-b8811b50095c', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: id,
          username,
          balance: currentBalance,
          email,
          phone
        })
      });
    } catch (error) {
      console.error('Ошибка отправки уведомления:', error);
    }
  };

  const handleSaveContacts = () => {
    localStorage.setItem(`email_user${id}`, email);
    localStorage.setItem(`phone_user${id}`, phone);
    alert('Контакты сохранены!');
  };

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
          <BalanceCard 
            balance={balance}
            coefficient={coefficient}
            calculatedTimerDate={calculatedTimerDate}
          />

          <PaymentSection 
            userId={id}
            username={username}
          />

          <NotificationsCard 
            email={email}
            phone={phone}
            balance={balance}
            onEmailChange={setEmail}
            onPhoneChange={setPhone}
            onSave={handleSaveContacts}
          />

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
