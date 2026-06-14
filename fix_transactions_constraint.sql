-- =============================================
-- 修复：transactions_type_check 约束问题
-- =============================================

-- 1. 查看当前的检查约束（使用正确的函数）
SELECT conname, pg_get_constraintdef(oid) as constraint_def
FROM pg_constraint 
WHERE conrelid = 'transactions'::regclass 
AND contype = 'c';

-- 2. 删除现有的 type 检查约束（如果存在）
ALTER TABLE IF EXISTS transactions 
DROP CONSTRAINT IF EXISTS transactions_type_check;

-- 3. 创建新的检查约束，允许常见的类型值
ALTER TABLE IF EXISTS transactions 
ADD CONSTRAINT transactions_type_check 
CHECK (type IN ('入账', '付款', '收入', '支出', '报销'));

-- 查看 transactions 表结构
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'transactions';

SELECT 'transactions 表约束修复完成！' AS result;