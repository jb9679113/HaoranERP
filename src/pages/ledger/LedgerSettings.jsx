import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Edit2, Trash2, Plus } from 'lucide-react'
import { toast } from '@/components/ui/toast'

export function LedgerSettings() {
  const [categories, setCategories] = useState([])
  const [payers, setPayers] = useState([])
  const [bankAccounts, setBankAccounts] = useState([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [currentTab, setCurrentTab] = useState('categories')
  const [editingItem, setEditingItem] = useState(null)
  const [formData, setFormData] = useState({ name: '', balance: '0' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [catRes, payerRes, bankRes] = await Promise.all([
        supabase.from('expense_categories').select('*'),
        supabase.from('payers').select('*'),
        supabase.from('bank_accounts').select('*'),
      ])
      setCategories(catRes.data || [])
      setPayers(payerRes.data || [])
      setBankAccounts(bankRes.data || [])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = (item = null) => {
    if (item) {
      setEditingItem(item)
      setFormData({ name: item.name, balance: String(item.balance || 0) })
    } else {
      setEditingItem(null)
      setFormData({ name: '', balance: '0' })
    }
    setDialogOpen(true)
  }

  const handleSave = async () => {
    const tableMap = {
      categories: 'expense_categories',
      payers: 'payers',
      bankAccounts: 'bank_accounts',
    }
    const table = tableMap[currentTab]

    try {
      if (editingItem) {
        if (currentTab === 'bankAccounts') {
          await supabase.from(table).update({ name: formData.name, balance: parseFloat(formData.balance) || 0 }).eq('id', editingItem.id)
        } else {
          await supabase.from(table).update({ name: formData.name }).eq('id', editingItem.id)
        }
        toast({ description: '更新成功', className: 'bg-green-500' })
      } else {
        if (currentTab === 'bankAccounts') {
          await supabase.from(table).insert({ name: formData.name, balance: parseFloat(formData.balance) || 0 })
        } else {
          await supabase.from(table).insert({ name: formData.name })
        }
        toast({ description: '添加成功', className: 'bg-green-500' })
      }
      setDialogOpen(false)
      loadData()
    } catch (error) {
      toast({ description: '保存失败: ' + error.message, variant: 'destructive' })
    }
  }

  const handleDelete = async (itemId) => {
    const tableMap = {
      categories: 'expense_categories',
      payers: 'payers',
      bankAccounts: 'bank_accounts',
    }
    const table = tableMap[currentTab]

    try {
      await supabase.from(table).delete().eq('id', itemId)
      toast({ description: '删除成功', className: 'bg-green-500' })
      loadData()
    } catch (error) {
      toast({ description: '删除失败: ' + error.message, variant: 'destructive' })
    }
  }

  const renderList = (items, itemName) => (
    <div className="space-y-3">
      {items.length === 0 ? (
        <div className="text-center py-8 text-slate-400">
          暂无{itemName}，点击上方按钮添加
        </div>
      ) : (
        items.map(item => (
          <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div>
              <span className="text-sm font-medium text-slate-900">{item.name}</span>
              {item.balance !== undefined && (
                <p className="text-xs text-slate-500">余额: ¥{item.balance.toLocaleString()}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleOpenDialog(item)}
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              >
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(item.id)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))
      )}
    </div>
  )

  if (loading) {
    return <div className="flex items-center justify-center py-12">加载中...</div>
  }

  return (
    <div className="space-y-6">
      <Tabs value={currentTab} onValueChange={setCurrentTab}>
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="categories">费用类别</TabsTrigger>
          <TabsTrigger value="payers">付款人</TabsTrigger>
          <TabsTrigger value="bankAccounts">银行账户</TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="mt-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">费用类别管理</h3>
              <Button onClick={() => { setEditingItem(null); setDialogOpen(true); }} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                新增类别
              </Button>
            </div>
            {renderList(categories, '费用类别')}
          </div>
        </TabsContent>

        <TabsContent value="payers" className="mt-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">付款人管理</h3>
              <Button onClick={() => { setEditingItem(null); setDialogOpen(true); }} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                新增付款人
              </Button>
            </div>
            {renderList(payers, '付款人')}
          </div>
        </TabsContent>

        <TabsContent value="bankAccounts" className="mt-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">银行账户管理</h3>
              <Button onClick={() => { setEditingItem(null); setDialogOpen(true); }} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                新增账户
              </Button>
            </div>
            {renderList(bankAccounts, '银行账户')}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? '编辑' : '新增'}{currentTab === 'bankAccounts' ? '银行账户' : currentTab === 'payers' ? '付款人' : '费用类别'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="name">名称 *</Label>
              <Input id="name" value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} required />
            </div>
            {currentTab === 'bankAccounts' && (
              <div className="space-y-2">
                <Label htmlFor="balance">初始余额</Label>
                <Input 
                  id="balance" 
                  type="number" 
                  step="0.01"
                  value={formData.balance} 
                  onChange={(e) => setFormData(prev => ({ ...prev, balance: e.target.value }))} 
                  placeholder="0.00"
                />
              </div>
            )}
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
