import json
import os
import base64
import boto3
from datetime import datetime

def handler(event: dict, context) -> dict:
    '''Загрузка изображений печати и подписи компании в S3 хранилище'''
    
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
        image_type = data.get('type')
        image_base64 = data.get('image')
        
        if not image_type or not image_base64:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Не указаны обязательные поля: type, image'})
            }
        
        if image_type not in ['signature', 'stamp']:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Неверный тип изображения. Допустимые: signature, stamp'})
            }
        
        # Декодируем base64
        if ',' in image_base64:
            image_base64 = image_base64.split(',')[1]
        
        image_data = base64.b64decode(image_base64)
        
        # Определяем тип файла
        content_type = 'image/png'
        if image_base64.startswith('iVBORw'):
            content_type = 'image/png'
        elif image_base64.startswith('/9j/'):
            content_type = 'image/jpeg'
        
        # Генерируем имя файла
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        filename = f'company/{image_type}-{timestamp}.png'
        
        # Загружаем в S3
        s3 = boto3.client('s3',
            endpoint_url='https://bucket.poehali.dev',
            aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
            aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
        )
        
        s3.put_object(
            Bucket='files',
            Key=filename,
            Body=image_data,
            ContentType=content_type
        )
        
        # Формируем CDN URL
        cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{filename}"
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'success': True,
                'url': cdn_url,
                'type': image_type,
                'message': 'Изображение успешно загружено'
            })
        }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': f'Ошибка загрузки изображения: {str(e)}'})
        }
