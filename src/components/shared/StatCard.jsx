import { TrendingUp, DollarSign, ShoppingCart, TrendingDown, CreditCard, FileText, Wallet } from 'lucide-react'
import { formatCurrency } from '../../lib/format'

const iconMap = {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  TrendingDown,
  CreditCard,
  FileText,
  Wallet,
}

const colorMap = {
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  orange: 'bg-orange-500',
  cyan: 'bg-cyan-500',
  red: 'bg-red-500',
}

export function StatCard({ title, value, icon: IconName = DollarSign, color = 'blue' }) {
  const Icon = iconMap[IconName] || DollarSign
  const bgColor = colorMap[color] || 'bg-blue-500'

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-slate-900">{formatCurrency(value)}</p>
        </div>
        <div className={`w-10 h-10 rounded-full ${bgColor} flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  )
}
