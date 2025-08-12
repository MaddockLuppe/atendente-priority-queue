const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
require('dotenv').config();

console.log('=== DEBUG DO PROCESSO DE LOGIN ===\n');

async function debugLoginProcess() {
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

    // Dados de teste
    const testUsername = 'admin';
    const testPassword = 'admin123';
    
    console.log('🔍 TESTANDO PROCESSO DE LOGIN:');
    console.log(`   Username: ${testUsername}`);
    console.log(`   Password: ${testPassword}\n`);

    // 1. Verificar se existem usuários na tabela
    console.log('1. Verificando usuários existentes...');
    const { data: allUsers, error: allUsersError } = await supabase
      .from('profiles')
      .select('id, username, display_name, role, created_at');

    if (allUsersError) {
      console.error(`   ❌ Erro ao buscar usuários: ${allUsersError.message}`);
    } else {
      console.log(`   📊 Total de usuários encontrados: ${allUsers?.length || 0}`);
      if (allUsers && allUsers.length > 0) {
        allUsers.forEach((user, index) => {
          console.log(`   ${index + 1}. ${user.username} (${user.role}) - ID: ${user.id}`);
        });
      } else {
        console.log('   ⚠️  Nenhum usuário encontrado na tabela profiles!');
        console.log('   💡 Isso explica por que o login falha.');
        return;
      }
    }

    // 2. Buscar usuário específico (simulando o login)
    console.log('\n2. Buscando usuário admin especificamente...');
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id, username, display_name, role, password_hash')
      .eq('username', testUsername)
      .single();

    if (profileError) {
      console.error(`   ❌ Erro ao buscar perfil: ${profileError.message}`);
      console.error(`   📋 Detalhes do erro: ${JSON.stringify(profileError, null, 2)}`);
      return;
    }

    if (!profileData) {
      console.log('   ❌ Usuário admin não encontrado!');
      return;
    }

    console.log('   ✅ Usuário admin encontrado!');
    console.log(`   📋 Dados do usuário:`);
    console.log(`      ID: ${profileData.id}`);
    console.log(`      Username: ${profileData.username}`);
    console.log(`      Nome: ${profileData.display_name}`);
    console.log(`      Role: ${profileData.role}`);
    console.log(`      Hash da senha: ${profileData.password_hash}`);

    // 3. Testar verificação da senha
    console.log('\n3. Testando verificação da senha...');
    console.log(`   Senha fornecida: "${testPassword}"`);
    console.log(`   Hash armazenado: "${profileData.password_hash}"`);
    
    try {
      const isValid = await bcrypt.compare(testPassword, profileData.password_hash);
      console.log(`   🔐 Resultado da comparação: ${isValid ? '✅ VÁLIDA' : '❌ INVÁLIDA'}`);
      
      if (!isValid) {
        console.log('\n🔧 TESTANDO HASHES ALTERNATIVOS:');
        
        // Testar com hash gerado na hora
        const freshHash = await bcrypt.hash(testPassword, 10);
        console.log(`   Hash gerado agora: ${freshHash}`);
        const freshTest = await bcrypt.compare(testPassword, freshHash);
        console.log(`   Teste com hash fresco: ${freshTest ? '✅ VÁLIDA' : '❌ INVÁLIDA'}`);
        
        // Testar diferentes salt rounds
        for (const saltRounds of [8, 10, 12]) {
          const testHash = await bcrypt.hash(testPassword, saltRounds);
          const testResult = await bcrypt.compare(testPassword, testHash);
          console.log(`   Salt ${saltRounds}: ${testResult ? '✅ VÁLIDA' : '❌ INVÁLIDA'} - ${testHash}`);
        }
      }
      
    } catch (bcryptError) {
      console.error(`   ❌ Erro no bcrypt: ${bcryptError.message}`);
    }

    // 4. Simular o objeto User que seria criado
    if (profileData) {
      console.log('\n4. Simulando criação do objeto User...');
      const user = {
        id: profileData.id,
        username: profileData.username,
        name: profileData.display_name,
        role: profileData.role
      };
      console.log(`   👤 Objeto User: ${JSON.stringify(user, null, 2)}`);
    }

    console.log('\n✅ DEBUG CONCLUÍDO!');
    
  } catch (error) {
    console.error('\n❌ ERRO GERAL:', error.message);
    console.error('   Stack:', error.stack);
  }
}

// Executar o debug
debugLoginProcess();