// Script para verificar se o usuário admin existe e se a senha admin123 está correta
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

// Configurações do Supabase
const SUPABASE_URL = "https://rahidenugbgnfrddtpxm.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhaGlkZW51Z2JnbmZyZGR0cHhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMjA4NTgsImV4cCI6MjA2OTg5Njg1OH0.ybEvAnEUQPjvxh6ipQypONxW6iDxvnPO6MurroW-lZA";

// Criar cliente Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// Dados do usuário a verificar
const username = 'admin';
const password = 'admin123';

async function checkUser() {
  try {
    console.log(`Verificando usuário: ${username}`);
    
    // Buscar o usuário no banco de dados
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, display_name, role, password_hash')
      .eq('username', username)
      .single();

    if (error || !data) {
      console.error('Erro ao buscar usuário ou usuário não encontrado:', error);
      return;
    }

    console.log('Usuário encontrado:', {
      id: data.id,
      username: data.username,
      display_name: data.display_name,
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
      
      // Gerar um novo hash para a senha fornecida para comparação
      const newHash = await bcrypt.hash(password, 10);
      console.log('Novo hash gerado para a senha fornecida:', newHash);
    }
    
    // Verificar a discrepância entre os tipos de usuário
    console.log('\nVerificando discrepância de tipos de usuário:');
    console.log('Tipo de usuário no banco de dados:', data.role);
    console.log('Tipos de usuário aceitos no banco de dados: "admin" e "user"');
    console.log('Tipos de usuário definidos no código: "admin", "attendant" e "viewer"');
    
    if (data.role !== 'admin' && data.role !== 'attendant' && data.role !== 'viewer') {
      console.log('PROBLEMA DETECTADO: O tipo de usuário no banco de dados não corresponde aos tipos aceitos no código!');
    }
  } catch (error) {
    console.error('Erro ao verificar usuário:', error);
  }
}

// Executar a função
checkUser();