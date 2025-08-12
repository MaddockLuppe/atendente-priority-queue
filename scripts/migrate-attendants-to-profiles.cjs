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

async function migrateAttendantsToProfiles() {
  console.log('=== MIGRAÇÃO DE ATTENDANTS PARA PROFILES ===\n');
  
  try {
    // Passo 1: Buscar todos os attendants
    console.log('📋 Passo 1: Buscando attendants...');
    const { data: attendants, error: attendantsError } = await supabase
      .from('attendants')
      .select('*');
    
    if (attendantsError) {
      console.error('❌ Erro ao buscar attendants:', attendantsError.message);
      return;
    }
    
    console.log(`   ✅ ${attendants.length} attendants encontrados`);
    
    // Passo 2: Verificar estado atual da tabela profiles
    console.log('\n📋 Passo 2: Verificando tabela profiles...');
    const { count: profilesCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    
    console.log(`   📊 Profiles existentes: ${profilesCount}`);
    
    // Passo 3: Gerar SQL para migração
    console.log('\n📋 Passo 3: Gerando SQL de migração...');
    
    let migrationSQL = `-- MIGRAÇÃO DE ATTENDANTS PARA PROFILES\n-- Gerado automaticamente\n\n`;
    
    // Criar usuário admin primeiro
    const adminPasswordHash = await bcrypt.hash('admin123', 12);
    migrationSQL += `-- Inserir usuário admin\nINSERT INTO profiles (user_id, username, display_name, role, password_hash)\nVALUES (\n  '${crypto.randomUUID()}',\n  'admin',\n  'Administrador',\n  'admin',\n  '${adminPasswordHash}'\n)\nON CONFLICT (username) DO UPDATE SET\n  display_name = EXCLUDED.display_name,\n  role = EXCLUDED.role,\n  password_hash = EXCLUDED.password_hash;\n\n`;
    
    // Migrar attendants como usuários operadores
    migrationSQL += `-- Migrar attendants como operadores\n`;
    
    for (const attendant of attendants) {
      const userId = crypto.randomUUID();
      const username = attendant.name.toLowerCase().replace(/\s+/g, '');
      const defaultPassword = await bcrypt.hash('123456', 12); // Senha padrão
      
      migrationSQL += `INSERT INTO profiles (user_id, username, display_name, role, password_hash)\nVALUES (\n  '${userId}',\n  '${username}',\n  '${attendant.name}',\n  'operator',\n  '${defaultPassword}'\n)\nON CONFLICT (username) DO UPDATE SET\n  display_name = EXCLUDED.display_name,\n  role = EXCLUDED.role;\n\n`;
    }
    
    // Verificação final
    migrationSQL += `-- Verificação final\nSELECT username, display_name, role FROM profiles ORDER BY role, username;\n\nSELECT COUNT(*) as total_usuarios FROM profiles;`;
    
    // Passo 4: Salvar SQL em arquivo
    const fs = require('fs');
    const sqlFilePath = 'migrate-attendants-to-profiles.sql';
    fs.writeFileSync(sqlFilePath, migrationSQL);
    
    console.log(`   ✅ SQL gerado e salvo em: ${sqlFilePath}`);
    
    // Passo 5: Mostrar resumo
    console.log('\n📋 Passo 4: Resumo da migração:');
    console.log(`   👤 Admin: admin / admin123 (role: admin)`);
    console.log(`   👥 Operadores: ${attendants.length} usuários`);
    
    attendants.forEach((attendant, index) => {
      const username = attendant.name.toLowerCase().replace(/\s+/g, '');
      console.log(`      ${index + 1}. ${username} / 123456 (${attendant.name})`);
    });
    
    console.log('\n🚀 INSTRUÇÕES PARA EXECUÇÃO:');
    console.log('1. Acesse o Supabase Dashboard');
    console.log('2. Vá em SQL Editor');
    console.log(`3. Copie e cole o conteúdo do arquivo: ${sqlFilePath}`);
    console.log('4. Execute o SQL');
    console.log('5. Teste o login com: admin / admin123');
    
    console.log('\n📝 CREDENCIAIS GERADAS:');
    console.log('   🔑 Admin: admin / admin123');
    attendants.forEach((attendant) => {
      const username = attendant.name.toLowerCase().replace(/\s+/g, '');
      console.log(`   👤 ${attendant.name}: ${username} / 123456`);
    });
    
  } catch (error) {
    console.error('❌ Erro na migração:', error);
  }
}

// Executar
migrateAttendantsToProfiles();