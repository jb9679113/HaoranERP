import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { EmptyState } from '../components/shared/EmptyState'
import { DeleteConfirm } from '../components/shared/DeleteConfirm'
import { formatCurrency } from '../lib/format'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Edit2, Trash2, Plus, Download } from 'lucide-react'
import { toast } from '@/components/ui/toast'
import { canEditProducts } from '../lib/auth'
import { exportInventoryReport } from '../lib/export'

export function Products({ role }) {
  const [products, setProducts] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [deletingProduct, setDeletingProduct] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    spec: '',
    stock_quantity: '0',
    purchase_price: '',
    selling_price: '',
  })
  const [loading, setLoading] = useState(true)

  const loadProducts = async () => {
    setLoading(true)
    try {
      const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false })
      setProducts(data || [])
    } catch (error) {
      console.error('Error loading products:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProducts()
  }, [])

  const handleOpenDialog = (product = null) => {
    if (product) {
      setEditingProduct(product)
      setFormData({
        name: product.name,
        brand: product.brand || '',
        spec: product.spec || '',
        stock_quantity: String(product.stock_quantity),
        purchase_price: String(product.purchase_price),
        selling_price: String(product.selling_price),
      })
    } else {
      setEditingProduct(null)
      setFormData({
        name: '',
        brand: '',
        spec: '',
        stock_quantity: '0',
        purchase_price: '',
        selling_price: '',
      })
    }
    setDialogOpen(true)
  }

  const handleSave = async () => {
    // 必填字段验证
    if (!formData.name.trim()) {
      toast({ description: '请输入商品名称', variant: 'destructive' })
      return
    }
    if (!formData.purchase_price || isNaN(parseFloat(formData.purchase_price))) {
      toast({ description: '请输入有效的进货价', variant: 'destructive' })
      return
    }
    if (!formData.selling_price || isNaN(parseFloat(formData.selling_price))) {
      toast({ description: '请输入有效的售价', variant: 'destructive' })
      return
    }
    
    try {
      if (editingProduct) {
        const { error } = await supabase.from('products').update({
          name: formData.name,
          brand: formData.brand,
          spec: formData.spec,
          stock_quantity: parseInt(formData.stock_quantity) || 0,
          purchase_price: parseFloat(formData.purchase_price),
          selling_price: parseFloat(formData.selling_price),
        }).eq('id', editingProduct.id)
        
        if (error) {
          console.error('更新商品失败:', error)
          toast({ description: '更新商品失败: ' + error.message, variant: 'destructive' })
          return
        }
        toast({ description: '商品更新成功', className: 'bg-green-500' })
      } else {
        const { error } = await supabase.from('products').insert({
          name: formData.name,
          brand: formData.brand,
          spec: formData.spec,
          stock_quantity: parseInt(formData.stock_quantity) || 0,
          purchase_price: parseFloat(formData.purchase_price),
          selling_price: parseFloat(formData.selling_price),
        })
        
        if (error) {
          console.error('添加商品失败:', error)
          toast({ description: '添加商品失败: ' + error.message, variant: 'destructive' })
          return
        }
        toast({ description: '商品添加成功', className: 'bg-green-500' })
      }
      setDialogOpen(false)
      loadProducts()
    } catch (error) {
      console.error('保存商品异常:', error)
      toast({ description: '保存失败: ' + error.message, variant: 'destructive' })
    }
  }

  const handleDelete = async () => {
    try {
      await supabase.from('products').delete().eq('id', deletingProduct.id)
      toast({ description: '商品删除成功', className: 'bg-green-500' })
      setDeleteDialogOpen(false)
      loadProducts()
    } catch (error) {
      toast({ description: '删除失败: ' + error.message, variant: 'destructive' })
    }
  }

  const handleExportInventory = async () => {
    try {
      toast({ description: '正在导出库存盘点表...', className: 'bg-blue-500' })
      
      // 获取采购记录
      const { data: purchases } = await supabase.from('purchases').select('*, products(name)').order('purchase_date')
      // 获取销售记录
      const { data: sales } = await supabase.from('sales').select('*, products(name), customers(name)').order('sale_date')
      // 获取赠品出库记录
      const { data: giftIssues } = await supabase.from('gift_issues').select('*, products(name), customers(name), issue_types(name)').order('issue_date')
      
      await exportInventoryReport(products, purchases || [], sales || [], giftIssues || [])
      
      toast({ description: '库存盘点表导出成功', className: 'bg-green-500' })
    } catch (error) {
      console.error('导出失败:', error)
      toast({ description: '导出失败: ' + error.message, variant: 'destructive' })
    }
  }

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.brand?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return <div className="flex items-center justify-center py-12">加载中...</div>
  }

  const canEdit = canEditProducts(role)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="relative max-w-md">
          <Input
            placeholder="搜索商品名称或品牌..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExportInventory} className="bg-green-600 hover:bg-green-700">
            <Download className="w-4 h-4 mr-2" />
            导出库存盘点表
          </Button>
          {canEdit && (
            <Button onClick={() => handleOpenDialog()} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              新增商品
            </Button>
          )}
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <EmptyState message="暂无商品数据" />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">商品名称</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">品牌</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">规格</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-slate-600">库存</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-slate-600">进货价</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-slate-600">售价</th>
                  {canEdit && <th className="text-center py-3 px-4 text-sm font-semibold text-slate-600">操作</th>}
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(product => (
                  <tr key={product.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4 text-sm font-medium text-slate-900">{product.name}</td>
                    <td className="py-3 px-4 text-sm text-slate-600">{product.brand || '-'}</td>
                    <td className="py-3 px-4 text-sm text-slate-600">{product.spec || '-'}</td>
                    <td className={`py-3 px-4 text-sm font-semibold text-right ${product.stock_quantity <= 10 ? 'text-red-600' : 'text-slate-900'}`}>
                      {product.stock_quantity}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600 text-right">{formatCurrency(product.purchase_price)}</td>
                    <td className="py-3 px-4 text-sm text-slate-600 text-right">{formatCurrency(product.selling_price)}</td>
                    {canEdit && (
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDialog(product)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => { setDeletingProduct(product); setDeleteDialogOpen(true); }}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingProduct ? '编辑商品' : '新增商品'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="name">商品名称 *</Label>
              <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="brand">品牌</Label>
              <Input id="brand" value={formData.brand} onChange={(e) => setFormData({ ...formData, brand: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="spec">规格</Label>
              <Input id="spec" value={formData.spec} onChange={(e) => setFormData({ ...formData, spec: e.target.value })} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stock_quantity">库存</Label>
                <Input id="stock_quantity" type="number" value={formData.stock_quantity} onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="purchase_price">进货价 *</Label>
                <Input id="purchase_price" type="number" step="0.01" value={formData.purchase_price} onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="selling_price">售价 *</Label>
                <Input id="selling_price" type="number" step="0.01" value={formData.selling_price} onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })} required />
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
        title="删除商品"
        description={`确定要删除商品 "${deletingProduct?.name}" 吗？`}
      />
    </div>
  )
}
