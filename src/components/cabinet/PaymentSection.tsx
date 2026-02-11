import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';

interface CryptoData {
  transactionId: string;
  currency: string;
  walletAddress: string;
  amountRub: number;
  amountCrypto: number;
  exchangeRate: number;
  qrCodeUrl: string;
  instructions: string;
  network: string;
}

interface PaymentSectionProps {
  userId: string | undefined;
  username: string | null;
}

const PaymentSection = ({ userId, username }: PaymentSectionProps) => {
  const [showInvoiceDialog, setShowInvoiceDialog] = useState<boolean>(false);
  const [showCryptoDialog, setShowCryptoDialog] = useState<boolean>(false);
  const [invoiceAmount, setInvoiceAmount] = useState<string>('');
  const [cryptoAmount, setCryptoAmount] = useState<string>('');
  const [cryptoCurrency, setCryptoCurrency] = useState<string>('USDT');
  const [invoiceHtml, setInvoiceHtml] = useState<string>('');
  const [cryptoData, setCryptoData] = useState<CryptoData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

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
          userId: userId,
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
          userId: userId,
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
    <>
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
    </>
  );
};

export default PaymentSection;
