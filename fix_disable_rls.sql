-- =============================================
-- 最简单的解决方案：临时禁用 RLS
-- =============================================

-- 禁用 sales 表的 RLS（测试用）
ALTER TABLE sales DISABLE ROW LEVEL SECURITY;

-- 如果需要，也禁用其他表的 RLS
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE employees DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE payers DISABLE ROW LEVEL SECURITY;

SELECT 'RLS 已禁用，测试完成后记得重新启用' AS result;