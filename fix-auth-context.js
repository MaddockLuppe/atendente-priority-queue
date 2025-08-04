// Script para corrigir a discrepância entre os tipos de usuário no banco de dados e no código
const fs = require('fs');
const path = require('path');

// Caminho para o arquivo AuthContext.tsx
const authContextPath = path.join(__dirname, 'src', 'contexts', 'AuthContext.tsx');

async function fixAuthContext() {
  try {
    console.log('Lendo o arquivo AuthContext.tsx...');
    
    // Ler o conteúdo atual do arquivo
    const content = fs.readFileSync(authContextPath, 'utf8');
    
    // Verificar se o arquivo contém a definição incorreta de UserRole
    if (content.includes("export type UserRole = 'admin' | 'attendant' | 'viewer';")) {
      console.log('Encontrada definição incorreta de UserRole. Corrigindo...');
      
      // Substituir a definição de UserRole para corresponder ao banco de dados
      const updatedContent = content.replace(
        "export type UserRole = 'admin' | 'attendant' | 'viewer';",
        "export type UserRole = 'admin' | 'user';"
      );
      
      // Escrever o conteúdo atualizado de volta no arquivo
      fs.writeFileSync(authContextPath, updatedContent, 'utf8');
      
      console.log('Arquivo AuthContext.tsx atualizado com sucesso!');
      console.log('A definição de UserRole agora corresponde aos tipos aceitos no banco de dados: "admin" e "user"');
    } else if (content.includes("export type UserRole = 'admin' | 'user';")) {
      console.log('A definição de UserRole já está correta no arquivo.');
    } else {
      console.log('Não foi possível encontrar a definição de UserRole no formato esperado.');
      console.log('Verifique manualmente o arquivo AuthContext.tsx.');
    }
  } catch (error) {
    console.error('Erro ao atualizar o arquivo AuthContext.tsx:', error);
  }
}

// Executar a função
fixAuthContext();