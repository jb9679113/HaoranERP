import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { formatCurrency, formatDate } from '../lib/format'
import { TrendingUp, TrendingDown, Wallet, PieChart, DollarSign, ShoppingCart, CreditCard, FileText } from 'lucide-react'

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

        const [salesRes, purchasesRes, transactionsRes] = await Promise.all([
          supabase.from('sales').select('quantity, unit_price').gte('sale_date', startDate),
          supabase.from('purchases').select('quantity, unit_price').gte('purchase_date', startDate),
          supabase.from('transactions').select('amount, type').gte('transaction_date', startDate),
        ])

        // 销售统计
        const totalSales = salesRes.data?.reduce((sum, s) => sum + s.quantity * s.unit_price, 0) || 0
        
        // 采购统计
        const totalPurchases = purchasesRes.data?.reduce((sum, p) => sum + p.quantity * p.unit_price, 0) || 0
        
        // 销售利润 = 销售额 - 采购额
        const salesProfit = totalSales - totalPurchases

        // 经营流水统计
        const transactionIncome = transactionsRes.data?.filter(t => 
          t.type === '入账' || t.type === '收入'
        ).reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0

        const transactionExpense = transactionsRes.data?.filter(t => 
          t.type === '付款' || t.type === '支出' || t.type === '报销'
        ).reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0

        const transactionNet = transactionIncome - transactionExpense

        // 统一统计
        const totalIncome = totalSales + transactionIncome
        const totalExpense = totalPurchases + transactionExpense
        const overallProfit = totalIncome - totalExpense

        // 账户余额计算（假设初始资金为0，实际可从数据库获取）
        const accountBalance = overallProfit

        setReport({
          totalSales,
          totalPurchases,
          salesProfit,
          transactionIncome,
          transactionExpense,
          transactionNet,
          totalIncome,
          totalExpense,
          overallProfit,
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

  if (loading) {
    return <div className="flex items-center justify-center py-12">加载中...</div>
  }

  const StatCard = ({ title, value, icon: Icon, color, trend }) => (
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
        </div>
      </div>

      {/* 核心指标 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
          title="账户余额" 
          value={report.accountBalance} 
          icon={Wallet} 
          color="blue" 
        />
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
    </div>
  )
}