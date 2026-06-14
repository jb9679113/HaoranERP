# 山青浩然羽毛球管理系统

> 一套面向羽毛球器材公司的轻量级内部 ERP 系统，融合「进销存管理」与「经营流水记账」两大核心模块。  
> 技术栈：React 18 + Vite + Supabase + shadcn/ui + Tailwind CSS，部署于 Vercel。

---

## 📐 系统设计理念

### 核心目标
将一家羽毛球器材公司日常经营中最高频的两类需求整合到同一平台：
1. **进销存**：商品库存的进、销、存全流程追踪，库存实时联动
2. **经营流水**：公司资金收支的精细化记录与可视化分析

### 设计原则
- **极简白色主题**：Inter 字体 + 冷调蓝灰色系，减少视觉干扰
- **角色最小权限**：不同岗位只看自己需要的数据，降低误操作风险
- **表单即时反馈**：库存不足拦截、金额自动计算、操作结果 Toast 通知
- **移动端兼容**：响应式布局，侧边栏在手机上自动收缩为抽屉菜单

---

## 🏗️ 技术架构

| 层级 | 技术选型 |
|------|---------|
| 后端 / 数据库 / 鉴权 | Supabase（PostgreSQL + Auth + Row Level Security） |
| 前端框架 | React 18 + Vite |
| UI 组件库 | shadcn/ui（基于 Radix UI） |
| 样式系统 | Tailwind CSS + CSS 变量设计令牌 |
| 图表 | Recharts |
| 路由 | React Router v6 |
| 图标 | Lucide React |
| 部署平台 | Vercel（GitHub 自动 CI/CD） |

---

## 🗂️ 数据模型

| 实体 | 说明 |
|------|------|
| Product | 商品（名称、品牌、规格、库存、进货价、售价） |
| Purchase | 采购记录（关联商品、供应商、数量、单价、日期） |
| Sale | 销售记录（关联商品/客户/销售员、数量、单价、日期） |
| Customer | 客户（名称、联系人、类型：普通/VIP/批发商/零售商） |
| Employee | 员工（关联 Supabase Auth 用户、职位、提成比例、在职状态） |
| Transaction | 经营流水（资金类型、类别、付款人、银行账户、是否报销） |
| ExpenseCategory | 费用类别（维表） |
| Payer | 付款人（维表） |
| BankAccount | 银行账户（维表） |

### 库存联动逻辑（数据库触发器）
- 采购入库 → `stock_quantity += 采购数量`
- 销售出库 → `stock_quantity -= 销售数量`（前端库存不足时拦截提交）
- 删除采购/销售记录 → 库存自动回滚

---

## 👥 角色权限（RBAC + Supabase RLS）

| 功能 | 管理员 | 仓库员 | 销售员 |
|------|:------:|:------:|:------:|
| 综合仪表盘 | ✅ | ❌ | ❌ |
| 商品仓库（查看） | ✅ | ✅ | ✅ |
| 商品仓库（编辑） | ✅ | ✅ | ❌ |
| 采购入库 | ✅ | ✅ | ❌ |
| 销售出库 | ✅ | ❌ | ✅（仅自己） |
| 员工管理 | ✅ | ❌ | ❌ |
| 客户管理 | ✅ | ❌ | ✅ |
| 经营流水全部功能 | ✅ | ❌ | ❌ |

角色在 `employees.role` 字段设置，值为 `admin` / `warehouse` / `sales`，通过 Supabase Row Level Security 在数据库层强制执行。

---

## 📦 功能模块

### 进销管理
- **综合仪表盘**：今日/本月销售额、毛利润、流水净额、30天折线图、低库存预警（≤10件）
- **商品仓库**：CRUD + 搜索，≤10件库存自动标红预警
- **采购入库**：录入后实时更新库存，支持日期筛选与合计统计
- **销售出库**：库存不足前端拦截，按销售员筛选，删除自动回滚库存
- **员工管理**：含提成比例配置，在职/离职状态（软删除）
- **客户管理**：四种客户类型，带色块标签（普通/VIP/批发商/零售商）

### 经营流水（管理员专属）
- **流水列表**：三种资金类型（入账/付款/收入），多维筛选，底部自动汇总
- **快速记账**：数量×单价自动计算，类别与付款人多选
- **经营报表**：支出类别饼图、付款人柱状图、每日收支折线图（按月查看）
- **系统设置**：Tabs 管理费用类别/付款人/银行账户三类维表

---

## 📁 项目结构

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
│   └── format.js              # formatCurrency（¥#,##0.00）/ formatDate
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
└── App.jsx                    # 路由配置 + 角色守卫（ProtectedRoute）
```

---

## 🚀 本地开发

### 前置条件
- Node.js ≥ 18
- 已创建 Supabase 项目并执行数据库 Migration

### 安装与启动

```bash
# 克隆仓库
git clone https://github.com/your-org/shanqing-badminton.git
cd shanqing-badminton

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env.local
# 填入 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY

# 启动开发服务器
npm run dev
```

### 环境变量

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

---

## 🗄️ 数据库初始化

在 Supabase SQL Editor 中按顺序执行：

1. `supabase/migrations/01_schema.sql` — 创建所有表与枚举
2. `supabase/migrations/02_triggers.sql` — 库存联动触发器
3. `supabase/migrations/03_rls.sql` — Row Level Security 策略
4. `supabase/migrations/04_seed.sql` — 初始费用类别/付款人等维表数据（可选）

---

## ☁️ Vercel 部署

1. 将代码推送到 GitHub 仓库
2. 在 [Vercel](https://vercel.com) 导入该仓库
3. 框架预设选 **Vite**
4. 在 Project Settings → Environment Variables 中添加：
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. 点击 Deploy，后续每次 push 到 `main` 分支自动触发重新部署

---

## 👤 创建第一个管理员账号

1. 在 Supabase 控制台 Authentication → Users 中手动创建用户（或通过注册页面）
2. 在 SQL Editor 执行：
   ```sql
   insert into employees (auth_user_id, name, role)
   values ('<用户的 auth.uid>', '管理员姓名', 'admin');
   ```
3. 用该邮箱/密码登录系统，即可访问所有功能

---

## 📄 许可证

MIT
