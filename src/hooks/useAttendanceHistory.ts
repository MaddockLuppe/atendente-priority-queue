import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AttendmentHistory } from '@/types';
import { useToast } from '@/hooks/use-toast';

export interface AttendanceHistoryRecord {
  id?: string;
  attendant_id: string;
  attendant_name: string;
  ticket_number: string;
  ticket_type: 'normal' | 'preferencial';
  start_time: string;
  end_time: string;
  service_date: string;
  created_at?: string;
}

export const useAttendanceHistory = () => {
  const [history, setHistory] = useState<AttendmentHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Função para converter data brasileira (DD/MM/YYYY) para formato ISO (YYYY-MM-DD)
  const convertBrazilianDateToISO = (brazilianDate: string): string => {
    const [day, month, year] = brazilianDate.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  };

  // Função para converter data ISO (YYYY-MM-DD) para formato brasileiro (DD/MM/YYYY)
  const convertISODateToBrazilian = (isoDate: string): string => {
    const [year, month, day] = isoDate.split('-');
    return `${day}/${month}/${year}`;
  };

  // Função para inserir registro no histórico com múltiplas estratégias
  const insertHistoryRecord = useCallback(async (record: AttendanceHistoryRecord): Promise<boolean> => {
    try {
      console.log('📝 Inserindo registro no histórico:', record);
      
      // Estratégia 1: Tentar função RPC personalizada
      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc('insert_attendance_record', {
          attendant_id: record.attendant_id,
          attendant_name: record.attendant_name,
          ticket_number: record.ticket_number,
          ticket_type: record.ticket_type,
          start_time: record.start_time,
          end_time: record.end_time,
          service_date: record.service_date
        });

        if (!rpcError && rpcData?.success) {
          console.log('✅ Inserção via RPC bem-sucedida');
          return true;
        }
        
        console.log('⚠️ RPC falhou, tentando inserção direta...');
      } catch (rpcErr) {
        console.log('⚠️ Erro na RPC, tentando inserção direta...', rpcErr);
      }

      // Estratégia 2: Inserção direta na tabela
      const { data, error } = await supabase
        .from('attendance_history')
        .insert({
          attendant_id: record.attendant_id,
          attendant_name: record.attendant_name,
          ticket_number: record.ticket_number,
          ticket_type: record.ticket_type,
          start_time: record.start_time,
          end_time: record.end_time,
          service_date: record.service_date,
          created_at: new Date().toISOString()
        })
        .select();

      if (!error) {
        console.log('✅ Inserção direta bem-sucedida:', data);
        return true;
      }

      console.error('❌ Erro na inserção direta:', error);
      
      // Estratégia 3: Fallback - armazenar localmente e tentar sincronizar depois
      const localRecord = {
        id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ...record,
        created_at: new Date().toISOString(),
        _isLocal: true
      };
      
      // Armazenar no localStorage como backup
      const existingLocal = JSON.parse(localStorage.getItem('pendingHistoryRecords') || '[]');
      existingLocal.push(localRecord);
      localStorage.setItem('pendingHistoryRecords', JSON.stringify(existingLocal));
      
      console.log('💾 Registro armazenado localmente para sincronização posterior');
      return true;
      
    } catch (error) {
      console.error('💥 Erro crítico ao inserir histórico:', error);
      
      toast({
        title: "Aviso",
        description: "Registro salvo localmente. Será sincronizado quando possível.",
        variant: "default"
      });
      
      return false;
    }
  }, [toast]);

  // Função para buscar histórico por data
  const getHistoryByDate = useCallback(async (brazilianDate: string): Promise<AttendmentHistory[]> => {
    try {
      setLoading(true);
      console.log('📊 Buscando histórico para data:', brazilianDate);
      
      const isoDate = convertBrazilianDateToISO(brazilianDate);
      console.log('📅 Data convertida para ISO:', isoDate);
      
      const { data, error } = await supabase
        .from('attendance_history')
        .select('*')
        .eq('service_date', isoDate)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erro ao buscar histórico:', error);
        throw error;
      }

      console.log('📋 Dados do histórico encontrados:', data?.length || 0, 'registros');

      // Converter dados do banco para o formato esperado
      const mappedHistory: AttendmentHistory[] = (data || []).map(item => ({
        id: item.id,
        attendantId: item.attendant_id,
        attendantName: item.attendant_name,
        ticketNumber: item.ticket_number,
        ticketType: item.ticket_type as 'preferencial' | 'normal',
        startTime: new Date(item.start_time),
        endTime: new Date(item.end_time),
        date: brazilianDate, // Manter formato brasileiro
      }));

      // Verificar se há registros locais pendentes para esta data
      const pendingLocal = JSON.parse(localStorage.getItem('pendingHistoryRecords') || '[]');
      const localForDate = pendingLocal.filter((record: any) => 
        record.service_date === isoDate
      );
      
      if (localForDate.length > 0) {
        console.log('📱 Encontrados', localForDate.length, 'registros locais pendentes');
        
        // Adicionar registros locais ao resultado
        const localMapped: AttendmentHistory[] = localForDate.map((item: any) => ({
          id: item.id,
          attendantId: item.attendant_id,
          attendantName: item.attendant_name,
          ticketNumber: item.ticket_number,
          ticketType: item.ticket_type as 'preferencial' | 'normal',
          startTime: new Date(item.start_time),
          endTime: new Date(item.end_time),
          date: brazilianDate,
        }));
        
        mappedHistory.push(...localMapped);
      }

      setHistory(mappedHistory);
      return mappedHistory;
      
    } catch (error) {
      console.error('💥 Erro ao carregar histórico:', error);
      
      toast({
        title: "Erro ao carregar histórico",
        description: "Não foi possível carregar o histórico. Tente novamente.",
        variant: "destructive"
      });
      
      return [];
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Função para carregar histórico do dia atual
  const loadTodayHistory = useCallback(async (): Promise<AttendmentHistory[]> => {
    const today = new Date().toLocaleDateString('pt-BR');
    return await getHistoryByDate(today);
  }, [getHistoryByDate]);

  // Função para tentar sincronizar registros locais pendentes
  const syncPendingRecords = useCallback(async (): Promise<void> => {
    try {
      const pendingRecords = JSON.parse(localStorage.getItem('pendingHistoryRecords') || '[]');
      
      if (pendingRecords.length === 0) {
        console.log('📱 Nenhum registro local pendente para sincronizar');
        return;
      }
      
      console.log('🔄 Sincronizando', pendingRecords.length, 'registros locais...');
      
      const syncedIds: string[] = [];
      
      for (const record of pendingRecords) {
        try {
          const { error } = await supabase
            .from('attendance_history')
            .insert({
              attendant_id: record.attendant_id,
              attendant_name: record.attendant_name,
              ticket_number: record.ticket_number,
              ticket_type: record.ticket_type,
              start_time: record.start_time,
              end_time: record.end_time,
              service_date: record.service_date,
              created_at: record.created_at
            });
          
          if (!error) {
            syncedIds.push(record.id);
            console.log('✅ Registro sincronizado:', record.ticket_number);
          }
        } catch (syncError) {
          console.log('⚠️ Falha ao sincronizar registro:', record.ticket_number, syncError);
        }
      }
      
      // Remover registros sincronizados do localStorage
      if (syncedIds.length > 0) {
        const remainingRecords = pendingRecords.filter((record: any) => 
          !syncedIds.includes(record.id)
        );
        localStorage.setItem('pendingHistoryRecords', JSON.stringify(remainingRecords));
        
        console.log('🎉 Sincronizados', syncedIds.length, 'registros com sucesso');
        
        if (remainingRecords.length === 0) {
          toast({
            title: "Sincronização concluída",
            description: "Todos os registros locais foram sincronizados.",
            variant: "default"
          });
        }
      }
      
    } catch (error) {
      console.error('💥 Erro na sincronização:', error);
    }
  }, [toast]);

  // Função para obter estatísticas do histórico
  const getHistoryStats = useCallback((historyData: AttendmentHistory[]) => {
    const totalAttendments = historyData.length;
    const attendantStats = historyData.reduce((acc, item) => {
      if (!acc[item.attendantName]) {
        acc[item.attendantName] = {
          count: 0,
          totalTime: 0,
          preferencial: 0,
          normal: 0
        };
      }
      
      acc[item.attendantName].count++;
      acc[item.attendantName].totalTime += item.endTime.getTime() - item.startTime.getTime();
      
      if (item.ticketType === 'preferencial') {
        acc[item.attendantName].preferencial++;
      } else {
        acc[item.attendantName].normal++;
      }
      
      return acc;
    }, {} as Record<string, { count: number; totalTime: number; preferencial: number; normal: number }>);
    
    return {
      totalAttendments,
      attendantStats,
      totalAttendants: Object.keys(attendantStats).length
    };
  }, []);

  return {
    history,
    loading,
    insertHistoryRecord,
    getHistoryByDate,
    loadTodayHistory,
    syncPendingRecords,
    getHistoryStats
  };
};