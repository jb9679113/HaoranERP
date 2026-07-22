import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { AppLayout } from './components/layout/AppLayout'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { Products } from './pages/Products'
import { Purchases } from './pages/Purchases'
import { Sales } from './pages/Sales'
import { Employees } from './pages/Employees'
import { Customers } from './pages/Customers'
import { Transactions } from './pages/ledger/Transactions'
import { NewTransaction } from './pages/ledger/NewTransaction'
import { Reports } from './pages/ledger/Reports'
import { LedgerSettings } from './pages/ledger/LedgerSettings'
import { FinancialReport } from './pages/FinancialReport'
import { GiftIssues } from './pages/GiftIssues'
import { Button } from '@/components/ui/button'
import {
  ToastProvider,
  ToastViewport,
} from '@/components/ui/toast'
import { canViewDashboard, canViewPurchases, canViewSales, canViewCustomers, canViewEmployees, canViewLedger, canViewGiftIssues } from './lib/auth'

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, role, loading } = useAuth()

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">加载中...</div>
  }

  if (!user) {
    return <Navigate to="/login" />
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/403" />
  }

  return children
}

const DashboardRoute = () => {
  const { role, loading } = useAuth()
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">加载中...</div>
  }
  if (!role || role !== 'admin') {
    return <Navigate to="/403" />
  }
  return <Dashboard />
}

const PurchasesRoute = () => {
  const { role, loading } = useAuth()
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">加载中...</div>
  }
  if (!canViewPurchases(role)) {
    return <Navigate to="/403" />
  }
  return <Purchases />
}

const SalesRoute = () => {
  const { role, employee, loading } = useAuth()
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">加载中...</div>
  }
  if (!canViewSales(role)) {
    return <Navigate to="/403" />
  }
  return <Sales role={role} employee={employee} />
}

const CustomersRoute = () => {
  const { role, loading } = useAuth()
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">加载中...</div>
  }
  if (!canViewCustomers(role)) {
    return <Navigate to="/403" />
  }
  return <Customers />
}

const EmployeesRoute = () => {
  const { role, loading } = useAuth()
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">加载中...</div>
  }
  if (!canViewEmployees(role)) {
    return <Navigate to="/403" />
  }
  return <Employees />
}

const TransactionsRoute = () => {
  const { role, loading } = useAuth()
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">加载中...</div>
  }
  if (!canViewLedger(role)) {
    return <Navigate to="/403" />
  }
  return <Transactions />
}

const NewTransactionRoute = () => {
  const { role, loading } = useAuth()
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">加载中...</div>
  }
  if (!canViewLedger(role)) {
    return <Navigate to="/403" />
  }
  return <NewTransaction />
}

const ReportsRoute = () => {
  const { role, loading } = useAuth()
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">加载中...</div>
  }
  if (!canViewLedger(role)) {
    return <Navigate to="/403" />
  }
  return <Reports />
}

const LedgerSettingsRoute = () => {
  const { role, loading } = useAuth()
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">加载中...</div>
  }
  if (!canViewLedger(role)) {
    return <Navigate to="/403" />
  }
  return <LedgerSettings />
}

const FinancialReportRoute = () => {
  const { role, loading } = useAuth()
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">加载中...</div>
  }
  if (!canViewLedger(role)) {
    return <Navigate to="/403" />
  }
  return <FinancialReport />
}

const GiftIssuesRoute = () => {
  const { role, employee, loading } = useAuth()
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">加载中...</div>
  }
  if (!canViewGiftIssues(role)) {
    return <Navigate to="/403" />
  }
  return <GiftIssues role={role} employee={employee} />
}

const ForbiddenPage = () => {
  const navigate = useNavigate()
  const { user, role } = useAuth()
  
  const getDefaultPath = () => {
    if (role === 'admin') return '/dashboard'
    if (role === 'warehouse') return '/products'
    if (role === 'sales') return '/sales'
    return '/login'
  }

  return (
    <div className="min-h-screen bg-[#F5F6FA] flex items-center justify-center">
      <div className="bg-white rounded-xl p-8 text-center max-w-md mx-4">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl font-bold text-red-600">403</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">您没有访问该页面的权限</h1>
        <p className="text-slate-500 mb-6">请联系管理员获取相应权限</p>
        <div className="text-xs text-slate-400 mb-4 break-all">
          诊断: 登录状态={user ? '已登录' : '未登录'} | 角色={role || '未设置'} | UID={user?.id || '无'}
        </div>
        <Button onClick={() => navigate(getDefaultPath())} className="bg-blue-600 hover:bg-blue-700">
          返回首页
        </Button>
      </div>
    </div>
  )
}

