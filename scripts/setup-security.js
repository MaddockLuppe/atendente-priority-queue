#!/usr/bin/env node

/**
 * Script de configuração de segurança
 * Execute este script após clonar o repositório
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function generateSecureKey(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

function checkFileExists(filePath) {
  return fs.existsSync(filePath);
}

function createEnvFile() {
  const envPath = path.join(process.cwd(), '.env');
  const envExamplePath = path.join(process.cwd(), '.env.example');
  
  if (checkFileExists(envPath)) {
    log('⚠️  Arquivo .env já existe. Pulando criação...', 'yellow');
    return;
  }
  
  if (!checkFileExists(envExamplePath)) {
    log('❌ Arquivo .env.example não encontrado!', 'red');
    return;
  }
  
  try {
    const envExample = fs.readFileSync(envExamplePath, 'utf8');
    let envContent = envExample;
    
    // Gerar chaves seguras
    const sessionSecret = generateSecureKey();
    const csrfSecret = generateSecureKey(16);
    
    // Substituir placeholders se existirem
    envContent = envContent.replace('your_session_secret_here', sessionSecret);
    envContent = envContent.replace('your_csrf_secret_here', csrfSecret);
    
    fs.writeFileSync(envPath, envContent);
    log('✅ Arquivo .env criado com sucesso!', 'green');
    log('🔑 Chaves de segurança geradas automaticamente', 'blue');
  } catch (error) {
    log(`❌ Erro ao criar arquivo .env: ${error.message}`, 'red');
  }
}

function checkSecurityDependencies() {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  
  if (!checkFileExists(packageJsonPath)) {
    log('❌ package.json não encontrado!', 'red');
    return;
  }
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    const securityDeps = {
      'bcryptjs': 'Hash de senhas',
      'zod': 'Validação de esquemas',
      '@types/bcryptjs': 'Tipos TypeScript para bcrypt'
    };
    
    log('\n🔍 Verificando dependências de segurança:', 'blue');
    
    Object.entries(securityDeps).forEach(([dep, description]) => {
      if (dependencies[dep]) {
        log(`  ✅ ${dep} - ${description}`, 'green');
      } else {
        log(`  ❌ ${dep} - ${description} (FALTANDO)`, 'red');
      }
    });
  } catch (error) {
    log(`❌ Erro ao verificar dependências: ${error.message}`, 'red');
  }
}

function checkSupabaseMigrations() {
  const migrationsPath = path.join(process.cwd(), 'supabase', 'migrations');
  
  if (!checkFileExists(migrationsPath)) {
    log('❌ Diretório de migrações do Supabase não encontrado!', 'red');
    return;
  }
  
  const securityMigration = path.join(migrationsPath, '20250115000000_security_improvements.sql');
  
  if (checkFileExists(securityMigration)) {
    log('✅ Migração de segurança encontrada', 'green');
  } else {
    log('❌ Migração de segurança não encontrada!', 'red');
    log('   Execute: supabase db push', 'yellow');
  }
}

function displaySecurityChecklist() {
  log('\n📋 CHECKLIST DE SEGURANÇA:', 'bold');
  log('\n🔧 Configuração Inicial:', 'blue');
  log('  [ ] Configurar variáveis de ambiente (.env)');
  log('  [ ] Executar migração de segurança (supabase db push)');
  log('  [ ] Alterar credenciais padrão do banco');
  
  log('\n🛡️  Antes da Produção:', 'blue');
  log('  [ ] Configurar HTTPS');
  log('  [ ] Configurar firewall');
  log('  [ ] Habilitar backup automático');
  log('  [ ] Configurar monitoramento');
  log('  [ ] Testar recuperação de desastre');
  
  log('\n🔄 Manutenção Regular:', 'blue');
  log('  [ ] Rotacionar chaves (trimestral)');
  log('  [ ] Auditoria de usuários (mensal)');
  log('  [ ] Revisão de logs (semanal)');
  log('  [ ] Atualizar dependências (mensal)');
}

function displayWarnings() {
  log('\n⚠️  AVISOS IMPORTANTES:', 'yellow');
  log('\n🚨 CRÍTICO: As senhas nas migrações estão expostas!');
  log('   - Altere IMEDIATAMENTE as credenciais padrão');
  log('   - Crie novos usuários admin com senhas seguras');
  log('   - Remova usuários com credenciais expostas');
  
  log('\n🔐 Configuração do Supabase:');
  log('   - Configure as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY');
  log('   - Desabilite signup público no dashboard');
  log('   - Configure rate limiting');
  log('   - Habilite SSL obrigatório');
}

function main() {
  log('🔒 CONFIGURAÇÃO DE SEGURANÇA - Sistema de Atendimento', 'bold');
  log('=' .repeat(60), 'blue');
  
  // Verificações e configurações
  createEnvFile();
  checkSecurityDependencies();
  checkSupabaseMigrations();
  
  // Exibir informações importantes
  displayWarnings();
  displaySecurityChecklist();
  
  log('\n📚 Para mais informações, consulte:', 'blue');
  log('   - SECURITY.md (guia completo de segurança)');
  log('   - .env.example (variáveis de ambiente)');
  
  log('\n✅ Configuração de segurança concluída!', 'green');
  log('🚀 Execute: npm run dev (para desenvolvimento)', 'blue');
  log('🏗️  Execute: npm run build (para produção)', 'blue');
}

// Executar a função principal
main();

export {
  generateSecureKey,
  createEnvFile,
  checkSecurityDependencies,
  checkSupabaseMigrations
};