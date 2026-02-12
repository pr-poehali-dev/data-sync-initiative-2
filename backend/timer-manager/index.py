import json
import os
from datetime import datetime, timedelta
import psycopg2
from psycopg2.extras import RealDictCursor

def process_deductions(cur, conn):
    '''Автоматическое списание средств с активных таймеров'''
    cur.execute('''
        SELECT id, user_id, balance, coefficient, timer_end_date, last_deduction_time
        FROM active_timers
        WHERE is_active = TRUE
    ''')
    active_timers = cur.fetchall()
    
    processed = 0
    deactivated = 0
    
    for timer in active_timers:
        timer_id = timer['id']
        balance = float(timer['balance'])
        coefficient = float(timer['coefficient'])
        timer_end_date = timer['timer_end_date']
        last_deduction = timer['last_deduction_time']
        
        now = datetime.now()
        
        if now >= timer_end_date:
            cur.execute('''
                UPDATE active_timers
                SET balance = 0, is_active = FALSE, updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
            ''', (timer_id,))
            deactivated += 1
            continue
        
        if coefficient > 0:
            seconds_passed = (now - last_deduction).total_seconds()
            minutes_passed = seconds_passed / 60
            amount_to_deduct = minutes_passed * coefficient
            
            new_balance = max(0, balance - amount_to_deduct)
            
            if new_balance > 0:
                cur.execute('''
                    UPDATE active_timers
                    SET balance = %s, last_deduction_time = %s, updated_at = CURRENT_TIMESTAMP
                    WHERE id = %s
                ''', (new_balance, now, timer_id))
            else:
                cur.execute('''
                    UPDATE active_timers
                    SET balance = 0, is_active = FALSE, updated_at = CURRENT_TIMESTAMP
                    WHERE id = %s
                ''', (timer_id,))
                deactivated += 1
            
            processed += 1
    
    conn.commit()
    return {'processed': processed, 'deactivated': deactivated}

