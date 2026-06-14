import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { StatCard } from '../components/shared/StatCard'
import { EmptyState } from '../components/shared/EmptyState'
import { formatCurrency, formatDate } from '../lib/format'
import { TrendingUp, DollarSign, ShoppingCart, TrendingDown, CreditCard, FileText, AlertTriangle } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export function Dashboard() {
  const [stats, setStats] = useState({
    todaySales: 0,
    monthlySales: 0,
    monthlyPurchases: 0,
    monthlyProfit: 0,
    monthlyIncome: 0,
    monthlyExpense: 0,
    monthlyNet: 0,
  })
  const [lowStockProducts, setLowStockProducts] = useState([])
  const [recentSales, setRecentSales] = useState([])
  const [salesChartData, setSalesChartData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true)
      try {
        const today = new Date().toISOString().split('T')[0]
        const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]

        const [salesRes, purchasesRes, productsRes, transactionsRes] = await Promise.all([
          supabase.from('sales').select('*, products(name)').gte('sale_date', firstDayOfMonth),
          supabase.from('purchases').select('*').gte('purchase_date', firstDayOfMonth),
          supabase.from('products').select('*').lte('stock_quantity', 10),
          supabase.from('transactions').select('*').gte('transaction_date', firstDayOfMonth),
        ])

        const todaySales = salesRes.data?.filter(s => s.sale_date === today).reduce((sum, s) => sum + s.quantity * s.unit_price, 0) || 0
        const monthlySales = salesRes.data?.reduce((sum, s) => sum + s.quantity * s.unit_price, 0) || 0
        const monthlyPurchases = purchasesRes.data?.reduce((sum, p) => sum + p.quantity * p.unit_price, 0) || 0
        const monthlyProfit = monthlySales - monthlyPurchases

        const monthlyIncome = transactionsRes.data?.filter(t => t.type === '入账' || t.type === '收入').reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0
        const monthlyExpense = transactionsRes.data?.filter(t => t.type === '付款').reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0
        const monthlyNet = monthlyIncome - monthlyExpense

        setStats({
          todaySales,
          monthlySales,
          monthlyPurchases,
          monthlyProfit,
          monthlyIncome,
          monthlyExpense,
          monthlyNet,
        })

        setLowStockProducts(productsRes.data || [])

        const recentSalesData = salesRes.data?.slice(-10).reverse().map(sale => ({
          ...sale,
          total: sale.quantity * sale.unit_price,
        })) || []
        setRecentSales(recentSalesData)

        const last30Days = []
        for (let i = 29; i >= 0; i--) {
          const date = new Date()
          date.setDate(date.getDate() - i)
          const dateStr = date.toISOString().split('T')[0]
          const daySales = salesRes.data?.filter(s => s.sale_date === dateStr).reduce((sum, s) => sum + s.quantity * s.unit_price, 0) || 0
          last30Days.push({ date: dateStr, sales: daySales })
        }
        setSalesChartData(last30Days)
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  if (loading) {
    return <div className="flex items-center justify-center py-12">加载中...</div>
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="今日销售额" value={stats.todaySales} icon="TrendingUp" color="blue" />
        <StatCard title="本月销售额" value={stats.monthlySales} icon="DollarSign" color="green" />
        <StatCard title="本月采购额" value={stats.monthlyPurchases} icon="ShoppingCart" color="orange" />
        <StatCard title="本月毛利润" value={stats.monthlyProfit} icon="TrendingDown" color="cyan" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="本月入账合计" value={stats.monthlyIncome} icon="CreditCard" color="green" />
        <StatCard title="本月支出合计" value={stats.monthlyExpense} icon="FileText" color="red" />
        <StatCard title="本月净额" value={stats.monthlyNet} icon="TrendingUp" color="blue" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">过去30天销售额</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  tickFormatter={(date) => {
                    const d = new Date(date)
                    return `${d.getMonth() + 1}/${d.getDate()}`
                  }}
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  tickFormatter={(value) => `¥${value.toLocaleString()}`}
                />
                <Tooltip 
                  formatter={(value) => [`¥${value.toLocaleString()}`, '销售额']}
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0' }}
                />
                <Line type="monotone" dataKey="sales" stroke="#3B6FE8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            <h3 className="text-lg font-semibold text-slate-900">低库存提醒</h3>
            {lowStockProducts.length > 0 && (
              <span className="ml-auto px-2 py-0.5 bg-orange-100 text-orange-600 text-sm font-medium rounded-full">
                {lowStockProducts.length}
              </span>
            )}
          </div>
          {lowStockProducts.length === 0 ? (
            <EmptyState message="暂无低库存商品" />
          ) : (
            <div className="space-y-3">
              {lowStockProducts.map(product => (
                <div key={product.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-900">{product.name}</p>
                    <p className="text-xs text-slate-500">{product.spec}</p>
                  </div>
                  <span className={`text-lg font-bold ${product.stock_quantity <= 5 ? 'text-red-600' : 'text-orange-600'}`}>
                    {product.stock_quantity}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">最近销售记录</h3>
        {recentSales.length === 0 ? (
          <EmptyState message="暂无销售记录" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">日期</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">商品</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-slate-600">数量</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-slate-600">单价</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-slate-600">合计</th>
                </tr>
              </thead>
              <tbody>
                {recentSales.map(sale => (
                  <tr key={sale.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4 text-sm text-slate-900">{formatDate(sale.sale_date)}</td>
                    <td className="py-3 px-4 text-sm text-slate-900">{sale.products?.name || '未知商品'}</td>
                    <td className="py-3 px-4 text-sm text-slate-600 text-right">{sale.quantity}</td>
                    <td className="py-3 px-4 text-sm text-slate-600 text-right">{formatCurrency(sale.unit_price)}</td>
                    <td className="py-3 px-4 text-sm font-medium text-slate-900 text-right">{formatCurrency(sale.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
