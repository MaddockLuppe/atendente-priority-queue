const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

console.log('=== EXECUTANDO CRIAÇÃO DO USUÁRIO ADMIN ===\n');

async function executeAdminCreation() {
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

    // 1. Remover todos os usuários existentes
    console.log('1. Removendo usuários existentes...');
    const { error: deleteError } = await supabase
      .from('profiles')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (deleteError) {
      console.log(`   ⚠️  Aviso ao remover usuários: ${deleteError.message}`);
    } else {
      console.log('   ✅ Usuários existentes removidos');
    }

    // 2. Criar novo usuário admin
    console.log('\n2. Criando usuário admin...');
    const { data: insertData, error: insertError } = await supabase
      .from('profiles')
      .insert({
        username: 'admin',
        display_name: 'Administrador',
        role: 'admin',
        password_hash: '$2b$10$5EnGfQWsZ2O9xX.TdNYiu.vvkrZCOEOnIFlzhQPYp03ojsqeUl77O'
      })
      .select();

    if (insertError) {
      console.error(`   ❌ Erro ao criar usuário: ${insertError.message}`);
      throw insertError;
    }

    console.log('   ✅ Usuário admin criado com sucesso!');
    console.log(`   📋 Dados: ${JSON.stringify(insertData, null, 2)}`);

    // 3. Verificar se o usuário foi criado
    console.log('\n3. Verificando criação do usuário...');
    const { data: verifyData, error: verifyError } = await supabase
      .from('profiles')
      .select('id, username, display_name, role, created_at')
      .eq('username', 'admin')
      .single();

    if (verifyError) {
      console.error(`   ❌ Erro ao verificar usuário: ${verifyError.message}`);
      throw verifyError;
    }

    console.log('   ✅ Usuário verificado com sucesso!');
    console.log(`   📋 Detalhes:`);
    console.log(`      ID: ${verifyData.id}`);
    console.log(`      Username: ${verifyData.username}`);
    console.log(`      Nome: ${verifyData.display_name}`);
    console.log(`      Role: ${verifyData.role}`);
    console.log(`      Criado em: ${verifyData.created_at}`);

    // 4. Contar total de usuários
    console.log('\n4. Contando total de usuários...');
    const { count, error: countError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error(`   ❌ Erro ao contar usuários: ${countError.message}`);
    } else {
      console.log(`   📊 Total de usuários: ${count}`);
    }

    console.log('\n🎯 PRÓXIMOS PASSOS:');
    console.log('   1. Execute: node scripts/verify-admin-login.cjs');
    console.log('   2. Teste o login na aplicação com:');
    console.log('      - Usuário: admin');
    console.log('      - Senha: admin123');
    
    console.log('\n✅ USUÁRIO ADMIN CRIADO COM SUCESSO!');
    
  } catch (error) {
    console.error('\n❌ ERRO GERAL:', error.message);
    console.error('   Stack:', error.stack);
    process.exit(1);
  }
}

// Executar o script
executeAdminCreation();