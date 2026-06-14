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
import { Trash2, Plus, AlertTriangle } from 'lucide-react'
import { toast } from '@/components/ui/toast'
import { isAdmin } from '../lib/auth'

export function Sales({ role, employee }) {
  const [sales, setSales] = useState([])
  const [products, setProducts] = useState([])
  const [customers, setCustomers] = useState([])
  const [employees, setEmployees] = useState([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingSale, setDeletingSale] = useState(null)
  const [selectedEmployee, setSelectedEmployee] = useState('')
  const [formData, setFormData] = useState({
    product_id: '',
    customer_id: '',
    employee_id: '',
    quantity: '1',
    unit_price: '',
    sale_date: new Date().toISOString().split('T')[0],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      console.log('=== 开始加载销售数据 ===');
      console.log('当前用户角色:', role);
      console.log('当前员工:', employee);
      
      // 先检查 Supabase 连接状态
      const { data: authData, error: authError } = await supabase.auth.getSession();
      console.log('认证状态:', authData?.session ? '已登录' : '未登录');
      if (authError) {
        console.error('认证错误:', authError);
      }
      
      // 单独查询每个表，看哪个有问题
      const tablesToCheck = ['sales', 'products', 'customers', 'employees'];
      const checkResults = {};
      
      for (const table of tablesToCheck) {
        try {
          const res = await supabase.from(table).select('*').limit(1);
          checkResults[table] = res.error ? `❌ ${res.error.message}` : `✅ 正常`;
          console.log(`${table}:`, checkResults[table]);
        } catch (e) {
          checkResults[table] = `❌ 异常: ${e.message}`;
          console.log(`${table}:`, checkResults[table]);
        }
      }
      
      // 如果 sales 表有问题，直接显示错误
      const salesCheck = await supabase.from('sales').select('*').limit(1);
      if (salesCheck.error) {
        const errorMsg = `无法访问 sales 表: ${salesCheck.error.message}`;
        setError(errorMsg);
        console.error(errorMsg);
        setLoading(false);
        return;
      }
      
      // 再查询完整数据
      const [fullSalesRes, productsRes, customersRes, employeesRes] = await Promise.all([
        supabase.from('sales').select('*, products(name), customers(name)').order('sale_date', { ascending: false }),
        supabase.from('products').select('id, name, stock_quantity, selling_price'),
        supabase.from('customers').select('id, name'),
        supabase.from('employees').select('id, name'),
      ]);
      
      console.log('完整查询结果:', { 
        sales: fullSalesRes.data?.length || 0, 
        products: productsRes.data?.length || 0,
        customers: customersRes.data?.length || 0,
        employees: employeesRes.data?.length || 0 
      });
      
      if (fullSalesRes.error) {
        setError('加载销售记录失败: ' + fullSalesRes.error.message);
        console.error('销售记录错误:', fullSalesRes.error);
      } else {
        let filteredSales = fullSalesRes.data || [];
        if (!isAdmin(role) && employee) {
          filteredSales = filteredSales.filter(s => s.employee_id === employee.id);
        }
        setSales(filteredSales);
        setProducts(productsRes.data || []);
        setCustomers(customersRes.data || []);
        setEmployees(employeesRes.data || []);
      }
    } catch (error) {
      setError('加载数据失败: ' + error.message);
      console.error('加载数据异常:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData()
  }, [role, employee])

  const selectedProduct = products.find(p => p.id === formData.product_id)
  const stockWarning = selectedProduct && parseInt(formData.quantity) > selectedProduct.stock_quantity

  const handleSave = async () => {
    if (stockWarning) {
      toast({ description: '库存不足，无法提交', variant: 'destructive' })
      return
    }

    // 验证必填字段
    if (!formData.product_id) {
      toast({ description: '请选择商品', variant: 'destructive' })
      return
    }
    if (!formData.employee_id) {
      toast({ description: '请选择销售员', variant: 'destructive' })
      return
    }
    if (!formData.quantity || parseInt(formData.quantity) <= 0) {
      toast({ description: '请输入有效数量', variant: 'destructive' })
      return
    }
    if (!formData.unit_price || parseFloat(formData.unit_price) <= 0) {
      toast({ description: '请输入有效单价', variant: 'destructive' })
      return
    }

    try {
      console.log('准备插入销售记录:', formData);
      const result = await supabase.from('sales').insert({
        product_id: formData.product_id,
        customer_id: formData.customer_id || null,
        employee_id: formData.employee_id,
        quantity: parseInt(formData.quantity),
        unit_price: parseFloat(formData.unit_price),
        sale_date: formData.sale_date,
      })
      
      console.log('插入结果:', result);
      
      if (result.error) {
        console.error('插入失败:', result.error);
        toast({ description: '保存失败: ' + result.error.message, variant: 'destructive' })
        return
      }
      
      toast({ description: '销售记录添加成功', className: 'bg-green-500' })
      setDialogOpen(false)
      setFormData({
        product_id: '',
        customer_id: '',
        employee_id: isAdmin(role) ? '' : employee?.id,
        quantity: '1',
        unit_price: '',
        sale_date: new Date().toISOString().split('T')[0],
      })
      loadData()
    } catch (error) {
      console.error('保存异常:', error);
      toast({ description: '保存失败: ' + error.message, variant: 'destructive' })
    }
  }

  const handleDelete = async () => {
    try {
      await supabase.from('sales').delete().eq('id', deletingSale.id)
      toast({ description: '销售记录删除成功', className: 'bg-green-500' })
      setDeleteDialogOpen(false)
      loadData()
    } catch (error) {
      toast({ description: '删除失败: ' + error.message, variant: 'destructive' })
    }
  }

  const handleProductChange = (productId) => {
    const product = products.find(p => p.id === productId)
    setFormData(prev => ({
      ...prev,
      product_id: productId,
      unit_price: product ? String(product.selling_price) : '',
    }))
  }

  const filteredSales = sales.filter(s => {
    if (!selectedEmployee || selectedEmployee === 'all') return true
    return s.employee_id === selectedEmployee
  })

  useEffect(() => {
    if (!isAdmin(role) && employee) {
      setFormData(prev => ({ ...prev, employee_id: employee.id }))
    }
  }, [role, employee])

  if (loading) {
    return <div className="flex items-center justify-center py-12">加载中...</div>
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-100 text-center">
        <div className="text-red-500 text-lg font-medium mb-2">加载失败</div>
        <div className="text-slate-600 text-sm mb-4">{error}</div>
        <Button onClick={loadData} className="bg-blue-600 hover:bg-blue-700">
          重新加载
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        {isAdmin(role) && (
          <div className="space-y-2">
            <Label className="text-xs">按销售员筛选</Label>
            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="全部销售员" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部销售员</SelectItem>
                {employees.map(emp => (
                  <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <Button onClick={() => setDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          新增销售
        </Button>
      </div>

      {filteredSales.length === 0 ? (
        <EmptyState message="暂无销售记录" />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">日期</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">商品</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">客户</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-slate-600">数量</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-slate-600">单价</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-slate-600">合计</th>
                  {isAdmin(role) && <th className="text-center py-3 px-4 text-sm font-semibold text-slate-600">操作</th>}
                </tr>
              </thead>
              <tbody>
                {filteredSales.map(sale => (
                  <tr key={sale.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4 text-sm text-slate-900">{formatDate(sale.sale_date)}</td>
                    <td className="py-3 px-4 text-sm font-medium text-slate-900">{sale.products?.name || '未知商品'}</td>
                    <td className="py-3 px-4 text-sm text-slate-600">{sale.customers?.name || '-'}</td>
                    <td className="py-3 px-4 text-sm text-slate-600 text-right">{sale.quantity}</td>
                    <td className="py-3 px-4 text-sm text-slate-600 text-right">{formatCurrency(sale.unit_price)}</td>
                    <td className="py-3 px-4 text-sm font-medium text-slate-900 text-right">{formatCurrency(sale.quantity * sale.unit_price)}</td>
                    {isAdmin(role) && (
                      <td className="py-3 px-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setDeletingSale(sale); setDeleteDialogOpen(true); }}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
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
            <DialogTitle>新增销售记录</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="product_id">商品 *</Label>
              <Select value={formData.product_id} onValueChange={handleProductChange}>
                <SelectTrigger>
                  <SelectValue placeholder="选择商品" />
                </SelectTrigger>
                <SelectContent>
                  {products.map(product => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} (库存: {product.stock_quantity})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer_id">客户</Label>
              <Select value={formData.customer_id || ''} onValueChange={(value) => setFormData({ ...formData, customer_id: value || null })}>
                <SelectTrigger>
                  <SelectValue placeholder="选择客户" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">无客户</SelectItem>
                  {customers.map(customer => (
                    <SelectItem key={customer.id} value={customer.id}>{customer.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {isAdmin(role) && (
              <div className="space-y-2">
                <Label htmlFor="employee_id">销售员 *</Label>
                <Select value={formData.employee_id} onValueChange={(value) => setFormData({ ...formData, employee_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择销售员" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map(emp => (
                      <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
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
                <Label htmlFor="sale_date">日期 *</Label>
                <Input id="sale_date" type="date" value={formData.sale_date} onChange={(e) => setFormData({ ...formData, sale_date: e.target.value })} required />
              </div>
            </div>
            {stockWarning && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-3 rounded-lg">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm">库存不足，当前仅剩 {selectedProduct?.stock_quantity} 件</span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
            <Button 
              className="bg-blue-600 hover:bg-blue-700" 
              onClick={handleSave}
              disabled={stockWarning}
            >
              {stockWarning ? '库存不足' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isAdmin(role) && (
        <DeleteConfirm
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={handleDelete}
          title="删除销售记录"
          description="确定要删除此销售记录吗？库存将自动回滚。"
        />
      )}
    </div>
  )
}
