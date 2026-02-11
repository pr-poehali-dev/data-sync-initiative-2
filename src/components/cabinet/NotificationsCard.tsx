import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface NotificationsCardProps {
  email: string;
  phone: string;
  balance: number;
  onEmailChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onSave: () => void;
}

const NotificationsCard = ({
  email,
  phone,
  balance,
  onEmailChange,
  onPhoneChange,
  onSave
}: NotificationsCardProps) => {
  return (
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
            onChange={(e) => onEmailChange(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Телефон</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+7 (999) 123-45-67"
            value={phone}
            onChange={(e) => onPhoneChange(e.target.value)}
          />
        </div>
        <Button onClick={onSave} className="w-full">
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
  );
};

export default NotificationsCard;
