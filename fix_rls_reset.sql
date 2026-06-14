-- =============================================
-- 重新设置 RLS 策略（先删除再创建）
-- =============================================

-- 删除现有策略（如果存在）
DROP POLICY IF EXISTS "Allow all users to select sales" ON sales;
DROP POLICY IF EXISTS "Allow authenticated users to insert sales" ON sales;
DROP POLICY IF EXISTS "Allow authenticated users to update sales" ON sales;
DROP POLICY IF EXISTS "Allow authenticated users to delete sales" ON sales;

DROP POLICY IF EXISTS "Allow all users to select products" ON products;
DROP POLICY IF EXISTS "Allow authenticated users to insert products" ON products;

DROP POLICY IF EXISTS "Allow all users to select customers" ON customers;
DROP POLICY IF EXISTS "Allow authenticated users to insert customers" ON customers;

DROP POLICY IF EXISTS "Allow all users to select employees" ON employees;
DROP POLICY IF EXISTS "Allow authenticated users to insert employees" ON employees;

DROP POLICY IF EXISTS "Allow all users to select transactions" ON transactions;
DROP POLICY IF EXISTS "Allow authenticated users to insert transactions" ON transactions;

DROP POLICY IF EXISTS "Allow all users to select payers" ON payers;
DROP POLICY IF EXISTS "Allow authenticated users to insert payers" ON payers;

-- 创建新策略
CREATE POLICY "Allow all users to select sales" ON sales FOR SELECT USING (true);
CREATE POLICY "Allow authenticated users to insert sales" ON sales FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated users to update sales" ON sales FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to delete sales" ON sales FOR DELETE TO authenticated USING (true);

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

SELECT 'RLS 策略重新设置完成！' AS result;