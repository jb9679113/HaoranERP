-- =============================================
-- 修复：sales 表缺少 employee_id 列
-- =============================================

-- 添加缺失的列（如果不存在）
ALTER TABLE IF EXISTS sales 
ADD COLUMN IF NOT EXISTS employee_id UUID REFERENCES employees(id);

ALTER TABLE IF EXISTS sales 
ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id);

ALTER TABLE IF EXISTS sales 
ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1;

ALTER TABLE IF EXISTS sales 
ADD COLUMN IF NOT EXISTS unit_price DECIMAL(10, 2) DEFAULT 0;

ALTER TABLE IF EXISTS sales 
ADD COLUMN IF NOT EXISTS sale_date DATE DEFAULT CURRENT_DATE;

-- 查看 sales 表结构
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'sales';

SELECT 'sales 表结构修复完成！' AS result;