const PageContent = ({ children }) => {
  const { user, role, employee, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const pageTitles = {
    '/dashboard': { title: '综合仪表盘', subtitle: '进销概览与经营数据' },
    '/products': { title: '商品仓库', subtitle: '管理商品库存信息' },
    '/purchases': { title: '采购入库', subtitle: '记录采购入库信息' },
    '/sales': { title: '销售出库', subtitle: '记录销售出库信息' },
    '/gift-issues': { title: '赠品出库', subtitle: '管理商品赠送出库，库存自动扣减' },
    '/employees': { title: '员工管理', subtitle: '管理员工信息' },
    '/customers': { title: '客户管理', subtitle: '管理客户信息' },
    '/ledger/transactions': { title: '流水列表', subtitle: '查看所有经营流水' },
    '/ledger/new': { title: '快速记账', subtitle: '新增经营流水记录' },
    '/financial-report': { title: '财务报表', subtitle: '统一查看收支、账户余额和整体利润' },
    '/ledger/reports': { title: '经营报表', subtitle: '查看经营数据分析' },
    '/ledger/settings': { title: '系统设置', subtitle: '管理费用类别、付款人、银行账户' },
  }

  const pageInfo = pageTitles[location.pathname] || { title: '未知页面', subtitle: '' }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const handleNavigate = (path) => {
    navigate(path)
  }

  return (
    <AppLayout
      currentPath={location.pathname}
      role={role}
      employee={employee}
      onNavigate={handleNavigate}
      onLogout={handleLogout}
      title={pageInfo.title}
      subtitle={pageInfo.subtitle}
    >
      {children}
    </AppLayout>
  )
}

function App() {
  const { loading, role } = useAuth()

  useEffect(() => {
    if (!loading && role) {
      const defaultPath = role === 'admin' ? '/dashboard' : role === 'warehouse' ? '/products' : '/sales'
      const currentPath = window.location.pathname
      if (currentPath === '/' || currentPath === '/login') {
        if (role) {
          window.location.href = defaultPath
        }
      }
    }
  }, [loading, role])

  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/403" element={<ForbiddenPage />} />
          
          <Route path="/dashboard" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <PageContent>
                <DashboardRoute />
              </PageContent>
            </ProtectedRoute>
          } />
          
          <Route path="/products" element={
            <ProtectedRoute>
              <PageContent>
                <Products role={role} />
              </PageContent>
            </ProtectedRoute>
          } />
          
          <Route path="/purchases" element={
            <ProtectedRoute allowedRoles={['admin', 'warehouse']}>
              <PageContent>
                <PurchasesRoute />
              </PageContent>
            </ProtectedRoute>
          } />
          
          <Route path="/sales" element={
            <ProtectedRoute allowedRoles={['admin', 'sales']}>
              <PageContent>
                <SalesRoute />
              </PageContent>
            </ProtectedRoute>
          } />
          
          <Route path="/gift-issues" element={
            <ProtectedRoute allowedRoles={['admin', 'warehouse', 'sales']}>
              <PageContent>
                <GiftIssuesRoute />
              </PageContent>
            </ProtectedRoute>
          } />
          
          <Route path="/employees" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <PageContent>
                <EmployeesRoute />
              </PageContent>
            </ProtectedRoute>
          } />
          
          <Route path="/customers" element={
            <ProtectedRoute allowedRoles={['admin', 'sales']}>
              <PageContent>
                <CustomersRoute />
              </PageContent>
            </ProtectedRoute>
          } />
          
          <Route path="/ledger/transactions" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <PageContent>
                <TransactionsRoute />
              </PageContent>
            </ProtectedRoute>
          } />
          
          <Route path="/ledger/new" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <PageContent>
                <NewTransactionRoute />
              </PageContent>
            </ProtectedRoute>
          } />
          
          <Route path="/financial-report" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <PageContent>
                <FinancialReportRoute />
              </PageContent>
            </ProtectedRoute>
          } />
          
          <Route path="/ledger/reports" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <PageContent>
                <ReportsRoute />
              </PageContent>
            </ProtectedRoute>
          } />
          
          <Route path="/ledger/settings" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <PageContent>
                <LedgerSettingsRoute />
              </PageContent>
            </ProtectedRoute>
          } />
          
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </BrowserRouter>
      <ToastViewport />
    </ToastProvider>
  )
}

export default App
