// Script para criar usuário admin usando Supabase Auth
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs'; // Usar bcryptjs como na aplicação
import fs from 'fs';

// Ler variáveis de ambiente do arquivo .env
let supabaseUrl = 'https://exemplo.supabase.co';
let supabaseAnonKey = 'exemplo_key';
let supabaseServiceKey = '';

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
      if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) {
        supabaseServiceKey = line.split('=')[1].trim();
      }
    }
  } catch (error) {
    console.log('⚠️  Erro ao ler arquivo .env:', error.message);
  }
}

// Cliente normal para consultas
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Cliente com service role para bypass RLS (se disponível)
const supabaseAdmin = supabaseServiceKey ? 
  createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }) : null;

async function createAdminUser() {
  console.log('=== CRIANDO USUÁRIO ADMIN VIA AUTH ===\n');
  
  console.log('📋 CONFIGURAÇÃO:');
  console.log(`   URL: ${supabaseUrl}`);
  console.log(`   Chave Anon: ${supabaseAnonKey.substring(0, 15)}...`);
  console.log(`   Service Key: ${supabaseServiceKey ? 'Disponível' : 'Não encontrada'}\n`);
  
  const adminData = {
    username: 'admin',
    password: 'admin123',
    displayName: 'Administrador',
    role: 'admin'
  };
  
  try {
    // 1. Verificar estado atual
    console.log('1. Verificando usuários existentes...');
    const { data: existingUsers, error: selectError } = await supabase
      .from('profiles')
      .select('username, role');
    
    if (selectError) {
      console.log(`⚠️  Erro ao consultar usuários: ${selectError.message}`);
    } else {
      console.log(`   Usuários encontrados: ${existingUsers ? existingUsers.length : 0}`);
      if (existingUsers && existingUsers.length > 0) {
        existingUsers.forEach(user => {
          console.log(`     - ${user.username} (${user.role})`);
        });
      }
    }
    
    // 2. Tentar remover usuários existentes (se temos service key)
    if (supabaseAdmin) {
      console.log('\n2. Removendo usuários existentes (usando service key)...');
      const { error: deleteError } = await supabaseAdmin
        .from('profiles')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
      
      if (deleteError) {
        console.log(`⚠️  Erro ao remover usuários: ${deleteError.message}`);
      } else {
        console.log('✅ Usuários removidos com sucesso');
      }
    } else {
      console.log('\n2. Service key não disponível - pulando remoção de usuários');
    }
    
    // 3. Gerar hash da senha usando bcryptjs
    console.log('\n3. Gerando hash da senha...');
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(adminData.password, saltRounds);
    
    console.log(`   Senha: ${adminData.password}`);
    console.log(`   Hash: ${passwordHash}`);
    
    // 4. Tentar criar usuário com service key primeiro
    let userCreated = false;
    
    if (supabaseAdmin) {
      console.log('\n4a. Tentando criar usuário com service key...');
      const { data: newUser, error: insertError } = await supabaseAdmin
        .from('profiles')
        .insert({
          username: adminData.username,
          display_name: adminData.displayName,
          role: adminData.role,
          password_hash: passwordHash
        })
        .select()
        .single();
      
      if (insertError) {
        console.log(`⚠️  Erro com service key: ${insertError.message}`);
      } else {
        console.log('✅ Usuário criado com service key');
        console.log(`   ID: ${newUser.id}`);
        userCreated = true;
      }
    }
    
    // 4b. Se não conseguiu com service key, tentar método alternativo
    if (!userCreated) {
      console.log('\n4b. Tentando método alternativo...');
      
      // Tentar criar via RPC se existir
      try {
        const { data: rpcResult, error: rpcError } = await supabase
          .rpc('create_user_profile', {
            p_username: adminData.username,
            p_display_name: adminData.displayName,
            p_role: adminData.role,
            p_password_hash: passwordHash
          });
        
        if (rpcError) {
          console.log(`⚠️  RPC não disponível: ${rpcError.message}`);
        } else {
          console.log('✅ Usuário criado via RPC');
          userCreated = true;
        }
      } catch (rpcErr) {
        console.log('⚠️  RPC não disponível');
      }
    }
    
    // 5. Se ainda não criou, mostrar instruções manuais
    if (!userCreated) {
      console.log('\n❌ NÃO FOI POSSÍVEL CRIAR O USUÁRIO AUTOMATICAMENTE');
      console.log('\n📋 EXECUTE ESTE SQL MANUALMENTE NO SUPABASE DASHBOARD:');
      console.log('\n```sql');
      console.log('-- Remover usuários existentes');
      console.log('DELETE FROM profiles;');
      console.log('');
      console.log('-- Criar usuário admin');
      console.log('INSERT INTO profiles (username, display_name, role, password_hash)');
      console.log('VALUES (');
      console.log(`  '${adminData.username}',`);
      console.log(`  '${adminData.displayName}',`);
      console.log(`  '${adminData.role}',`);
      console.log(`  '${passwordHash}'`);
      console.log(');');
      console.log('```');
      console.log('\n📍 COMO EXECUTAR:');
      console.log('1. Acesse o Supabase Dashboard');
      console.log('2. Vá em SQL Editor');
      console.log('3. Cole e execute o SQL acima');
      console.log('4. Execute este script novamente para verificar');
      return;
    }
    
    // 6. Verificar se foi criado corretamente
    console.log('\n5. Verificando usuário criado...');
    const { data: verifyUser, error: verifyError } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', adminData.username)
      .single();
    
    if (verifyError) {
      console.log(`❌ Erro na verificação: ${verifyError.message}`);
      return;
    }
    
    console.log('✅ Verificação bem-sucedida:');
    console.log(`   ID: ${verifyUser.id}`);
    console.log(`   Username: ${verifyUser.username}`);
    console.log(`   Display Name: ${verifyUser.display_name}`);
    console.log(`   Role: ${verifyUser.role}`);
    console.log(`   Hash Length: ${verifyUser.password_hash.length}`);
    
    // 7. Testar o hash da senha
    console.log('\n6. Testando hash da senha...');
    const isValidPassword = await bcrypt.compare(adminData.password, verifyUser.password_hash);
    console.log(`   Senha válida: ${isValidPassword ? '✅ SIM' : '❌ NÃO'}`);
    
    if (isValidPassword) {
      console.log('\n🎉 USUÁRIO ADMIN CRIADO COM SUCESSO!');
      console.log('\n📋 CREDENCIAIS:');
      console.log(`   Username: ${adminData.username}`);
      console.log(`   Password: ${adminData.password}`);
      console.log('\n✅ Você pode agora fazer login na aplicação!');
      console.log('\n🔗 Acesse: http://localhost:8080/');
    } else {
      console.log('\n❌ Problema com o hash da senha!');
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
    console.log('\n💡 Soluções:');
    console.log('1. Execute o SQL manualmente no Supabase Dashboard');
    console.log('2. Verifique as permissões da tabela profiles');
    console.log('3. Adicione SUPABASE_SERVICE_ROLE_KEY no arquivo .env');
  }
}

// Executar criação
createAdminUser();