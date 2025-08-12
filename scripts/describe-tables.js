// Script para descrever a estrutura das tabelas do banco de dados
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Ler variáveis de ambiente do arquivo .env
let supabaseUrl = 'https://exemplo.supabase.co';
let supabaseAnonKey = 'exemplo_key';

const hasEnvFile = fs.existsSync('.env');

if (hasEnvFile) {
  try {
    const envContent = fs.readFileSync('.env', 'utf8');
    const envLines = envContent.split('\n');
    
    for (const line of envLines) {
      if (line.startsWith('VITE_SUPABASE_URL=')) {
        supabaseUrl = line.split('=')[1].trim();
      }
      if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) {
        supabaseAnonKey = line.split('=')[1].trim();
      }
    }
  } catch (error) {
    console.log('⚠️  Erro ao ler arquivo .env:', error.message);
  }
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function describeTable(tableName) {
  console.log(`\n📋 TABELA: ${tableName.toUpperCase()}`);
  console.log('=' .repeat(50));
  
  try {
    // Tentar obter uma amostra dos dados
    const { data: sampleData, error: sampleError } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (sampleError) {
      console.log(`❌ Erro ao acessar tabela: ${sampleError.message}`);
      return;
    }
    
    // Contar registros
    const { count, error: countError } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });
    
    if (!countError) {
      console.log(`📊 Total de registros: ${count}`);
    }
    
    // Mostrar estrutura baseada na amostra
    if (sampleData && sampleData.length > 0) {
      console.log('\n🏗️  ESTRUTURA (baseada em dados existentes):');
      const sample = sampleData[0];
      Object.keys(sample).forEach(column => {
        const value = sample[column];
        const type = typeof value;
        const isNull = value === null;
        console.log(`   ${column}: ${isNull ? 'NULL' : type} ${isNull ? '' : '- Exemplo: ' + JSON.stringify(value)}`);
      });
    } else {
      console.log('\n📝 Tabela vazia - não é possível determinar estrutura');
    }
    
  } catch (error) {
    console.log(`❌ Erro ao descrever tabela: ${error.message}`);
  }
}

async function describeTables() {
  console.log('=== DESCRIÇÃO DETALHADA DAS TABELAS ===\n');
  
  console.log('📋 CONFIGURAÇÃO:');
  console.log(`   URL: ${supabaseUrl}`);
  console.log(`   Chave: ${supabaseAnonKey.substring(0, 15)}...`);
  
  const knownTables = ['profiles', 'attendants', 'tickets', 'attendance_history', 'queue_state'];
  
  for (const tableName of knownTables) {
    await describeTable(tableName);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ RESUMO DAS TABELAS ENCONTRADAS:');
  console.log('   • profiles - Perfis de usuários');
  console.log('   • attendants - Atendentes');
  console.log('   • tickets - Tickets/Chamados');
  console.log('   • attendance_history - Histórico de atendimentos');
  console.log('   • queue_state - Estado da fila');
  console.log('\n💡 Para mais detalhes sobre uma tabela específica, consulte a seção correspondente acima.');
}

// Executar função
describeTables();