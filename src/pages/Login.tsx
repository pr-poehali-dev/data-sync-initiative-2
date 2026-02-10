import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Временная авторизация (позже подключим БД)
    if (username === 'admin' && password === 'admin') {
      localStorage.setItem('userRole', 'admin');
      localStorage.setItem('username', username);
      toast({ title: 'Вход выполнен', description: 'Добро пожаловать, администратор!' });
      navigate('/admin');
    } else if (username.startsWith('user') && password === 'user123') {
      // Пользователи: user1, user2, ..., user20
      const userId = username.replace('user', '');
      if (parseInt(userId) >= 1 && parseInt(userId) <= 20) {
        localStorage.setItem('userRole', 'user');
        localStorage.setItem('userId', userId);
        localStorage.setItem('username', username);
        toast({ title: 'Вход выполнен', description: `Добро пожаловать, ${username}!` });
        navigate(`/cabinet/${userId}`);
      } else {
        toast({ title: 'Ошибка', description: 'Неверные данные для входа', variant: 'destructive' });
      }
    } else {
      toast({ title: 'Ошибка', description: 'Неверные данные для входа', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Вход в систему</CardTitle>
          <CardDescription className="text-center">
            Введите логин и пароль для доступа
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Логин</Label>
              <Input
                id="username"
                type="text"
                placeholder="admin или user1-user20"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <Input
                id="password"
                type="password"
                placeholder="Введите пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full">
              Войти
            </Button>
          </form>
          <div className="mt-4 text-sm text-muted-foreground text-center">
            <p>Тестовые данные:</p>
            <p>Админ: admin / admin</p>
            <p>Пользователи: user1-user20 / user123</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
