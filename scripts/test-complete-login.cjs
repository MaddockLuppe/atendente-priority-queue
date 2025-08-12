const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const { z } = require('zod');
require('dotenv').config();

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Credenciais do Supabase não encontradas no .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Schema de validação (copiado do validation.ts)
const loginSchema = z.object({
  username: z.string()
    .min(1, "Nome de usuário é obrigatório")
    .max(50, "Nome de usuário deve ter no máximo 50 caracteres")
    .regex(/^[a-zA-Z0-9_-]+$/, "Nome de usuário deve conter apenas letras, números, _ e -"),
  password: z.string()
    .min(1, "Senha é obrigatória")
});

// Função de sanitização
function sanitizeString(input) {
  if (typeof input !== 'string') return '';
  return input
    .trim()
    .replace(/[<>"'&]/g, '') // Remove caracteres perigosos
    .slice(0, 255); // Limita tamanho
}

async function testCompleteLogin() {
  console.log('=== TESTE COMPLETO DE LOGIN ===\n');
  
  const username = 'admin';
  const password = 'admin123';
  
  try {
    console.log('1. Testando credenciais:');
    console.log('   Username:', username);
    console.log('   Password:', password);
    console.log('');
    
    // 1. Sanitizar entradas
    console.log('2. Sanitizando entradas...');
    const sanitizedUsername = sanitizeString(username);
    const sanitizedPassword = password; // Não sanitizar senha
    console.log('   Username sanitizado:', sanitizedUsername);
    console.log('   Password (não sanitizada):', sanitizedPassword);
    console.log('');
    
    // 2. Validar com Zod
    console.log('3. Validando com schema Zod...');
    const validation = loginSchema.safeParse({
      username: sanitizedUsername,
      password: sanitizedPassword
    });
    
    if (!validation.success) {
      console.log('❌ Validação falhou:');
      validation.error.errors.forEach(err => {
        console.log('   -', err.message);
      });
      return;
    }
    console.log('✅ Validação passou');
    console.log('');
    
    // 3. Buscar usuário no banco
    console.log('4. Buscando usuário no banco...');
    const { data: profileData, error } = await supabase
      .from('profiles')
      .select('id, username, display_name, role, password_hash')
      .eq('username', sanitizedUsername)
      .single();
    
    if (error || !profileData) {
      console.log('❌ Usuário não encontrado:');
      console.log('   Error:', error?.message || 'Nenhum dado retornado');
      console.log('   Code:', error?.code);
      console.log('   Details:', error?.details);
      
      // Verificar se existem usuários na tabela
      console.log('\n5. Verificando todos os usuários na tabela...');
      const { data: allUsers, error: allError } = await supabase
        .from('profiles')
        .select('id, username, display_name, role');
      
      if (allError) {
        console.log('❌ Erro ao buscar todos os usuários:', allError.message);
      } else {
        console.log('📊 Total de usuários encontrados:', allUsers?.length || 0);
        if (allUsers && allUsers.length > 0) {
          allUsers.forEach((user, index) => {
            console.log(`   ${index + 1}. Username: ${user.username}, Role: ${user.role}`);
          });
        } else {
          console.log('   Tabela profiles está vazia!');
          console.log('\n💡 SOLUÇÃO: Execute o SQL no Supabase Dashboard:');
          console.log('   Arquivo: create-admin-final.sql');
        }
      }
      return;
    }
    
    console.log('✅ Usuário encontrado:');
    console.log('   ID:', profileData.id);
    console.log('   Username:', profileData.username);
    console.log('   Display Name:', profileData.display_name);
    console.log('   Role:', profileData.role);
    console.log('   Tem password_hash:', !!profileData.password_hash);
    console.log('');
    
    // 4. Verificar senha com bcrypt
    console.log('5. Verificando senha com bcrypt...');
    console.log('   Password fornecida:', password);
    console.log('   Hash no banco:', profileData.password_hash);
    
    const isValid = await bcrypt.compare(password, profileData.password_hash);
    console.log('   Resultado bcrypt.compare:', isValid);
    
    if (isValid) {
      console.log('\n🎉 LOGIN SERIA BEM-SUCEDIDO!');
      console.log('   Usuário seria logado como:', profileData.display_name);
      console.log('   Com papel:', profileData.role);
    } else {
      console.log('\n❌ SENHA INCORRETA!');
      console.log('   A senha fornecida não confere com o hash armazenado');
      
      // Testar se o hash está correto para admin123
      console.log('\n6. Testando hashes conhecidos...');
      const knownHashes = [
        '$2b$10$5EnGfQWsZ2O9xX.TdNYiu.vvkrZCOEOnIFlzhQPYp03ojsqeUl77O', // Hash do SQL
        '$2b$10$kCd0QPW/HbC/aaXC8WKohudJSyjPOTbNWK/uE8fa/emPucEQOC12S', // Hash gerado
      ];
      
      for (let i = 0; i < knownHashes.length; i++) {
        const testResult = await bcrypt.compare('admin123', knownHashes[i]);
        console.log(`   Hash ${i + 1}: ${testResult ? '✅ VÁLIDO' : '❌ INVÁLIDO'}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar
testCompleteLogin();