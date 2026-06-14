# Trae 开发提示词 — 山青浩然羽毛球管理系统

## 一句话任务

用 React 18 + Vite + Supabase + shadcn/ui + Tailwind CSS 从零搭建一套「山青浩然羽毛球管理系统」轻量级内部 ERP，完成后推送到 GitHub，并部署到 Vercel。

---

## 技术栈要求（固定，不可替换）

| 层级 | 选型 |
|------|------|
| 后端 / 数据库 / 鉴权 | Supabase（PostgreSQL + Auth + Row Level Security） |
| 前端框架 | React 18 + Vite |
| UI 组件库 | shadcn/ui（基于 Radix UI） |
| 样式 | Tailwind CSS + CSS 变量设计令牌 |
| 图表 | Recharts |
| 路由 | React Router v6 |
| 图标 | Lucide React |
| 部署 | Vercel（连接 GitHub 仓库，自动 CI/CD） |

---

## 界面设计规范（严格还原截图）

- **主题**：纯白背景 `#FFFFFF`，字体 Inter
- **侧边栏**：宽 220px，白底，左上角显示「山青浩然 / 羽毛球管理系统」品牌名，当前激活菜单项用蓝色填充背景（`#3B6FE8`），其余灰色文字；底部固定显示当前登录用户头像缩写、姓名、角色标签
- **菜单结构**（按截图顺序）：
  - 📦 进销管理（分组标题）
    - 综合仪表盘
    - 商品仓库
    - 采购入库
    - 销售出库
    - 员工管理
    - 客户管理
  - 💰 经营流水（分组标题）
    - 流水列表
    - 快速记账
    - 经营报表
    - 系统设置
- **内容区**：`#F5F6FA` 背景，顶部面包屑标题，右上角「退出」按钮
- **统计卡片**：白色圆角卡片，左侧灰色小标题 + 大号金额，右侧带色圆形图标（蓝/绿/橙/青）
- **图表**：Recharts 折线图，X 轴日期，Y 轴金额（¥），带网格线
- **低库存预警**：右侧卡片，橙色警告图标 + 数字角标，列出商品名与库存数量（红色）
- **移动端**：侧边栏收缩为抽屉菜单，响应式布局

---

## Supabase 数据库 Schema（请用 SQL Migration 创建）

```sql
-- 启用 UUID 扩展
create extension if not exists "uuid-ossp";

-- 用户角色枚举
create type user_role as enum ('admin', 'warehouse', 'sales');

-- 员工表（与 Supabase Auth 用户关联）
create table employees (
  id uuid primary key default uuid_generate_v4(),
  auth_user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  role user_role not null default 'sales',
  commission_rate numeric(5,4) default 0,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- 商品表
create table products (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  brand text,
  spec text,
  stock_quantity integer not null default 0,
  purchase_price numeric(10,2) not null,
  selling_price numeric(10,2) not null,
  created_at timestamptz default now()
);

-- 客户表
create table customers (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  contact text,
  type text check (type in ('普通','VIP','批发商','零售商')) default '普通',
  created_at timestamptz default now()
);

-- 采购记录
create table purchases (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid references products(id),
  supplier text,
  quantity integer not null,
  unit_price numeric(10,2) not null,
  purchase_date date not null default current_date,
  created_at timestamptz default now()
);

-- 销售记录
create table sales (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid references products(id),
  customer_id uuid references customers(id),
  employee_id uuid references employees(id),
  quantity integer not null,
  unit_price numeric(10,2) not null,
  sale_date date not null default current_date,
  created_at timestamptz default now()
);

-- 费用类别维表
create table expense_categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique
);

-- 付款人维表
create table payers (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique
);

-- 银行账户维表
create table bank_accounts (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique
);

-- 经营流水
create table transactions (
  id uuid primary key default uuid_generate_v4(),
  type text check (type in ('入账','付款','收入')) not null,
  amount numeric(10,2) not null,
  quantity numeric(10,2) default 1,
  unit_price numeric(10,2),
  category_id uuid references expense_categories(id),
  payer_id uuid references payers(id),
  bank_account_id uuid references bank_accounts(id),
  is_reimbursable boolean default false,
  note text,
  transaction_date date not null default current_date,
  created_at timestamptz default now()
);
```

### 库存联动触发器（Supabase SQL）

