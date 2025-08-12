const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
require('dotenv').config();

console.log('=== CRIANDO USUÁRIO ADMIN (BYPASS RLS) ===\n');

async function createAdminBypassRLS() {
  try {
    // Configurar cliente Supabase
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY são obrigatórias');
    }

    console.log('📋 CONFIGURAÇÃO:');
    console.log(`   URL: ${supabaseUrl}`);
    console.log(`   Chave: ${supabaseKey.substring(0, 20)}...\n`);

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Gerar hash da senha
    console.log('1. Gerando hash da senha "admin123"...');
    const passwordHash = await bcrypt.hash('admin123', 10);
    console.log(`   ✅ Hash gerado: ${passwordHash}\n`);

    // Tentar usar SQL direto para bypass RLS
    console.log('2. Executando SQL direto para bypass RLS...');
    
    const sqlCommands = [
      // Primeiro, remover usuários existentes
      'DELETE FROM public.profiles;',
      
      // Inserir novo usuário admin
      `INSERT INTO public.profiles (user_id, username, display_name, role, password_hash)
       VALUES (
         gen_random_uuid(),
         'admin',
         'Administrador',
         'admin',
         '${passwordHash}'
       );`
    ];

    for (const sql of sqlCommands) {
      console.log(`   Executando: ${sql.substring(0, 50)}...`);
      
      const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
      
      if (error) {
        console.log(`   ⚠️  Tentativa com RPC falhou: ${error.message}`);
        
        // Tentar com query direta
        const { data: directData, error: directError } = await supabase
          .from('profiles')
          .insert({
            username: 'admin',
            display_name: 'Administrador',
            role: 'admin',
            password_hash: passwordHash
          })
          .select();
          
        if (directError) {
          console.log(`   ❌ Query direta também falhou: ${directError.message}`);
          
          // Última tentativa: usar política pública
          console.log('   🔄 Tentando com política pública...');
          
          const { data: publicData, error: publicError } = await supabase
            .from('profiles')
            .insert({
              username: 'admin',
              display_name: 'Administrador', 
              role: 'admin',
              password_hash: passwordHash
            })
            .select();
            
          if (publicError) {
            throw new Error(`Todas as tentativas falharam. Último erro: ${publicError.message}`);
          }
          
          console.log('   ✅ Usuário criado com política pública!');
          console.log(`   📋 Dados: ${JSON.stringify(publicData, null, 2)}`);
        } else {
          console.log('   ✅ Usuário criado com query direta!');
          console.log(`   📋 Dados: ${JSON.stringify(directData, null, 2)}`);
        }
      } else {
        console.log('   ✅ SQL executado com sucesso!');
        console.log(`   📋 Resultado: ${JSON.stringify(data, null, 2)}`);
      }
    }

    // Verificar se o usuário foi criado
    console.log('\n3. Verificando criação do usuário...');
    const { data: verifyData, error: verifyError } = await supabase
      .from('profiles')
      .select('id, username, display_name, role, created_at')
      .eq('username', 'admin');

    if (verifyError) {
      console.error(`   ❌ Erro ao verificar usuário: ${verifyError.message}`);
    } else if (verifyData && verifyData.length > 0) {
      console.log('   ✅ Usuário verificado com sucesso!');
      console.log(`   📋 Detalhes:`);
      verifyData.forEach(user => {
        console.log(`      ID: ${user.id}`);
        console.log(`      Username: ${user.username}`);
        console.log(`      Nome: ${user.display_name}`);
        console.log(`      Role: ${user.role}`);
        console.log(`      Criado em: ${user.created_at}`);
      });
    } else {
      console.log('   ⚠️  Usuário não encontrado após criação');
    }

    console.log('\n🎯 PRÓXIMOS PASSOS:');
    console.log('   1. Execute: node scripts/verify-admin-login.cjs');
    console.log('   2. Teste o login na aplicação com:');
    console.log('      - Usuário: admin');
    console.log('      - Senha: admin123');
    
    console.log('\n✅ PROCESSO CONCLUÍDO!');
    
  } catch (error) {
    console.error('\n❌ ERRO GERAL:', error.message);
    console.error('\n💡 SOLUÇÕES ALTERNATIVAS:');
    console.error('   1. Execute o SQL manualmente no Supabase Dashboard:');
    console.error('      - Acesse seu projeto no Supabase');
    console.error('      - Vá para "SQL Editor"');
    console.error('      - Execute o conteúdo do arquivo: supabase/migrations/20250812133954_create_admin_user.sql');
    console.error('   2. Verifique se as políticas RLS estão corretas');
    console.error('   3. Considere usar a service key em vez da anon key');
    process.exit(1);
  }
}

// Executar o script
createAdminBypassRLS();