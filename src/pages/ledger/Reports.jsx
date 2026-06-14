import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { formatCurrency, formatDateShort } from '../../lib/format'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { EmptyState } from '../../components/shared/EmptyState'

export function Reports() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))
  const [categoryData, setCategoryData] = useState([])
  const [payerData, setPayerData] = useState([])
  const [dailyData, setDailyData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadReports = async () => {
      setLoading(true)
      try {
        const year = selectedMonth.split('-')[0]
        const month = selectedMonth.split('-')[1]
        const firstDay = `${year}-${month}-01`
        
        const lastDayOfMonth = new Date(parseInt(year), parseInt(month), 0)
        const lastDay = `${year}-${month}-${String(lastDayOfMonth.getDate()).padStart(2, '0')}`

        const { data: transactions } = await supabase
          .from('transactions')
          .select('*, expense_categories(name), payers(name)')
          .gte('transaction_date', firstDay)
          .lte('transaction_date', lastDay)

        const categoryMap = {}
        const payerMap = {}
        const dailyMap = {}

        for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
          const dateStr = `${year}-${month}-${String(i).padStart(2, '0')}`
          dailyMap[dateStr] = { income: 0, expense: 0 }
        }

        transactions?.forEach(t => {
          if (t.type === '付款' && t.category_id && t.expense_categories) {
            const catName = t.expense_categories.name
            categoryMap[catName] = (categoryMap[catName] || 0) + parseFloat(t.amount)
          }
          
          if (t.payer_id && t.payers) {
            const payerName = t.payers.name
            payerMap[payerName] = (payerMap[payerName] || 0) + parseFloat(t.amount)
          }

          if (dailyMap[t.transaction_date]) {
            if (t.type === '付款') {
              dailyMap[t.transaction_date].expense += parseFloat(t.amount)
            } else {
              dailyMap[t.transaction_date].income += parseFloat(t.amount)
            }
          }
        })

        setCategoryData(Object.entries(categoryMap).map(([name, value]) => ({ name, value })))
        setPayerData(Object.entries(payerMap).map(([name, value]) => ({ name, value })))
        setDailyData(Object.entries(dailyMap).map(([date, { income, expense }]) => ({ date, income, expense })))
      } catch (error) {
        console.error('Error loading reports:', error)
      } finally {
        setLoading(false)
      }
    }

    loadReports()
  }, [selectedMonth])

  const COLORS = ['#3B6FE8', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16']

  const months = []
  for (let i = 12; i >= 0; i--) {
    const date = new Date()
    date.setMonth(date.getMonth() - i)
    months.push(date.toISOString().slice(0, 7))
  }

  if (loading) {
    return <div className="flex items-center justify-center py-12">加载中...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <div className="space-y-2">
          <span className="text-sm text-slate-500">选择月份</span>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="选择月份" />
            </SelectTrigger>
            <SelectContent>
              {months.map(m => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">支出类别分布</h3>
          {categoryData.length === 0 ? (
            <EmptyState message="暂无支出数据" />
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${formatCurrency(value)}`, '金额']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">付款人统计</h3>
          {payerData.length === 0 ? (
            <EmptyState message="暂无付款人数据" />
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={payerData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12, fill: '#64748b' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    tickFormatter={(value) => `¥${value.toLocaleString()}`}
                  />
                  <Tooltip 
                    formatter={(value) => [`${formatCurrency(value)}`, '金额']}
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0' }}
                  />
                  <Bar dataKey="value" fill="#3B6FE8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">每日收支趋势</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12, fill: '#64748b' }}
                tickFormatter={formatDateShort}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#64748b' }}
                tickFormatter={(value) => `¥${value.toLocaleString()}`}
              />
              <Tooltip 
                formatter={(value) => [`${formatCurrency(value)}`, '金额']}
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0' }}
              />
              <Legend />
              <Line type="monotone" dataKey="income" name="收入" stroke="#10B981" strokeWidth={2} />
              <Line type="monotone" dataKey="expense" name="支出" stroke="#EF4444" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
