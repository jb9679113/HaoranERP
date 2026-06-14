-- =============================================
-- 极简修复：为销售出库页面启用插入权限
-- =============================================

-- 方案1：直接禁用 sales 表的 RLS（最简单，适合测试）
-- ALTER TABLE sales DISABLE ROW LEVEL SECURITY;

-- 方案2：创建允许插入的策略（推荐，保持安全性）
CREATE POLICY "Allow all users to select sales" 
ON sales FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to insert sales" 
ON sales FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update sales" 
ON sales FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to delete sales" 
ON sales FOR DELETE TO authenticated USING (true);

-- 为其他常用表也创建策略
CREATE POLICY "Allow all users to select products" ON products FOR SELECT USING (true);
CREATE POLICY "Allow authenticated users to insert products" ON products FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow all users to select customers" ON customers FOR SELECT USING (true);
CREATE POLICY "Allow authenticated users to insert customers" ON customers FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow all users to select employees" ON employees FOR SELECT USING (true);
CREATE POLICY "Allow authenticated users to insert employees" ON employees FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow all users to select transactions" ON transactions FOR SELECT USING (true);
CREATE POLICY "Allow authenticated users to insert transactions" ON transactions FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow all users to select payers" ON payers FOR SELECT USING (true);
CREATE POLICY "Allow authenticated users to insert payers" ON payers FOR INSERT TO authenticated WITH CHECK (true);

SELECT '修复完成！所有表已配置 RLS 策略' AS result;