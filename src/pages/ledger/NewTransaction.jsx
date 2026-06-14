import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { TransactionForm } from '../../components/ledger/TransactionForm'
import { toast } from '@/components/ui/toast'

export function NewTransaction() {
  const [categories, setCategories] = useState([])
  const [payers, setPayers] = useState([])
  const [bankAccounts, setBankAccounts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
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
    loadData()
  }, [])

  const handleSubmit = async (formData) => {
    try {
      await supabase.from('transactions').insert({
        type: formData.type,
        amount: parseFloat(formData.amount),
        quantity: parseFloat(formData.quantity) || 1,
        unit_price: formData.unit_price ? parseFloat(formData.unit_price) : null,
        category_id: formData.category_id || null,
        payer_id: formData.payer_id || null,
        bank_account_id: formData.bank_account_id || null,
        is_reimbursable: formData.is_reimbursable,
        note: formData.note,
        transaction_date: formData.transaction_date,
      })
      toast({ description: '记账成功', className: 'bg-green-500' })
    } catch (error) {
      toast({ description: '保存失败: ' + error.message, variant: 'destructive' })
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-12">加载中...</div>
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
        <h2 className="text-lg font-semibold text-slate-900 mb-6">快速记账</h2>
        <TransactionForm
          onSubmit={handleSubmit}
          categories={categories}
          payers={payers}
          bankAccounts={bankAccounts}
        />
      </div>
    </div>
  )
}
