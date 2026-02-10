import json
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def handler(event: dict, context) -> dict:
    '''Отправка уведомлений о низком балансе на email и SMS'''
    method = event.get('httpMethod', 'POST')

    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': '',
            'isBase64Encoded': False
        }

    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }

    try:
        body = json.loads(event.get('body', '{}'))
        user_id = body.get('userId')
        username = body.get('username')
        balance = body.get('balance', 0)
        email = body.get('email')
        phone = body.get('phone')

        notifications_sent = []

        # Отправка Email
        if email:
            try:
                send_email(email, username, user_id, balance)
                notifications_sent.append('email')
            except Exception as e:
                print(f'Ошибка отправки email: {e}')

        # SMS отправка (заглушка - требуется настройка SMS-провайдера)
        if phone:
            try:
                send_sms(phone, username, user_id, balance)
                notifications_sent.append('sms')
            except Exception as e:
                print(f'Ошибка отправки SMS: {e}')

        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'success': True,
                'sent': notifications_sent
            }),
            'isBase64Encoded': False
        }

    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }


def send_email(to_email: str, username: str, user_id: str, balance: float):
    '''Отправка email уведомления'''
    smtp_server = os.environ.get('SMTP_SERVER', 'smtp.gmail.com')
    smtp_port = int(os.environ.get('SMTP_PORT', '587'))
    smtp_user = os.environ.get('SMTP_USER', '')
    smtp_password = os.environ.get('SMTP_PASSWORD', '')

    if not smtp_user or not smtp_password:
        print('SMTP credentials not configured')
        return

    msg = MIMEMultipart('alternative')
    msg['Subject'] = f'⚠️ Низкий баланс - {balance:.2f}₽'
    msg['From'] = smtp_user
    msg['To'] = to_email

    text = f'''
Здравствуйте, {username}!

Ваш баланс на счете #{user_id} опустился ниже 1000₽.
Текущий баланс: {balance:.2f}₽

Рекомендуем пополнить баланс для продолжения работы.

С уважением,
Система уведомлений
    '''

    html = f'''
<html>
  <body style="font-family: Arial, sans-serif; padding: 20px;">
    <h2 style="color: #f59e0b;">⚠️ Низкий баланс</h2>
    <p>Здравствуйте, <strong>{username}</strong>!</p>
    <p>Ваш баланс на счете <strong>#{user_id}</strong> опустился ниже 1000₽.</p>
    <p style="font-size: 18px; color: #dc2626;">
      Текущий баланс: <strong>{balance:.2f}₽</strong>
    </p>
    <p>Рекомендуем пополнить баланс для продолжения работы.</p>
    <hr style="margin: 20px 0;">
    <p style="color: #6b7280; font-size: 12px;">
      С уважением,<br>
      Система уведомлений
    </p>
  </body>
</html>
    '''

    part1 = MIMEText(text, 'plain', 'utf-8')
    part2 = MIMEText(html, 'html', 'utf-8')

    msg.attach(part1)
    msg.attach(part2)

    with smtplib.SMTP(smtp_server, smtp_port) as server:
        server.starttls()
        server.login(smtp_user, smtp_password)
        server.send_message(msg)


def send_sms(phone: str, username: str, user_id: str, balance: float):
    '''Отправка SMS уведомления (требуется настройка SMS-провайдера)'''
    # Здесь нужно интегрировать SMS-провайдера (Twilio, SMS.ru и т.д.)
    # Пример для SMS.ru:
    
    sms_api_key = os.environ.get('SMS_API_KEY', '')
    
    if not sms_api_key:
        print('SMS API key not configured')
        return
    
    message = f'Баланс #{user_id} низкий: {balance:.2f}₽. Пополните счет.'
    
    # Здесь должен быть код отправки через SMS-провайдера
    print(f'SMS to {phone}: {message}')
