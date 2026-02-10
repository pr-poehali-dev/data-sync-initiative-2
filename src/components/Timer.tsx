import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TimerProps {
  targetDate: Date;
  title?: string;
}

const Timer = ({ targetDate, title = 'Обратный отсчёт' }: TimerProps) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const target = new Date(targetDate).getTime();
      const difference = target - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  const TimeBlock = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center justify-center bg-primary/10 rounded-lg p-4 min-w-[80px]">
      <div className="text-4xl font-bold text-primary tabular-nums">
        {String(value).padStart(2, '0')}
      </div>
      <div className="text-sm text-muted-foreground mt-1">{label}</div>
    </div>
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-center">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <TimeBlock value={timeLeft.days} label="Дней" />
          <TimeBlock value={timeLeft.hours} label="Часов" />
          <TimeBlock value={timeLeft.minutes} label="Минут" />
          <TimeBlock value={timeLeft.seconds} label="Секунд" />
        </div>
      </CardContent>
    </Card>
  );
};

export default Timer;
