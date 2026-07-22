# 赠品出库功能 - 专业评估报告

## 一、业务需求分析

### 1.1 核心业务场景

根据业务描述，"山青浩然羽毛球（采购单价 68 元）赠送客户"属于以下业务场景：

| 场景 | 业务定性 | 会计处理 | 库存影响 |
|------|----------|----------|----------|
| 销售活动、拓客赠送给客户 | 市场推广 | 销售费用 - 业务宣传费 | 数量减少 |
| 维护老客户、应酬招待 | 业务招待 | 管理费用 - 业务招待费 | 数量减少 |
| 样品试用、展会赠送 | 样品推广 | 销售费用 - 样品费 | 数量减少 |

### 1.2 核心原则

- ✅ **库存数量减少**：与销售出库一样扣减库存
- ✅ **成本费用化**：按采购成本（68元）计入对应费用科目，不产生收入
- ❌ **非销售行为**：严禁使用销售单处理，不结转主营业务成本

---

## 二、现有系统评估

### 2.1 数据库架构分析

#### 当前表结构

```sql
-- 商品表（实际数据库结构，以前端代码为准）
products (
  id, name, sku, brand, category,
  unit_price,       -- 售价
  purchase_price,   -- 进货价（成本）
  stock_quantity,   -- 库存数量（⚠️ 前端实际使用的列名）
  selling_price,    -- 销售价
  supplier, created_at, updated_at
)
```

> **⚠️ 重要发现**：数据库迁移文件 `01_schema.sql` 中定义的是 `stock` 列，但前端代码（`Products.jsx`、`Sales.jsx`、`Dashboard.jsx`）全部使用 `stock_quantity`。由于系统之前能正常运行，说明数据库中实际使用的是 `stock_quantity` 列。所有触发器和查询必须使用 `stock_quantity`。
-- 采购表
purchases (
  id, product_id, quantity, unit_price, total_amount,
  supplier, purchase_date, created_by, created_at
)

-- 销售表
sales (
  id, product_id, customer_id, quantity, unit_price, total_amount,
  sale_date, created_by, created_at
)

