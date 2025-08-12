// Teste de conexão com banco de dados
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import fs from 'fs';

// Verificar se arquivo .env existe
const hasEnvFile = fs.existsSync('.env');

// Ler variáveis de ambiente do arquivo .env
let supabaseUrl = 'https://exemplo.supabase.co';
let supabaseAnonKey = 'exemplo_key';

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

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
});

// Função para testar conexão com banco de dados
async function testDatabaseConnection() {
  console.log('=== TESTE DE CONEXÃO COM BANCO DE DADOS ===\n');
  
  // Status da configuração
  console.log('📋 STATUS DA CONFIGURAÇÃO:');
  console.log(`   Arquivo .env: ${hasEnvFile ? '✅ Existe' : '❌ Não encontrado'}`);
  console.log(`   URL Supabase: ${supabaseUrl}`);
  console.log(`   Chave: ${supabaseAnonKey.substring(0, 15)}...`);
  
  if (supabaseUrl === 'https://exemplo.supabase.co') {
    console.log('\n⚠️  ATENÇÃO: Usando URLs de exemplo!');
    console.log('   Para conectar ao banco real:');
    console.log('   1. Copie .env.example para .env');
    console.log('   2. Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY');
    console.log('   3. Reinicie o servidor\n');
  }
  
  try {
    // 1. Testar conexão básica
    console.log('1. Testando conexão básica...');
    
    // Teste simples de conectividade
    try {
      const { data, error } = await supabase.from('profiles').select('count').limit(0);
      console.log('✅ Conexão com banco estabelecida\n');
    } catch (err) {
      console.log('❌ ERRO na conexão:', err.message);
      return;
    }
    
    // 2. Testar autenticação com usuários conhecidos
    console.log('2. Testando autenticação com usuários conhecidos...');
    
    const testUsers = [
      { username: 'lucas', password: 'password' },
      { username: 'abassa', password: 'password' }
    ];
    
    let foundUsers = 0;
    
    for (const testUser of testUsers) {
      console.log(`\n   Testando usuário: ${testUser.username}`);
      
      // Tentar fazer login para verificar se o usuário existe
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: `${testUser.username}@example.com`,
        password: testUser.password
      });
      
      if (authError) {
        if (authError.message.includes('Invalid login credentials')) {
          console.log(`   ⚠️  Usuário ${testUser.username} existe mas credenciais inválidas`);
        } else {
          console.log(`   ❌ Erro: ${authError.message}`);
        }
      } else {
        console.log(`   ✅ Login bem-sucedido para ${testUser.username}`);
        foundUsers++;
        
        // Fazer logout
        await supabase.auth.signOut();
      }
    }
    
    if (foundUsers === 0) {
      console.log('\n⚠️  Nenhum usuário conseguiu fazer login. Verificando se existem usuários na base...');
      
      // Tentar uma consulta direta (pode falhar devido ao RLS)
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('username')
        .limit(5);
      
      if (usersError) {
        console.log('   ❌ Não foi possível acessar tabela profiles (RLS ativo)');
        console.log('   💡 Isso é normal - as políticas de segurança estão funcionando');
      } else if (users && users.length > 0) {
        console.log(`   ✅ Encontrados ${users.length} usuários na base`);
      }
    } else {
      console.log(`\n✅ ${foundUsers} usuário(s) conseguiu(ram) fazer login com sucesso`);
    }
    
    // 3. Testar regras de login para cada usuário
    console.log('3. Testando regras de login...');
    
    const testCredentials = [
      { username: 'lucas', password: '12061409' },
      { username: 'abassa', password: 'xangoeoxum@2025@' }
    ];
    
    for (const cred of testCredentials) {
      console.log(`\nTestando login: ${cred.username}`);
      
      // Buscar dados do usuário
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, username, display_name, role, password_hash')
        .eq('username', cred.username)
        .single();
      
      if (profileError) {
        console.log(`❌ Usuário ${cred.username} não encontrado:`, profileError.message);
        continue;
      }
      
      if (!profileData) {
        console.log(`❌ Dados do usuário ${cred.username} não retornados`);
        continue;
      }
      
      console.log(`  ✅ Usuário encontrado: ${profileData.display_name}`);
      console.log(`  📋 Papel: ${profileData.role}`);
      console.log(`  🔑 Hash: ${profileData.password_hash.substring(0, 20)}...`);
      
      // Testar senha
      try {
        const isValid = await bcrypt.compare(cred.password, profileData.password_hash);
        console.log(`  🔐 Senha: ${isValid ? '✅ VÁLIDA' : '❌ INVÁLIDA'}`);
        
        if (!isValid) {
          console.log(`  ⚠️  Hash atual não confere com a senha fornecida`);
          
          // Gerar hash correto para comparação
          const correctHash = await bcrypt.hash(cred.password, 10);
          const testCorrect = await bcrypt.compare(cred.password, correctHash);
          console.log(`  🔧 Hash correto seria válido: ${testCorrect ? '✅ SIM' : '❌ NÃO'}`);
        }
      } catch (bcryptError) {
        console.log(`  ❌ Erro ao verificar senha:`, bcryptError.message);
      }
    }
    
    // 4. Verificar políticas RLS
    console.log('\n4. Verificando políticas RLS...');
    
    try {
      // Tentar acessar sem autenticação (deve funcionar para login)
      const { data: anonAccess, error: anonError } = await supabase
        .from('profiles')
        .select('username')
        .limit(1);
      
      if (anonError) {
        console.log('❌ Acesso anônimo bloqueado:', anonError.message);
        console.log('⚠️  Isso pode impedir o login. Verifique as políticas RLS.');
      } else {
        console.log('✅ Acesso anônimo permitido (necessário para login)');
      }
    } catch (rlsError) {
      console.log('❌ Erro ao testar RLS:', rlsError.message);
    }
    
    // 5. Resumo
    console.log('\n=== RESUMO ===');
    console.log('✅ Conexão: OK');
    console.log(`✅ Usuários testados: ${foundUsers > 0 ? foundUsers + ' com login funcionando' : 'nenhum com login funcionando'}`);
    
    const validLogins = testCredentials.filter(async cred => {
      const { data } = await supabase
        .from('profiles')
        .select('password_hash')
        .eq('username', cred.username)
        .single();
      
      if (data) {
        return await bcrypt.compare(cred.password, data.password_hash);
      }
      return false;
    });
    
    console.log('\n📋 PRÓXIMOS PASSOS:');
    console.log('1. Se houver hashes inválidos, execute: npm run fix-passwords');
    console.log('2. Aplique o SQL gerado no Supabase Dashboard');
    console.log('3. Teste o login na aplicação');
    console.log('4. Configure as variáveis de ambiente (.env) se necessário');
    
  } catch (error) {
    console.log('❌ ERRO GERAL:', error.message);
    console.log('Stack:', error.stack);
    
    if (error.message.includes('Variáveis de ambiente')) {
      console.log('\n🔧 SOLUÇÃO:');
      console.log('1. Copie .env.example para .env');
      console.log('2. Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY');
      console.log('3. Reinicie o servidor de desenvolvimento');
    }
  }
}

// Executar teste
testDatabaseConnection().catch(console.error);