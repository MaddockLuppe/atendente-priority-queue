// Script para criar o usuário admin caso não exista
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Configurações do Supabase
const SUPABASE_URL = "https://rahidenugbgnfrddtpxm.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhaGlkZW51Z2JnbmZyZGR0cHhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMjA4NTgsImV4cCI6MjA2OTg5Njg1OH0.ybEvAnEUQPjvxh6ipQypONxW6iDxvnPO6MurroW-lZA";

// Criar cliente Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// Dados do usuário administrador
const username = 'lucas';
const password = '12345';
const displayName = 'Lucas Administrador';
const role = 'admin';

async function createAdminUser() {
  try {
    console.log('Iniciando correção do login...');
    console.log('Passo 1: Verificando usuário lucas...');
    
    // Verificar se o usuário admin já existe
    const { data: existingUser, error: checkError } = await supabase
      .from('profiles')
      .select('id, username, display_name, role, password_hash')
      .eq('username', username)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 é o código para "não encontrado", que é o que esperamos se o usuário não existir
      console.error('Erro ao verificar usuário existente:', checkError);
      return;
    }

    if (existingUser) {
      console.log(`Usuário lucas encontrado (ID: ${existingUser.id}). Verificando senha...`);
      
      // Verificar se a senha está correta
      const isPasswordValid = await bcrypt.compare(password, existingUser.password_hash);
      
      if (isPasswordValid) {
        console.log('A senha do usuário lucas está correta!');
        console.log('Login corrigido com sucesso!');
      } else {
        console.log('A senha do usuário lucas está incorreta. Atualizando...');
        
        // Atualizar a senha do usuário existente
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ 
            password_hash: hashedPassword,
            role: 'admin' // Garantir que o papel também está correto
          })
          .eq('id', existingUser.id);
        
        if (updateError) {
          console.error('Erro ao atualizar senha:', updateError);
          return;
        }
        
        console.log('Senha do usuário lucas atualizada com sucesso!');
        console.log('Login corrigido com sucesso!');
      }
      return;
    }

    console.log('Usuário lucas não encontrado. Criando novo usuário administrador...');
    
    // Gerar hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Gerar UUID para user_id
    const userId = crypto.randomUUID();
    
    // Inserir novo usuário admin
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        user_id: userId,
        username,
        display_name: displayName,
        role,
        password_hash: hashedPassword
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao adicionar usuário lucas:', error);
      return;
    }

    console.log('Usuário lucas criado com sucesso:', {
      id: data.id,
      username: data.username,
      displayName: data.display_name,
      role: data.role
    });
    console.log('Login corrigido com sucesso!');
  } catch (error) {
    console.error('Erro ao criar/verificar usuário lucas:', error);
  }
}

// Executar a função
createAdminUser();