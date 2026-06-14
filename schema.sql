-- 为已存在的表添加缺失的列
ALTER TABLE IF EXISTS payers ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'other';
ALTER TABLE IF EXISTS expense_categories ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'expense';

-- 创建缺失的表（如果不存在）
CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id),
  customer_id UUID REFERENCES customers(id),
  employee_id UUID REFERENCES employees(id),
  quantity INTEGER DEFAULT 1,
  unit_price DECIMAL(10, 2) DEFAULT 0,
  total_amount DECIMAL(10, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  sale_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id),
  supplier_id UUID REFERENCES suppliers(id),
  quantity INTEGER DEFAULT 1,
  unit_price DECIMAL(10, 2) DEFAULT 0,
  total_amount DECIMAL(10, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  purchase_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  contact VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(50) NOT NULL CHECK (type IN ('income', 'expense')),
  category_id UUID REFERENCES expense_categories(id),
  payer_id UUID REFERENCES payers(id),
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT,
  transaction_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建基础数据（如果不存在）
INSERT INTO expense_categories (name, type) VALUES 
('办公费用', 'expense'),
('水电费', 'expense'),
('租金', 'expense'),
('工资', 'expense'),
('其他支出', 'expense'),
('销售收入', 'income'),
('其他收入', 'income')
ON CONFLICT DO NOTHING;

INSERT INTO payers (name, type) VALUES 
('现金', 'cash'),
('微信支付', 'wechat'),
('支付宝', 'alipay'),
('银行卡', 'bank')
ON CONFLICT DO NOTHING;

-- 启用 RLS
ALTER TABLE IF EXISTS sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS payers ENABLE ROW LEVEL SECURITY;
