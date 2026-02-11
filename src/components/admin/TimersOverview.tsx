import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';

interface TimerData {
  id: number;
  username: string;
  email: string | null;
  phone: string | null;
  balance: number | null;
  coefficient: number | null;
  timer_end_date: string | null;
  is_active: boolean | null;
  last_deduction_time: string | null;
}

const TimersOverview = () => {
  const [timers, setTimers] = useState<TimerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchTimers = async () => {
    try {
      const response = await fetch('https://functions.poehali.dev/a23898cb-270c-4d21-8199-e4efe343c233');
      const data = await response.json();
      setTimers(Array.isArray(data) ? data : []);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Ошибка загрузки таймеров:', error);
    } finally {
      setLoading(false);
    }
  };

  const processDeductions = async () => {
    try {
      await fetch('https://functions.poehali.dev/a23898cb-270c-4d21-8199-e4efe343c233', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'process_deductions' })
      });
      fetchTimers();
    } catch (error) {
      console.error('Ошибка обработки списаний:', error);
    }
  };

  useEffect(() => {
    fetchTimers();
    const interval = setInterval(() => {
      fetchTimers();
      processDeductions();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const formatTimeRemaining = (endDate: string | null) => {
    if (!endDate) return 'Не активен';
    
    const now = new Date();
    const end = new Date(endDate);
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return 'Истёк';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / 1000 / 60) % 60);
    
    return `${days}д ${hours}ч ${minutes}м`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon name="Clock" size={20} />
            Активные таймеры
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <Icon name="Loader2" size={32} className="animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const activeTimers = timers.filter(t => t.is_active && t.balance && t.balance > 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Icon name="Clock" size={20} />
              Активные таймеры ({activeTimers.length})
            </CardTitle>
            <CardDescription>
              Последнее обновление: {lastUpdate?.toLocaleTimeString('ru-RU')}
            </CardDescription>
          </div>
          <Button onClick={fetchTimers} variant="outline" size="sm">
            <Icon name="RefreshCw" size={16} className="mr-2" />
            Обновить
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {activeTimers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Icon name="Clock" size={48} className="mx-auto mb-4 opacity-20" />
            <p>Нет активных таймеров</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeTimers.map((timer) => (
              <div
                key={timer.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-primary/10 p-3 rounded-full">
                    <Icon name="User" size={20} className="text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">{timer.username}</div>
                    <div className="text-sm text-muted-foreground">ID: {timer.id}</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-6 text-right">
                  <div>
                    <div className="text-xs text-muted-foreground">Баланс</div>
                    <div className="font-bold text-lg">
                      {timer.balance?.toFixed(2)} ₽
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Коэффициент</div>
                    <div className="font-medium">
                      {timer.coefficient} ₽/мин
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Осталось</div>
                    <div className="font-medium text-orange-600">
                      {formatTimeRemaining(timer.timer_end_date)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TimersOverview;
