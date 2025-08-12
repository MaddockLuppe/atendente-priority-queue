// Script para aplicar a migração do admin diretamente via código
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

async function applyAdminMigration() {
  console.log('=== APLICANDO MIGRAÇÃO DO ADMIN ===\n');
  
  console.log('📋 CONFIGURAÇÃO:');
  console.log(`   URL: ${supabaseUrl}`);
  console.log(`   Chave: ${supabaseAnonKey.substring(0, 15)}...\n`);
  
  try {
    // 1. Verificar estado atual da tabela
    console.log('1. Verificando estado atual da tabela profiles...');
    const { data: currentUsers, error: selectError } = await supabase
      .from('profiles')
      .select('*');
    
    if (selectError) {
      console.log(`❌ Erro ao acessar tabela: ${selectError.message}`);
      console.log('\n💡 Verifique se a tabela profiles existe e se você tem permissões.');
      return;
    }
    
    console.log(`   Usuários existentes: ${currentUsers ? currentUsers.length : 0}`);
    
    if (currentUsers && currentUsers.length > 0) {
      console.log('   Usuários encontrados:');
      currentUsers.forEach(user => {
        console.log(`     - ${user.username} (${user.role})`);
      });
    }
    
    // 2. Remover todos os usuários existentes
    console.log('\n2. Removendo todos os usuários existentes...');
    const { error: deleteError } = await supabase
      .from('profiles')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Deletar todos
    
    if (deleteError) {
      console.log(`❌ Erro ao remover usuários: ${deleteError.message}`);
      return;
    }
    
    console.log('✅ Usuários removidos com sucesso');
    
    // 3. Gerar hash da senha
    console.log('\n3. Gerando hash da senha...');
    const password = 'admin123';
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    console.log(`   Senha: ${password}`);
    console.log(`   Hash: ${passwordHash}`);
    
    // 4. Criar novo usuário admin
    console.log('\n4. Criando usuário admin...');
    const { data: newUser, error: insertError } = await supabase
      .from('profiles')
      .insert({
        username: 'admin',
        display_name: 'Administrador',
        role: 'admin',
        password_hash: passwordHash
      })
      .select()
      .single();
    
    if (insertError) {
      console.log(`❌ Erro ao criar usuário: ${insertError.message}`);
      
      // Tentar com user_id explícito se necessário
      if (insertError.message.includes('user_id')) {
        console.log('\n🔄 Tentando com user_id explícito...');
        const { data: newUserWithId, error: insertError2 } = await supabase
          .from('profiles')
          .insert({
            user_id: crypto.randomUUID(),
            username: 'admin',
            display_name: 'Administrador',
            role: 'admin',
            password_hash: passwordHash
          })
          .select()
          .single();
        
        if (insertError2) {
          console.log(`❌ Erro na segunda tentativa: ${insertError2.message}`);
          return;
        }
        
        console.log('✅ Usuário admin criado com sucesso (segunda tentativa)');
        console.log(`   ID: ${newUserWithId.id || newUserWithId.user_id}`);
      } else {
        return;
      }
    } else {
      console.log('✅ Usuário admin criado com sucesso');
      console.log(`   ID: ${newUser.id || newUser.user_id}`);
    }
    
    // 5. Verificar se foi criado corretamente
    console.log('\n5. Verificando usuário criado...');
    const { data: verifyUser, error: verifyError } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', 'admin')
      .single();
    
    if (verifyError) {
      console.log(`❌ Erro na verificação: ${verifyError.message}`);
      return;
    }
    
    console.log('✅ Verificação bem-sucedida:');
    console.log(`   Username: ${verifyUser.username}`);
    console.log(`   Display Name: ${verifyUser.display_name}`);
    console.log(`   Role: ${verifyUser.role}`);
    console.log(`   Hash Length: ${verifyUser.password_hash.length}`);
    
    // 6. Testar o hash da senha
    console.log('\n6. Testando hash da senha...');
    const isValidPassword = await bcrypt.compare(password, verifyUser.password_hash);
    console.log(`   Senha válida: ${isValidPassword ? '✅ SIM' : '❌ NÃO'}`);
    
    if (isValidPassword) {
      console.log('\n🎉 MIGRAÇÃO APLICADA COM SUCESSO!');
      console.log('\n📋 CREDENCIAIS DO ADMIN:');
      console.log('   Username: admin');
      console.log('   Password: admin123');
      console.log('\n✅ Você pode agora fazer login na aplicação!');
    } else {
      console.log('\n❌ Problema com o hash da senha!');
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
    console.log('\n💡 Possíveis soluções:');
    console.log('1. Verifique as permissões da tabela profiles');
    console.log('2. Execute o script SQL manualmente no Supabase Dashboard');
    console.log('3. Verifique se as credenciais do .env estão corretas');
  }
}

// Executar migração
applyAdminMigration();