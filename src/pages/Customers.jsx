import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { EmptyState } from '../components/shared/EmptyState'
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
import { Edit2, Trash2, Plus } from 'lucide-react'
import { toast } from '@/components/ui/toast'

export function Customers() {
  const [customers, setCustomers] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    type: '普通',
  })
  const [loading, setLoading] = useState(true)

  const loadCustomers = async () => {
    setLoading(true)
    try {
      const { data } = await supabase.from('customers').select('*').order('created_at', { ascending: false })
      setCustomers(data || [])
    } catch (error) {
      console.error('Error loading customers:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCustomers()
  }, [])

  const handleOpenDialog = (customer = null) => {
    if (customer) {
      setEditingCustomer(customer)
      setFormData({
        name: customer.name,
        contact: customer.contact || '',
        type: customer.type || '普通',
      })
    } else {
      setEditingCustomer(null)
      setFormData({
        name: '',
        contact: '',
        type: '普通',
      })
    }
    setDialogOpen(true)
  }

  const handleSave = async () => {
    try {
      if (editingCustomer) {
        await supabase.from('customers').update({
          name: formData.name,
          contact: formData.contact,
          type: formData.type,
        }).eq('id', editingCustomer.id)
        toast({ description: '客户信息更新成功', className: 'bg-green-500' })
      } else {
        await supabase.from('customers').insert({
          name: formData.name,
          contact: formData.contact,
          type: formData.type,
        })
        toast({ description: '客户添加成功', className: 'bg-green-500' })
      }
      setDialogOpen(false)
      loadCustomers()
    } catch (error) {
      toast({ description: '保存失败: ' + error.message, variant: 'destructive' })
    }
  }

  const handleDelete = async (customerId) => {
    try {
      await supabase.from('customers').delete().eq('id', customerId)
      toast({ description: '客户删除成功', className: 'bg-green-500' })
      loadCustomers()
    } catch (error) {
      toast({ description: '删除失败: ' + error.message, variant: 'destructive' })
    }
  }

  const typeLabels = { '普通': '普通', 'VIP': 'VIP', '批发商': '批发商', '零售商': '零售商' }
  const typeColors = {
    '普通': 'bg-slate-100 text-slate-600',
    'VIP': 'bg-yellow-100 text-yellow-700',
    '批发商': 'bg-blue-100 text-blue-700',
    '零售商': 'bg-green-100 text-green-700',
  }

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.contact?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return <div className="flex items-center justify-center py-12">加载中...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="relative max-w-md">
          <Input
            placeholder="搜索客户名称或联系人..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button onClick={() => handleOpenDialog()} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          新增客户
        </Button>
      </div>

      {filteredCustomers.length === 0 ? (
        <EmptyState message="暂无客户数据" />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">客户名称</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">联系人</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">类型</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-slate-600">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map(customer => (
                  <tr key={customer.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4 text-sm font-medium text-slate-900">{customer.name}</td>
                    <td className="py-3 px-4 text-sm text-slate-600">{customer.contact || '-'}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${typeColors[customer.type]}`}>
                        {typeLabels[customer.type]}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDialog(customer)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(customer.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
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
            <DialogTitle>{editingCustomer ? '编辑客户' : '新增客户'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="name">客户名称 *</Label>
              <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact">联系人</Label>
              <Input id="contact" value={formData.contact} onChange={(e) => setFormData({ ...formData, contact: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">类型</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="选择类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="普通">普通</SelectItem>
                  <SelectItem value="VIP">VIP</SelectItem>
                  <SelectItem value="批发商">批发商</SelectItem>
                  <SelectItem value="零售商">零售商</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleSave}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
