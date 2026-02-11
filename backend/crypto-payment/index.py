import json
import os
import hashlib
from datetime import datetime

def handler(event: dict, context) -> dict:
    '''Генерация криптовалютного адреса и QR-кода для пополнения баланса'''
    
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
        amount = data.get('amount')
        currency = data.get('currency', 'USDT')  # USDT, BTC, ETH
        
        if not all([user_id, amount]):
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Не указаны обязательные поля: userId, amount'})
            }
        
        # Получаем адреса кошельков из переменных окружения
        wallet_addresses = {
            'USDT': os.environ.get('CRYPTO_USDT_ADDRESS', 'TExampleUSDTAddressForDemo1234567890'),
            'BTC': os.environ.get('CRYPTO_BTC_ADDRESS', 'bc1qExampleBTCAddressForDemo1234567'),
            'ETH': os.environ.get('CRYPTO_ETH_ADDRESS', '0xExampleETHAddressForDemo123456789012')
        }
        
        if currency not in wallet_addresses:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': f'Неподдерживаемая криптовалюта: {currency}'})
            }
        
        wallet_address = wallet_addresses[currency]
        
        # Генерируем ID транзакции
        transaction_id = hashlib.sha256(f"{user_id}-{amount}-{currency}-{datetime.now().isoformat()}".encode()).hexdigest()[:16]
        
        # Курсы криптовалют к рублю (заглушка - в реальности нужно получать через API)
        exchange_rates = {
            'USDT': float(os.environ.get('USDT_TO_RUB_RATE', '92')),
            'BTC': float(os.environ.get('BTC_TO_RUB_RATE', '8500000')),
            'ETH': float(os.environ.get('ETH_TO_RUB_RATE', '320000'))
        }
        
        crypto_amount = round(amount / exchange_rates[currency], 8)
        
        # URL для QR кода
        qr_data = f"{wallet_address}"
        qr_code_url = f"https://api.qrserver.com/v1/create-qr-code/?size=300x300&data={qr_data}"
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'success': True,
                'transactionId': transaction_id,
                'currency': currency,
                'walletAddress': wallet_address,
                'amountRub': amount,
                'amountCrypto': crypto_amount,
                'exchangeRate': exchange_rates[currency],
                'qrCodeUrl': qr_code_url,
                'instructions': f'Переведите {crypto_amount} {currency} на адрес {wallet_address}. После подтверждения транзакции баланс будет пополнен автоматически.',
                'network': 'TRC20' if currency == 'USDT' else currency,
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
            'body': json.dumps({'error': f'Ошибка генерации платёжных данных: {str(e)}'})
        }