-- =============================================
-- 修复：transactions 表结构问题
-- =============================================

-- 1. 将 category 列改为可空（因为前端代码不使用此字段）
ALTER TABLE IF EXISTS transactions 
ALTER COLUMN category DROP NOT NULL;

-- 2. 如果 category 列不存在，添加一个可空的列
ALTER TABLE IF EXISTS transactions 
ADD COLUMN IF NOT EXISTS category VARCHAR(255);

-- 3. 确保其他必要列存在且类型正确
ALTER TABLE IF EXISTS transactions 
ADD COLUMN IF NOT EXISTS bank_account_id BIGINT;

ALTER TABLE IF EXISTS transactions 
ADD COLUMN IF NOT EXISTS category_id BIGINT;

ALTER TABLE IF EXISTS transactions 
ADD COLUMN IF NOT EXISTS payer_id BIGINT;

ALTER TABLE IF EXISTS transactions 
ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT '入账';

ALTER TABLE IF EXISTS transactions 
ADD COLUMN IF NOT EXISTS amount DECIMAL(10, 2) DEFAULT 0;

ALTER TABLE IF EXISTS transactions 
ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1;

ALTER TABLE IF EXISTS transactions 
ADD COLUMN IF NOT EXISTS unit_price DECIMAL(10, 2);

ALTER TABLE IF EXISTS transactions 
ADD COLUMN IF NOT EXISTS is_reimbursable BOOLEAN DEFAULT false;

ALTER TABLE IF EXISTS transactions 
ADD COLUMN IF NOT EXISTS note TEXT;

ALTER TABLE IF EXISTS transactions 
ADD COLUMN IF NOT EXISTS transaction_date DATE DEFAULT CURRENT_DATE;

-- 查看 transactions 表结构
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'transactions';

SELECT 'transactions 表结构修复完成！' AS result;