def handler(event: dict, context) -> dict:
    '''API для управления таймерами пользователей и автоматического списания'''
    
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': ''
        }
    
    try:
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        if method == 'GET':
            user_id = event.get('queryStringParameters', {}).get('user_id')
            
            if user_id:
                cur.execute('''
                    SELECT u.*, at.balance, at.coefficient, at.timer_end_date, 
                           at.is_active, at.last_deduction_time
                    FROM users u
                    LEFT JOIN active_timers at ON u.id = at.user_id AND at.is_active = TRUE
                    WHERE u.id = %s
                ''', (user_id,))
                user = cur.fetchone()
                
                if not user:
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'User not found'})
                    }
                
                result = dict(user)
                if result.get('timer_end_date'):
                    result['timer_end_date'] = result['timer_end_date'].isoformat()
                if result.get('last_deduction_time'):
                    result['last_deduction_time'] = result['last_deduction_time'].isoformat()
                if result.get('created_at'):
                    result['created_at'] = result['created_at'].isoformat()
                if result.get('updated_at'):
                    result['updated_at'] = result['updated_at'].isoformat()
                    
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps(result)
                }
            else:
                cur.execute('''
                    SELECT u.*, at.balance, at.coefficient, at.timer_end_date, 
                           at.is_active, at.last_deduction_time
                    FROM users u
                    LEFT JOIN active_timers at ON u.id = at.user_id AND at.is_active = TRUE
                    ORDER BY u.id
                ''')
                users = cur.fetchall()
                
                result = []
                for user in users:
                    user_dict = dict(user)
                    if user_dict.get('timer_end_date'):
                        user_dict['timer_end_date'] = user_dict['timer_end_date'].isoformat()
                    if user_dict.get('last_deduction_time'):
                        user_dict['last_deduction_time'] = user_dict['last_deduction_time'].isoformat()
                    if user_dict.get('created_at'):
                        user_dict['created_at'] = user_dict['created_at'].isoformat()
                    if user_dict.get('updated_at'):
                        user_dict['updated_at'] = user_dict['updated_at'].isoformat()
                    result.append(user_dict)
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps(result)
                }
        
        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            action = body.get('action')
            
            if action == 'create_user':
                username = body.get('username')
                email = body.get('email', '')
                phone = body.get('phone', '')
                
                cur.execute('''
                    INSERT INTO users (username, email, phone)
                    VALUES (%s, %s, %s)
                    RETURNING id, username, email, phone, created_at
                ''', (username, email, phone))
                user = cur.fetchone()
                conn.commit()
                
                result = dict(user)
                if result.get('created_at'):
                    result['created_at'] = result['created_at'].isoformat()
                
                return {
                    'statusCode': 201,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps(result)
                }
            
            elif action == 'add_balance':
                user_id = body.get('user_id')
                amount = float(body.get('amount', 0))
                admin_name = body.get('admin_name', 'admin')
                
                print(f'[ADD_BALANCE] Start: user_id={user_id}, amount={amount}, admin={admin_name}')
                
                cur.execute('''
                    SELECT id FROM users WHERE id = %s
                ''', (user_id,))
                user = cur.fetchone()
                
                if not user:
                    print(f'[ADD_BALANCE] User {user_id} not found, creating...')
                    cur.execute('''
                        INSERT INTO users (id, username) VALUES (%s, %s)
                    ''', (user_id, f'user{user_id}'))
                    conn.commit()
                    print(f'[ADD_BALANCE] User {user_id} created')
                else:
                    print(f'[ADD_BALANCE] User {user_id} exists')
                
                print(f'[ADD_BALANCE] Inserting topup history...')
                cur.execute('''
                    INSERT INTO topup_history (user_id, amount, admin_name)
                    VALUES (%s, %s, %s)
                    RETURNING id, user_id, amount, admin_name, created_at
                ''', (user_id, amount, admin_name))
                topup = cur.fetchone()
                print(f'[ADD_BALANCE] Topup history created: id={topup["id"]}')
                
                cur.execute('''
                    SELECT balance, coefficient FROM active_timers 
                    WHERE user_id = %s AND is_active = TRUE
                ''', (user_id,))
                timer = cur.fetchone()
                
                if timer:
                    print(f'[ADD_BALANCE] Active timer found: balance={timer["balance"]}, coefficient={timer["coefficient"]}')
                    new_balance = float(timer['balance']) + amount
                    coefficient = float(timer['coefficient'])
                    
                    additional_minutes = amount / coefficient if coefficient > 0 else 0
                    print(f'[ADD_BALANCE] Updating timer: new_balance={new_balance}, additional_minutes={additional_minutes}')
                    
                    cur.execute('''
                        UPDATE active_timers
                        SET balance = %s,
                            timer_end_date = timer_end_date + make_interval(mins => %s),
                            updated_at = CURRENT_TIMESTAMP
                        WHERE user_id = %s AND is_active = TRUE
                    ''', (new_balance, additional_minutes, user_id))
                    print(f'[ADD_BALANCE] Timer updated successfully')
                else:
                    print(f'[ADD_BALANCE] No active timer for user {user_id}')
                
                conn.commit()
                print(f'[ADD_BALANCE] Transaction committed successfully')
                
                result = dict(topup)
                if result.get('created_at'):
                    result['created_at'] = result['created_at'].isoformat()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps(result)
                }
            
            elif action == 'start_timer':
                user_id = body.get('user_id')
                balance = float(body.get('balance', 0))
                coefficient = float(body.get('coefficient', 1))
                
                total_minutes = balance / coefficient if coefficient > 0 else 0
                timer_end_date = datetime.now() + timedelta(minutes=total_minutes)
                
                cur.execute('''
                    INSERT INTO active_timers (user_id, balance, coefficient, timer_end_date)
                    VALUES (%s, %s, %s, %s)
                    ON CONFLICT (user_id) 
                    DO UPDATE SET 
                        balance = EXCLUDED.balance,
                        coefficient = EXCLUDED.coefficient,
                        timer_end_date = EXCLUDED.timer_end_date,
                        is_active = TRUE,
                        last_deduction_time = CURRENT_TIMESTAMP,
                        updated_at = CURRENT_TIMESTAMP
                    RETURNING id, user_id, balance, coefficient, timer_end_date
                ''', (user_id, balance, coefficient, timer_end_date))
                timer = cur.fetchone()
                conn.commit()
                
                result = dict(timer)
                if result.get('timer_end_date'):
                    result['timer_end_date'] = result['timer_end_date'].isoformat()
                
                return {
                    'statusCode': 201,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps(result)
                }
            
            elif action == 'process_deductions':
                result = process_deductions(cur, conn)
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'success': True,
                        'processed': result['processed'],
                        'deactivated': result['deactivated'],
                        'timestamp': datetime.now().isoformat()
                    })
                }
            
            elif action == 'get_topup_history':
                user_id = body.get('user_id')
                
                print(f'[GET_TOPUP_HISTORY] Start: user_id={user_id}')
                
                if user_id:
                    cur.execute('''
                        SELECT id, user_id, amount, admin_name, created_at
                        FROM topup_history
                        WHERE user_id = %s
                        ORDER BY created_at DESC
                    ''', (user_id,))
                else:
                    cur.execute('''
                        SELECT th.id, th.user_id, th.amount, th.admin_name, th.created_at, u.username
                        FROM topup_history th
                        LEFT JOIN users u ON th.user_id = u.id
                        ORDER BY th.created_at DESC
                        LIMIT 100
                    ''')
                
                history = cur.fetchall()
                print(f'[GET_TOPUP_HISTORY] Found {len(history)} records')
                
                result = []
                for record in history:
                    record_dict = dict(record)
                    if record_dict.get('created_at'):
                        record_dict['created_at'] = record_dict['created_at'].isoformat()
                    result.append(record_dict)
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps(result)
                }
        
        elif method == 'PUT':
            body = json.loads(event.get('body', '{}'))
            user_id = body.get('user_id')
            
            updates = []
            params = []
            
            if 'email' in body:
                updates.append('email = %s')
                params.append(body['email'])
            if 'phone' in body:
                updates.append('phone = %s')
                params.append(body['phone'])
            if 'coefficient' in body:
                cur.execute('''
                    UPDATE active_timers 
                    SET coefficient = %s, updated_at = CURRENT_TIMESTAMP
                    WHERE user_id = %s AND is_active = TRUE
                ''', (float(body['coefficient']), user_id))
            
            if updates:
                params.append(user_id)
                cur.execute(f'''
                    UPDATE users 
                    SET {', '.join(updates)}, updated_at = CURRENT_TIMESTAMP
                    WHERE id = %s
                ''', params)
            
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True})
            }
        
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'})
        }
        
    except Exception as e:
        print(f'[ERROR] Exception occurred: {type(e).__name__}: {str(e)}')
        import traceback
        print(f'[ERROR] Traceback: {traceback.format_exc()}')
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e), 'type': type(e).__name__})
        }
    finally:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            conn.close()