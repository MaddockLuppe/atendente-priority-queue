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

async function verifyExistingUsers() {
  console.log('=== VERIFICAÇÃO DE USUÁRIOS EXISTENTES ===\n');
  
  console.log('🔗 Conectando ao projeto:', supabaseUrl);
  console.log('🆔 Project ID extraído:', supabaseUrl.match(/https:\/\/(.*?)\.supabase\.co/)?.[1]);
  
  try {
    // Teste 1: Verificar todas as tabelas disponíveis
    console.log('\n📋 Teste 1: Listando todas as tabelas disponíveis...');
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_schema_tables');
    
    if (tablesError) {
      console.log('   ⚠️  Não foi possível listar tabelas:', tablesError.message);
    } else {
      console.log('   ✅ Tabelas encontradas:', tables);
    }
    
    // Teste 2: Tentar diferentes esquemas
    console.log('\n📋 Teste 2: Testando diferentes esquemas...');
    const schemas = ['public', 'auth', 'storage'];
    
    for (const schema of schemas) {
      try {
        const { data, error } = await supabase
          .schema(schema)
          .from('profiles')
          .select('*')
          .limit(5);
        
        console.log(`   Schema '${schema}':`, {
          success: !error,
          count: data?.length || 0,
          error: error?.message
        });
        
        if (data && data.length > 0) {
          console.log('   📄 Primeiros registros:');
          data.forEach((record, index) => {
            console.log(`      ${index + 1}. ${JSON.stringify(record, null, 2)}`);
          });
        }
      } catch (err) {
        console.log(`   Schema '${schema}': Erro -`, err.message);
      }
    }
    
    // Teste 3: Verificar metadados da tabela
    console.log('\n📋 Teste 3: Verificando metadados da tabela profiles...');
    const { data: metadata, error: metaError } = await supabase
      .rpc('get_table_metadata', { table_name: 'profiles' });
    
    if (metaError) {
      console.log('   ⚠️  Não foi possível obter metadados:', metaError.message);
    } else {
      console.log('   ✅ Metadados:', metadata);
    }
    
    // Teste 4: Tentar com diferentes filtros
    console.log('\n📋 Teste 4: Testando com diferentes filtros...');
    const filters = [
      { field: 'role', value: 'admin' },
      { field: 'username', value: 'admin' },
      { field: 'display_name', value: 'Administrador' }
    ];
    
    for (const filter of filters) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq(filter.field, filter.value);
      
      console.log(`   Filtro ${filter.field}='${filter.value}':`, {
        success: !error,
        count: data?.length || 0,
        error: error?.message
      });
    }
    
    // Teste 5: Verificar se há dados em outras tabelas relacionadas
    console.log('\n📋 Teste 5: Verificando outras tabelas...');
    const otherTables = ['attendants', 'tickets', 'users'];
    
    for (const table of otherTables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        console.log(`   Tabela '${table}':`, {
          exists: !error,
          count: count,
          error: error?.message
        });
      } catch (err) {
        console.log(`   Tabela '${table}': Não existe ou erro -`, err.message);
      }
    }
    
    // Teste 6: Verificar políticas RLS
    console.log('\n📋 Teste 6: Verificando políticas RLS...');
    try {
      const { data: policies, error: policiesError } = await supabase
        .rpc('get_policies', { table_name: 'profiles' });
      
      if (policiesError) {
        console.log('   ⚠️  Não foi possível verificar políticas:', policiesError.message);
      } else {
        console.log('   ✅ Políticas RLS:', policies);
      }
    } catch (err) {
      console.log('   ⚠️  Erro ao verificar políticas:', err.message);
    }
    
    // Resumo final
    console.log('\n🔍 RESUMO DA VERIFICAÇÃO:');
    console.log('   📊 Project ID configurado:', supabaseUrl.match(/https:\/\/(.*?)\.supabase\.co/)?.[1]);
    console.log('   📊 Project ID informado pelo usuário: rahidenugbgnfrddtpxm');
    console.log('   📊 IDs coincidem:', (supabaseUrl.includes('rahidenugbgnfrddtpxm') ? '✅ SIM' : '❌ NÃO'));
    
    console.log('\n💡 POSSÍVEIS CAUSAS:');
    console.log('   1. Projeto diferente do configurado no .env');
    console.log('   2. RLS bloqueando acesso com chave anônima');
    console.log('   3. Dados em schema diferente do public');
    console.log('   4. Tabela profiles realmente vazia');
    
  } catch (error) {
    console.error('❌ Erro geral na verificação:', error);
  }
}

// Executar
verifyExistingUsers();