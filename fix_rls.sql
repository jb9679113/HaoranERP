-- =============================================
-- 修复销售出库页面插入失败问题
-- 原因：RLS（行级安全性）策略阻止了插入操作
-- 跳过不存在的表
-- =============================================

-- 为 sales 表创建策略
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sales') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow authenticated users to insert sales') THEN
      CREATE POLICY "Allow authenticated users to insert sales" ON sales FOR INSERT TO authenticated WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow authenticated users to select sales') THEN
      CREATE POLICY "Allow authenticated users to select sales" ON sales FOR SELECT TO authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow authenticated users to update sales') THEN
      CREATE POLICY "Allow authenticated users to update sales" ON sales FOR UPDATE TO authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow authenticated users to delete sales') THEN
      CREATE POLICY "Allow authenticated users to delete sales" ON sales FOR DELETE TO authenticated USING (true);
    END IF;
  END IF;
END $$;

-- 为 purchases 表创建策略
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'purchases') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow authenticated users to insert purchases') THEN
      CREATE POLICY "Allow authenticated users to insert purchases" ON purchases FOR INSERT TO authenticated WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow authenticated users to select purchases') THEN
      CREATE POLICY "Allow authenticated users to select purchases" ON purchases FOR SELECT TO authenticated USING (true);
    END IF;
  END IF;
END $$;

-- 为 transactions 表创建策略
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'transactions') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow authenticated users to select transactions') THEN
      CREATE POLICY "Allow authenticated users to select transactions" ON transactions FOR SELECT TO authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow authenticated users to insert transactions') THEN
      CREATE POLICY "Allow authenticated users to insert transactions" ON transactions FOR INSERT TO authenticated WITH CHECK (true);
    END IF;
  END IF;
END $$;

-- 为 payers 表创建策略
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payers') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow authenticated users to select payers') THEN
      CREATE POLICY "Allow authenticated users to select payers" ON payers FOR SELECT TO authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow authenticated users to insert payers') THEN
      CREATE POLICY "Allow authenticated users to insert payers" ON payers FOR INSERT TO authenticated WITH CHECK (true);
    END IF;
  END IF;
END $$;

-- 为 customers 表创建策略
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customers') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow authenticated users to select customers') THEN
      CREATE POLICY "Allow authenticated users to select customers" ON customers FOR SELECT TO authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow authenticated users to insert customers') THEN
      CREATE POLICY "Allow authenticated users to insert customers" ON customers FOR INSERT TO authenticated WITH CHECK (true);
    END IF;
  END IF;
END $$;

-- 为 products 表创建策略
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow authenticated users to select products') THEN
      CREATE POLICY "Allow authenticated users to select products" ON products FOR SELECT TO authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow authenticated users to insert products') THEN
      CREATE POLICY "Allow authenticated users to insert products" ON products FOR INSERT TO authenticated WITH CHECK (true);
    END IF;
  END IF;
END $$;

-- 为 employees 表创建策略
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'employees') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow authenticated users to select employees') THEN
      CREATE POLICY "Allow authenticated users to select employees" ON employees FOR SELECT TO authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow authenticated users to insert employees') THEN
      CREATE POLICY "Allow authenticated users to insert employees" ON employees FOR INSERT TO authenticated WITH CHECK (true);
    END IF;
  END IF;
END $$;

-- 为 suppliers 表创建策略
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'suppliers') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow authenticated users to select suppliers') THEN
      CREATE POLICY "Allow authenticated users to select suppliers" ON suppliers FOR SELECT TO authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow authenticated users to insert suppliers') THEN
      CREATE POLICY "Allow authenticated users to insert suppliers" ON suppliers FOR INSERT TO authenticated WITH CHECK (true);
    END IF;
  END IF;
END $$;

-- 为 inventory 表创建策略（如果存在）
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'inventory') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow authenticated users to select inventory') THEN
      CREATE POLICY "Allow authenticated users to select inventory" ON inventory FOR SELECT TO authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow authenticated users to insert inventory') THEN
      CREATE POLICY "Allow authenticated users to insert inventory" ON inventory FOR INSERT TO authenticated WITH CHECK (true);
    END IF;
  END IF;
END $$;

-- 为 inventory_logs 表创建策略（如果存在）
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'inventory_logs') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow authenticated users to select inventory_logs') THEN
      CREATE POLICY "Allow authenticated users to select inventory_logs" ON inventory_logs FOR SELECT TO authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow authenticated users to insert inventory_logs') THEN
      CREATE POLICY "Allow authenticated users to insert inventory_logs" ON inventory_logs FOR INSERT TO authenticated WITH CHECK (true);
    END IF;
  END IF;
END $$;

SELECT 'RLS 策略检查/创建完成' AS result;