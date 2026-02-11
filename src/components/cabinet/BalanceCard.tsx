import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Timer from '@/components/Timer';
import Icon from '@/components/ui/icon';

interface BalanceCardProps {
  balance: number;
  coefficient: number;
  calculatedTimerDate: Date | null;
}

const BalanceCard = ({ balance, coefficient, calculatedTimerDate }: BalanceCardProps) => {
  return (
    <>
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
    </>
  );
};

export default BalanceCard;
