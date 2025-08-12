const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Função para gerar hash da senha
async function generatePasswordHash(password) {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

// Função para gerar UUID
function generateUUID() {
  return crypto.randomUUID();
}

async function createAdminUser() {
  console.log('=== CRIAÇÃO DO USUÁRIO ADMIN VIA MCP ===\n');
  
  try {
    // Gerar dados do usuário admin
    const userId = generateUUID();
    const username = 'admin';
    const displayName = 'Administrador';
    const role = 'admin';
    const password = 'admin123';
    
    console.log('📝 Gerando hash da senha...');
    const passwordHash = await generatePasswordHash(password);
    
    console.log('✅ Dados do usuário admin preparados:');
    console.log(`   User ID: ${userId}`);
    console.log(`   Username: ${username}`);
    console.log(`   Display Name: ${displayName}`);
    console.log(`   Role: ${role}`);
    console.log(`   Password Hash: ${passwordHash.substring(0, 20)}...`);
    
    // SQL para inserir o usuário
    const insertSQL = `
      INSERT INTO profiles (user_id, username, display_name, role, password_hash)
      VALUES ('${userId}', '${username}', '${displayName}', '${role}', '${passwordHash}')
      ON CONFLICT (username) DO UPDATE SET
        display_name = EXCLUDED.display_name,
        role = EXCLUDED.role,
        password_hash = EXCLUDED.password_hash;
    `;
    
    console.log('\n📋 SQL a ser executado:');
    console.log(insertSQL);
    
    console.log('\n🔧 INSTRUÇÕES PARA EXECUÇÃO:');
    console.log('1. Copie o SQL acima');
    console.log('2. Acesse o Supabase Dashboard');
    console.log('3. Vá em SQL Editor');
    console.log('4. Cole e execute o SQL');
    console.log('5. Teste o login com admin/admin123');
    
    // Teste da senha gerada
    console.log('\n🧪 Testando hash da senha...');
    const isValid = await bcrypt.compare(password, passwordHash);
    console.log(`   Senha '${password}' válida: ${isValid ? '✅' : '❌'}`);
    
    return {
      success: true,
      userId,
      username,
      passwordHash,
      sql: insertSQL
    };
    
  } catch (error) {
    console.error('❌ Erro ao criar usuário admin:', error);
    return { success: false, error: error.message };
  }
}

// Executar
createAdminUser().then(result => {
  if (result.success) {
    console.log('\n✅ Script executado com sucesso!');
    console.log('\n💡 PRÓXIMO PASSO: Execute o SQL no Supabase Dashboard');
  } else {
    console.log('\n❌ Falha na execução:', result.error);
  }
});