```sql
-- 采购入库后增加库存
create or replace function on_purchase_insert()
returns trigger language plpgsql as $$
begin
  update products set stock_quantity = stock_quantity + NEW.quantity where id = NEW.product_id;
  return NEW;
end;$$;
create trigger trg_purchase_insert after insert on purchases
  for each row execute function on_purchase_insert();

-- 删除采购记录回滚库存
create or replace function on_purchase_delete()
returns trigger language plpgsql as $$
begin
  update products set stock_quantity = stock_quantity - OLD.quantity where id = OLD.product_id;
  return OLD;
end;$$;
create trigger trg_purchase_delete after delete on purchases
  for each row execute function on_purchase_delete();

-- 销售出库减少库存
create or replace function on_sale_insert()
returns trigger language plpgsql as $$
begin
  update products set stock_quantity = stock_quantity - NEW.quantity where id = NEW.product_id;
  return NEW;
end;$$;
create trigger trg_sale_insert after insert on sales
  for each row execute function on_sale_insert();

-- 删除销售记录回滚库存
create or replace function on_sale_delete()
returns trigger language plpgsql as $$
begin
  update products set stock_quantity = stock_quantity + OLD.quantity where id = OLD.product_id;
  return OLD;
end;$$;
create trigger trg_sale_delete after delete on sales
  for each row execute function on_sale_delete();
```

### Row Level Security（RLS）策略

```sql
-- 启用 RLS
alter table products enable row level security;
alter table purchases enable row level security;
alter table sales enable row level security;
alter table employees enable row level security;
alter table customers enable row level security;
alter table transactions enable row level security;

-- 辅助函数：获取当前用户角色
create or replace function get_my_role()
returns text language sql security definer as $$
  select role::text from employees where auth_user_id = auth.uid();
$$;

-- products：所有已登录用户可读；admin/warehouse 可写
create policy "products_read" on products for select using (auth.role() = 'authenticated');
create policy "products_write" on products for all using (get_my_role() in ('admin','warehouse'));

-- purchases：admin/warehouse 可全操作
create policy "purchases_all" on purchases for all using (get_my_role() in ('admin','warehouse'));

-- sales：admin 可全操作；sales 只能看自己的记录
create policy "sales_admin" on sales for all using (get_my_role() = 'admin');
create policy "sales_own" on sales for select using (
  get_my_role() = 'sales' and
  employee_id = (select id from employees where auth_user_id = auth.uid())
);
create policy "sales_insert_own" on sales for insert with check (
  get_my_role() = 'sales' and
  employee_id = (select id from employees where auth_user_id = auth.uid())
);

-- employees：admin 可全操作；其他只能读自己
create policy "employees_admin" on employees for all using (get_my_role() = 'admin');
create policy "employees_self" on employees for select using (auth_user_id = auth.uid());

-- customers：admin/sales 可全操作
create policy "customers_all" on customers for all using (get_my_role() in ('admin','sales'));

-- transactions：仅 admin
create policy "transactions_admin" on transactions for all using (get_my_role() = 'admin');
```

---

## 页面与功能清单

### 1. 登录页（`/login`）
- Supabase Auth 邮箱 + 密码登录
- 登录成功后根据角色跳转：admin → `/dashboard`，warehouse → `/products`，sales → `/sales`

### 2. 综合仪表盘（`/dashboard`，仅 admin）
- 4 张统计卡片：今日销售额、本月销售额、本月采购额、本月毛利润
- 3 张流水卡片：本月入账、本月支出、本月净额
- 过去 30 天销售额折线图（Recharts LineChart）
- 低库存预警列表（stock_quantity ≤ 10，红色数字）
- 最近销售记录表格

### 3. 商品仓库（`/products`）
- 数据表格：商品名、品牌、规格、库存（≤10 红色预警）、进货价、售价、操作
- 搜索框（名称/品牌）
- 新增/编辑弹窗（Dialog）
- 删除确认弹窗
- 权限：admin/warehouse 可编辑；sales 只读

### 4. 采购入库（`/purchases`）
- 表单：选择商品、供应商、数量、单价、日期
- 日期范围筛选
- 合计统计行
- 删除时库存自动回滚
- 权限：admin/warehouse

### 5. 销售出库（`/sales`）
- 表单：商品（显示库存）、客户、销售员、数量（库存不足时前端禁用提交并提示）、单价、日期
- 按销售员筛选
- 删除时库存自动回滚
- 权限：admin 全量；sales 仅自己记录

