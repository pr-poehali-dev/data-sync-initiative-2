import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';

const CompanySettings = () => {
  const navigate = useNavigate();
  const [signaturePreview, setSignaturePreview] = useState<string>('');
  const [stampPreview, setStampPreview] = useState<string>('');
  const [signatureUrl, setSignatureUrl] = useState<string>('');
  const [stampUrl, setStampUrl] = useState<string>('');
  const [loading, setLoading] = useState<{ signature: boolean; stamp: boolean }>({
    signature: false,
    stamp: false
  });

  const handleImageChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    type: 'signature' | 'stamp'
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Пожалуйста, выберите изображение');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('Размер файла не должен превышать 2 МБ');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      if (type === 'signature') {
        setSignaturePreview(base64);
      } else {
        setStampPreview(base64);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async (type: 'signature' | 'stamp') => {
    const preview = type === 'signature' ? signaturePreview : stampPreview;
    
    if (!preview) {
      alert('Сначала выберите изображение');
      return;
    }

    setLoading(prev => ({ ...prev, [type]: true }));

    try {
      const response = await fetch('https://functions.poehali.dev/8b75370e-8a14-4f88-a342-2e1a9f27917c', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          image: preview
        })
      });

      const data = await response.json();
      
      if (data.success) {
        if (type === 'signature') {
          setSignatureUrl(data.url);
        } else {
          setStampUrl(data.url);
        }
        alert(`${type === 'signature' ? 'Подпись' : 'Печать'} успешно загружена!`);
      } else {
        alert('Ошибка: ' + data.error);
      }
    } catch (error) {
      console.error('Ошибка загрузки:', error);
      alert('Ошибка при загрузке изображения');
    } finally {
      setLoading(prev => ({ ...prev, [type]: false }));
    }
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    alert('URL скопирован в буфер обмена!');
  };

  const handleReload = (type: 'signature' | 'stamp') => {
    if (type === 'signature') {
      setSignaturePreview('');
      setSignatureUrl('');
      const input = document.getElementById('signature') as HTMLInputElement;
      if (input) input.value = '';
    } else {
      setStampPreview('');
      setStampUrl('');
      const input = document.getElementById('stamp') as HTMLInputElement;
      if (input) input.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="container mx-auto p-4 md:p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Настройки компании</h1>
            <p className="text-muted-foreground mt-1">Загрузка печати и подписи для счетов</p>
          </div>
          <Button onClick={() => navigate('/admin')} variant="outline">
            <Icon name="ArrowLeft" size={16} className="mr-2" />
            Назад
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon name="PenTool" size={20} />
                Подпись директора
              </CardTitle>
              <CardDescription>
                Рекомендуемый размер: 200x60px, формат PNG с прозрачным фоном
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signature">Выберите изображение</Label>
                <input
                  id="signature"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageChange(e, 'signature')}
                  className="block w-full text-sm text-muted-foreground
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-primary file:text-primary-foreground
                    hover:file:bg-primary/90 file:cursor-pointer"
                />
              </div>

              {signaturePreview && (
                <div className="border rounded-lg p-4 bg-muted/50">
                  <p className="text-sm font-medium mb-2">Предпросмотр:</p>
                  <div className="flex justify-center bg-white p-4 rounded">
                    <img
                      src={signaturePreview}
                      alt="Подпись"
                      className="max-h-16 object-contain"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={() => handleUpload('signature')}
                  disabled={!signaturePreview || loading.signature}
                  className="flex-1"
                >
                  {loading.signature ? (
                    <>
                      <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                      Загрузка...
                    </>
                  ) : (
                    <>
                      <Icon name="Upload" size={16} className="mr-2" />
                      Загрузить подпись
                    </>
                  )}
                </Button>
                {(signaturePreview || signatureUrl) && (
                  <Button
                    onClick={() => handleReload('signature')}
                    variant="outline"
                    size="icon"
                  >
                    <Icon name="RotateCcw" size={16} />
                  </Button>
                )}
              </div>

              {signatureUrl && (
                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg space-y-2">
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">
                    ✓ Подпись загружена
                  </p>
                  <div className="flex gap-2">
                    <input
                      value={signatureUrl}
                      readOnly
                      className="flex-1 text-xs font-mono bg-background border rounded px-2 py-1"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(signatureUrl)}
                    >
                      <Icon name="Copy" size={14} />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Скопируйте URL и добавьте в переменную SIGNATURE_IMAGE_URL
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon name="Stamp" size={20} />
                Печать компании
              </CardTitle>
              <CardDescription>
                Рекомендуемый размер: 120x120px, формат PNG с прозрачным фоном
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="stamp">Выберите изображение</Label>
                <input
                  id="stamp"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageChange(e, 'stamp')}
                  className="block w-full text-sm text-muted-foreground
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-primary file:text-primary-foreground
                    hover:file:bg-primary/90 file:cursor-pointer"
                />
              </div>

              {stampPreview && (
                <div className="border rounded-lg p-4 bg-muted/50">
                  <p className="text-sm font-medium mb-2">Предпросмотр:</p>
                  <div className="flex justify-center bg-white p-4 rounded">
                    <img
                      src={stampPreview}
                      alt="Печать"
                      className="max-h-32 object-contain"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={() => handleUpload('stamp')}
                  disabled={!stampPreview || loading.stamp}
                  className="flex-1"
                >
                  {loading.stamp ? (
                    <>
                      <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                      Загрузка...
                    </>
                  ) : (
                    <>
                      <Icon name="Upload" size={16} className="mr-2" />
                      Загрузить печать
                    </>
                  )}
                </Button>
                {(stampPreview || stampUrl) && (
                  <Button
                    onClick={() => handleReload('stamp')}
                    variant="outline"
                    size="icon"
                  >
                    <Icon name="RotateCcw" size={16} />
                  </Button>
                )}
              </div>

              {stampUrl && (
                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg space-y-2">
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">
                    ✓ Печать загружена
                  </p>
                  <div className="flex gap-2">
                    <input
                      value={stampUrl}
                      readOnly
                      className="flex-1 text-xs font-mono bg-background border rounded px-2 py-1"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(stampUrl)}
                    >
                      <Icon name="Copy" size={14} />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Скопируйте URL и добавьте в переменную STAMP_IMAGE_URL
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Инструкция</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <span className="font-bold text-primary">1.</span>
              <p>Загрузите изображения подписи и печати в формате PNG с прозрачным фоном</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold text-primary">2.</span>
              <p>После загрузки скопируйте полученные URL-адреса</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold text-primary">3.</span>
              <p>Добавьте URL в соответствующие переменные окружения: SIGNATURE_IMAGE_URL и STAMP_IMAGE_URL</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold text-primary">4.</span>
              <p>После этого изображения будут автоматически вставляться в счета на оплату</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CompanySettings;