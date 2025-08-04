// Script para atualizar a senha do usuário admin para admin123
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

// Configurações do Supabase
const SUPABASE_URL = "https://rahidenugbgnfrddtpxm.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhaGlkZW51Z2JnbmZyZGR0cHhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMjA4NTgsImV4cCI6MjA2OTg5Njg1OH0.ybEvAnEUQPjvxh6ipQypONxW6iDxvnPO6MurroW-lZA";

// Criar cliente Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// Dados do usuário a atualizar
const username = 'admin';
const newPassword = 'admin123';

async function updateAdminPassword() {
  try {
    console.log(`Buscando usuário: ${username}`);
    
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

    // Gerar hash da nova senha
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Atualizar a senha do usuário
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ password_hash: hashedPassword })
      .eq('username', username);

    if (updateError) {
      console.error('Erro ao atualizar senha:', updateError);
      return;
    }

    console.log(`Senha do usuário ${username} atualizada com sucesso para '${newPassword}'`);
  } catch (error) {
    console.error('Erro ao atualizar senha:', error);
  }
}

// Executar a função
updateAdminPassword();