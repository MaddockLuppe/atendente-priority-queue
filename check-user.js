// Script para verificar se o usuário 'lucas' existe no banco de dados e se a senha 'admin' está correta
// Este script deve ser executado em um ambiente com Node.js e as dependências instaladas

const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

// Configurações do Supabase
const SUPABASE_URL = "https://rahidenugbgnfrddtpxm.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhaGlkZW51Z2JnbmZyZGR0cHhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMjA4NTgsImV4cCI6MjA2OTg5Njg1OH0.ybEvAnEUQPjvxh6ipQypONxW6iDxvnPO6MurroW-lZA";

// Criar cliente Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// Dados do usuário a verificar
const username = 'lucas';
const password = 'admin';

async function checkUser() {
  try {
    console.log(`Verificando usuário: ${username}`);
    
    // Verificar se o usuário existe
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, display_name, role, password_hash')
      .eq('username', username)
      .single();

    if (error || !data) {
      console.error('Usuário não encontrado:', error?.message || 'Usuário não existe');
      return;
    }

    console.log('Usuário encontrado:', {
      id: data.id,
      username: data.username,
      displayName: data.display_name,
      role: data.role
    });

    // Verificar se a senha está correta
    const isPasswordValid = await bcrypt.compare(password, data.password_hash);
    
    if (isPasswordValid) {
      console.log('Senha está correta!');
    } else {
      console.log('Senha está incorreta!');
      
      // Mostrar o hash da senha armazenado
      console.log('Hash da senha armazenado:', data.password_hash);
      
      // Gerar um hash da senha fornecida para comparação
      const newHash = await bcrypt.hash(password, 10);
      console.log('Hash da senha fornecida:', newHash);
    }
    
    // Verificar a discrepância entre os papéis de usuário
    console.log('\nVerificando papéis de usuário:');
    console.log('Papel no banco de dados:', data.role);
    console.log('Papéis esperados no banco de dados: "admin" ou "user"');
    console.log('Papéis definidos no código: "admin", "attendant" ou "viewer"');
    
    if (data.role !== 'admin' && data.role !== 'user' && 
        data.role !== 'attendant' && data.role !== 'viewer') {
      console.log('ALERTA: O papel do usuário não corresponde a nenhum dos valores esperados!');
    }
  } catch (error) {
    console.error('Erro ao verificar usuário:', error);
  }
}

// Executar a função
checkUser();