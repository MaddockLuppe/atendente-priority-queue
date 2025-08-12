const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
require('dotenv').config();

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Credenciais do Supabase não encontradas no .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createAdminUser() {
  console.log('=== CRIANDO USUÁRIO ADMIN ===\n');
  
  try {
    // 1. Verificar se já existe
    console.log('1. Verificando se o usuário admin já existe...');
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', 'admin')
      .single();
    
    if (existingUser) {
      console.log('⚠️  Usuário admin já existe!');
      console.log('   ID:', existingUser.id);
      console.log('   Username:', existingUser.username);
      console.log('   Role:', existingUser.role);
      return;
    }
    
    console.log('✅ Usuário admin não existe, criando...');
    
    // 2. Gerar hash da senha
    console.log('2. Gerando hash da senha...');
    const password = 'admin123';
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    console.log('✅ Hash gerado:', passwordHash);
    
    // 3. Inserir o usuário
    console.log('3. Inserindo usuário na tabela profiles...');
    const { data: newUser, error } = await supabase
      .from('profiles')
      .insert({
        user_id: crypto.randomUUID(),
        username: 'admin',
        password_hash: passwordHash,
        display_name: 'Administrador',
        role: 'admin'
      })
      .select()
      .single();
    
    if (error) {
      console.error('❌ Erro ao inserir usuário:', error);
      
      // Verificar se é problema de RLS
      if (error.code === '42501' || error.message.includes('RLS')) {
        console.log('\n💡 SOLUÇÃO: Execute este SQL no Supabase Dashboard:');
        console.log('\n-- Desabilitar RLS temporariamente');
        console.log('ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;');
        console.log('\n-- Inserir admin');
        console.log(`INSERT INTO profiles (username, password_hash, name, role, created_at, updated_at)`);
        console.log(`VALUES ('admin', '${passwordHash}', 'Administrador', 'admin', NOW(), NOW());`);
        console.log('\n-- Reabilitar RLS');
        console.log('ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;');
      }
      
      return;
    }
    
    console.log('✅ Usuário admin criado com sucesso!');
    console.log('   ID:', newUser.id);
    console.log('   Username:', newUser.username);
    console.log('   Display Name:', newUser.display_name);
    console.log('   Role:', newUser.role);
    
    // 4. Testar o login
    console.log('\n4. Testando o login...');
    const isValidPassword = await bcrypt.compare(password, newUser.password_hash);
    console.log('✅ Teste de senha:', isValidPassword ? 'SUCESSO' : 'FALHA');
    
    console.log('\n🎉 USUÁRIO ADMIN CRIADO COM SUCESSO!');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar
createAdminUser();