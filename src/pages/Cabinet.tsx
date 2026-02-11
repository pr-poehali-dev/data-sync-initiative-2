import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [notificationSent, setNotificationSent] = useState<boolean>(false);
  const [showInvoiceDialog, setShowInvoiceDialog] = useState<boolean>(false);
  const [showCryptoDialog, setShowCryptoDialog] = useState<boolean>(false);
  const [invoiceAmount, setInvoiceAmount] = useState<string>('');
  const [cryptoAmount, setCryptoAmount] = useState<string>('');
  const [cryptoCurrency, setCryptoCurrency] = useState<string>('USDT');
  const [invoiceHtml, setInvoiceHtml] = useState<string>('');
  const [cryptoData, setCryptoData] = useState<{
    transactionId: string;
    currency: string;
    walletAddress: string;
    amountRub: number;
    amountCrypto: number;
    exchangeRate: number;
    qrCodeUrl: string;
    instructions: string;
    network: string;
  } | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
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

  const handleGenerateInvoice = async () => {
    if (!invoiceAmount || parseFloat(invoiceAmount) <= 0) {
      alert('Введите корректную сумму');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('https://functions.poehali.dev/14b5b0ca-60b8-4288-b32a-28527b754694', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: id,
          username,
          amount: parseFloat(invoiceAmount)
        })
      });

      const data = await response.json();
      if (data.success) {
        setInvoiceHtml(data.invoiceHtml);
        const blob = new Blob([data.invoiceHtml], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice-${data.invoiceNumber}.html`;
        a.click();
        URL.revokeObjectURL(url);
        alert('Счёт сформирован и скачан!');
        setShowInvoiceDialog(false);
        setInvoiceAmount('');
      } else {
        alert('Ошибка генерации счёта: ' + data.error);
      }
    } catch (error) {
      console.error('Ошибка:', error);
      alert('Ошибка при формировании счёта');
    }
    setLoading(false);
  };

  const handleGenerateCryptoPayment = async () => {
    if (!cryptoAmount || parseFloat(cryptoAmount) <= 0) {
      alert('Введите корректную сумму');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('https://functions.poehali.dev/a106fc6e-84f1-4795-bbbb-d084546823b8', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: id,
          amount: parseFloat(cryptoAmount),
          currency: cryptoCurrency
        })
      });

      const data = await response.json();
      if (data.success) {
        setCryptoData(data);
      } else {
        alert('Ошибка: ' + data.error);
      }
    } catch (error) {
      console.error('Ошибка:', error);
      alert('Ошибка при генерации платёжных данных');
    }
    setLoading(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Скопировано в буфер обмена!');
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
              <CardTitle className="flex items-center gap-2">
                <Icon name="CreditCard" size={20} />
                Пополнение баланса
              </CardTitle>
              <CardDescription>
                Выберите удобный способ оплаты
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={() => setShowInvoiceDialog(true)}
                className="w-full"
                variant="outline"
              >
                <Icon name="FileText" size={16} className="mr-2" />
                Сформировать счёт на оплату
              </Button>
              <Button
                onClick={() => setShowCryptoDialog(true)}
                className="w-full"
                variant="outline"
              >
                <Icon name="Bitcoin" size={16} className="mr-2" />
                Оплатить криптовалютой
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon name="Bell" size={20} />
                Уведомления о балансе
              </CardTitle>
              <CardDescription>
                Получайте уведомления когда баланс меньше 1000₽
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="example@mail.ru"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Телефон</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+7 (999) 123-45-67"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <Button onClick={handleSaveContacts} className="w-full">
                <Icon name="Save" size={16} className="mr-2" />
                Сохранить контакты
              </Button>
              {balance < 1000 && balance > 0 && (
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-start gap-2">
                  <Icon name="AlertTriangle" size={16} className="text-yellow-600 mt-0.5" />
                  <div className="text-sm text-yellow-800 dark:text-yellow-200">
                    <strong>Внимание!</strong> Ваш баланс ниже 1000₽
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

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

      <Dialog open={showInvoiceDialog} onOpenChange={setShowInvoiceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Формирование счёта</DialogTitle>
            <DialogDescription>
              Укажите сумму для пополнения баланса
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invoiceAmount">Сумма (₽)</Label>
              <Input
                id="invoiceAmount"
                type="number"
                placeholder="Например: 5000"
                value={invoiceAmount}
                onChange={(e) => setInvoiceAmount(e.target.value)}
              />
            </div>
            <Button
              onClick={handleGenerateInvoice}
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Формирование...' : 'Сформировать счёт'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showCryptoDialog} onOpenChange={(open) => {
        setShowCryptoDialog(open);
        if (!open) setCryptoData(null);
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Оплата криптовалютой</DialogTitle>
            <DialogDescription>
              Выберите валюту и укажите сумму
            </DialogDescription>
          </DialogHeader>
          {!cryptoData ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cryptoAmount">Сумма (₽)</Label>
                <Input
                  id="cryptoAmount"
                  type="number"
                  placeholder="Например: 5000"
                  value={cryptoAmount}
                  onChange={(e) => setCryptoAmount(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Криптовалюта</Label>
                <Select value={cryptoCurrency} onValueChange={setCryptoCurrency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USDT">USDT (TRC20)</SelectItem>
                    <SelectItem value="BTC">Bitcoin (BTC)</SelectItem>
                    <SelectItem value="ETH">Ethereum (ETH)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleGenerateCryptoPayment}
                className="w-full"
                disabled={loading}
              >
                {loading ? 'Генерация...' : 'Получить адрес для оплаты'}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center">
                <img
                  src={cryptoData.qrCodeUrl}
                  alt="QR Code"
                  className="mx-auto mb-4 rounded-lg border"
                />
                <p className="text-sm font-medium mb-2">
                  Переведите {cryptoData.amountCrypto} {cryptoData.currency}
                </p>
                <p className="text-xs text-muted-foreground mb-2">
                  Сеть: {cryptoData.network}
                </p>
              </div>
              <div className="space-y-2">
                <Label>Адрес кошелька</Label>
                <div className="flex gap-2">
                  <Input
                    value={cryptoData.walletAddress}
                    readOnly
                    className="font-mono text-xs"
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => copyToClipboard(cryptoData.walletAddress)}
                  >
                    <Icon name="Copy" size={16} />
                  </Button>
                </div>
              </div>
              <div className="p-3 bg-muted rounded-lg text-xs space-y-1">
                <p><strong>Сумма в рублях:</strong> {cryptoData.amountRub} ₽</p>
                <p><strong>Курс:</strong> 1 {cryptoData.currency} = {cryptoData.exchangeRate} ₽</p>
                <p className="text-muted-foreground mt-2">{cryptoData.instructions}</p>
              </div>
              <Button
                onClick={() => {
                  setCryptoData(null);
                  setShowCryptoDialog(false);
                  setCryptoAmount('');
                }}
                variant="outline"
                className="w-full"
              >
                Закрыть
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Cabinet;