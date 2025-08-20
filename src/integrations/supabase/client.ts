import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rahidenugbgnfrddtpxm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhaGlkZW51Z2JnbmZyZGR0cHhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMjA4NTgsImV4cCI6MjA2OTg5Njg1OH0.ybEvAnEUQPjvxh6ipQypONxW6iDxvnPO6MurroW-lZA';

// Cliente principal para operações normais
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Nova função robusta para inserir dados no histórico
export const insertAttendanceHistory = async (historyData: any) => {
  try {
    console.log('🔄 Inserindo dados no histórico com nova implementação...');
    console.log('📝 Dados:', historyData);
    
    // Tentar usar a função RPC robusta primeiro
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc('insert_attendance_record', {
        attendant_id: historyData.attendant_id,
        attendant_name: historyData.attendant_name,
        ticket_number: historyData.ticket_number,
        ticket_type: historyData.ticket_type,
        start_time: historyData.start_time,
        end_time: historyData.end_time,
        service_date: historyData.service_date
      });
      
      if (!rpcError && rpcData?.success) {
        console.log('✅ Inserção via RPC robusta bem-sucedida:', rpcData);
        return { data: rpcData.data, error: null };
      }
      
      console.log('⚠️ RPC não disponível, tentando inserção direta:', rpcError?.message);
    } catch (rpcErr) {
      console.log('⚠️ RPC falhou, tentando inserção direta:', rpcErr);
    }
    
    // Fallback 1: Inserção direta na tabela
    try {
      console.log('🔄 Tentando inserção direta na tabela...');
      const { data: directData, error: directError } = await supabase
        .from('attendance_history')
        .insert([historyData])
        .select();
      
      if (!directError && directData && directData.length > 0) {
        console.log('✅ Inserção direta bem-sucedida:', directData[0]);
        return { data: directData[0], error: null };
      }
      
      console.log('⚠️ Inserção direta falhou:', directError?.message);
    } catch (directErr) {
      console.log('⚠️ Erro na inserção direta:', directErr);
    }
    
    // Fallback 2: armazenar localmente para sincronização posterior
    console.log('💾 Salvando registro localmente...');
    const localRecord = {
      id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...historyData,
      created_at: new Date().toISOString(),
      _isLocal: true
    };
    
    const existingRecords = JSON.parse(localStorage.getItem('pendingHistoryRecords') || '[]');
    existingRecords.push(localRecord);
    localStorage.setItem('pendingHistoryRecords', JSON.stringify(existingRecords));
    
    console.log('💾 Registro salvo localmente:', localRecord);
    console.log('📱 Total de registros locais pendentes:', existingRecords.length);
    
    return { 
      data: { id: localRecord.id, ...historyData }, 
      error: null,
      isLocal: true 
    };
    
  } catch (err) {
    console.error('💥 Erro crítico ao inserir no histórico:', err);
    return { data: null, error: err };
  }
};

// Nova função para buscar histórico por data (fallback para consulta direta)
export const getAttendanceHistoryByDate = async (date: string) => {
  try {
    console.log('🔍 Buscando histórico para data:', date);
    
    // Converter data brasileira (DD/MM/YYYY) para formato ISO (YYYY-MM-DD)
    const [day, month, year] = date.split('/');
    const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    
    console.log('📅 Data convertida para ISO:', isoDate);
    
    // Tentar usar a função RPC primeiro
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_attendance_history_by_date', {
        target_date: isoDate
      });
      
      if (!rpcError) {
        console.log('✅ Dados retornados da RPC:', rpcData);
        return { data: rpcData, error: null };
      }
      
      console.log('⚠️ RPC não disponível, usando consulta direta:', rpcError.message);
    } catch (rpcErr) {
      console.log('⚠️ RPC falhou, usando consulta direta:', rpcErr);
    }
    
    // Fallback: consulta direta à tabela
    console.log('🔄 Executando consulta direta à tabela attendance_history...');
    const { data, error } = await supabase
      .from('attendance_history')
      .select('*')
      .eq('service_date', isoDate)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Erro na consulta direta:', error);
      throw error;
    }
    
    console.log('✅ Dados retornados da consulta direta:', data);
    return { data, error: null };
    
  } catch (err) {
    console.error('💥 Erro ao buscar histórico:', err);
    return { data: null, error: err };
  }
};

// Nova função robusta para buscar estatísticas
export const getAttendanceStats = async (startDate?: string, endDate?: string) => {
  try {
    console.log('📊 Buscando estatísticas com nova implementação...');
    
    let start_date = null;
    let end_date = null;
    
    if (startDate) {
      const [day, month, year] = startDate.split('/');
      start_date = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    if (endDate) {
      const [day, month, year] = endDate.split('/');
      end_date = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    // Tentar usar a função RPC primeiro
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_attendance_stats', {
        start_date,
        end_date
      });
      
      if (!rpcError && rpcData) {
        console.log('✅ Estatísticas via RPC carregadas:', rpcData);
        return { data: rpcData, error: null };
      }
      
      console.log('⚠️ RPC de estatísticas não disponível, calculando diretamente:', rpcError?.message);
    } catch (rpcErr) {
      console.log('⚠️ RPC de estatísticas falhou, calculando diretamente:', rpcErr);
    }
    
    // Fallback: Calcular estatísticas diretamente
    try {
      console.log('🔄 Calculando estatísticas diretamente...');
      
      let query = supabase.from('attendance_history').select('*');
      
      if (start_date) {
        query = query.gte('service_date', start_date);
      }
      
      if (end_date) {
        query = query.lte('service_date', end_date);
      }
      
      const { data: records, error: recordsError } = await query;
      
      if (recordsError) {
        console.log('⚠️ Erro ao buscar registros:', recordsError.message);
        return { data: { total_today: 0, total_all_time: 0 }, error: null };
      }
      
      // Buscar total geral se não houver filtros
      let totalCount = records?.length || 0;
      if (!start_date && !end_date) {
        const { count, error: countError } = await supabase
          .from('attendance_history')
          .select('*', { count: 'exact', head: true });
        totalCount = count || 0;
      }
      
      const today = new Date().toISOString().split('T')[0];
      const todayCount = records?.filter(r => r.service_date === today).length || 0;
      
      const stats = {
        total_today: todayCount,
        total_all_time: totalCount,
        filtered_count: records?.length || 0
      };
      
      console.log('✅ Estatísticas calculadas diretamente:', stats);
      return { data: stats, error: null };
      
    } catch (directErr) {
      console.log('⚠️ Erro ao calcular estatísticas diretamente:', directErr);
      return { data: { total_today: 0, total_all_time: 0 }, error: null };
    }
    
  } catch (err) {
    console.error('💥 Erro crítico ao buscar estatísticas:', err);
    return { data: { total_today: 0, total_all_time: 0 }, error: null };
  }
};