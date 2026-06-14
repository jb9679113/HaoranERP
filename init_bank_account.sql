-- =============================================
-- 银行账户表修改：添加余额字段
-- =============================================

-- 添加余额字段（如果不存在）
ALTER TABLE IF EXISTS bank_accounts 
ADD COLUMN IF NOT EXISTS balance DECIMAL(12, 2) DEFAULT 0;

-- 查看银行账户表结构
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'bank_accounts';

-- =============================================
-- 初始化青岛银行账户（5人每人投入1万，共5万启动资金）
-- =============================================

-- 先检查是否已存在青岛银行账户
INSERT INTO bank_accounts (name, balance)
SELECT '青岛银行', 50000.00
WHERE NOT EXISTS (SELECT 1 FROM bank_accounts WHERE name = '青岛银行');

-- 查看结果
SELECT * FROM bank_accounts;