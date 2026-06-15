import { useState } from 'react'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  DollarSign,
  Users,
  User,
  FileText,
  PlusCircle,
  BarChart3,
  Settings,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react'
import { canViewDashboard, canEditProducts, canViewPurchases, canViewSales, canViewCustomers, canViewEmployees, canViewLedger } from '../../lib/auth'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet'

const menuItems = [
  {
    group: '进销管理',
    items: [
      { id: 'dashboard', label: '综合仪表盘', icon: LayoutDashboard, roleCheck: canViewDashboard },
      { id: 'products', label: '商品仓库', icon: Package, roleCheck: () => true },
      { id: 'purchases', label: '采购入库', icon: ShoppingCart, roleCheck: canViewPurchases },
      { id: 'sales', label: '销售出库', icon: DollarSign, roleCheck: canViewSales },
      { id: 'employees', label: '员工管理', icon: Users, roleCheck: canViewEmployees },
      { id: 'customers', label: '客户管理', icon: User, roleCheck: canViewCustomers },
    ],
  },
  {
    group: '经营流水',
    items: [
      { id: 'ledger/transactions', label: '流水列表', icon: FileText, roleCheck: canViewLedger },
      { id: 'ledger/new', label: '快速记账', icon: PlusCircle, roleCheck: canViewLedger },
      { id: 'financial-report', label: '财务报表', icon: BarChart3, roleCheck: canViewLedger },
      { id: 'ledger/reports', label: '经营报表', icon: FileText, roleCheck: canViewLedger },
      { id: 'ledger/settings', label: '系统设置', icon: Settings, roleCheck: canViewLedger },
    ],
  },
]

export function Sidebar({ currentPath, role, employee, onNavigate }) {
  const [expandedGroups, setExpandedGroups] = useState(['进销管理', '经营流水'])

  const toggleGroup = (groupName) => {
    setExpandedGroups(prev =>
      prev.includes(groupName)
        ? prev.filter(g => g !== groupName)
        : [...prev, groupName]
    )
  }

  const renderMenuItem = (item) => {
    const isActive = currentPath === `/${item.id}` || currentPath.startsWith(`/${item.id}/`)
    const Icon = item.icon

    if (!item.roleCheck(role)) return null

    return (
      <button
        key={item.id}
        onClick={() => onNavigate(`/${item.id}`)}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
          isActive
            ? 'bg-blue-600 text-white'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
        }`}
      >
        <Icon className="w-4 h-4" />
        <span>{item.label}</span>
        {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
      </button>
    )
  }

  const initials = employee?.name?.charAt(0)?.toUpperCase() || 'U'
  const roleLabels = { admin: '管理员', warehouse: '仓库员', sales: '销售员' }

  return (
    <>
      <div className="hidden md:flex flex-col w-[220px] bg-white border-r border-slate-200 h-screen fixed left-0 top-0 z-40">
        <div className="p-4 border-b border-slate-100">
          <h1 className="text-sm font-semibold text-slate-900">山青浩然<span className="text-xs align-super">®</span></h1>
          <p className="text-xs text-slate-500">羽毛球管理系统</p>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          {menuItems.map(({ group, items }) => {
            const hasVisibleItems = items.some(item => item.roleCheck(role))
            if (!hasVisibleItems) return null

            return (
              <div key={group} className="mb-4">
                <button
                  onClick={() => toggleGroup(group)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider hover:text-slate-600"
                >
                  <span>{group}</span>
                  <ChevronRight className={`w-3 h-3 ml-auto transition-transform ${expandedGroups.includes(group) ? 'rotate-90' : ''}`} />
                </button>
                {expandedGroups.includes(group) && (
                  <div className="mt-1 space-y-1">
                    {items.map(renderMenuItem)}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {employee && (
          <div className="p-4 border-t border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{employee.name}</p>
                <span className="inline-block text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full">
                  {roleLabels[role]}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <Sheet>
        <SheetTrigger className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md">
          <Menu className="w-5 h-5 text-slate-600" />
        </SheetTrigger>
        <SheetContent side="left" className="w-[220px] sm:w-[280px] bg-white">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-sm font-semibold text-slate-900">山青浩然<span className="text-xs align-super">®</span></h1>
              <p className="text-xs text-slate-500">羽毛球管理系统</p>
            </div>
            <SheetTrigger>
              <X className="w-5 h-5 text-slate-500" />
            </SheetTrigger>
          </div>

          <div className="space-y-4">
            {menuItems.map(({ group, items }) => {
              const hasVisibleItems = items.some(item => item.roleCheck(role))
              if (!hasVisibleItems) return null

              return (
                <div key={group}>
                  <button
                    onClick={() => toggleGroup(group)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider hover:text-slate-600"
                  >
                    <span>{group}</span>
                    <ChevronRight className={`w-3 h-3 ml-auto transition-transform ${expandedGroups.includes(group) ? 'rotate-90' : ''}`} />
                  </button>
                  {expandedGroups.includes(group) && (
                    <div className="mt-1 space-y-1">
                      {items.map(renderMenuItem)}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {employee && (
            <div className="mt-6 pt-6 border-t border-slate-100">
              <div className="flex items-center gap-3 px-3">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium">
                  {initials}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">{employee.name}</p>
                  <span className="inline-block text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full">
                    {roleLabels[role]}
                  </span>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}
