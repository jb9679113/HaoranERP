import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// 读取环境变量
const envContent = readFileSync(join(__dirname, '.env'), 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.+)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim();
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseAnonKey = envVars.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('ERROR: 未找到环境变量 VITE_SUPABASE_URL 或 VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 读取迁移文件
const migrationPath = join(__dirname, 'supabase', 'migrations', '05_gift_issues.sql');
const sqlContent = readFileSync(migrationPath, 'utf-8');

// 分割 SQL 语句（按分号分割，但需要处理字符串中的分号）
function splitSqlStatements(sql) {
  const statements = [];
  let currentStatement = '';
  let inString = false;
  let stringChar = '';
  let inComment = false;
  
  for (let i = 0; i < sql.length; i++) {
    const char = sql[i];
    const nextChar = sql[i + 1];
    
    // 处理注释
    if (!inString && char === '-' && nextChar === '-') {
      inComment = true;
      continue;
    }
    if (inComment) {
      if (char === '\n') {
        inComment = false;
      }
      continue;
    }
    
    // 处理字符串
    if (!inComment) {
      if ((char === "'" || char === '"') && (i === 0 || sql[i - 1] !== '\\')) {
        if (!inString) {
          inString = true;
          stringChar = char;
        } else if (stringChar === char) {
          inString = false;
        }
      }
    }
    
    // 处理分号
    if (!inString && !inComment && char === ';') {
      const trimmed = currentStatement.trim();
      if (trimmed) {
        statements.push(trimmed);
      }
      currentStatement = '';
      continue;
    }
    
    currentStatement += char;
  }
  
  // 添加最后一条语句
  const trimmed = currentStatement.trim();
  if (trimmed) {
    statements.push(trimmed);
  }
  
  return statements;
}

const statements = splitSqlStatements(sqlContent);

console.log(`准备执行 ${statements.length} 条 SQL 语句...\n`);

async function executeMigration() {
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    const shortStatement = statement.length > 50 ? statement.substring(0, 50) + '...' : statement;
    
    try {
      console.log(`[${i + 1}/${statements.length}] 执行: ${shortStatement}`);
      
      // 使用 rpc 或直接查询
      const result = await supabase.rpc('pg_catalog.execute', { query: statement });
      
      if (result.error) {
        // 尝试使用另一种方式执行
        console.log(`  重试...`);
        // Supabase 的 REST API 不支持直接执行任意 SQL
        // 需要使用自定义 RPC 函数或者通过 Dashboard 执行
        console.log(`  注意: Supabase REST API 不支持直接执行 DDL 语句`);
        console.log(`  错误: ${result.error.message}`);
        console.log(`  将跳过此语句，请手动在 Supabase Dashboard 中执行`);
        continue;
      }
      
      console.log(`  ✓ 成功`);
    } catch (error) {
      console.log(`  ✗ 失败: ${error.message}`);
      console.log(`  将跳过此语句，请手动在 Supabase Dashboard 中执行`);
    }
    
    // 延迟 100ms，避免请求过快
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log(`\n迁移脚本执行完成！`);
  console.log(`\n请在 Supabase Dashboard 中手动执行以下 SQL 语句:`);
  console.log(`=============================================`);
  console.log(sqlContent);
  console.log(`=============================================`);
}

executeMigration().catch(error => {
  console.error('迁移执行失败:', error);
  process.exit(1);
});