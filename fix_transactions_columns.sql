-- =============================================
-- 修复：transactions 表缺少必要的列（使用正确的类型）
-- =============================================

-- 先检查 bank_accounts 表的 id 类型（应该是 bigint）
SELECT data_type 
FROM information_schema.columns 
WHERE table_name = 'bank_accounts' AND column_name = 'id';

-- 添加缺失的列（使用正确的类型）
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
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'transactions';

SELECT 'transactions 表结构修复完成！' AS result;