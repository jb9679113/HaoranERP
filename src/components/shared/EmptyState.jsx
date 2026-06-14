import { FileQuestion } from 'lucide-react'

export function EmptyState({ message = '暂无数据', icon: Icon = FileQuestion }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-slate-400">
      <Icon className="w-12 h-12 mb-4" />
      <p className="text-lg font-medium">{message}</p>
    </div>
  )
}
