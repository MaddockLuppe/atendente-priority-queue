const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Credenciais do Supabase não encontradas no .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUsersTable() {
  console.log('=== VERIFICAÇÃO DA TABELA USERS ===\n');
  
  try {
    // Teste 1: Verificar estrutura da tabela users
    console.log('📋 Teste 1: Verificando tabela users...');
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(10);
    
    console.log('   Resultado users:', {
      success: !usersError,
      count: usersData?.length || 0,
      error: usersError?.message
    });
    
    if (usersData && usersData.length > 0) {
      console.log('   ✅ Usuários encontrados na tabela users:');
      usersData.forEach((user, index) => {
        console.log(`      ${index + 1}. ${JSON.stringify(user, null, 2)}`);
      });
    }
    
    // Teste 2: Buscar admin na tabela users
    console.log('\n📋 Teste 2: Buscando admin na tabela users...');
    const { data: adminInUsers, error: adminUsersError } = await supabase
      .from('users')
      .select('*')
      .eq('username', 'admin');
    
    console.log('   Admin em users:', {
      success: !adminUsersError,
      count: adminInUsers?.length || 0,
      error: adminUsersError?.message
    });
    
    if (adminInUsers && adminInUsers.length > 0) {
      console.log('   ✅ Admin encontrado em users:', adminInUsers[0]);
    }
    
    // Teste 3: Verificar attendants (pode ter dados de usuários)
    console.log('\n📋 Teste 3: Verificando tabela attendants...');
    const { data: attendantsData, error: attendantsError } = await supabase
      .from('attendants')
      .select('*')
      .limit(5);
    
    console.log('   Resultado attendants:', {
      success: !attendantsError,
      count: attendantsData?.length || 0,
      error: attendantsError?.message
    });
    
    if (attendantsData && attendantsData.length > 0) {
      console.log('   ✅ Primeiros attendants:');
      attendantsData.forEach((attendant, index) => {
        console.log(`      ${index + 1}. ${JSON.stringify(attendant, null, 2)}`);
      });
    }
    
    // Teste 4: Verificar se há admin em attendants
    console.log('\n📋 Teste 4: Buscando admin em attendants...');
    const { data: adminInAttendants, error: adminAttendantsError } = await supabase
      .from('attendants')
      .select('*')
      .or('name.eq.admin,username.eq.admin,email.eq.admin');
    
    console.log('   Admin em attendants:', {
      success: !adminAttendantsError,
      count: adminInAttendants?.length || 0,
      error: adminAttendantsError?.message
    });
    
    // Teste 5: Verificar todas as colunas possíveis para username
    console.log('\n📋 Teste 5: Verificando diferentes campos de username...');
    const tables = ['users', 'attendants'];
    const usernameFields = ['username', 'name', 'email', 'login', 'user_name'];
    
    for (const table of tables) {
      console.log(`\n   Tabela: ${table}`);
      for (const field of usernameFields) {
        try {
          const { data, error } = await supabase
            .from(table)
            .select('*')
            .eq(field, 'admin');
          
          if (!error && data && data.length > 0) {
            console.log(`      ✅ Campo '${field}' encontrado com admin:`, data[0]);
          } else if (!error) {
            console.log(`      ⚪ Campo '${field}': sem dados`);
          } else {
            console.log(`      ❌ Campo '${field}': ${error.message}`);
          }
        } catch (err) {
          console.log(`      ❌ Campo '${field}': ${err.message}`);
        }
      }
    }
    
    // Resumo
    console.log('\n🔍 RESUMO:');
    console.log('   📊 Tabela profiles: VAZIA (0 registros)');
    console.log(`   📊 Tabela users: ${usersData?.length || 0} registros`);
    console.log(`   📊 Tabela attendants: ${attendantsData?.length || 0} registros`);
    
    console.log('\n💡 CONCLUSÃO:');
    if (usersData && usersData.length > 0) {
      console.log('   ✅ Dados de usuários encontrados na tabela USERS');
      console.log('   🔧 O sistema pode estar usando a tabela errada');
      console.log('   📝 Verificar se AuthContext deve usar "users" ao invés de "profiles"');
    } else if (attendantsData && attendantsData.length > 0) {
      console.log('   ✅ Dados encontrados na tabela ATTENDANTS');
      console.log('   🔧 Verificar se attendants contém dados de login');
    } else {
      console.log('   ❌ Nenhum dado de usuário encontrado em nenhuma tabela');
      console.log('   📝 Necessário criar usuário admin conforme instruções anteriores');
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar
checkUsersTable();