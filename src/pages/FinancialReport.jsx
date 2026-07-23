import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { formatCurrency, formatDate } from '../lib/format'
import { TrendingUp, TrendingDown, Wallet, PieChart, DollarSign, ShoppingCart, CreditCard, FileText, Building2, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { exportFinancialReport } from '../lib/export'

export function FinancialReport() {
  const [report, setReport] = useState({
    totalSales: 0,
    totalPurchases: 0,
    salesProfit: 0,
    transactionIncome: 0,
    transactionExpense: 0,
    transactionNet: 0,
    totalIncome: 0,
    totalExpense: 0,
    overallProfit: 0,
    bankBalance: 0,
    previousBalance: 0,
    accountBalance: 0,
  })
  const [period, setPeriod] = useState('month') // month, quarter, year
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchFinancialData = async () => {
      setLoading(true)
      try {
        let startDate = ''
        const today = new Date().toISOString().split('T')[0]
        
        if (period === 'month') {
          startDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
        } else if (period === 'quarter') {
          const quarter = Math.floor(new Date().getMonth() / 3)
          startDate = new Date(new Date().getFullYear(), quarter * 3, 1).toISOString().split('T')[0]
        } else {
          startDate = new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]
        }

        // 查询当期数据
        const [salesRes, purchasesRes, transactionsRes, bankRes, giftIssuesRes] = await Promise.all([
          supabase.from('sales').select('quantity, unit_price').gte('sale_date', startDate),
          supabase.from('purchases').select('quantity, unit_price').gte('purchase_date', startDate),
          supabase.from('transactions').select('amount, type').gte('transaction_date', startDate),
          supabase.from('bank_accounts').select('name, balance'),
          supabase.from('gift_issues').select('total_cost, issue_type').gte('issue_date', startDate),
        ])

        // 查询历史累计数据（从开始到当前时间段之前）
        const [historicalSalesRes, historicalPurchasesRes, historicalTransactionsRes, historicalGiftIssuesRes] = await Promise.all([
          supabase.from('sales').select('quantity, unit_price').lt('sale_date', startDate),
          supabase.from('purchases').select('quantity, unit_price').lt('purchase_date', startDate),
          supabase.from('transactions').select('amount, type').lt('transaction_date', startDate),
          supabase.from('gift_issues').select('total_cost').lt('issue_date', startDate),
        ])

        // 当期销售统计
        const totalSales = salesRes.data?.reduce((sum, s) => sum + s.quantity * s.unit_price, 0) || 0
        
        // 当期采购统计
        const totalPurchases = purchasesRes.data?.reduce((sum, p) => sum + p.quantity * p.unit_price, 0) || 0
        
        // 当期销售利润
        const salesProfit = totalSales - totalPurchases

        // 当期经营流水统计
        const transactionIncome = transactionsRes.data?.filter(t => 
          t.type === '入账' || t.type === '收入'
        ).reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0

        const transactionExpense = transactionsRes.data?.filter(t => 
          t.type === '付款' || t.type === '支出' || t.type === '报销'
        ).reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0

        const transactionNet = transactionIncome - transactionExpense

        // 当期赠品出库成本统计（费用化支出）
        const giftIssueCost = giftIssuesRes.data?.reduce((sum, g) => sum + parseFloat(g.total_cost), 0) || 0

        // 当期统一统计（赠品成本计入总支出）
        const totalIncome = totalSales + transactionIncome
        const totalExpense = totalPurchases + transactionExpense + giftIssueCost
        const overallProfit = totalIncome - totalExpense

        // 历史累计利润计算
        const historicalSales = historicalSalesRes.data?.reduce((sum, s) => sum + s.quantity * s.unit_price, 0) || 0
        const historicalPurchases = historicalPurchasesRes.data?.reduce((sum, p) => sum + p.quantity * p.unit_price, 0) || 0
        const historicalTransactionIncome = historicalTransactionsRes.data?.filter(t => 
          t.type === '入账' || t.type === '收入'
        ).reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0
        const historicalTransactionExpense = historicalTransactionsRes.data?.filter(t => 
          t.type === '付款' || t.type === '支出' || t.type === '报销'
        ).reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0
        const historicalGiftIssueCost = historicalGiftIssuesRes.data?.reduce((sum, g) => sum + parseFloat(g.total_cost), 0) || 0
        
        const historicalProfit = (historicalSales + historicalTransactionIncome) - (historicalPurchases + historicalTransactionExpense + historicalGiftIssueCost)

        // 获取青岛银行账户余额（初始资金）
        const bankAccounts = bankRes.data || []
        const qingdaoBank = bankAccounts.find(acc => acc.name === '青岛银行')
        const bankBalance = qingdaoBank ? parseFloat(qingdaoBank.balance) || 0 : 0

        // 现金流量计算（不含赠品成本，因为赠品不涉及资金流出）
        // 当期现金净流量 = 销售回款 + 经营收入 - 采购付款 - 经营支出
        const currentCashFlow = totalSales + transactionIncome - totalPurchases - transactionExpense
        
        // 历史现金净流量（从开始到当前时间段之前）
        const historicalCashFlow = historicalSales + historicalTransactionIncome - historicalPurchases - historicalTransactionExpense

        // 上个月的账户余额 = 初始资金 + 历史现金净流量
        const previousBalance = bankBalance + historicalCashFlow
        
        // 本月账户余额 = 上个月账户余额 + 本月现金净流量
        const accountBalance = previousBalance + currentCashFlow

        setReport({
          totalSales,
          totalPurchases,
          salesProfit,
          transactionIncome,
          transactionExpense,
          transactionNet,
          giftIssueCost,
          totalIncome,
          totalExpense,
          overallProfit,
          bankBalance,
          previousBalance,
          accountBalance,
        })
      } catch (error) {
        console.error('Error fetching financial data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchFinancialData()
  }, [period])

  const handleExport = async () => {
    try {
      let startDate = ''
      const today = new Date().toISOString().split('T')[0]
      
      if (period === 'month') {
        startDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
      } else if (period === 'quarter') {
        const quarter = Math.floor(new Date().getMonth() / 3)
        startDate = new Date(new Date().getFullYear(), quarter * 3, 1).toISOString().split('T')[0]
      } else {
        startDate = new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]
      }

      // 获取明细数据（赠品出库不使用连表查询，因为TEXT类型无法匹配）
      const [salesRes, purchasesRes, transactionsRes, giftIssuesRes, productsRes, customersRes, issueTypesRes] = await Promise.all([
        supabase.from('sales').select('*, products(name), customers(name), employees(name)').gte('sale_date', startDate),
        supabase.from('purchases').select('*, products(name)').gte('purchase_date', startDate),
        supabase.from('transactions').select('*, expense_categories(name)').gte('transaction_date', startDate),
        // 不使用连表查询，因为TEXT类型无法与BIGINT/UUID匹配
        supabase.from('gift_issues').select('*').gte('issue_date', startDate),
        supabase.from('products').select('id, name'),
        supabase.from('customers').select('id, name'),
        supabase.from('issue_types').select('id, name, expense_account'),
      ])
      
      // 手动关联赠品出库数据
      const giftIssues = giftIssuesRes.data || []
      const products = productsRes.data || []
      const customers = customersRes.data || []
      const issueTypes = issueTypesRes.data || []
      
      const giftIssuesWithDetails = giftIssues.map(g => {
        const product = products.find(p => String(p.id) === g.product_id)
        const customer = customers.find(c => String(c.id) === g.customer_id)
        const issueType = issueTypes.find(t => t.id === g.issue_type)
        
        return {
          ...g,
          products: product ? { name: product.name } : null,
          customers: customer ? { name: customer.name } : null,
          issue_types: issueType ? { name: issueType.name, expense_account: issueType.expense_account } : null,
        }
      })
      
      await exportFinancialReport(report, salesRes.data || [], purchasesRes.data || [], transactionsRes.data || [], giftIssuesWithDetails, period)
      
      const toast = await import('@/components/ui/toast').then(m => m.toast)
      toast({ description: '财务报表导出成功', className: 'bg-green-500' })
    } catch (error) {
      console.error('导出失败:', error)
      const toast = await import('@/components/ui/toast').then(m => m.toast)
      toast({ description: '导出失败: ' + error.message, variant: 'destructive' })
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-12">加载中...</div>
  }

  const StatCard = ({ title, value, icon: Icon, color, trend, subtitle }) => (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
          <p className={`text-2xl font-bold ${
            color === 'green' ? 'text-green-600' : 
            color === 'red' ? 'text-red-600' : 
            color === 'blue' ? 'text-blue-600' : 'text-slate-900'
          }`}>
            {formatCurrency(value)}
          </p>
          {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
          {trend !== undefined && (
            <p className={`text-xs mt-1 ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${
          color === 'green' ? 'bg-green-100' : 
          color === 'red' ? 'bg-red-100' : 
          color === 'blue' ? 'bg-blue-100' : 'bg-slate-100'
        }`}>
          <Icon className={`w-5 h-5 ${
            color === 'green' ? 'text-green-600' : 
            color === 'red' ? 'text-red-600' : 
            color === 'blue' ? 'text-blue-600' : 'text-slate-600'
          }`} />
        </div>
      </div>
    </div>
  )

  const periodLabels = {
    month: '本月',
    quarter: '本季度',
    year: '本年度'
  }

  return (
    <div className="space-y-6">
      {/* 标题和时间范围选择 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">财务报表</h1>
          <p className="text-slate-500 mt-1">统一查看收支、账户余额和整体利润</p>
        </div>
        <div className="flex gap-2">
          {['month', 'quarter', 'year'].map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                period === p 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              {periodLabels[p]}
            </button>
          ))}
          <Button onClick={handleExport} className="bg-green-600 hover:bg-green-700">
            <Download className="w-4 h-4 mr-2" />
            导出报表
          </Button>
        </div>
      </div>

      {/* 核心指标 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        <StatCard 
          title="总收入" 
          value={report.totalIncome} 
          icon={TrendingUp} 
          color="green" 
        />
        <StatCard 
          title="总支出" 
          value={report.totalExpense} 
          icon={TrendingDown} 
          color="red" 
        />
        <StatCard 
          title="整体利润" 
          value={report.overallProfit} 
          icon={PieChart} 
          color={report.overallProfit >= 0 ? 'green' : 'red'} 
        />
        <StatCard 
          title="上期余额" 
          value={report.previousBalance} 
          icon={Building2} 
          color="blue" 
          subtitle="初始资金 + 历史累计利润"
        />
        <StatCard 
          title="账户余额" 
          value={report.accountBalance} 
          icon={Wallet} 
          color="blue" 
          subtitle="上期余额 + 本期利润"
        />
      </div>

      {/* 账户余额变动 */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-blue-500" />
          账户余额变动
        </h3>
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-slate-600 mb-1">上期余额</p>
              <p className="text-2xl font-bold text-slate-700">{formatCurrency(report.previousBalance)}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600 mb-1">本期利润</p>
              <p className={`text-2xl font-bold ${report.overallProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {report.overallProfit >= 0 ? '+' : ''}{formatCurrency(report.overallProfit)}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-600 mb-1">当前余额</p>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(report.accountBalance)}</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-blue-200 text-center">
            <p className="text-xs text-slate-500">
              初始资金：5人 × ¥10,000 = ¥50,000 | 
              历史累计利润：{formatCurrency(report.previousBalance - report.bankBalance)} | 
              当前总余额：{formatCurrency(report.accountBalance)}
            </p>
          </div>
        </div>
      </div>

      {/* 进销管理统计 */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-orange-500" />
          进销管理
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-sm text-slate-500 mb-1">销售总额</p>
            <p className="text-xl font-bold text-green-600">{formatCurrency(report.totalSales)}</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-sm text-slate-500 mb-1">采购总额</p>
            <p className="text-xl font-bold text-red-600">{formatCurrency(report.totalPurchases)}</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-sm text-slate-500 mb-1">销售利润</p>
            <p className={`text-xl font-bold ${report.salesProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(report.salesProfit)}
            </p>
          </div>
        </div>
      </div>

      {/* 经营流水统计 */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-blue-500" />
          经营流水
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-sm text-slate-500 mb-1">入账收入</p>
            <p className="text-xl font-bold text-green-600">{formatCurrency(report.transactionIncome)}</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-sm text-slate-500 mb-1">付款支出</p>
            <p className="text-xl font-bold text-red-600">{formatCurrency(report.transactionExpense)}</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-sm text-slate-500 mb-1">流水净额</p>
            <p className={`text-xl font-bold ${report.transactionNet >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(report.transactionNet)}
            </p>
          </div>
        </div>
      </div>

      {/* 利润构成分析 */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-purple-500" />
          利润构成分析
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
            <span className="text-slate-700">销售利润贡献</span>
            <span className="font-semibold text-green-600">
              {formatCurrency(report.salesProfit)} ({report.totalIncome > 0 ? ((report.salesProfit / report.totalIncome) * 100).toFixed(1) : 0}%)
            </span>
          </div>
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
            <span className="text-slate-700">经营流水贡献</span>
            <span className="font-semibold text-blue-600">
              {formatCurrency(report.transactionNet)} ({report.totalIncome > 0 ? ((report.transactionNet / report.totalIncome) * 100).toFixed(1) : 0}%)
            </span>
          </div>
          <div className="flex items-center justify-between p-4 bg-slate-100 rounded-lg font-semibold">
            <span className="text-slate-900">整体净利润</span>
            <span className={`${report.overallProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(report.overallProfit)}
            </span>
          </div>
        </div>
      </div>

      {/* 计算公式说明 */}
      <div className="bg-slate-50 rounded-xl p-6 border border-slate-100">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">计算公式说明</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="bg-white rounded-lg p-4">
            <p className="font-medium text-slate-700 mb-2">总收入</p>
            <p className="text-slate-500">销售总额 + 经营流水收入（入账、收入）</p>
            <p className="text-slate-700 mt-1 font-mono">= {formatCurrency(report.totalSales)} + {formatCurrency(report.transactionIncome)} = {formatCurrency(report.totalIncome)}</p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <p className="font-medium text-slate-700 mb-2">总支出</p>
            <p className="text-slate-500">采购总额 + 经营流水支出（付款、支出、报销）</p>
            <p className="text-slate-700 mt-1 font-mono">= {formatCurrency(report.totalPurchases)} + {formatCurrency(report.transactionExpense)} = {formatCurrency(report.totalExpense)}</p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <p className="font-medium text-slate-700 mb-2">整体利润</p>
            <p className="text-slate-500">总收入 - 总支出</p>
            <p className="text-slate-700 mt-1 font-mono">= {formatCurrency(report.totalIncome)} - {formatCurrency(report.totalExpense)} = {formatCurrency(report.overallProfit)}</p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <p className="font-medium text-slate-700 mb-2">上期余额</p>
            <p className="text-slate-500">初始资金 + 历史累计利润</p>
            <p className="text-slate-700 mt-1 font-mono">= {formatCurrency(report.bankBalance)} + {formatCurrency(report.previousBalance - report.bankBalance)} = {formatCurrency(report.previousBalance)}</p>
          </div>
          <div className="bg-white rounded-lg p-4 md:col-span-2">
            <p className="font-medium text-slate-700 mb-2">账户余额</p>
            <p className="text-slate-500">上期余额 + 本期经营利润</p>
            <p className="text-slate-700 mt-1 font-mono">= {formatCurrency(report.previousBalance)} + {formatCurrency(report.overallProfit)} = {formatCurrency(report.accountBalance)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}