// Script para listar todas as tabelas do banco de dados
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

async function listTables() {
  console.log('=== LISTAGEM DE TABELAS DO BANCO DE DADOS ===\n');
  
  console.log('📋 CONFIGURAÇÃO:');
  console.log(`   URL: ${supabaseUrl}`);
  console.log(`   Chave: ${supabaseAnonKey.substring(0, 15)}...\n`);
  
  try {
    // Consulta para listar todas as tabelas do schema public
    const { data: tables, error } = await supabase
      .rpc('exec_sql', {
        query: `
          SELECT 
            table_name,
            table_type
          FROM information_schema.tables 
          WHERE table_schema = 'public'
          ORDER BY table_name;
        `
      });
    
    if (error) {
      // Tentar método alternativo
      console.log('⚠️  Método RPC não disponível, tentando consulta direta...\n');
      
      // Tentar acessar algumas tabelas conhecidas
      const knownTables = ['profiles', 'attendants', 'tickets', 'attendance_history', 'queue_state'];
      
      console.log('🔍 VERIFICANDO TABELAS CONHECIDAS:\n');
      
      for (const tableName of knownTables) {
        try {
          const { data, error: tableError } = await supabase
            .from(tableName)
            .select('*')
            .limit(0);
          
          if (!tableError) {
            console.log(`✅ ${tableName} - Tabela existe`);
            
            // Tentar obter informações das colunas
            try {
              const { data: columns, error: colError } = await supabase
                .rpc('exec_sql', {
                  query: `
                    SELECT 
                      column_name,
                      data_type,
                      is_nullable,
                      column_default
                    FROM information_schema.columns 
                    WHERE table_name = '${tableName}' 
                    AND table_schema = 'public'
                    ORDER BY ordinal_position;
                  `
                });
              
              if (!colError && columns) {
                console.log(`   Colunas: ${columns.map(col => col.column_name).join(', ')}`);
              }
            } catch (colErr) {
              // Ignorar erro de colunas
            }
          } else {
            console.log(`❌ ${tableName} - Tabela não existe ou sem acesso`);
          }
        } catch (err) {
          console.log(`❌ ${tableName} - Erro: ${err.message}`);
        }
      }
      
      return;
    }
    
    if (!tables || tables.length === 0) {
      console.log('⚠️  Nenhuma tabela encontrada no schema public');
      return;
    }
    
    console.log(`✅ ENCONTRADAS ${tables.length} TABELAS:\n`);
    
    tables.forEach((table, index) => {
      console.log(`${index + 1}. ${table.table_name} (${table.table_type})`);
    });
    
  } catch (error) {
    console.error('❌ Erro ao listar tabelas:', error.message);
    console.log('\n💡 Dica: Verifique se as credenciais do Supabase estão corretas no arquivo .env');
  }
}

// Executar função
listTables();