### 6. 员工管理（`/employees`，仅 admin）
- 字段：姓名、角色、提成比例、在职状态
- 支持新增/编辑/停用（不物理删除）

### 7. 客户管理（`/customers`）
- 字段：客户名、联系人、类型（色块标签：普通灰/VIP 金/批发商蓝/零售商绿）
- 权限：admin/sales

### 8. 流水列表（`/ledger/transactions`，仅 admin）
- 多维筛选：类型、类别、日期范围、付款人
- 底部汇总：入账合计 / 支出合计 / 净额
- 删除确认

### 9. 快速记账（`/ledger/new`，仅 admin）
- 字段：资金类型、金额（或数量×单价自动计算）、类别、付款人、银行账户、是否报销、备注、日期
- 提交后 Toast 通知，表单重置

### 10. 经营报表（`/ledger/reports`，仅 admin）
- 月份选择器
- 支出类别饼图（PieChart）
- 付款人柱状图（BarChart）
- 每日收支折线图（LineChart，双线：收入/支出）

### 11. 系统设置（`/ledger/settings`，仅 admin）
- Tabs 组件：费用类别 / 付款人 / 银行账户
- 每个 Tab 支持新增和删除

---

## 路由守卫逻辑

```jsx
// 伪代码
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, role } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(role)) return <Navigate to="/403" />;
  return children;
};
```

---

## 项目结构（请严格按此创建）

```
src/
├── components/
│   ├── layout/
│   │   ├── AppLayout.jsx      # 整体布局：侧边栏 + 内容区
│   │   └── Sidebar.jsx        # 侧边栏菜单、用户信息底栏
│   ├── ledger/
│   │   └── TransactionForm.jsx
│   └── shared/
│       ├── StatCard.jsx       # 统计卡片组件
│       ├── PageHeader.jsx     # 页面标题 + 操作按钮区
│       ├── EmptyState.jsx     # 空状态占位
│       └── DeleteConfirm.jsx  # 删除确认 Dialog
├── hooks/
│   └── useAuth.js             # 封装 Supabase session + 角色
├── lib/
│   ├── supabase.js            # createClient 单例
│   ├── auth.js                # isAdmin / isWarehouse / isSales
│   └── format.js              # formatCurrency / formatDate
├── pages/
│   ├── Login.jsx
│   ├── Dashboard.jsx
│   ├── Products.jsx
│   ├── Purchases.jsx
│   ├── Sales.jsx
│   ├── Employees.jsx
│   ├── Customers.jsx
│   └── ledger/
│       ├── Transactions.jsx
│       ├── NewTransaction.jsx
│       ├── Reports.jsx
│       └── LedgerSettings.jsx
└── App.jsx                    # 路由配置 + 角色守卫
```

---

## 环境变量（`.env.local`）

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

> 在 Vercel 部署时，将以上两个变量添加到 Project Settings → Environment Variables。

---

## 部署流程

1. 在 Supabase 控制台创建新项目，执行上方所有 SQL Migration
2. `npm create vite@latest shanqing-badminton -- --template react`
3. 安装依赖：`npm install @supabase/supabase-js react-router-dom recharts lucide-react`
4. 初始化 shadcn/ui：`npx shadcn-ui@latest init`，选 Default style、slate 主色、CSS variables
5. 按项目结构创建所有文件，填入上方逻辑
6. `git init && git remote add origin <你的 GitHub 仓库地址> && git push -u origin main`
7. 在 Vercel 导入 GitHub 仓库，框架选 Vite，填入环境变量，点击 Deploy

---

## 关键 UX 细节（必须实现）

- 库存不足时，销售出库表单提交按钮变灰并显示红色提示「库存不足，当前仅剩 X 件」
- 所有增删改操作完成后，使用 shadcn/ui 的 `toast()` 给出成功/失败反馈
- 金额统一格式化为 `¥#,##0.00`
- 日期统一格式化为 `YYYY-MM-DD`
- 低库存（≤10件）商品在商品仓库表格中库存列显示红色加粗数字
- 侧边栏在 `md` 断点以下收缩，用汉堡菜单按钮触发抽屉
- 403 无权限页面：简单提示「您没有访问该页面的权限」+返回按钮
