-- =============================================
-- 修改管理员密码
-- 注意：Supabase 使用 auth.users 表存储用户信息
-- 密码需要通过 Supabase Dashboard 或 API 修改
-- =============================================

-- 查看用户信息
SELECT id, email, created_at, last_sign_in_at 
FROM auth.users 
WHERE email = '676965736@qq.com';

-- 注意：直接修改密码哈希不推荐
-- 请通过 Supabase Dashboard 的 Authentication 页面修改密码
-- 或使用 Supabase Admin API

SELECT '请通过 Supabase Dashboard 修改密码' AS result;