-- 经营流水表
transactions (
  id, type (income/expense/payment), category_id, payer_id,
  bank_account_id, amount, description, is_reimbursed,
  transaction_date, created_by, created_at
)
```

#### 当前触发器机制

| 触发器 | 触发时机 | 作用 |
|--------|----------|------|
| `purchase_stock_trigger` | AFTER INSERT purchases | 增加库存 |
| `purchase_delete_stock_trigger` | BEFORE DELETE purchases | 回滚库存 |
| `sale_stock_trigger` | AFTER INSERT sales | 减少库存 |
| `sale_delete_stock_trigger` | BEFORE DELETE sales | 恢复库存 |

### 2.2 前端功能分析

| 页面 | 功能 | 状态 |
|------|------|------|
| `Products.jsx` | 商品CRUD、库存管理 | ✅ 已有 |
| `Purchases.jsx` | 采购入库 | ✅ 已有（触发库存增加） |
| `Sales.jsx` | 销售出库 | ✅ 已有（触发库存减少） |
| `Transactions.jsx` | 经营流水记账 | ✅ 已有 |
| `FinancialReport.jsx` | 财务报表 | ✅ 已有 |

### 2.3 权限控制分析

| 角色 | 现有权限 | 是否需要赠品出库权限 |
|------|----------|---------------------|
| admin | 全部权限 | ✅ 需要 |
| warehouse | 商品管理、采购入库 | ✅ 需要（仓库操作） |
| sales | 销售出库、客户管理 | ✅ 需要（销售赠品） |

### 2.4 当前系统缺失分析

#### ❌ 缺失的功能模块

1. **赠品出库单**：没有专门的赠品/样品出库单据
2. **出库类型区分**：无法区分销售出库与赠品出库
3. **费用科目关联**：赠品成本无法自动计入对应费用科目
4. **成本自动取数**：无法自动抓取当前存货计价成本
5. **前端入口**：侧边栏没有"赠品出库"菜单

#### ❌ 缺失的数据库表

1. **`gift_issues`（赠品出库表）**：记录赠品出库明细
2. **出库类型字段**：区分赠品出库的业务场景

---

## 三、技术方案设计

### 3.1 数据库设计

#### 方案A：新增独立赠品出库表（推荐）

```sql
-- 赠品出库表
CREATE TABLE gift_issues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id),           -- 赠送客户（可选）
  issue_type TEXT NOT NULL CHECK (                    -- 出库类型
    issue_type IN ('marketing', 'entertainment', 'sample')
  ),
  quantity INT NOT NULL CHECK (quantity > 0),
  unit_cost DECIMAL(10,2) NOT NULL,                   -- 出库成本（自动取采购价）
  total_cost DECIMAL(10,2) NOT NULL,                  -- 总成本
  description TEXT,                                   -- 赠送原因/备注
  issue_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES employees(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 出库类型映射表（可选，用于前端展示）
CREATE TABLE issue_types (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  expense_account TEXT NOT NULL,                      -- 对应费用科目
  description TEXT
);

INSERT INTO issue_types (id, name, expense_account, description) VALUES
  ('marketing', '市场推广赠品', '销售费用-业务宣传费', '销售活动、拓客赠送给客户'),
  ('entertainment', '业务招待赠品', '管理费用-业务招待费', '维护老客户、应酬招待'),
  ('sample', '样品赠送', '销售费用-样品费', '样品试用、展会赠送');
```

#### 方案B：扩展现有销售表（不推荐）

在 `sales` 表中增加 `is_gift` 字段，不推荐原因：
- 混淆销售与赠品的业务性质
- 会计处理完全不同（收入 vs 费用）
- 不利于后续财务报表区分

### 3.2 触发器设计

```sql
-- 赠品出库触发器：减少库存（含库存充足性检查）
CREATE OR REPLACE FUNCTION update_stock_on_gift_issue()
RETURNS TRIGGER AS $$
DECLARE
  current_stock INT;
BEGIN
  -- 查询当前库存
  SELECT stock_quantity INTO current_stock
  FROM products
  WHERE id = NEW.product_id;
  
  -- 库存充足性检查（数据库级防护，防止负库存）
  IF current_stock < NEW.quantity THEN
    RAISE EXCEPTION '库存不足：商品 ID % 当前库存 %，请求出库 %', 
      NEW.product_id, current_stock, NEW.quantity;
  END IF;
  
  -- 扣减库存（使用 stock_quantity，与前端保持一致）
  UPDATE products
  SET stock_quantity = stock_quantity - NEW.quantity,
      updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.product_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER gift_issue_stock_trigger
AFTER INSERT ON gift_issues
FOR EACH ROW
EXECUTE FUNCTION update_stock_on_gift_issue();

-- 删除赠品出库触发器：恢复库存
CREATE OR REPLACE FUNCTION rollback_stock_on_gift_issue_delete()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE products
  SET stock_quantity = stock_quantity + OLD.quantity,
      updated_at = CURRENT_TIMESTAMP
  WHERE id = OLD.product_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER gift_issue_delete_stock_trigger
BEFORE DELETE ON gift_issues
FOR EACH ROW
EXECUTE FUNCTION rollback_stock_on_gift_issue_delete();
```

### 3.3 前端设计

#### 新增页面：`GiftIssues.jsx`

```
┌─────────────────────────────────────────────────────┐
│  赠品出库                                            │
├─────────────────────────────────────────────────────┤
│  [新增赠品出库]                                      │
├─────────────────────────────────────────────────────┤
│  日期范围筛选                                         │
├─────────────────────────────────────────────────────┤
│  ┌──────┬──────┬──────────┬─────┬──────┬──────┬────┐ │
│  │ 日期 │ 商品 │ 客户     │ 类型 │ 数量 │ 成本 │ 操作│ │
│  ├──────┼──────┼──────────┼─────┼──────┼──────┼────┤ │
│  │6.18 │羽毛球│山大电视台│市场推广│  1  │ 68.00│ 删除│ │
│  │6.25 │羽毛球│黄开宏    │业务招待│  1  │ 68.00│ 删除│ │
│  └──────┴──────┴──────────┴─────┴──────┴──────┴────┘ │
│  合计: 数量 2 | 成本 136.00                          │
├─────────────────────────────────────────────────────┤
│  新增赠品出库弹窗:                                    │
│  ┌──────────────────────────────────────────────┐   │
│  │ 商品: [选择商品]                              │   │
│  │ 客户: [选择客户] (可选)                       │   │
│  │ 出库类型: [市场推广/业务招待/样品赠送]         │   │
│  │ 数量: [输入]                                 │   │
│  │ 成本: 68.00 (自动取采购价，不可修改)          │   │
│  │ 备注: [输入]                                 │   │
│  │ 日期: [选择]                                 │   │
│  │ [取消] [保存]                                │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

#### 侧边栏菜单扩展

```jsx
const menuItems = [
  {
    group: '进销管理',
    items: [
      // ... 现有菜单
      { id: 'gift-issues', label: '赠品出库', icon: Gift, roleCheck: canViewGiftIssues },
    ],
  },
]
```

### 3.4 权限控制设计

```javascript
// src/lib/auth.js
export const canViewGiftIssues = (role) => 
  isAdmin(role) || isWarehouse(role) || isSales(role)
```

### 3.5 财务报表集成

在 `FinancialReport.jsx` 中增加赠品出库成本统计：

```javascript
// 赠品出库成本汇总
const giftIssuesRes = await supabase
  .from('gift_issues')
  .select('total_cost, issue_type')
  .gte('issue_date', startDate)
  .lte('issue_date', endDate)

// 按类型汇总
const marketingCost = giftIssuesRes.data
  .filter(g => g.issue_type === 'marketing')
  .reduce((sum, g) => sum + parseFloat(g.total_cost), 0)

const entertainmentCost = giftIssuesRes.data
  .filter(g => g.issue_type === 'entertainment')
  .reduce((sum, g) => sum + parseFloat(g.total_cost), 0)

const sampleCost = giftIssuesRes.data
  .filter(g => g.issue_type === 'sample')
  .reduce((sum, g) => sum + parseFloat(g.total_cost), 0)
```

---

## 四、实施计划

### 4.1 阶段一：数据库层

| 步骤 | 内容 | 风险 | 优先级 |
|------|------|------|--------|
| 1.1 | 创建 `gift_issues` 表 | 低 | 高 |
| 1.2 | 创建 `issue_types` 表并插入初始数据 | 低 | 高 |
| 1.3 | 创建库存扣减触发器 | 中（需验证） | 高 |
| 1.4 | 创建删除恢复触发器 | 中（需验证） | 高 |
| 1.5 | 设置 RLS 权限 | 低 | 中 |

### 4.2 阶段二：前端层

| 步骤 | 内容 | 风险 | 优先级 |
|------|------|------|--------|
| 2.1 | 创建 `GiftIssues.jsx` 页面 | 低 | 高 |
| 2.2 | 新增侧边栏菜单入口 | 低 | 高 |
| 2.3 | 新增权限控制函数 | 低 | 高 |
| 2.4 | 更新路由配置 | 低 | 高 |

### 4.3 阶段三：报表集成

| 步骤 | 内容 | 风险 | 优先级 |
|------|------|------|--------|
| 3.1 | 更新 `FinancialReport.jsx` 添加赠品成本统计 | 中 | 中 |
| 3.2 | 更新 `Dashboard.jsx` 添加赠品出库统计 | 低 | 低 |

### 4.4 阶段四：测试验证

| 步骤 | 内容 |
|------|------|
| 4.1 | 采购入库羽毛球（68元） |
| 4.2 | 创建赠品出库单（市场推广） |
| 4.3 | 验证库存是否减少 |
| 4.4 | 验证成本是否为68元 |
| 4.5 | 删除赠品出库单，验证库存恢复 |
| 4.6 | 验证财务报表统计 |

---

## 五、代码文件清单

### 新增文件

| 文件路径 | 说明 |
|----------|------|
| `src/pages/GiftIssues.jsx` | 赠品出库页面 |
| `supabase/migrations/05_gift_issues.sql` | 赠品出库表和触发器 |

### 修改文件

| 文件路径 | 修改内容 |
|----------|----------|
| `src/components/layout/Sidebar.jsx` | 添加赠品出库菜单 |
| `src/lib/auth.js` | 添加权限控制函数 |
| `src/App.jsx` | 添加路由配置 |
| `src/pages/FinancialReport.jsx` | 集成赠品成本统计 |
| `src/pages/Dashboard.jsx` | 可选：添加赠品出库统计卡片 |

---

## 六、成本取数规则说明

### 6.1 成本取值逻辑

```
用户选择商品 → 系统自动查询 products.purchase_price 
           → 带出 unit_cost = purchase_price（68元）
           → total_cost = quantity × unit_cost
           → unit_cost 字段不可手动修改
```

### 6.2 成本锁定机制

- ✅ 赠品出库时**自动抓取**当前商品的 `purchase_price`
- ✅ `unit_cost` 在表单中**只读**，不可修改
- ✅ 成本在保存时**固定写入** `gift_issues` 表
- ✅ 后续即使商品采购价变动，不影响已出库记录

### 6.3 与财务的关联

| 出库类型 | 借方科目 | 贷方科目 | 金额来源 |
|----------|----------|----------|----------|
| 市场推广 | 销售费用-业务宣传费 | 库存商品-羽毛球 | total_cost |
| 业务招待 | 管理费用-业务招待费 | 库存商品-羽毛球 | total_cost |
| 样品赠送 | 销售费用-样品费 | 库存商品-羽毛球 | total_cost |

### 6.4 成本计价方式说明

> **⚠️ 当前系统简化处理**：用户需求中提到"移动加权平均/先进先出成本自动留存"，但当前 ERP 系统使用的是简化的成本计价方式：
> 
> - **当前实现**：每个商品只有一个静态的 `purchase_price`（进货价），赠品出库时直接取这个值作为出库成本
> - **用户需求**：期望支持移动加权平均或先进先出（FIFO）的成本核算方法
> 
> **V1 版本方案**：
> - 使用静态 `purchase_price` 作为出库成本（与现有采购/销售逻辑保持一致）
> - 成本在出库时锁定写入 `gift_issues.unit_cost`，不受后续采购价变动影响
> 
> **后续扩展（V2）**：如需实现移动加权平均/FIFO，需要：
> 1. 创建 `stock_layers`（库存批次）表，记录每批进货的成本
> 2. 修改采购入库逻辑，新增库存批次
> 3. 修改出库逻辑，按 FIFO 或加权平均计算出库成本

---

## 七、总结

### 7.1 可行性评估

| 评估维度 | 评估结果 | 说明 |
|----------|----------|------|
| 技术可行性 | ✅ 可行 | 基于现有技术栈（React + Supabase） |
| 数据一致性 | ✅ 可靠 | 通过数据库触发器保证库存一致性 |
| 财务合规性 | ✅ 合规 | 符合视同销售的会计处理原则 |
| 用户体验 | ✅ 友好 | 与现有采购/销售流程保持一致 |

### 7.2 实施复杂度

- **低风险**：新增独立表，不影响现有采购/销售流程
- **高内聚**：赠品出库逻辑独立，易于维护
- **可扩展**：后续可扩展更多出库类型

### 7.3 预计开发时间

| 阶段 | 时间 |
|------|------|
| 数据库层 | 2小时 |
| 前端页面 | 4小时 |
| 报表集成 | 2小时 |
| 测试验证 | 2小时 |
| **总计** | **10小时** |

---

# Excel 导出功能 - 专业评估报告

## 一、业务需求分析

### 1.1 核心导出场景

根据用户需求，需要支持以下两类数据导出：

| 导出场景 | 使用目的 | 频率 |
|----------|----------|------|
| **库存盘点表** | 与手工记录的库存进行核对、盘点 | 每月/季度 |
| **财务报表** | 财务审计、税务申报、经营分析 | 每月/季度/年度 |

### 1.2 用户提供的参考模板

用户提供了"5号球进出库明细"Excel模板，包含以下列：

| 列名 | 说明 | 数据来源 |
|------|------|----------|
| 日期 | 操作日期 | purchase_date / sale_date / gift_issue_date |
| 明细 | 操作类型及备注 | 入库/出库/赠送 + 供应商/客户/备注 |
| 入库数量 | 采购入库数量 | purchases.quantity |
| 入库单价 | 采购单价 | purchases.unit_price |
| 入库金额 | 采购金额 | quantity × unit_price |
| 出库数量 | 销售/赠送出库数量 | sales.quantity / gift_issues.quantity |
| 出库单价 | 销售单价/成本价 | sales.unit_price / gift_issues.unit_cost |
| 出库金额 | 销售金额/成本金额 | quantity × unit_price |
| 备注 | 备注信息 | description / supplier / customer |

---

## 二、技术方案评估

### 2.1 导出方案对比

| 方案 | 优点 | 缺点 | 适用场景 |
|------|------|------|----------|
| **纯前端导出 (xlsx库)** | 无需后端、轻量、快速 | 大数据量性能受限 | 中小规模数据 |
| **后端导出 (Supabase Edge Function)** | 支持大数据量、服务器端生成 | 需要后端开发、部署复杂 | 大规模数据 |
| **CSV导出 (原生)** | 最简单、兼容性最好 | 格式简单、无样式 | 临时导出 |

**推荐方案：纯前端导出 (xlsx库)**

理由：
- 当前数据量较小（商品 < 1000，采购/销售记录 < 10000）
- 无需额外部署后端服务
- 实现简单、维护成本低
- 用户已有手工记录习惯，导出后可直接在Excel中编辑对比

### 2.2 推荐技术栈

| 库名 | 功能 | 版本 |
|------|------|------|
| `xlsx` | Excel文件生成（支持 .xlsx 格式） | ^0.18.5 |
| `file-saver` | 前端文件下载 | ^2.0.5 |

### 2.3 需要新增的依赖

```bash
npm install xlsx file-saver
```

---

## 三、导出功能设计

### 3.1 库存盘点表导出

#### 3.1.1 导出数据结构

```javascript
// 库存盘点表 - 商品汇总
{
  "商品名称": "山青浩然羽毛球",
  "品牌": "山青浩然",
  "规格": "5号球",
  "当前库存": 100,
  "进货价": 68.00,
  "售价": 88.00,
  "库存金额": 6800.00,  // 数量 × 进货价
  "创建时间": "2026-01-01"
}

// 库存盘点表 - 进出库明细
{
  "日期": "2026-06-18",
  "明细": "赠送出库（山大电视台）",
  "入库数量": "",
  "入库单价": "",
  "入库金额": "",
  "出库数量": 1,
  "出库单价": 68.00,
  "出库金额": 68.00,
  "备注": "市场推广"
}
```

#### 3.1.2 Excel表格结构

**Sheet 1: 商品库存汇总**

| 序号 | 商品名称 | 品牌 | 规格 | 当前库存 | 进货价 | 售价 | 库存金额 |
|------|----------|------|------|----------|--------|------|----------|
| 1 | 山青浩然羽毛球 | 山青浩然 | 5号球 | 100 | 68.00 | 88.00 | 6800.00 |
| 2 | ... | ... | ... | ... | ... | ... | ... |

**Sheet 2: 进出库明细**

| 序号 | 日期 | 明细 | 入库数量 | 入库单价 | 入库金额 | 出库数量 | 出库单价 | 出库金额 | 备注 |
|------|------|------|----------|----------|----------|----------|----------|----------|------|
| 1 | 2026-06-18 | 赠送出库 | | | | 1 | 68.00 | 68.00 | 山大电视台 |
| 2 | ... | ... | ... | ... | ... | ... | ... | ... | ... |

### 3.2 财务报表导出

#### 3.2.1 导出数据结构

```javascript
// 财务报表 - 核心指标
{
  "统计周期": "2026年6月",
  "总收入": 10000.00,
  "总支出": 6000.00,
  "整体利润": 4000.00,
  "上期余额": 50000.00,
  "账户余额": 54000.00,
  "生成时间": "2026-06-30 18:00:00"
}

// 财务报表 - 销售明细
{
  "日期": "2026-06-15",
  "商品名称": "山青浩然羽毛球",
  "客户": "张鹏",
  "数量": 2,
  "单价": 88.00,
  "金额": 176.00,
  "销售员": "李玉龙"
}

// 财务报表 - 采购明细
{
  "日期": "2026-06-10",
  "商品名称": "山青浩然羽毛球",
  "供应商": "XX体育用品",
  "数量": 50,
  "单价": 68.00,
  "金额": 3400.00
}

// 财务报表 - 经营流水明细
{
  "日期": "2026-06-20",
  "类型": "收入",
  "科目": "销售收入",
  "金额": 5000.00,
  "描述": "会员充值",
  "付款方式": "微信支付"
}

// 财务报表 - 赠品出库成本
{
  "日期": "2026-06-18",
  "商品名称": "山青浩然羽毛球",
  "客户": "山大电视台",
  "数量": 1,
  "成本": 68.00,
  "费用科目": "销售费用-业务宣传费",
  "类型": "市场推广"
}
```

#### 3.2.2 Excel表格结构

**Sheet 1: 核心指标**

| 指标 | 金额 | 说明 |
|------|------|------|
| 总收入 | ¥10,000.00 | 销售总额 + 经营流水收入 |
| 总支出 | ¥6,000.00 | 采购总额 + 经营流水支出 |
| 整体利润 | ¥4,000.00 | 总收入 - 总支出 |
| 上期余额 | ¥50,000.00 | 初始资金 + 历史累计利润 |
| 账户余额 | ¥54,000.00 | 上期余额 + 本期利润 |

**Sheet 2: 销售明细**

| 序号 | 日期 | 商品名称 | 客户 | 数量 | 单价 | 金额 | 销售员 |
|------|------|----------|------|------|------|------|--------|
| 1 | ... | ... | ... | ... | ... | ... | ... |

**Sheet 3: 采购明细**

| 序号 | 日期 | 商品名称 | 供应商 | 数量 | 单价 | 金额 |
|------|------|----------|--------|------|------|------|
| 1 | ... | ... | ... | ... | ... | ... |

**Sheet 4: 经营流水明细**

| 序号 | 日期 | 类型 | 科目 | 金额 | 描述 | 付款方式 |
|------|------|------|------|------|------|----------|
| 1 | ... | ... | ... | ... | ... | ... |

**Sheet 5: 赠品出库成本**

| 序号 | 日期 | 商品名称 | 客户 | 数量 | 成本 | 费用科目 | 类型 |
|------|------|----------|------|------|------|----------|------|
| 1 | ... | ... | ... | ... | ... | ... | ... |

---

## 四、前端实现方案

### 4.1 新增工具函数

创建 `src/lib/export.js`：

```javascript
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

/**
 * 导出库存盘点表
 * @param {Array} products - 商品列表
 * @param {Array} purchases - 采购记录
 * @param {Array} sales - 销售记录
 * @param {Array} giftIssues - 赠品出库记录
 */
export const exportInventoryReport = (products, purchases, sales, giftIssues) => {
  // Sheet 1: 商品库存汇总
  const productSheet = products.map((p, index) => ({
    '序号': index + 1,
    '商品名称': p.name,
    '品牌': p.brand || '',
    '规格': p.spec || '',
    '当前库存': p.stock_quantity,
    '进货价': p.purchase_price,
    '售价': p.selling_price,
    '库存金额': p.stock_quantity * p.purchase_price,
  }))

  // Sheet 2: 进出库明细
  const detailsSheet = []
  
  // 添加采购记录
  purchases.forEach(p => {
    detailsSheet.push({
      '序号': detailsSheet.length + 1,
      '日期': p.purchase_date,
      '明细': `采购入库（${p.supplier || ''}）`,
      '入库数量': p.quantity,
      '入库单价': p.unit_price,
      '入库金额': p.quantity * p.unit_price,
      '出库数量': '',
      '出库单价': '',
      '出库金额': '',
      '备注': p.products?.name || '',
    })
  })
  
  // 添加销售记录
  sales.forEach(s => {
    detailsSheet.push({
      '序号': detailsSheet.length + 1,
      '日期': s.sale_date,
      '明细': `销售出库（${s.customers?.name || ''}）`,
      '入库数量': '',
      '入库单价': '',
      '入库金额': '',
      '出库数量': s.quantity,
      '出库单价': s.unit_price,
      '出库金额': s.quantity * s.unit_price,
      '备注': s.products?.name || '',
    })
  })
  
  // 添加赠品出库记录
  giftIssues.forEach(g => {
    detailsSheet.push({
      '序号': detailsSheet.length + 1,
      '日期': g.issue_date,
      '明细': `赠送出库（${g.customers?.name || ''}）`,
      '入库数量': '',
      '入库单价': '',
      '入库金额': '',
      '出库数量': g.quantity,
      '出库单价': g.unit_cost,
      '出库金额': g.total_cost,
      '备注': g.description || '',
    })
  })
  
  // 按日期排序
  detailsSheet.sort((a, b) => new Date(a.日期) - new Date(b.日期))

  // 创建工作簿
  const wb = XLSX.utils.book_new()
  
  // 添加Sheet
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(productSheet), '商品库存汇总')
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(detailsSheet), '进出库明细')

  // 导出文件
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  saveAs(new Blob([wbout], { type: 'application/octet-stream' }), `库存盘点表_${new Date().toISOString().split('T')[0]}.xlsx`)
}

/**
 * 导出财务报表
 * @param {Object} report - 核心指标
 * @param {Array} sales - 销售明细
 * @param {Array} purchases - 采购明细
 * @param {Array} transactions - 经营流水明细
 * @param {Array} giftIssues - 赠品出库明细
 * @param {string} period - 统计周期
 */
export const exportFinancialReport = (report, sales, purchases, transactions, giftIssues, period) => {
  const periodLabels = {
    month: '本月',
    quarter: '本季度',
    year: '本年度'
  }
  
  // Sheet 1: 核心指标
  const summarySheet = [
    { '指标': '统计周期', '金额': periodLabels[period], '说明': '' },
    { '指标': '总收入', '金额': report.totalIncome, '说明': '销售总额 + 经营流水收入' },
    { '指标': '总支出', '金额': report.totalExpense, '说明': '采购总额 + 经营流水支出' },
    { '指标': '整体利润', '金额': report.overallProfit, '说明': '总收入 - 总支出' },
    { '指标': '上期余额', '金额': report.previousBalance, '说明': '初始资金 + 历史累计利润' },
    { '指标': '账户余额', '金额': report.accountBalance, '说明': '上期余额 + 本期利润' },
    { '指标': '生成时间', '金额': new Date().toLocaleString('zh-CN'), '说明': '' },
  ]

  // Sheet 2: 销售明细
  const salesSheet = sales.map((s, index) => ({
    '序号': index + 1,
    '日期': s.sale_date,
    '商品名称': s.products?.name || '未知',
    '客户': s.customers?.name || '',
    '数量': s.quantity,
    '单价': s.unit_price,
    '金额': s.quantity * s.unit_price,
    '销售员': '',
  }))

  // Sheet 3: 采购明细
  const purchasesSheet = purchases.map((p, index) => ({
    '序号': index + 1,
    '日期': p.purchase_date,
    '商品名称': p.products?.name || '未知',
    '供应商': p.supplier || '',
    '数量': p.quantity,
    '单价': p.unit_price,
    '金额': p.quantity * p.unit_price,
  }))

  // Sheet 4: 经营流水明细
  const transactionsSheet = transactions.map((t, index) => ({
    '序号': index + 1,
    '日期': t.transaction_date,
    '类型': t.type,
    '科目': t.expense_categories?.name || '',
    '金额': t.amount,
    '描述': t.description || '',
    '付款方式': '',
  }))

  // Sheet 5: 赠品出库成本
  const giftIssuesSheet = giftIssues.map((g, index) => ({
    '序号': index + 1,
    '日期': g.issue_date,
    '商品名称': g.products?.name || '未知',
    '客户': g.customers?.name || '',
    '数量': g.quantity,
    '成本': g.unit_cost,
    '费用科目': g.issue_types?.expense_account || '',
    '类型': g.issue_types?.name || '',
  }))

  // 创建工作簿
  const wb = XLSX.utils.book_new()
  
  // 添加Sheet
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summarySheet), '核心指标')
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(salesSheet), '销售明细')
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(purchasesSheet), '采购明细')
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(transactionsSheet), '经营流水')
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(giftIssuesSheet), '赠品出库')

  // 导出文件
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  saveAs(new Blob([wbout], { type: 'application/octet-stream' }), `财务报表_${periodLabels[period]}_${new Date().toISOString().split('T')[0]}.xlsx`)
}
```

### 4.2 修改现有页面添加导出按钮

#### 4.2.1 商品仓库页面 (`Products.jsx`)

在页面顶部添加"导出库存盘点表"按钮：

```jsx
<Button onClick={handleExportInventory} className="bg-green-600 hover:bg-green-700">
  <Download className="w-4 h-4 mr-2" />
  导出库存盘点表
</Button>
```

#### 4.2.2 财务报表页面 (`FinancialReport.jsx`)

在页面顶部添加"导出Excel"按钮：

```jsx
<Button onClick={handleExportFinancial} className="bg-green-600 hover:bg-green-700">
  <Download className="w-4 h-4 mr-2" />
  导出Excel
</Button>
```

### 4.3 需要修改的文件清单

| 文件路径 | 修改内容 |
|----------|----------|
| `src/lib/export.js` | **新增**：导出工具函数 |
| `src/pages/Products.jsx` | 添加导出按钮和导出逻辑 |
| `src/pages/FinancialReport.jsx` | 添加导出按钮和导出逻辑 |
| `src/pages/Purchases.jsx` | 可选：添加采购记录导出 |
| `src/pages/Sales.jsx` | 可选：添加销售记录导出 |

---

## 五、实施计划

### 5.1 阶段一：安装依赖

| 步骤 | 内容 | 风险 | 优先级 |
|------|------|------|--------|
| 1.1 | `npm install xlsx file-saver` | 低 | 高 |

### 5.2 阶段二：创建导出工具函数

| 步骤 | 内容 | 风险 | 优先级 |
|------|------|------|--------|
| 2.1 | 创建 `src/lib/export.js` | 低 | 高 |
| 2.2 | 实现库存盘点表导出函数 | 低 | 高 |
| 2.3 | 实现财务报表导出函数 | 低 | 高 |

### 5.3 阶段三：集成到页面

| 步骤 | 内容 | 风险 | 优先级 |
|------|------|------|--------|
| 3.1 | Products.jsx 添加导出按钮 | 低 | 高 |
| 3.2 | FinancialReport.jsx 添加导出按钮 | 低 | 高 |

### 5.4 阶段四：测试验证

| 步骤 | 内容 |
|------|------|
| 4.1 | 导出库存盘点表，检查数据完整性 |
| 4.2 | 导出财务报表，检查数据准确性 |
| 4.3 | 验证Excel文件在不同版本Excel中均可打开 |
| 4.4 | 验证导出文件与手工记录格式兼容性 |

---

## 六、导出功能可行性评估

| 评估维度 | 评估结果 | 说明 |
|----------|----------|------|
| 技术可行性 | ✅ 可行 | 使用成熟的 xlsx 库，实现简单 |
| 数据完整性 | ✅ 可靠 | 直接从数据库查询，保证数据准确 |
| 用户体验 | ✅ 友好 | 一键导出，格式与手工记录兼容 |
| 性能 | ✅ 良好 | 当前数据量较小，前端导出完全胜任 |
| 兼容性 | ✅ 良好 | 标准 .xlsx 格式，支持所有Excel版本 |

### 6.1 预计开发时间

| 阶段 | 时间 |
|------|------|
| 安装依赖 | 0.5小时 |
| 创建工具函数 | 2小时 |
| 页面集成 | 2小时 |
| 测试验证 | 1小时 |
| **总计** | **5.5小时** |

---

## 七、赠品出库 + Excel导出 联合评估

### 7.1 功能关联分析

赠品出库功能与Excel导出功能有以下关联：

| 关联点 | 说明 |
|--------|------|
| 数据来源 | 赠品出库数据需要纳入库存盘点表和财务报表导出 |
| 成本核算 | 赠品出库成本需要在财务报表中体现 |
| 库存变动 | 赠品出库导致的库存变动需要在库存盘点表中体现 |

### 7.2 联合实施计划

推荐先实施赠品出库功能，再实施Excel导出功能：

```
阶段一：赠品出库功能（约10小时）
  ├── 数据库层：创建 gift_issues 表和触发器
  ├── 前端页面：创建 GiftIssues.jsx
  ├── 菜单集成：添加侧边栏入口
  └── 报表集成：更新财务报表

阶段二：Excel导出功能（约5.5小时）
  ├── 安装依赖：xlsx, file-saver
  ├── 创建工具函数：export.js
  ├── 页面集成：Products.jsx, FinancialReport.jsx
  └── 测试验证：确保数据准确完整
```

### 7.3 联合开发时间预估

| 功能 | 时间 |
|------|------|
| 赠品出库功能 | 10小时 |
| Excel导出功能 | 5.5小时 |
| **总计** | **15.5小时** |

---

## 八、总结

### 8.1 功能需求汇总

| 功能 | 优先级 | 开发时间 |
|------|--------|----------|
| 赠品出库（方案A） | 高 | 10小时 |
| 库存盘点表导出 | 高 | 包含在导出功能中 |
| 财务报表导出 | 高 | 包含在导出功能中 |

### 8.2 技术风险点

| 风险 | 影响 | 应对措施 |
|------|------|----------|
| Supabase项目不可用 | 数据库迁移无法执行 | 需用户先恢复或重建项目 |
| 列名不一致（stock vs stock_quantity） | 触发器失效 | 使用前端实际列名 `stock_quantity` |
| 数据量增长 | 前端导出性能下降 | 当前数据量较小，后续可考虑后端导出 |

### 8.3 下一步建议

1. **确认Supabase项目状态**（硬阻塞）
2. **确认成本计价方式**（静态成本 vs FIFO/加权平均）
3. **确认优先开发顺序**（赠品出库 → Excel导出）

确认后即可开始开发！