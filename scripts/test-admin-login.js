// Script para testar o login do usuário admin
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcrypt';
import fs from 'fs';

// Ler variáveis de ambiente do arquivo .env
let supabaseUrl = 'https://exemplo.supabase.co';
let supabaseAnonKey = 'exemplo_key';

const hasEnvFile = fs.existsSync('.env');

if (hasEnvFile) {
  try {
    const envContent = fs.readFileSync('.env', 'utf8');
    const envLines = envContent.split('\n');
    
    for (const line of envLines) {
      if (line.startsWith('VITE_SUPABASE_URL=')) {
        supabaseUrl = line.split('=')[1].trim();
      }
      if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) {
        supabaseAnonKey = line.split('=')[1].trim();
      }
    }
  } catch (error) {
    console.log('⚠️  Erro ao ler arquivo .env:', error.message);
  }
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAdminLogin() {
  console.log('=== TESTE DE LOGIN DO USUÁRIO ADMIN ===\n');
  
  console.log('📋 CONFIGURAÇÃO:');
  console.log(`   URL: ${supabaseUrl}`);
  console.log(`   Chave: ${supabaseAnonKey.substring(0, 15)}...\n`);
  
  try {
    // 1. Verificar se o usuário admin existe
    console.log('1. Verificando se o usuário admin existe...');
    const { data: users, error: selectError } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', 'admin');
    
    if (selectError) {
      console.log(`❌ Erro ao buscar usuário: ${selectError.message}`);
      return;
    }
    
    if (!users || users.length === 0) {
      console.log('❌ Usuário admin não encontrado na tabela profiles');
      console.log('\n💡 Execute o script SQL no Supabase Dashboard primeiro!');
      return;
    }
    
    const adminUser = users[0];
    console.log('✅ Usuário admin encontrado:');
    console.log(`   ID: ${adminUser.id || adminUser.user_id}`);
    console.log(`   Username: ${adminUser.username}`);
    console.log(`   Display Name: ${adminUser.display_name}`);
    console.log(`   Role: ${adminUser.role}`);
    console.log(`   Hash Length: ${adminUser.password_hash ? adminUser.password_hash.length : 'N/A'}`);
    console.log(`   Created: ${adminUser.created_at}\n`);
    
    // 2. Verificar se o hash da senha está correto
    console.log('2. Verificando hash da senha...');
    const testPassword = 'admin123';
    const storedHash = adminUser.password_hash;
    
    if (!storedHash) {
      console.log('❌ Hash da senha não encontrado');
      return;
    }
    
    console.log(`   Senha de teste: ${testPassword}`);
    console.log(`   Hash armazenado: ${storedHash}`);
    
    // Verificar se o hash é válido
    try {
      const isValidHash = await bcrypt.compare(testPassword, storedHash);
      console.log(`   Hash válido: ${isValidHash ? '✅ SIM' : '❌ NÃO'}\n`);
      
      if (!isValidHash) {
        console.log('🔧 PROBLEMA IDENTIFICADO: Hash da senha inválido!');
        console.log('\n💡 SOLUÇÕES:');
        console.log('1. Execute novamente o script SQL no Supabase Dashboard');
        console.log('2. Ou execute: npm run create-admin para gerar novo hash');
        return;
      }
    } catch (hashError) {
      console.log(`❌ Erro ao verificar hash: ${hashError.message}`);
      return;
    }
    
    // 3. Testar login simulado (como a aplicação faria)
    console.log('3. Testando processo de login simulado...');
    
    // Buscar usuário por username
    const { data: loginUser, error: loginError } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', 'admin')
      .single();
    
    if (loginError) {
      console.log(`❌ Erro no login: ${loginError.message}`);
      
      if (loginError.code === 'PGRST116') {
        console.log('\n🔍 DIAGNÓSTICO: Múltiplos usuários com mesmo username ou nenhum encontrado');
        
        // Verificar quantos usuários admin existem
        const { data: allAdmins, error: countError } = await supabase
          .from('profiles')
          .select('*')
          .eq('username', 'admin');
        
        if (!countError && allAdmins) {
          console.log(`   Usuários 'admin' encontrados: ${allAdmins.length}`);
          if (allAdmins.length > 1) {
            console.log('\n💡 SOLUÇÃO: Remova usuários duplicados executando:');
            console.log('   DELETE FROM profiles WHERE username = \'admin\';');
            console.log('   E depois execute novamente o script de criação do admin.');
          }
        }
      }
      return;
    }
    
    console.log('✅ Usuário encontrado no processo de login');
    
    // Verificar senha
    const passwordMatch = await bcrypt.compare(testPassword, loginUser.password_hash);
    console.log(`✅ Verificação de senha: ${passwordMatch ? 'SUCESSO' : 'FALHA'}\n`);
    
    if (passwordMatch) {
      console.log('🎉 LOGIN FUNCIONANDO CORRETAMENTE!');
      console.log('\n📋 CREDENCIAIS CONFIRMADAS:');
      console.log('   Username: admin');
      console.log('   Password: admin123');
      console.log('\n✅ Você pode fazer login na aplicação com essas credenciais.');
    } else {
      console.log('❌ SENHA NÃO CONFERE!');
      console.log('\n🔧 Execute: npm run create-admin para gerar novo hash');
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
    console.log('\n💡 Verifique se:');
    console.log('1. O script SQL foi executado no Supabase Dashboard');
    console.log('2. As credenciais do .env estão corretas');
    console.log('3. A tabela profiles existe e tem dados');
  }
}

// Executar teste
testAdminLogin();