import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { EmptyState } from '../components/shared/EmptyState'
import { formatCurrency } from '../lib/format'
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
import { Switch } from '@/components/ui/switch'
import { Edit2, UserPlus } from 'lucide-react'
import { toast } from '@/components/ui/toast'

export function Employees() {
  const [employees, setEmployees] = useState([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    role: 'sales',
    commission_rate: '0',
    is_active: true,
  })
  const [loading, setLoading] = useState(true)

  const loadEmployees = async () => {
    setLoading(true)
    try {
      const { data } = await supabase.from('employees').select('*').order('created_at', { ascending: false })
      setEmployees(data || [])
    } catch (error) {
      console.error('Error loading employees:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadEmployees()
  }, [])

  const handleOpenDialog = (employee = null) => {
    if (employee) {
      setEditingEmployee(employee)
      setFormData({
        name: employee.name,
        role: employee.role,
        commission_rate: String(employee.commission_rate || 0),
        is_active: employee.is_active,
      })
    } else {
      setEditingEmployee(null)
      setFormData({
        name: '',
        role: 'sales',
        commission_rate: '0',
        is_active: true,
      })
    }
    setDialogOpen(true)
  }

  const handleSave = async () => {
    try {
      if (editingEmployee) {
        await supabase.from('employees').update({
          name: formData.name,
          role: formData.role,
          commission_rate: parseFloat(formData.commission_rate),
          is_active: formData.is_active,
        }).eq('id', editingEmployee.id)
        toast({ description: '员工信息更新成功', className: 'bg-green-500' })
      } else {
        await supabase.from('employees').insert({
          name: formData.name,
          role: formData.role,
          commission_rate: parseFloat(formData.commission_rate),
          is_active: formData.is_active,
        })
        toast({ description: '员工添加成功', className: 'bg-green-500' })
      }
      setDialogOpen(false)
      loadEmployees()
    } catch (error) {
      toast({ description: '保存失败: ' + error.message, variant: 'destructive' })
    }
  }

  const roleLabels = { admin: '管理员', warehouse: '仓库员', sales: '销售员' }
  const roleColors = { admin: 'bg-red-100 text-red-700', warehouse: 'bg-blue-100 text-blue-700', sales: 'bg-green-100 text-green-700' }

  if (loading) {
    return <div className="flex items-center justify-center py-12">加载中...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div />
        <Button onClick={() => handleOpenDialog()} className="bg-blue-600 hover:bg-blue-700">
          <UserPlus className="w-4 h-4 mr-2" />
          新增员工
        </Button>
      </div>

      {employees.length === 0 ? (
        <EmptyState message="暂无员工数据" />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">姓名</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">角色</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-slate-600">提成比例</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-slate-600">在职状态</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-slate-600">操作</th>
                </tr>
              </thead>
              <tbody>
                {employees.map(employee => (
                  <tr key={employee.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4 text-sm font-medium text-slate-900">{employee.name}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${roleColors[employee.role]}`}>
                        {roleLabels[employee.role]}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600 text-right">{(parseFloat(employee.commission_rate) * 100).toFixed(2)}%</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${employee.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                        {employee.is_active ? '在职' : '离职'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDialog(employee)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
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
            <DialogTitle>{editingEmployee ? '编辑员工' : '新增员工'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="name">姓名 *</Label>
              <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">角色 *</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="选择角色" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">管理员</SelectItem>
                  <SelectItem value="warehouse">仓库员</SelectItem>
                  <SelectItem value="sales">销售员</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="commission_rate">提成比例</Label>
              <Input id="commission_rate" type="number" step="0.0001" value={formData.commission_rate} onChange={(e) => setFormData({ ...formData, commission_rate: e.target.value })} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="is_active">在职状态</Label>
              <Switch id="is_active" checked={formData.is_active} onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })} />
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
