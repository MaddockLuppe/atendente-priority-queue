const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Credenciais do Supabase não encontradas no .env');
  process.exit(1);
}

// Cliente normal (com RLS)
const supabase = createClient(supabaseUrl, supabaseKey);

async function testRLSBypass() {
  console.log('=== TESTE DE RLS E POLÍTICAS DE SEGURANÇA ===\n');
  
  try {
    console.log('1. Testando acesso com chave anônima (RLS ativo)...');
    
    // Teste 1: Buscar todos os usuários
    console.log('\n📋 Teste 1: SELECT * FROM profiles');
    const { data: allUsers, error: allError } = await supabase
      .from('profiles')
      .select('*');
    
    console.log('   Resultado:', {
      success: !allError,
      count: allUsers?.length || 0,
      error: allError?.message,
      errorCode: allError?.code
    });
    
    if (allUsers && allUsers.length > 0) {
      console.log('   ✅ Usuários encontrados:');
      allUsers.forEach((user, index) => {
        console.log(`      ${index + 1}. ${user.username} (${user.role})`);
      });
    }
    
    // Teste 2: Buscar usuário específico
    console.log('\n📋 Teste 2: SELECT * FROM profiles WHERE username = \'admin\'');
    const { data: adminUser, error: adminError } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', 'admin');
    
    console.log('   Resultado:', {
      success: !adminError,
      count: adminUser?.length || 0,
      error: adminError?.message,
      errorCode: adminError?.code
    });
    
    // Teste 3: Usar .single() como no código original
    console.log('\n📋 Teste 3: SELECT * FROM profiles WHERE username = \'admin\' (single)');
    const { data: singleAdmin, error: singleError } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', 'admin')
      .single();
    
    console.log('   Resultado:', {
      success: !singleError,
      hasData: !!singleAdmin,
      error: singleError?.message,
      errorCode: singleError?.code
    });
    
    // Teste 4: Verificar políticas RLS
    console.log('\n📋 Teste 4: Verificando políticas RLS...');
    const { data: rlsInfo, error: rlsError } = await supabase
      .rpc('check_rls_policies');
    
    if (rlsError) {
      console.log('   ⚠️  Não foi possível verificar RLS:', rlsError.message);
    } else {
      console.log('   RLS Info:', rlsInfo);
    }
    
    // Teste 5: Tentar diferentes usernames
    console.log('\n📋 Teste 5: Testando diferentes usernames...');
    const testUsernames = ['admin', 'Admin', 'ADMIN', 'administrator', 'root'];
    
    for (const username of testUsernames) {
      const { data, error } = await supabase
        .from('profiles')
        .select('username, role')
        .eq('username', username);
      
      console.log(`   ${username}: ${data?.length || 0} usuários encontrados`);
    }
    
    // Teste 6: Verificar se a tabela existe e tem dados via count
    console.log('\n📋 Teste 6: Contando registros na tabela...');
    const { count, error: countError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    
    console.log('   Count resultado:', {
      count: count,
      error: countError?.message,
      errorCode: countError?.code
    });
    
    // Resumo
    console.log('\n🔍 RESUMO DO DIAGNÓSTICO:');
    
    if (allError && allError.code === 'PGRST116') {
      console.log('   ❌ Tabela profiles está vazia ou RLS está bloqueando acesso');
      console.log('   💡 Possíveis causas:');
      console.log('      1. Tabela realmente vazia');
      console.log('      2. RLS (Row Level Security) bloqueando acesso');
      console.log('      3. Políticas de segurança restritivas');
    } else if (allUsers && allUsers.length > 0) {
      console.log('   ✅ Usuários encontrados na tabela');
      console.log('   🔍 Verificar se o username \'admin\' existe exatamente como esperado');
    } else {
      console.log('   ⚠️  Situação indefinida - verificar logs acima');
    }
    
    console.log('\n📝 PRÓXIMOS PASSOS:');
    console.log('   1. Se a tabela estiver vazia: Execute create-admin-final.sql');
    console.log('   2. Se RLS estiver bloqueando: Verificar políticas no Supabase Dashboard');
    console.log('   3. Se usuários existem mas admin não: Verificar username exato');
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar
testRLSBypass();