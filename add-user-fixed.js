// Script para adicionar um novo usuário ao sistema com papel compatível
// Este script deve ser executado em um ambiente com Node.js e as dependências instaladas

const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

// Configurações do Supabase
const SUPABASE_URL = "https://rahidenugbgnfrddtpxm.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhaGlkZW51Z2JnbmZyZGR0cHhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMjA4NTgsImV4cCI6MjA2OTg5Njg1OH0.ybEvAnEUQPjvxh6ipQypONxW6iDxvnPO6MurroW-lZA";

// Criar cliente Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// Dados do novo usuário
const username = 'lucas';
const password = 'admin';
const displayName = 'Lucas';
const role = 'admin'; // Deve ser 'admin' ou 'user' conforme definido no banco de dados

async function addUser() {
  try {
    // Verificar se o usuário já existe
    const { data: existingUser, error: checkError } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', username)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 é o código para "não encontrado", que é o que queremos
      console.error('Erro ao verificar usuário existente:', checkError);
      return;
    }

    if (existingUser) {
      console.log(`Usuário '${username}' já existe. Tentando atualizar a senha...`);
      
      // Atualizar a senha do usuário existente
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ password_hash: hashedPassword })
        .eq('username', username);
      
      if (updateError) {
        console.error('Erro ao atualizar senha:', updateError);
        return;
      }
      
      console.log(`Senha do usuário '${username}' atualizada com sucesso!`);
      return;
    }

    // Gerar hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Inserir novo usuário
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        user_id: crypto.randomUUID(),
        username,
        display_name: displayName,
        role,
        password_hash: hashedPassword
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao adicionar usuário:', error);
      return;
    }

    console.log('Usuário criado com sucesso:', {
      id: data.id,
      username: data.username,
      displayName: data.display_name,
      role: data.role
    });
  } catch (error) {
    console.error('Erro ao adicionar usuário:', error);
  }
}

// Executar a função
addUser();