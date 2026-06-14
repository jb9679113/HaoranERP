import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'

export function TransactionForm({ onSubmit, initialData = {}, categories = [], payers = [], bankAccounts = [] }) {
  const [formData, setFormData] = useState({
    type: '入账',
    amount: '',
    quantity: '1',
    unit_price: '',
    category_id: '',
    payer_id: '',
    bank_account_id: '',
    is_reimbursable: false,
    note: '',
    transaction_date: new Date().toISOString().split('T')[0],
    ...initialData,
  })

  useEffect(() => {
    if (formData.quantity && formData.unit_price) {
      const calculatedAmount = (parseFloat(formData.quantity) * parseFloat(formData.unit_price)).toFixed(2)
      setFormData(prev => ({ ...prev, amount: calculatedAmount }))
    }
  }, [formData.quantity, formData.unit_price])

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="type">资金类型</Label>
          <Select value={formData.type} onValueChange={(value) => handleChange('type', value)}>
            <SelectTrigger>
              <SelectValue placeholder="选择类型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="入账">入账</SelectItem>
              <SelectItem value="付款">付款</SelectItem>
              <SelectItem value="收入">收入</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount">金额</Label>
          <Input
            id="amount"
            type="number"
            value={formData.amount}
            onChange={(e) => handleChange('amount', e.target.value)}
            placeholder="0.00"
            step="0.01"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="quantity">数量</Label>
          <Input
            id="quantity"
            type="number"
            value={formData.quantity}
            onChange={(e) => handleChange('quantity', e.target.value)}
            placeholder="1"
            step="1"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="unit_price">单价</Label>
          <Input
            id="unit_price"
            type="number"
            value={formData.unit_price}
            onChange={(e) => handleChange('unit_price', e.target.value)}
            placeholder="0.00"
            step="0.01"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category_id">费用类别</Label>
          <Select value={formData.category_id || ''} onValueChange={(value) => handleChange('category_id', value)}>
            <SelectTrigger>
              <SelectValue placeholder="选择类别" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(cat => (
                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="payer_id">付款人</Label>
          <Select value={formData.payer_id || ''} onValueChange={(value) => handleChange('payer_id', value)}>
            <SelectTrigger>
              <SelectValue placeholder="选择付款人" />
            </SelectTrigger>
            <SelectContent>
              {payers.map(payer => (
                <SelectItem key={payer.id} value={payer.id}>{payer.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bank_account_id">银行账户</Label>
          <Select value={formData.bank_account_id || ''} onValueChange={(value) => handleChange('bank_account_id', value)}>
            <SelectTrigger>
              <SelectValue placeholder="选择账户" />
            </SelectTrigger>
            <SelectContent>
              {bankAccounts.map(account => (
                <SelectItem key={account.id} value={account.id}>{account.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Checkbox
          id="is_reimbursable"
          checked={formData.is_reimbursable}
          onCheckedChange={(checked) => handleChange('is_reimbursable', checked)}
        />
        <Label htmlFor="is_reimbursable">是否报销</Label>
      </div>

      <div className="space-y-2">
        <Label htmlFor="note">备注</Label>
        <Input
          id="note"
          value={formData.note}
          onChange={(e) => handleChange('note', e.target.value)}
          placeholder="添加备注..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="transaction_date">日期</Label>
        <Input
          id="transaction_date"
          type="date"
          value={formData.transaction_date}
          onChange={(e) => handleChange('transaction_date', e.target.value)}
        />
      </div>

      <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
        {initialData.id ? '更新记录' : '保存记录'}
      </Button>
    </form>
  )
}
