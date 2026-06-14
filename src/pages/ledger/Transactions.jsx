import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { EmptyState } from '../../components/shared/EmptyState'
import { DeleteConfirm } from '../../components/shared/DeleteConfirm'
import { formatCurrency, formatDate } from '../../lib/format'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'

export function Transactions() {
  const [transactions, setTransactions] = useState([])
  const [categories, setCategories] = useState([])
  const [payers, setPayers] = useState([])
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingTransaction, setDeletingTransaction] = useState(null)
  const [filters, setFilters] = useState({
    type: '',
    category_id: '',
    payer_id: '',
    startDate: '',
    endDate: '',
  })
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    setLoading(true)
    try {
      const [transRes, catRes, payerRes] = await Promise.all([
        supabase.from('transactions').select('*, expense_categories(name), payers(name)').order('transaction_date', { ascending: false }),
        supabase.from('expense_categories').select('*'),
        supabase.from('payers').select('*'),
      ])
      setTransactions(transRes.data || [])
      setCategories(catRes.data || [])
      setPayers(payerRes.data || [])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleDelete = async () => {
    try {
      await supabase.from('transactions').delete().eq('id', deletingTransaction.id)
      toast({ description: '流水记录删除成功', className: 'bg-green-500' })
      setDeleteDialogOpen(false)
      loadData()
    } catch (error) {
      toast({ description: '删除失败: ' + error.message, variant: 'destructive' })
    }
  }

  const filteredTransactions = transactions.filter(t => {
    if (filters.type && t.type !== filters.type) return false
    if (filters.category_id && t.category_id !== filters.category_id) return false
    if (filters.payer_id && t.payer_id !== filters.payer_id) return false
    if (filters.startDate && t.transaction_date < filters.startDate) return false
    if (filters.endDate && t.transaction_date > filters.endDate) return false
    return true
  })

  const totalIncome = filteredTransactions.filter(t => t.type === '入账' || t.type === '收入').reduce((sum, t) => sum + parseFloat(t.amount), 0)
  const totalExpense = filteredTransactions.filter(t => t.type === '付款').reduce((sum, t) => sum + parseFloat(t.amount), 0)
  const netAmount = totalIncome - totalExpense

  const typeColors = { '入账': 'text-green-600', '付款': 'text-red-600', '收入': 'text-blue-600' }
  const typeBgColors = { '入账': 'bg-green-50', '付款': 'bg-red-50', '收入': 'bg-blue-50' }

  if (loading) {
    return <div className="flex items-center justify-center py-12">加载中...</div>
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="space-y-2">
            <Label className="text-xs">类型</Label>
            <Select value={filters.type} onValueChange={(value) => setFilters({ ...filters, type: value })}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="全部类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">全部类型</SelectItem>
                <SelectItem value="入账">入账</SelectItem>
                <SelectItem value="付款">付款</SelectItem>
                <SelectItem value="收入">收入</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">类别</Label>
            <Select value={filters.category_id} onValueChange={(value) => setFilters({ ...filters, category_id: value })}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="全部分类" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">全部分类</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">付款人</Label>
            <Select value={filters.payer_id} onValueChange={(value) => setFilters({ ...filters, payer_id: value })}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="全部付款人" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">全部付款人</SelectItem>
                {payers.map(payer => (
                  <SelectItem key={payer.id} value={payer.id}>{payer.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">开始日期</Label>
            <Input type="date" value={filters.startDate} onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">结束日期</Label>
            <Input type="date" value={filters.endDate} onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} />
          </div>
        </div>
      </div>

      {filteredTransactions.length === 0 ? (
        <EmptyState message="暂无流水记录" />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">日期</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">类型</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">类别</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">付款人</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-slate-600">金额</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">备注</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-slate-600">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map(transaction => (
                  <tr key={transaction.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4 text-sm text-slate-900">{formatDate(transaction.transaction_date)}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${typeBgColors[transaction.type]} ${typeColors[transaction.type]}`}>
                        {transaction.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600">{transaction.expense_categories?.name || '-'}</td>
                    <td className="py-3 px-4 text-sm text-slate-600">{transaction.payers?.name || '-'}</td>
                    <td className={`py-3 px-4 text-sm font-semibold text-right ${typeColors[transaction.type]}`}>
                      {transaction.type === '付款' ? '-' : '+'}{formatCurrency(transaction.amount)}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600">{transaction.note || '-'}</td>
                    <td className="py-3 px-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { setDeletingTransaction(transaction); setDeleteDialogOpen(true); }}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
                <tr className="bg-slate-50 font-semibold">
                  <td colSpan={4} className="py-3 px-4 text-sm text-right text-slate-600">入账合计</td>
                  <td className="py-3 px-4 text-sm text-right text-green-600">+{formatCurrency(totalIncome)}</td>
                  <td colSpan={2} className="py-3 px-4" />
                </tr>
                <tr className="bg-slate-50 font-semibold">
                  <td colSpan={4} className="py-3 px-4 text-sm text-right text-slate-600">支出合计</td>
                  <td className="py-3 px-4 text-sm text-right text-red-600">-{formatCurrency(totalExpense)}</td>
                  <td colSpan={2} className="py-3 px-4" />
                </tr>
                <tr className="bg-slate-50 font-semibold">
                  <td colSpan={4} className="py-3 px-4 text-sm text-right text-slate-600">净额</td>
                  <td className={`py-3 px-4 text-sm text-right font-bold ${netAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {netAmount >= 0 ? '+' : ''}{formatCurrency(netAmount)}
                  </td>
                  <td colSpan={2} className="py-3 px-4" />
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      <DeleteConfirm
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        title="删除流水记录"
        description="确定要删除此流水记录吗？"
      />
    </div>
  )
}
