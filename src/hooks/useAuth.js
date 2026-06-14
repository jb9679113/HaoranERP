import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export const useAuth = () => {
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(true)
  const [employee, setEmployee] = useState(null)

  const fetchEmployeeRole = useCallback(async (userId) => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('auth_user_id', userId)
        .maybeSingle()
      
      if (error) {
        console.error('Error fetching employee:', error)
        return null
      }
      return data
    } catch (err) {
      console.error('Error fetching employee:', err)
      return null
    }
  }, [])

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)
      setLoading(true)
      
      if (session?.user) {
        const employeeData = await fetchEmployeeRole(session.user.id)
        if (employeeData) {
          setRole(employeeData.role)
          setEmployee(employeeData)
        } else {
          setRole(null)
          setEmployee(null)
        }
      } else {
        setRole(null)
        setEmployee(null)
      }
      setLoading(false)
    })

    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      
      if (session?.user) {
        try {
          const employeeData = await fetchEmployeeRole(session.user.id)
          if (employeeData && employeeData.role) {
            setRole(employeeData.role)
            setEmployee(employeeData)
          } else {
            console.warn('未找到员工记录或角色为空')
          }
        } catch (error) {
          console.error('初始化时获取员工信息失败:', error)
        }
      }
      setLoading(false)
    }

    init()

    return () => {
      if (subscription && typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe()
      }
    }
  }, [fetchEmployeeRole])

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    return { data, error }
  }

  const logout = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  return {
    user,
    role,
    employee,
    loading,
    login,
    logout,
  }
}
