import bcrypt from 'bcryptjs';

// Função para testar hashes de senha
async function testPasswordHashes() {
  console.log('=== TESTE DE HASHES DE SENHA ===\n');
  
  // Testes com diferentes usuários e senhas
  const tests = [
    {
      username: 'lucas',
      password: '12061409',
      hash: '$2b$10$ltSub8pDfKD3A4jy9ckh9uD3MO.GFi2lXssP/9WgkLyp8VJGcrEAe'
    },
    {
      username: 'abassa',
      password: 'xangoeoxum@2025@',
      hash: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'
    }
  ];
  
  for (const test of tests) {
    console.log(`Testando usuário: ${test.username}`);
    console.log(`Senha: ${test.password}`);
    console.log(`Hash: ${test.hash}`);
    
    try {
      const isValid = await bcrypt.compare(test.password, test.hash);
      console.log(`Resultado: ${isValid ? '✅ VÁLIDO' : '❌ INVÁLIDO'}`);
      
      // Gerar novo hash para comparação
      const newHash = await bcrypt.hash(test.password, 10);
      console.log(`Novo hash gerado: ${newHash}`);
      
      // Testar novo hash
      const newHashValid = await bcrypt.compare(test.password, newHash);
      console.log(`Novo hash válido: ${newHashValid ? '✅ SIM' : '❌ NÃO'}`);
      
    } catch (error) {
      console.log(`❌ ERRO: ${error.message}`);
    }
    
    console.log('---\n');
  }
  
  // Teste adicional: gerar hashes corretos
  console.log('=== GERANDO HASHES CORRETOS ===\n');
  
  const passwords = [
    { user: 'lucas', pass: '12061409' },
    { user: 'abassa', pass: 'xangoeoxum@2025@' }
  ];
  
  for (const item of passwords) {
    try {
      const hash = await bcrypt.hash(item.pass, 10);
      console.log(`Usuário: ${item.user}`);
      console.log(`Senha: ${item.pass}`);
      console.log(`Hash correto: ${hash}`);
      
      // Verificar se o hash funciona
      const works = await bcrypt.compare(item.pass, hash);
      console.log(`Funciona: ${works ? '✅ SIM' : '❌ NÃO'}`);
      console.log('---\n');
    } catch (error) {
      console.log(`❌ ERRO para ${item.user}: ${error.message}\n`);
    }
  }
}

// Executar teste
testPasswordHashes().catch(console.error);