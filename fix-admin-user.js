// Script para verificar e corrigir o usuário admin no banco de dados
const fetch = require('node-fetch');
const bcrypt = require('bcryptjs');

const SUPABASE_URL = "https://rahidenugbgnfrddtpxm.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhaGlkZW51Z2JnbmZyZGR0cHhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMjA4NTgsImV4cCI6MjA2OTg5Njg1OH0.ybEvAnEUQPjvxh6ipQypONxW6iDxvnPO6MurroW-lZA";

async function checkAndFixAdminUser() {
  try {
    console.log('Verificando usuário admin...');
    
    // Verificar se o usuário admin existe
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?username=eq.admin&select=id,username,display_name,role,password_hash`,
      {
        method: 'GET',
        headers: {
          'apikey': SUPABASE_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data || data.length === 0) {
      console.log('Usuário admin não encontrado. Criando...');
      await createAdminUser();
      return;
    }
    
    const adminUser = data[0];
    console.log('Usuário admin encontrado:', {
      id: adminUser.id,
      username: adminUser.username,
      display_name: adminUser.display_name,
      role: adminUser.role
    });
    
    // Verificar se a senha está correta (admin123)
    const correctPasswordHash = '$2a$10$K.gF7qzO8wN6hHhGqf/ZLeQZ8xVlM6HwZ8zP9vGpU6lK8yZ7xJ1Xu';
    const isCorrectHash = adminUser.password_hash === correctPasswordHash;
    
    if (!isCorrectHash) {
      console.log('Hash da senha do admin não corresponde ao esperado. Atualizando...');
      await updateAdminPassword(adminUser.id);
    } else {
      console.log('Hash da senha do admin está correto.');
      
      // Teste de verificação da senha
      const testPassword = 'admin123';
      const isPasswordValid = await bcrypt.compare(testPassword, adminUser.password_hash);
      console.log(`Teste de senha 'admin123': ${isPasswordValid ? 'Válida' : 'Inválida'}`);
    }
    
    // Verificar se o papel (role) está correto
    if (adminUser.role !== 'admin') {
      console.log(`Papel do usuário admin incorreto: ${adminUser.role}. Atualizando para 'admin'...`);
      await updateAdminRole(adminUser.id);
    } else {
      console.log('Papel do usuário admin está correto.');
    }
    
  } catch (error) {
    console.error('Erro ao verificar/corrigir usuário admin:', error);
  }
}

async function createAdminUser() {
  try {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles`,
      {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: crypto.randomUUID(),
          username: 'admin',
          display_name: 'Administrador',
          role: 'admin',
          password_hash: hashedPassword
        })
      }
    );
    
    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }
    
    console.log('Usuário admin criado com sucesso!');
  } catch (error) {
    console.error('Erro ao criar usuário admin:', error);
  }
}

async function updateAdminPassword(adminId) {
  try {
    // Usar o hash exato do arquivo de migração
    const correctPasswordHash = '$2a$10$K.gF7qzO8wN6hHhGqf/ZLeQZ8xVlM6HwZ8zP9vGpU6lK8yZ7xJ1Xu';
    
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?id=eq.${adminId}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          password_hash: correctPasswordHash
        })
      }
    );
    
    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }
    
    console.log('Senha do admin atualizada com sucesso!');
  } catch (error) {
    console.error('Erro ao atualizar senha do admin:', error);
  }
}

async function updateAdminRole(adminId) {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?id=eq.${adminId}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          role: 'admin'
        })
      }
    );
    
    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }
    
    console.log('Papel do admin atualizado com sucesso!');
  } catch (error) {
    console.error('Erro ao atualizar papel do admin:', error);
  }
}

// Executar a verificação
checkAndFixAdminUser();