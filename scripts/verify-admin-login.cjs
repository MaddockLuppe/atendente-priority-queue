const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
require('dotenv').config();

console.log('=== VERIFICANDO LOGIN DO ADMIN ===\n');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não encontradas!');
  console.log('   Verifique VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyAdminLogin() {
  try {
    console.log('📋 CONFIGURAÇÃO:');
    console.log(`   URL: ${supabaseUrl}`);
    console.log(`   Chave: ${supabaseKey.substring(0, 20)}...\n`);

    // 1. Verificar se o usuário admin existe
    console.log('1. Verificando se o usuário admin existe...');
    const { data: users, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', 'admin');

    if (fetchError) {
      console.error('❌ Erro ao buscar usuário:', fetchError.message);
      return;
    }

    if (!users || users.length === 0) {
      console.log('❌ Usuário admin não encontrado!');
      console.log('   Execute o SQL no Supabase Dashboard primeiro.');
      return;
    }

    if (users.length > 1) {
      console.log('⚠️  Múltiplos usuários admin encontrados!');
      console.log(`   Total: ${users.length}`);
    }

    const adminUser = users[0];
    console.log('✅ Usuário admin encontrado:');
    console.log(`   ID: ${adminUser.id}`);
    console.log(`   Username: ${adminUser.username}`);
    console.log(`   Display Name: ${adminUser.display_name}`);
    console.log(`   Role: ${adminUser.role}`);
    console.log(`   Hash Length: ${adminUser.password_hash?.length || 0}`);
    console.log(`   Created: ${adminUser.created_at}\n`);

    // 2. Testar o hash da senha
    console.log('2. Testando hash da senha...');
    const testPassword = 'admin123';
    const isValidPassword = await bcrypt.compare(testPassword, adminUser.password_hash);
    
    if (isValidPassword) {
      console.log('✅ Hash da senha está correto!');
      console.log(`   Senha testada: ${testPassword}`);
    } else {
      console.log('❌ Hash da senha está incorreto!');
      console.log(`   Senha testada: ${testPassword}`);
      console.log(`   Hash armazenado: ${adminUser.password_hash}`);
    }

    // 3. Simular processo de login da aplicação
    console.log('\n3. Simulando processo de login da aplicação...');
    
    // Buscar perfil como a aplicação faz
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', 'admin')
      .single();

    if (profileError) {
      console.log('❌ Erro ao buscar perfil:', profileError.message);
      return;
    }

    // Verificar senha como a aplicação faz
    const passwordMatch = await bcrypt.compare('admin123', profile.password_hash);
    
    if (passwordMatch) {
      console.log('✅ LOGIN SIMULADO COM SUCESSO!');
      console.log('   O login deve funcionar na aplicação.');
    } else {
      console.log('❌ FALHA NO LOGIN SIMULADO!');
      console.log('   O login não funcionará na aplicação.');
    }

    // 4. Verificar total de usuários
    console.log('\n4. Verificando total de usuários...');
    const { data: allUsers, error: countError } = await supabase
      .from('profiles')
      .select('username, role');

    if (countError) {
      console.log('❌ Erro ao contar usuários:', countError.message);
    } else {
      console.log(`✅ Total de usuários: ${allUsers.length}`);
      allUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.username} (${user.role})`);
      });
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

verifyAdminLogin();