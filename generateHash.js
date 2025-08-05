import bcrypt from 'bcryptjs';

// Script para gerar hash da senha
const generatePasswordHash = async () => {
  const password = 'xangoeoxum@2025@';
  const hash = await bcrypt.hash(password, 10);
  console.log('Hash gerado:', hash);
  
  // Teste de verificação
  const isValid = await bcrypt.compare(password, hash);
  console.log('Verificação:', isValid);
  
  return hash;
};

generatePasswordHash();