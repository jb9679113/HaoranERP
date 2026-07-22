import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { EmptyState } from '../components/shared/EmptyState';
import { DeleteConfirm } from '../components/shared/DeleteConfirm';
import { formatCurrency, formatDate } from '../lib/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus, AlertTriangle, Download } from 'lucide-react';
import { toast } from '@/components/ui/toast';
import { isAdmin } from '../lib/auth';
import { exportGiftIssues } from '../lib/export';

export function GiftIssues({ role, employee }) {
  const [giftIssues, setGiftIssues] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [issueTypes, setIssueTypes] = useState([]);
  // 默认出库类型（作为数据库数据的 fallback）
  const defaultIssueTypes = [
    { id: 'marketing', name: '市场推广赠品', expense_account: '销售费用-业务宣传费' },
    { id: 'entertainment', name: '业务招待赠品', expense_account: '管理费用-业务招待费' },
    { id: 'sample', name: '样品赠送', expense_account: '销售费用-样品费' },
  ];
  // 合并数据库数据和默认数据（数据库数据优先）
  const availableIssueTypes = issueTypes.length > 0 ? issueTypes : defaultIssueTypes;
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingIssue, setDeletingIssue] = useState(null);
  const [formData, setFormData] = useState({
    product_id: '',
    customer_id: '',
    issue_type: 'marketing',
    quantity: '1',
    description: '',
    issue_date: new Date().toISOString().split('T')[0],
  });
  const [loading, setLoading] = useState(true);

  // 选中商品的成本信息
  const selectedProduct = products.find(p => p.id === formData.product_id);
  const unitCost = selectedProduct ? selectedProduct.purchase_price : 0;
  const totalCost = selectedProduct ? parseInt(formData.quantity) * selectedProduct.purchase_price : 0;
  const stockWarning = selectedProduct && parseInt(formData.quantity) > selectedProduct.stock_quantity;

  const loadData = async () => {
    setLoading(true);
    try {
      const [issuesRes, productsRes, customersRes, typesRes] = await Promise.all([
        supabase.from('gift_issues').select('*, products(name), customers(name), issue_types(name, expense_account)').order('issue_date', { ascending: false }),
        supabase.from('products').select('id, name, stock_quantity, purchase_price'),
        supabase.from('customers').select('id, name'),
        supabase.from('issue_types').select('id, name, expense_account'),
      ]);
      setGiftIssues(issuesRes.data || []);
      setProducts(productsRes.data || []);
      setCustomers(customersRes.data || []);
      setIssueTypes(typesRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({ description: '加载数据失败: ' + error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async () => {
    if (stockWarning) {
      toast({ description: '库存不足，无法提交', variant: 'destructive' });
      return;
    }

    if (!formData.product_id) {
      toast({ description: '请选择商品', variant: 'destructive' });
      return;
    }

    if (!formData.quantity || parseInt(formData.quantity) <= 0) {
      toast({ description: '请输入有效数量', variant: 'destructive' });
      return;
    }

    try {
      const result = await supabase.from('gift_issues').insert({
        product_id: formData.product_id,
        customer_id: formData.customer_id || null,
        issue_type: formData.issue_type,
        quantity: parseInt(formData.quantity),
        unit_cost: parseFloat(unitCost),
        total_cost: parseFloat(totalCost),
        description: formData.description,
        issue_date: formData.issue_date,
        created_by: employee?.id,
      });

      if (result.error) {
        console.error('插入失败:', result.error);
        toast({ description: '保存失败: ' + result.error.message, variant: 'destructive' });
        return;
      }

      toast({ description: '赠品出库记录添加成功，库存已扣减', className: 'bg-green-500' });
      setDialogOpen(false);
      setFormData({
        product_id: '',
        customer_id: '',
        issue_type: 'marketing',
        quantity: '1',
        description: '',
        issue_date: new Date().toISOString().split('T')[0],
      });
      loadData();
    } catch (error) {
      console.error('保存异常:', error);
      toast({ description: '保存失败: ' + error.message, variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    try {
      const { error } = await supabase.from('gift_issues').delete().eq('id', deletingIssue.id);

      if (error) {
        toast({ description: '删除失败: ' + error.message, variant: 'destructive' });
        return;
      }

      toast({ description: '赠品出库记录删除成功，库存已恢复', className: 'bg-green-500' });
      setDeleteDialogOpen(false);
      loadData();
    } catch (error) {
      toast({ description: '删除失败: ' + error.message, variant: 'destructive' });
    }
  };

  const handleExport = async () => {
    try {
      toast({ description: '正在导出赠品出库记录...', className: 'bg-blue-500' });
      await exportGiftIssues(giftIssues);
      toast({ description: '赠品出库记录导出成功', className: 'bg-green-500' });
    } catch (error) {
      console.error('导出失败:', error);
      toast({ description: '导出失败: ' + error.message, variant: 'destructive' });
    }
  };

  const getIssueTypeName = (typeId) => {
    const type = availableIssueTypes.find(t => t.id === typeId);
    return type ? type.name : typeId;
  };

  const getExpenseAccount = (typeId) => {
    const type = availableIssueTypes.find(t => t.id === typeId);
    return type ? type.expense_account : '';
  };

  const filteredIssues = giftIssues;

  if (loading) {
    return <div className="flex items-center justify-center py-12">加载中...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">赠品出库</h1>
          <p className="text-slate-500 mt-1">管理商品赠送出库，库存自动扣减，成本计入对应费用科目</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExport} className="bg-blue-600 hover:bg-blue-700">
            <Download className="w-4 h-4 mr-2" />
            导出记录
          </Button>
          <Button onClick={() => setDialogOpen(true)} className="bg-green-600 hover:bg-green-700">
            <Plus className="w-4 h-4 mr-2" />
            新增赠品出库
          </Button>
        </div>
      </div>

      {filteredIssues.length === 0 ? (
        <EmptyState message="暂无赠品出库记录" />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">日期</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">商品</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">客户</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">类型</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-slate-600">数量</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-slate-600">成本</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">费用科目</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">备注</th>
                  {isAdmin(role) && <th className="text-center py-3 px-4 text-sm font-semibold text-slate-600">操作</th>}
                </tr>
              </thead>
              <tbody>
                {filteredIssues.map(issue => (
                  <tr key={issue.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4 text-sm text-slate-900">{formatDate(issue.issue_date)}</td>
                    <td className="py-3 px-4 text-sm font-medium text-slate-900">{issue.products?.name || '未知商品'}</td>
                    <td className="py-3 px-4 text-sm text-slate-600">{issue.customers?.name || '-'}</td>
                    <td className="py-3 px-4 text-sm text-slate-600">{issue.issue_types?.name || getIssueTypeName(issue.issue_type)}</td>
                    <td className="py-3 px-4 text-sm text-slate-600 text-right">{issue.quantity}</td>
                    <td className="py-3 px-4 text-sm font-medium text-slate-900 text-right">{formatCurrency(issue.total_cost)}</td>
                    <td className="py-3 px-4 text-sm text-slate-600">{issue.issue_types?.expense_account || getExpenseAccount(issue.issue_type)}</td>
                    <td className="py-3 px-4 text-sm text-slate-600">{issue.description || '-'}</td>
                    {isAdmin(role) && (
                      <td className="py-3 px-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setDeletingIssue(issue); setDeleteDialogOpen(true); }}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    )}
                  </tr>
                ))}
                <tr className="bg-slate-50 font-semibold">
                  <td className="py-3 px-4 text-sm text-slate-600" colSpan="4">合计</td>
                  <td className="py-3 px-4 text-sm text-slate-900 text-right">{filteredIssues.reduce((sum, i) => sum + parseInt(i.quantity), 0)}</td>
                  <td className="py-3 px-4 text-sm text-green-600 text-right">{formatCurrency(filteredIssues.reduce((sum, i) => sum + parseFloat(i.total_cost), 0))}</td>
                  <td className="py-3 px-4" colSpan="2" />
                  {isAdmin(role) && <td className="py-3 px-4"></td>}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新增赠品出库记录</DialogTitle>
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
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} (库存: {product.stock_quantity}, 成本: {formatCurrency(product.purchase_price)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer_id">客户</Label>
              <Select value={formData.customer_id || ''} onValueChange={(value) => setFormData({ ...formData, customer_id: value || null })}>
                <SelectTrigger>
                  <SelectValue placeholder="选择客户（可选）" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">无客户</SelectItem>
                  {customers.map(customer => (
                    <SelectItem key={customer.id} value={customer.id}>{customer.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="issue_type">出库类型 *</Label>
              <Select value={formData.issue_type} onValueChange={(value) => setFormData({ ...formData, issue_type: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="选择出库类型" />
                </SelectTrigger>
                <SelectContent>
                  {availableIssueTypes.map(type => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name} ({type.expense_account})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">数量 *</Label>
                <Input id="quantity" type="number" min="1" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit_cost">成本单价（自动）</Label>
                <Input id="unit_cost" type="number" step="0.01" value={unitCost} disabled className="bg-slate-100" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="total_cost">总成本（自动计算）</Label>
              <Input id="total_cost" type="number" step="0.01" value={totalCost} disabled className="bg-slate-100 font-semibold text-green-600" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">备注</Label>
              <Input id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="赠送原因等..." />
            </div>

            <div className="space-y-2">
              <Label htmlFor="issue_date">日期 *</Label>
              <Input id="issue_date" type="date" value={formData.issue_date} onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })} required />
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
              className="bg-green-600 hover:bg-green-700"
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
          title="删除赠品出库记录"
          description="确定要删除此赠品出库记录吗？库存将自动恢复。"
        />
      )}
    </div>
  );
}