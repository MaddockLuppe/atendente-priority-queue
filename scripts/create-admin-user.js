import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createAdminUser() {
  const username = 'lucas';
  const password = '12061409';
  const displayName = 'Lucas - Administrador';
  const role = 'admin';
  
  try {
    // Gerar hash da senha
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    console.log('\n=== CRIAÇÃO DE USUÁRIO ADMINISTRADOR ===');
    console.log(`Usuário: ${username}`);
    console.log(`Senha: ${password}`);
    console.log(`Hash gerado: ${passwordHash}`);
    
    // Criar timestamp para o nome do arquivo de migração
    const timestamp = new Date().toISOString().replace(/[-:T]/g, '').split('.')[0];
    const migrationFileName = `${timestamp}_create_admin_user_lucas.sql`;
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', migrationFileName);
    
    // Conteúdo da migração SQL
    const migrationContent = `-- Criar usuário administrador: ${username}
-- Senha: ${password}
-- Gerado automaticamente em: ${new Date().toISOString()}

INSERT INTO profiles (user_id, username, display_name, role, password_hash)
VALUES (
  gen_random_uuid(),
  '${username}',
  '${displayName}',
  '${role}',
  '${passwordHash}'
) ON CONFLICT (username) 
DO UPDATE SET 
  password_hash = '${passwordHash}',
  display_name = '${displayName}',
  role = '${role}',
  updated_at = now();

-- Verificar se o usuário foi criado corretamente
SELECT 
  id,
  username,
  display_name,
  role,
  created_at
FROM profiles 
WHERE username = '${username}';
`;
    
    // Escrever arquivo de migração
    fs.writeFileSync(migrationPath, migrationContent);
    
    console.log(`\n✅ Migração criada: ${migrationFileName}`);
    console.log(`📁 Localização: ${migrationPath}`);
    console.log('\n🔧 Para aplicar a migração:');
    console.log('1. Execute: supabase db push');
    console.log('2. Ou aplique manualmente no Supabase Dashboard');
    console.log('\n⚠️  IMPORTANTE:');
    console.log('- Guarde essas credenciais em local seguro');
    console.log('- Altere a senha após o primeiro login');
    console.log('- Este usuário terá privilégios de administrador');
    
  } catch (error) {
    console.error('❌ Erro ao criar usuário administrador:', error);
    process.exit(1);
  }
}

// Executar função principal
createAdminUser();