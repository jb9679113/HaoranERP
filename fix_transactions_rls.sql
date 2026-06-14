-- =============================================
-- 修复 transactions 表的 RLS 策略
-- =============================================

-- 确保 transactions 表存在并启用 RLS
ALTER TABLE IF EXISTS transactions ENABLE ROW LEVEL SECURITY;

-- 删除现有策略（如果存在）
DROP POLICY IF EXISTS "Allow all users to select transactions" ON transactions;
DROP POLICY IF EXISTS "Allow authenticated users to insert transactions" ON transactions;
DROP POLICY IF EXISTS "Allow authenticated users to update transactions" ON transactions;
DROP POLICY IF EXISTS "Allow authenticated users to delete transactions" ON transactions;

-- 创建新策略
CREATE POLICY "Allow all users to select transactions" 
ON transactions FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to insert transactions" 
ON transactions FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update transactions" 
ON transactions FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to delete transactions" 
ON transactions FOR DELETE TO authenticated USING (true);

-- 检查 transactions 表结构
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'transactions';

SELECT 'transactions 表 RLS 策略配置完成！' AS result;