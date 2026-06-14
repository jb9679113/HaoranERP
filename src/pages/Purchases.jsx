import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { EmptyState } from '../components/shared/EmptyState'
import { DeleteConfirm } from '../components/shared/DeleteConfirm'
import { formatCurrency, formatDate } from '../lib/format'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Trash2, Plus } from 'lucide-react'
import { toast } from '@/components/ui/toast'

export function Purchases() {
  const [purchases, setPurchases] = useState([])
  const [products, setProducts] = useState([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingPurchase, setDeletingPurchase] = useState(null)
  const [formData, setFormData] = useState({
    product_id: '',
    supplier: '',
    quantity: '1',
    unit_price: '',
    purchase_date: new Date().toISOString().split('T')[0],
  })
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    setLoading(true)
    try {
      const [purchasesRes, productsRes] = await Promise.all([
        supabase.from('purchases').select('*, products(name)').order('purchase_date', { ascending: false }),
        supabase.from('products').select('id, name'),
      ])
      setPurchases(purchasesRes.data || [])
      setProducts(productsRes.data || [])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSave = async () => {
    try {
      await supabase.from('purchases').insert({
        product_id: formData.product_id,
        supplier: formData.supplier,
        quantity: parseInt(formData.quantity),
        unit_price: parseFloat(formData.unit_price),
        purchase_date: formData.purchase_date,
      })
      toast({ description: '采购记录添加成功', className: 'bg-green-500' })
      setDialogOpen(false)
      setFormData({
        product_id: '',
        supplier: '',
        quantity: '1',
        unit_price: '',
        purchase_date: new Date().toISOString().split('T')[0],
      })
      loadData()
    } catch (error) {
      toast({ description: '保存失败: ' + error.message, variant: 'destructive' })
    }
  }

  const handleDelete = async () => {
    try {
      await supabase.from('purchases').delete().eq('id', deletingPurchase.id)
      toast({ description: '采购记录删除成功', className: 'bg-green-500' })
      setDeleteDialogOpen(false)
      loadData()
    } catch (error) {
      toast({ description: '删除失败: ' + error.message, variant: 'destructive' })
    }
  }

  const filteredPurchases = purchases.filter(p => {
    if (dateRange.start && p.purchase_date < dateRange.start) return false
    if (dateRange.end && p.purchase_date > dateRange.end) return false
    return true
  })

  const totalAmount = filteredPurchases.reduce((sum, p) => sum + p.quantity * p.unit_price, 0)

  if (loading) {
    return <div className="flex items-center justify-center py-12">加载中...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="space-y-2">
            <Label className="text-xs">开始日期</Label>
            <Input type="date" value={dateRange.start} onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">结束日期</Label>
            <Input type="date" value={dateRange.end} onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })} />
          </div>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          新增采购
        </Button>
      </div>

      {filteredPurchases.length === 0 ? (
        <EmptyState message="暂无采购记录" />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">日期</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">商品</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">供应商</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-slate-600">数量</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-slate-600">单价</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-slate-600">合计</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-slate-600">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredPurchases.map(purchase => (
                  <tr key={purchase.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4 text-sm text-slate-900">{formatDate(purchase.purchase_date)}</td>
                    <td className="py-3 px-4 text-sm font-medium text-slate-900">{purchase.products?.name || '未知商品'}</td>
                    <td className="py-3 px-4 text-sm text-slate-600">{purchase.supplier || '-'}</td>
                    <td className="py-3 px-4 text-sm text-slate-600 text-right">{purchase.quantity}</td>
                    <td className="py-3 px-4 text-sm text-slate-600 text-right">{formatCurrency(purchase.unit_price)}</td>
                    <td className="py-3 px-4 text-sm font-medium text-slate-900 text-right">{formatCurrency(purchase.quantity * purchase.unit_price)}</td>
                    <td className="py-3 px-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { setDeletingPurchase(purchase); setDeleteDialogOpen(true); }}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
                <tr className="bg-slate-50 font-semibold">
                  <td colSpan={5} className="py-3 px-4 text-sm text-right text-slate-600">合计</td>
                  <td className="py-3 px-4 text-sm text-right text-blue-600">{formatCurrency(totalAmount)}</td>
                  <td className="py-3 px-4" />
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新增采购记录</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="product_id">商品 *</Label>
              <Select value={formData.product_id} onValueChange={(value) => setFormData({ ...formData, product_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="选择商品" />
                </SelectTrigger>
                <SelectContent>
                  {products.map(product => (
                    <SelectItem key={product.id} value={product.id}>{product.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplier">供应商</Label>
              <Input id="supplier" value={formData.supplier} onChange={(e) => setFormData({ ...formData, supplier: e.target.value })} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">数量 *</Label>
                <Input id="quantity" type="number" min="1" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit_price">单价 *</Label>
                <Input id="unit_price" type="number" step="0.01" value={formData.unit_price} onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="purchase_date">日期 *</Label>
                <Input id="purchase_date" type="date" value={formData.purchase_date} onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })} required />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleSave}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteConfirm
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        title="删除采购记录"
        description="确定要删除此采购记录吗？库存将自动回滚。"
      />
    </div>
  )
}
