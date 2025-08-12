const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Configurar cliente Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas!');
  console.log('Verifique se VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY estão definidas no .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Função para simular o processo de login com logging
async function testLoginProcess() {
  console.log('🔐 TESTE DO PROCESSO DE LOGIN COM LOGGING\n');
  
  const username = 'admin';
  const password = 'admin123';
  
  try {
    console.log('📊 1. Verificando usuários existentes...');
    const { data: allUsers, error: allUsersError } = await supabase
      .from('profiles')
      .select('id, username, display_name, role');
    
    if (allUsersError) {
      console.error('❌ Erro ao buscar usuários:', allUsersError.message);
      return;
    }
    
    console.log(`✅ Total de usuários encontrados: ${allUsers.length}`);
    if (allUsers.length > 0) {
      console.log('👥 Usuários:');
      allUsers.forEach(user => {
        console.log(`   - ${user.username} (${user.role}) - ${user.display_name}`);
      });
    } else {
      console.log('⚠️  Nenhum usuário encontrado na tabela profiles!');
      console.log('\n📝 Para criar o usuário admin, execute o seguinte SQL no Supabase Dashboard:');
      console.log('\n```sql');
      
      // Gerar hash da senha
      const passwordHash = await bcrypt.hash(password, 10);
      
      console.log(`-- Deletar perfis existentes (se houver)`);
      console.log(`DELETE FROM profiles WHERE username = 'admin';`);
      console.log(``);
      console.log(`-- Inserir usuário admin`);
      console.log(`INSERT INTO profiles (user_id, username, display_name, role, password_hash)`);
      console.log(`VALUES (`);
      console.log(`  gen_random_uuid(),`);
      console.log(`  'admin',`);
      console.log(`  'Administrador',`);
      console.log(`  'admin',`);
      console.log(`  '${passwordHash}'`);
      console.log(`);`);
      console.log(``);
      console.log(`-- Verificar criação`);
      console.log(`SELECT * FROM profiles WHERE username = 'admin';`);
      console.log('```\n');
      return;
    }
    
    console.log('\n🔍 2. Buscando perfil do usuário admin...');
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id, username, display_name, role, password_hash')
      .eq('username', username)
      .single();
    
    if (profileError || !profileData) {
      console.error('❌ Usuário admin não encontrado!');
      console.log('Erro:', profileError?.message || 'Usuário não existe');
      return;
    }
    
    console.log('✅ Usuário admin encontrado:');
    console.log(`   - ID: ${profileData.id}`);
    console.log(`   - Username: ${profileData.username}`);
    console.log(`   - Nome: ${profileData.display_name}`);
    console.log(`   - Role: ${profileData.role}`);
    console.log(`   - Tem hash de senha: ${!!profileData.password_hash}`);
    
    if (!profileData.password_hash) {
      console.error('❌ Usuário não possui hash de senha!');
      return;
    }
    
    console.log('\n🔐 3. Testando comparação de senha...');
    console.log(`   - Senha testada: "${password}"`);
    console.log(`   - Hash armazenado: ${profileData.password_hash.substring(0, 20)}...`);
    
    const isValid = await bcrypt.compare(password, profileData.password_hash);
    
    if (isValid) {
      console.log('✅ Senha válida! Login seria bem-sucedido.');
      
      const user = {
        id: profileData.id,
        username: profileData.username,
        name: profileData.display_name,
        role: profileData.role
      };
      
      console.log('\n👤 4. Objeto User que seria criado:');
      console.log(JSON.stringify(user, null, 2));
      
    } else {
      console.error('❌ Senha inválida! Login falharia.');
      
      // Testar com outras senhas comuns
      console.log('\n🔍 Testando outras senhas comuns...');
      const commonPasswords = ['admin', 'password', '123456', 'admin123!'];
      
      for (const testPassword of commonPasswords) {
        const testResult = await bcrypt.compare(testPassword, profileData.password_hash);
        console.log(`   - "${testPassword}": ${testResult ? '✅ VÁLIDA' : '❌ inválida'}`);
        if (testResult) break;
      }
    }
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Função para testar a validação Zod
function testValidation() {
  console.log('\n📋 TESTE DE VALIDAÇÃO ZOD\n');
  
  const testCases = [
    { username: 'admin', password: 'admin123', expected: true },
    { username: 'ad', password: 'admin123', expected: false }, // username muito curto
    { username: 'admin', password: '123', expected: false }, // senha muito curta
    { username: 'admin@test', password: 'admin123', expected: false }, // caractere inválido
    { username: 'admin', password: 'a'.repeat(130), expected: false }, // senha muito longa
  ];
  
  testCases.forEach((testCase, index) => {
    console.log(`Teste ${index + 1}: username="${testCase.username}", password="${testCase.password.substring(0, 10)}${testCase.password.length > 10 ? '...' : ''}"`);
    
    // Simular validação (sem importar Zod aqui)
    const usernameValid = testCase.username.length >= 3 && testCase.username.length <= 50 && /^[a-zA-Z0-9_-]+$/.test(testCase.username);
    const passwordValid = testCase.password.length >= 8 && testCase.password.length <= 128;
    const isValid = usernameValid && passwordValid;
    
    console.log(`   - Resultado: ${isValid ? '✅ válido' : '❌ inválido'}`);
    console.log(`   - Username válido: ${usernameValid}`);
    console.log(`   - Password válido: ${passwordValid}`);
    console.log(`   - Esperado: ${testCase.expected ? 'válido' : 'inválido'}`);
    console.log('');
  });
}

// Executar testes
async function runAllTests() {
  await testLoginProcess();
  testValidation();
  
  console.log('\n🎯 PRÓXIMOS PASSOS:');
  console.log('1. Se o usuário admin não existe, execute o SQL fornecido no Supabase Dashboard');
  console.log('2. Se o usuário existe mas a senha não confere, verifique o hash da senha');
  console.log('3. Teste o login na aplicação com username="admin" e password="admin123"');
  console.log('4. Verifique os logs no console do navegador (F12) para debugging detalhado');
  console.log('5. Use debugAuth() no console do navegador para ver estatísticas de autenticação');
}

runAllTests().catch(console.error);