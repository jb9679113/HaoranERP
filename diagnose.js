// Supabase 连接和表诊断
const SUPABASE_URL = 'https://lqiviylpavrplbtlmhfi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxaXZpeWxwYXZycGxidGxtaGZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzMTE1MzMsImV4cCI6MjA5Njg4NzUzM30.iIySql1z8R47ArQvcyjuCvpxi3Z1pA9JeSR45Wrjy7k';

// 检查所有必要的表
async function checkTables() {
  const tables = ['sales', 'products', 'customers', 'employees', 'transactions', 'expense_categories', 'payers'];
  
  console.log('=== Supabase 表诊断 ===');
  console.log('URL:', SUPABASE_URL);
  
  for (const table of tables) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?limit=1`, {
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ ${table} - 正常 (${data.length} 条记录)`);
      } else {
        const errorText = await response.text();
        console.log(`❌ ${table} - 错误 ${response.status}: ${errorText.substring(0, 100)}`);
      }
    } catch (e) {
      console.log(`❌ ${table} - 异常: ${e.message}`);
    }
  }
}

// 检查 RLS 状态
async function checkRLS() {
  console.log('\n=== RLS 状态检查 ===');
  try {
    // 尝试插入一条测试记录到 sales 表
    const response = await fetch(`${SUPABASE_URL}/rest/v1/sales`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        quantity: 1,
        unit_price: 100,
        sale_date: '2024-01-01'
      })
    });
    
    if (response.ok) {
      console.log('✅ RLS 允许插入');
      // 删除测试记录
      const data = await response.json();
      await fetch(`${SUPABASE_URL}/rest/v1/sales?id=eq.${data.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
      });
    } else {
      const errorText = await response.text();
      console.log(`❌ RLS 阻止插入: ${errorText.substring(0, 150)}`);
    }
  } catch (e) {
    console.log(`❌ RLS 检查异常: ${e.message}`);
  }
}

// 运行诊断
checkTables().then(checkRLS);
