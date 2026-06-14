-- =============================================
-- 修改管理员密码（使用正确的 Supabase 函数）
-- =============================================

-- 1. 先获取用户 ID
SELECT id, email FROM auth.users WHERE email = '676965736@qq.com';

-- 2. 使用正确的函数修改密码
-- 注意：需要替换下面的 USER_ID 为实际的用户 ID
-- 或者使用这个直接更新的方法：

UPDATE auth.users 
SET encrypted_password = crypt('qq123456', gen_salt('bf')) 
WHERE email = '676965736@qq.com';

SELECT '密码修改成功！' AS result;