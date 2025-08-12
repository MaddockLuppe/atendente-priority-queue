const { Client } = require('pg');
const bcrypt = require('bcryptjs');

// URL do PostgreSQL fornecida pelo usuário
// Substitua [YOUR-PASSWORD] pela senha real
const connectionString = 'postgresql://postgres:[YOUR-PASSWORD]@db.rahidenugbgnfrddtpxm.supabase.co:5432/postgres';

async function testDirectPostgres() {
  console.log('=== TESTE DIRETO NO POSTGRESQL ===\n');
  
  // Verificar se a senha foi substituída
  if (connectionString.includes('[YOUR-PASSWORD]')) {
    console.log('❌ ERRO: Substitua [YOUR-PASSWORD] pela senha real do PostgreSQL');
    console.log('   URL atual:', connectionString);
    console.log('\n💡 Para obter a senha:');
    console.log('   1. Acesse https://supabase.com');
    console.log('   2. Vá em Settings > Database');
    console.log('   3. Copie a Connection String');
    console.log('   4. Substitua [YOUR-PASSWORD] pela senha real');
    return;
  }
  
  const client = new Client({
    connectionString: connectionString,
  });
  
  try {
    console.log('1. Conectando ao PostgreSQL...');
    await client.connect();
    console.log('✅ Conectado com sucesso!');
    
    // 1. Verificar se a tabela profiles existe
    console.log('\n2. Verificando se a tabela profiles existe...');
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('❌ Tabela profiles não existe!');
      return;
    }
    console.log('✅ Tabela profiles existe');
    
    // 2. Verificar estrutura da tabela
    console.log('\n3. Verificando estrutura da tabela profiles...');
    const structure = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'profiles'
      ORDER BY ordinal_position;
    `);
    
    console.log('📋 Colunas da tabela profiles:');
    structure.rows.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    
    // 3. Contar usuários
    console.log('\n4. Contando usuários na tabela...');
    const countResult = await client.query('SELECT COUNT(*) as total FROM profiles');
    const totalUsers = parseInt(countResult.rows[0].total);
    console.log(`📊 Total de usuários: ${totalUsers}`);
    
    if (totalUsers === 0) {
      console.log('❌ Tabela profiles está vazia!');
      console.log('\n💡 SOLUÇÃO: Execute o SQL para criar o usuário admin');
      return;
    }
    
    // 4. Listar todos os usuários
    console.log('\n5. Listando todos os usuários...');
    const usersResult = await client.query(`
      SELECT id, username, display_name, role, created_at
      FROM profiles
      ORDER BY created_at DESC
    `);
    
    console.log('👥 Usuários encontrados:');
    usersResult.rows.forEach((user, index) => {
      console.log(`   ${index + 1}. ID: ${user.id}`);
      console.log(`      Username: ${user.username}`);
      console.log(`      Display Name: ${user.display_name || 'N/A'}`);
      console.log(`      Role: ${user.role}`);
      console.log(`      Created: ${user.created_at}`);
      console.log('');
    });
    
    // 5. Buscar especificamente o usuário admin
    console.log('6. Buscando usuário admin...');
    const adminResult = await client.query(`
      SELECT id, username, display_name, role, password_hash
      FROM profiles
      WHERE username = 'admin'
    `);
    
    if (adminResult.rows.length === 0) {
      console.log('❌ Usuário admin não encontrado!');
      console.log('\n💡 Usuários disponíveis:');
      usersResult.rows.forEach(user => {
        console.log(`   - ${user.username} (${user.role})`);
      });
    } else {
      const admin = adminResult.rows[0];
      console.log('✅ Usuário admin encontrado:');
      console.log(`   ID: ${admin.id}`);
      console.log(`   Username: ${admin.username}`);
      console.log(`   Display Name: ${admin.display_name}`);
      console.log(`   Role: ${admin.role}`);
      console.log(`   Tem password_hash: ${!!admin.password_hash}`);
      
      // 6. Testar senha
      if (admin.password_hash) {
        console.log('\n7. Testando senha admin123...');
        const isValid = await bcrypt.compare('admin123', admin.password_hash);
        console.log(`   Resultado: ${isValid ? '✅ SENHA CORRETA' : '❌ SENHA INCORRETA'}`);
        
        if (!isValid) {
          console.log('\n🔍 Testando outras senhas comuns...');
          const commonPasswords = ['admin', 'password', '123456', 'admin1234'];
          for (const pwd of commonPasswords) {
            const test = await bcrypt.compare(pwd, admin.password_hash);
            console.log(`   ${pwd}: ${test ? '✅ CORRETA' : '❌ INCORRETA'}`);
          }
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    
    if (error.code === 'ENOTFOUND') {
      console.log('\n💡 Erro de conexão - verifique:');
      console.log('   1. URL do banco está correta');
      console.log('   2. Senha está correta');
      console.log('   3. Conexão com internet');
    } else if (error.code === '28P01') {
      console.log('\n💡 Erro de autenticação - senha incorreta');
    }
  } finally {
    await client.end();
  }
}

// Executar
testDirectPostgres();