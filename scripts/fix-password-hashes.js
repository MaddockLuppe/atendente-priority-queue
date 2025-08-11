import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Função para corrigir hashes de senha
async function fixPasswordHashes() {
  console.log('=== CORRIGINDO HASHES DE SENHA ===\n');
  
  // Usuários conhecidos que precisam ser corrigidos
  const users = [
    {
      username: 'lucas',
      password: '12061409',
      displayName: 'Lucas - Administrador',
      role: 'admin'
    },
    {
      username: 'abassa',
      password: 'xangoeoxum@2025@',
      displayName: 'Administrador',
      role: 'admin'
    }
  ];
  
  let sqlStatements = [];
  
  console.log('Gerando hashes corretos...\n');
  
  for (const user of users) {
    try {
      // Gerar hash correto
      const hash = await bcrypt.hash(user.password, 10);
      
      console.log(`Usuário: ${user.username}`);
      console.log(`Senha: ${user.password}`);
      console.log(`Hash: ${hash}`);
      
      // Verificar se o hash funciona
      const works = await bcrypt.compare(user.password, hash);
      console.log(`Verificação: ${works ? '✅ OK' : '❌ ERRO'}`);
      
      // Criar statement SQL
      const sql = `-- Corrigir hash do usuário ${user.username}
INSERT INTO profiles (user_id, username, display_name, role, password_hash)
VALUES (
  gen_random_uuid(),
  '${user.username}',
  '${user.displayName}',
  '${user.role}',
  '${hash}'
) ON CONFLICT (username) 
DO UPDATE SET 
  password_hash = '${hash}',
  display_name = '${user.displayName}',
  role = '${user.role}',
  updated_at = now();`;
  
      sqlStatements.push(sql);
      console.log('---\n');
      
    } catch (error) {
      console.error(`❌ Erro ao processar ${user.username}:`, error.message);
    }
  }
  
  // Criar arquivo SQL de migração
  const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, '');
  const migrationName = `${timestamp}_fix_password_hashes.sql`;
  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', migrationName);
  
  const migrationContent = `-- Corrigir hashes de senha inválidos
-- Gerado automaticamente em: ${new Date().toISOString()}

${sqlStatements.join('\n\n')}

-- Verificar usuários corrigidos
SELECT 
  username,
  display_name,
  role,
  created_at,
  updated_at
FROM profiles 
WHERE username IN ('lucas', 'abassa')
ORDER BY username;`;
  
  try {
    fs.writeFileSync(migrationPath, migrationContent, 'utf8');
    console.log(`✅ Migração criada: ${migrationName}`);
    console.log(`📁 Localização: ${migrationPath}`);
  } catch (error) {
    console.error('❌ Erro ao criar migração:', error.message);
  }
  
  // Criar arquivo SQL standalone
  const standalonePath = path.join(__dirname, '..', 'fix-password-hashes.sql');
  
  try {
    fs.writeFileSync(standalonePath, migrationContent, 'utf8');
    console.log(`✅ Arquivo SQL standalone criado: fix-password-hashes.sql`);
  } catch (error) {
    console.error('❌ Erro ao criar arquivo standalone:', error.message);
  }
  
  console.log('\n=== INSTRUÇÕES ===');
  console.log('1. Execute a migração via Supabase Dashboard:');
  console.log('   - Vá para SQL Editor');
  console.log('   - Cole o conteúdo do arquivo fix-password-hashes.sql');
  console.log('   - Execute o SQL');
  console.log('');
  console.log('2. Ou use o Supabase CLI (se instalado):');
  console.log('   supabase db push');
  console.log('');
  console.log('3. Teste o login com as credenciais:');
  console.log('   - lucas / 12061409');
  console.log('   - abassa / xangoeoxum@2025@');
  console.log('');
  console.log('⚠️  IMPORTANTE: Altere as senhas após o primeiro login!');
}

// Executar correção
fixPasswordHashes().catch(console.error);