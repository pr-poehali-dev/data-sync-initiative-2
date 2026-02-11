-- Создание таблицы пользователей
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы активных таймеров
CREATE TABLE IF NOT EXISTS active_timers (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    balance DECIMAL(10, 2) NOT NULL DEFAULT 0,
    coefficient DECIMAL(10, 2) NOT NULL DEFAULT 1,
    timer_end_date TIMESTAMP NOT NULL,
    last_deduction_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы истории пополнений
CREATE TABLE IF NOT EXISTS topup_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    admin_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание индексов для оптимизации
CREATE INDEX IF NOT EXISTS idx_active_timers_user_id ON active_timers(user_id);
CREATE INDEX IF NOT EXISTS idx_active_timers_is_active ON active_timers(is_active);
CREATE INDEX IF NOT EXISTS idx_topup_history_user_id ON topup_history(user_id);