import json
import os
from datetime import datetime

def handler(event: dict, context) -> dict:
    '''Генерация счёта на оплату для пополнения баланса клиента'''
    
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': ''
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Метод не поддерживается'})
        }
    
    try:
        data = json.loads(event.get('body', '{}'))
        user_id = data.get('userId')
        username = data.get('username')
        amount = data.get('amount')
        
        if not all([user_id, username, amount]):
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Не указаны обязательные поля: userId, username, amount'})
            }
        
        # Генерируем номер счёта
        invoice_number = f"INV-{user_id}-{datetime.now().strftime('%Y%m%d%H%M%S')}"
        
        # Данные компании (заглушки - нужно заменить на реальные)
        company_name = os.environ.get('COMPANY_NAME', 'ООО "Ваша Компания"')
        company_inn = os.environ.get('COMPANY_INN', '1234567890')
        company_kpp = os.environ.get('COMPANY_KPP', '123456789')
        company_account = os.environ.get('COMPANY_ACCOUNT', '40702810000000000000')
        company_bank = os.environ.get('COMPANY_BANK', 'ПАО "Сбербанк"')
        company_bik = os.environ.get('COMPANY_BIK', '044525225')
        company_correspondent = os.environ.get('COMPANY_CORRESPONDENT', '30101810400000000225')
        
        # Формируем HTML счёта
        invoice_html = f'''
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Счёт на оплату №{invoice_number}</title>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 40px; }}
        .header {{ text-align: center; margin-bottom: 30px; }}
        .company-info {{ margin-bottom: 20px; }}
        .invoice-table {{ width: 100%; border-collapse: collapse; margin-top: 20px; }}
        .invoice-table th, .invoice-table td {{ border: 1px solid #000; padding: 10px; text-align: left; }}
        .total {{ font-weight: bold; text-align: right; margin-top: 20px; }}
    </style>
</head>
<body>
    <div class="header">
        <h1>Счёт на оплату №{invoice_number}</h1>
        <p>от {datetime.now().strftime('%d.%m.%Y')}</p>
    </div>
    
    <div class="company-info">
        <p><strong>Получатель:</strong> {company_name}</p>
        <p><strong>ИНН:</strong> {company_inn} <strong>КПП:</strong> {company_kpp}</p>
        <p><strong>Расчётный счёт:</strong> {company_account}</p>
        <p><strong>Банк:</strong> {company_bank}</p>
        <p><strong>БИК:</strong> {company_bik}</p>
        <p><strong>Корр. счёт:</strong> {company_correspondent}</p>
    </div>
    
    <div>
        <p><strong>Плательщик:</strong> {username} (ID: {user_id})</p>
    </div>
    
    <table class="invoice-table">
        <thead>
            <tr>
                <th>№</th>
                <th>Наименование услуги</th>
                <th>Количество</th>
                <th>Цена</th>
                <th>Сумма</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>1</td>
                <td>Пополнение баланса лицевого счёта #{user_id}</td>
                <td>1</td>
                <td>{amount} ₽</td>
                <td>{amount} ₽</td>
            </tr>
        </tbody>
    </table>
    
    <div class="total">
        <p>Итого к оплате: {amount} ₽</p>
    </div>
    
    <div style="margin-top: 40px;">
        <p>Счёт действителен в течение 3 дней с даты выставления.</p>
        <p>После оплаты баланс будет пополнен автоматически.</p>
    </div>
</body>
</html>
        '''
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'success': True,
                'invoiceNumber': invoice_number,
                'invoiceHtml': invoice_html,
                'amount': amount,
                'date': datetime.now().isoformat()
            })
        }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': f'Ошибка генерации счёта: {str(e)}'})
        }
