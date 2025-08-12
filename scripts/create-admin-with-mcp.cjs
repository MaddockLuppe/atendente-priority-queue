const bcrypt = require('bcryptjs');
require('dotenv').config();

console.log('=== CRIANDO USUÁRIO ADMIN AUTOMATICAMENTE ===\n');

// Função para gerar hash da senha
async function generatePasswordHash(password) {
  try {
    // Usar salt 10 para compatibilidade com bcryptjs
    const hash = await bcrypt.hash(password, 10);
    console.log('✅ Hash da senha gerado com sucesso');
    console.log(`   Hash: ${hash}\n`);
    return hash;
  } catch (error) {
    console.error('❌ Erro ao gerar hash da senha:', error.message);
    throw error;
  }
}

// Função para criar SQL de inserção
function generateInsertSQL(passwordHash) {
  return `
-- Remover todos os usuários existentes e criar novo admin
-- Usuário: admin
-- Senha: admin123
-- Gerado automaticamente em: ${new Date().toISOString()}

-- Remover todos os usuários existentes
DELETE FROM profiles;

-- Criar novo usuário administrador
INSERT INTO profiles (user_id, username, display_name, role, password_hash)
VALUES (
  gen_random_uuid(),
  'admin',
  'Administrador',
  'admin',
  '${passwordHash}'
);

-- Verificar se o usuário foi criado corretamente
SELECT 
  id,
  username,
  display_name,
  role,
  created_at
FROM profiles 
WHERE username = 'admin';

-- Contar total de usuários
SELECT COUNT(*) as total_users FROM profiles;
`;
}

async function createAdminUser() {
  try {
    console.log('📋 CONFIGURAÇÃO:');
    console.log(`   URL: ${process.env.VITE_SUPABASE_URL}`);
    console.log(`   Chave: ${process.env.VITE_SUPABASE_ANON_KEY?.substring(0, 20)}...\n`);

    // 1. Gerar hash da senha
    console.log('1. Gerando hash da senha "admin123"...');
    const passwordHash = await generatePasswordHash('admin123');

    // 2. Gerar SQL
    console.log('2. Gerando SQL de inserção...');
    const sql = generateInsertSQL(passwordHash);

    // 3. Salvar SQL em arquivo
    const fs = require('fs');
    const sqlFilePath = './supabase/migrations/20250812133954_create_admin_user.sql';
    
    console.log('3. Salvando SQL atualizado...');
    fs.writeFileSync(sqlFilePath, sql);
    console.log(`✅ SQL salvo em: ${sqlFilePath}\n`);

    // 4. Mostrar instruções
    console.log('🎯 PRÓXIMOS PASSOS:');
    console.log('   1. Acesse seu projeto no Supabase Dashboard');
    console.log('   2. Vá para "SQL Editor"');
    console.log(`   3. Execute o conteúdo do arquivo: ${sqlFilePath}`);
    console.log('   4. Teste o login com:');
    console.log('      - Usuário: admin');
    console.log('      - Senha: admin123');
    console.log('   5. Execute: node scripts/verify-admin-login.cjs\n');

    console.log('✅ Script executado com sucesso!');
    console.log('   O arquivo de migração foi atualizado com o hash correto.');
    
  } catch (error) {
    console.error('❌ Erro ao criar usuário admin:', error.message);
    process.exit(1);
  }
}

// Executar o script
createAdminUser();