import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, CheckCircle } from 'lucide-react'

export function Login() {
  const [mode, setMode] = useState('login') // 'login' or 'register'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [diagInfo, setDiagInfo] = useState('')
  const { login, role } = useAuth()
  const navigate = useNavigate()

  if (role) {
    const defaultPath = role === 'admin' ? '/dashboard' : role === 'warehouse' ? '/products' : '/sales'
    navigate(defaultPath)
    return null
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setDiagInfo('')
    setLoading(true)

    try {
      const { data, error: loginError } = await login(email, password)

      if (loginError) {
        setError(loginError.message || '登录失败，请检查邮箱和密码')
      } else if (data?.user) {
        setSuccess('登录成功，正在跳转...')
        
        const userId = data.user.id
        
        // 测试1：查询所有员工记录
        const { data: allEmployees, error: allError } = await supabase
          .from('employees')
          .select('*')
          .limit(10)
        
        // 测试2：按 auth_user_id 查询
        const { data: employeeData, error: empError } = await supabase
          .from('employees')
          .select('*')
          .eq('auth_user_id', userId)
          .maybeSingle()
        
        let diag = 'UID=' + userId
        diag += ' | 所有记录=' + JSON.stringify(allEmployees)
        diag += ' | 匹配记录=' + JSON.stringify(employeeData)
        if (allError) diag += ' | 所有记录错误=' + allError.message
        if (empError) diag += ' | 匹配错误=' + empError.message
        setDiagInfo(diag)
        
        if (employeeData?.role) {
          const defaultPath = employeeData.role === 'admin' ? '/dashboard' : employeeData.role === 'warehouse' ? '/products' : '/sales'
          navigate(defaultPath)
        } else {
          // 自动创建员工记录
          setSuccess('正在自动创建员工记录...')
          const { error: insertError } = await supabase
            .from('employees')
            .insert({
              auth_user_id: userId,
              email: email,
              name: name || email.split('@')[0],
              role: 'admin',
            })
          
          if (insertError) {
            setError('登录成功但创建员工记录失败: ' + insertError.message)
            setDiagInfo('插入错误: ' + JSON.stringify(insertError))
          } else {
            setSuccess('员工记录创建成功！请重新登录')
            setTimeout(() => {
              window.location.reload()
            }, 1500)
          }
        }
      }
    } catch (err) {
      setError('登录过程中发生错误，请稍后重试')
      setDiagInfo('异常: ' + err.message)
    }

    setLoading(false)
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      // 1. 创建 Supabase 认证用户
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (authError) {
        setError(authError.message)
        setLoading(false)
        return
      }

      if (!authData.user) {
        setError('注册失败，请稍后重试')
        setLoading(false)
        return
      }

      // 2. 创建员工记录（默认角色为 sales）
      const { error: employeeError } = await supabase
        .from('employees')
        .insert({
          auth_user_id: authData.user.id,
          email: email,
          name: name,
          role: 'sales', // 默认为销售员，管理员需要手动修改
        })

      if (employeeError) {
        console.error('创建员工记录失败:', employeeError)
        setError('注册成功但创建员工记录失败，请联系管理员')
      } else {
        setSuccess('注册成功！请登录您的账户')
        setMode('login')
        setPassword('')
      }
    } catch (err) {
      console.error('注册错误:', err)
      setError('注册失败，请稍后重试')
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100">
      <div className="w-full max-w-md mx-4">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-white">山</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">山青浩然羽毛球管理系统</h1>
            <p className="text-slate-500 mt-2">
              {mode === 'login' ? '请登录您的账户' : '注册新账户'}
            </p>
          </div>

          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">邮箱</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">密码</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  required
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-3 rounded-lg">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              {success && (
                <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-3 rounded-lg">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm">{success}</span>
                </div>
              )}

              {diagInfo && (
                <div className="text-xs text-slate-500 bg-slate-50 px-3 py-2 rounded break-all">
                  诊断: {diagInfo}
                </div>
              )}

              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
                {loading ? '登录中...' : '登 录'}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  没有账户？点击注册
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">姓名</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="请输入您的姓名"
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-email">邮箱</Label>
                <Input
                  id="register-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-password">密码</Label>
                <Input
                  id="register-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码（至少6位）"
                  required
                  minLength={6}
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-3 rounded-lg">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
                {loading ? '注册中...' : '注 册'}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  已有账户？点击登录
                </button>
              </div>

              <div className="text-center text-xs text-slate-500">
                <p>注册后默认为销售员角色</p>
                <p>如需管理员权限请联系系统管理员</p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
