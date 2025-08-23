import { useState, useCallback, useEffect } from 'react';
import { supabase, insertAttendanceHistory, getAttendanceHistoryByDate } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getLocalDateISO } from '@/utils/dateUtils';

export interface Attendant {
  id: string;
  name: string;
  isActive: boolean;
  currentTicket?: Ticket;
  queueTickets: Ticket[];
}

export interface Ticket {
  id: string;
  number: string;
  type: 'preferencial' | 'normal';
  createdAt: Date;
  calledAt?: Date;
  completedAt?: Date;
  attendantId?: string;
  status: 'waiting' | 'in-service' | 'completed';
}

export interface QueueState {
  nextPreferentialNumber: number;
  nextNormalNumber: number;
}

export interface AttendmentHistory {
  id: string;
  attendantId: string;
  attendantName: string;
  ticketNumber: string;
  ticketType: 'preferencial' | 'normal';
  startTime: Date;
  endTime: Date;
  date: string;
}

export const useTicketSystem = () => {
  const [attendants, setAttendants] = useState<Attendant[]>([]);
  const [queueState, setQueueState] = useState<QueueState>({
    nextPreferentialNumber: 1,
    nextNormalNumber: 1,
  });
  const [history, setHistory] = useState<AttendmentHistory[]>([]);
  const [timers, setTimers] = useState<Record<string, { timer: number; warning: number }>>({});
  const [operationsInProgress, setOperationsInProgress] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  // Carrega dados iniciais
  useEffect(() => {
    loadAttendants();
    loadQueueState();
    loadHistory();
  }, []);

  // Verifica avisos de tempo a cada minuto
  useEffect(() => {
    const interval = setInterval(() => {
      checkTimeWarnings();
    }, 60000); // Verifica a cada minuto

    return () => clearInterval(interval);
  }, [attendants]);

  const loadAttendants = async () => {
    try {
      // Carrega atendentes e tickets em uma única consulta otimizada
      const [attendantsResult, ticketsResult] = await Promise.all([
        supabase
          .from('attendants')
          .select('id, name, is_active')
          .order('name'),
        supabase
          .from('tickets')
          .select('id, ticket_number, ticket_type, created_at, called_at, completed_at, attendant_id, status')
          .in('status', ['waiting', 'in-service'])
      ]);

      if (attendantsResult.error) throw attendantsResult.error;
      if (ticketsResult.error) throw ticketsResult.error;

      const attendantsData = attendantsResult.data;
      const ticketsData = ticketsResult.data;

      // Cria um mapa de tickets por atendente para melhor performance
      const ticketsByAttendant = new Map<string, any[]>();
      ticketsData.forEach(ticket => {
        if (!ticketsByAttendant.has(ticket.attendant_id)) {
          ticketsByAttendant.set(ticket.attendant_id, []);
        }
        ticketsByAttendant.get(ticket.attendant_id)!.push(ticket);
      });

      const mappedAttendants: Attendant[] = attendantsData.map(attendant => {
        const attendantTickets = ticketsByAttendant.get(attendant.id) || [];
        const currentTicket = attendantTickets.find(t => t.status === 'in-service');
        const queueTickets = attendantTickets.filter(t => t.status === 'waiting');

        return {
          id: attendant.id,
          name: attendant.name,
          isActive: attendant.is_active,
          currentTicket: currentTicket ? mapTicketFromDB(currentTicket) : undefined,
          queueTickets: queueTickets.map(mapTicketFromDB),
        };
      });

      setAttendants(mappedAttendants);
    } catch (error) {
      console.error('Erro ao carregar atendentes:', error);
    }
  };

  const loadQueueState = async () => {
    try {
      // Primeiro tenta buscar o estado existente
      const { data, error } = await supabase
        .from('queue_state')
        .select('*')
        .single();

      if (error) {
        // Se não existe nenhum registro, usar valores padrão e tentar inserir em background
        if (error.code === 'PGRST116') {
          console.log('Nenhum estado de fila encontrado, usando valores padrão...');
          
          // Usar valores padrão imediatamente
          setQueueState({
            nextPreferentialNumber: 1,
            nextNormalNumber: 1,
          });

          // Tentar inserir em background (sem bloquear a aplicação)
          supabase
            .from('queue_state')
            .insert({
              next_preferential_number: 1,
              next_normal_number: 1
            })
            .then(({ error: insertError }) => {
              if (insertError) {
                console.warn('Não foi possível inserir estado inicial no banco:', insertError.message);
              } else {
                console.log('Estado inicial inserido no banco com sucesso');
              }
            });
          
          return;
        }
        throw error;
      }

      setQueueState({
        nextPreferentialNumber: data.next_preferential_number,
        nextNormalNumber: data.next_normal_number,
      });
    } catch (error) {
      console.error('Erro ao carregar estado da fila:', error);
      // Usar valores padrão em caso de erro
      setQueueState({
        nextPreferentialNumber: 1,
        nextNormalNumber: 1,
      });
    }
  };

  // Função para criar dados de teste do histórico
  const createTestHistoryData = useCallback(async () => {
    try {
      console.log('🧪 Criando dados de teste para o histórico...');
      
      const today = new Date();
      // Usar data local para evitar problemas de fuso horário
      const todayStr = getLocalDateISO(today); // YYYY-MM-DD
      
      // Criar alguns registros de teste para hoje
      const testRecords = [
        {
          attendant_id: '00000000-0000-0000-0000-000000000001',
          attendant_name: 'João Silva',
          ticket_number: 'A001',
          ticket_type: 'normal',
          service_date: todayStr,
          start_time: new Date(today.getTime() - 2 * 60 * 60 * 1000).toISOString(), // 2h atrás
          end_time: new Date(today.getTime() - 2 * 60 * 60 * 1000 + 10 * 60 * 1000).toISOString() // 10 min depois
        },
        {
          attendant_id: '00000000-0000-0000-0000-000000000002',
          attendant_name: 'Maria Santos',
          ticket_number: 'P001',
          ticket_type: 'preferencial',
          service_date: todayStr,
          start_time: new Date(today.getTime() - 1 * 60 * 60 * 1000).toISOString(), // 1h atrás
          end_time: new Date(today.getTime() - 1 * 60 * 60 * 1000 + 15 * 60 * 1000).toISOString() // 15 min depois
        },
        {
          attendant_id: '00000000-0000-0000-0000-000000000001',
          attendant_name: 'João Silva',
          ticket_number: 'A002',
          ticket_type: 'normal',
          service_date: todayStr,
          start_time: new Date(today.getTime() - 30 * 60 * 1000).toISOString(), // 30 min atrás
          end_time: new Date(today.getTime() - 30 * 60 * 1000 + 8 * 60 * 1000).toISOString() // 8 min depois
        }
      ];
      
      console.log('📝 Inserindo registros de teste:', testRecords);
      
      // Usar a função especializada para contornar RLS
      console.log('🔄 Inserindo registros usando função especializada...');
      
      for (const record of testRecords) {
        const { data: insertData, error: insertError } = await insertAttendanceHistory(record);
        
        if (insertError) {
          console.error('❌ Erro ao inserir registro:', insertError);
          return false;
        } else {
          console.log('✅ Registro inserido com sucesso:', insertData);
        }
      }
      
      console.log('✅ Todos os registros de teste foram criados com sucesso');
      return true;
      
    } catch (error) {
      console.error('💥 Erro ao criar dados de teste:', error);
      return false;
    }
  }, []);
  


  const loadHistory = async () => {
    try {
      console.log('📊 Carregando histórico do dia atual com nova implementação...');
      const today = new Date().toLocaleDateString('pt-BR');
      console.log('📅 Data de hoje (formato brasileiro):', today);
      
      const { data, error } = await getAttendanceHistoryByDate(today);

      if (error) {
        console.error('❌ Erro ao carregar histórico:', error);
        throw error;
      }

      console.log('📊 Dados do histórico carregados:', data);
      console.log('📈 Quantidade de registros:', data?.length || 0);

      const mappedHistory: AttendmentHistory[] = (data || []).map(item => {
        return {
          id: item.id,
          attendantId: item.attendant_id,
          attendantName: item.attendant_name,
          ticketNumber: item.ticket_number,
          ticketType: item.ticket_type as 'preferencial' | 'normal',
          startTime: new Date(item.start_time),
          endTime: new Date(item.end_time),
          date: today, // Usar formato brasileiro
        };
      });

      // Verificar se há registros locais pendentes
      try {
        const pendingLocal = JSON.parse(localStorage.getItem('pendingHistoryRecords') || '[]');
        // Usar data local para evitar problemas de fuso horário
        const todayISO = getLocalDateISO();
        const localForToday = pendingLocal.filter((record: any) => 
          record.service_date === todayISO
        );
        
        if (localForToday.length > 0) {
          console.log('📱 Encontrados', localForToday.length, 'registros locais pendentes para hoje');
          
          const localMapped: AttendmentHistory[] = localForToday.map((item: any) => ({
            id: item.id,
            attendantId: item.attendant_id,
            attendantName: item.attendant_name,
            ticketNumber: item.ticket_number,
            ticketType: item.ticket_type as 'preferencial' | 'normal',
            startTime: new Date(item.start_time),
            endTime: new Date(item.end_time),
            date: today,
          }));
          
          mappedHistory.push(...localMapped);
        }
      } catch (localError) {
        console.log('⚠️ Erro ao verificar registros locais:', localError);
      }

      console.log('✅ Histórico mapeado:', mappedHistory);
      setHistory(mappedHistory);
    } catch (error) {
      console.error('❌ Erro ao carregar histórico:', error);
    }
  };

  const mapTicketFromDB = (ticket: any): Ticket => ({
    id: ticket.id,
    number: ticket.ticket_number,
    type: ticket.ticket_type,
    createdAt: new Date(ticket.created_at),
    calledAt: ticket.called_at ? new Date(ticket.called_at) : undefined,
    completedAt: ticket.completed_at ? new Date(ticket.completed_at) : undefined,
    attendantId: ticket.attendant_id,
    status: ticket.status,
  });

  const checkTimeWarnings = () => {
    attendants.forEach(attendant => {
      if (attendant.currentTicket?.calledAt) {
        const now = Date.now();
        const calledTime = attendant.currentTicket.calledAt.getTime();
        const elapsedMinutes = Math.floor((now - calledTime) / (1000 * 60));

        // Aviso aos 13 minutos (2 minutos antes dos 15)
        if (elapsedMinutes === 13) {
          toast({
            title: "⚠️ Aviso de Tempo",
            description: `${attendant.name} - Ticket ${attendant.currentTicket.number}: restam 2 minutos!`,
            variant: "destructive",
          });
        }

        // Aviso crítico aos 15 minutos
        if (elapsedMinutes >= 15) {
          toast({
            title: "🚨 Tempo Esgotado",
            description: `${attendant.name} - Ticket ${attendant.currentTicket.number}: tempo limite ultrapassado!`,
            variant: "destructive",
          });
        }
      }
    });
  };

  const addAttendant = useCallback(async (name: string) => {
    try {
      const { data, error } = await supabase
        .from('attendants')
        .insert({ name })
        .select()
        .single();

      if (error) throw error;

      await loadAttendants();
    } catch (error) {
      console.error('Erro ao adicionar atendente:', error);
      throw error;
    }
  }, []);

  const updateAttendant = useCallback(async (id: string, name: string) => {
    try {
      const { error } = await supabase
        .from('attendants')
        .update({ name })
        .eq('id', id);

      if (error) throw error;

      await loadAttendants();
    } catch (error) {
      console.error('Erro ao atualizar atendente:', error);
      throw error;
    }
  }, []);

  const deleteAttendant = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('attendants')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await loadAttendants();
    } catch (error) {
      console.error('Erro ao excluir atendente:', error);
      throw error;
    }
  }, []);

  const toggleAttendantActive = useCallback(async (attendantId: string) => {
    try {
      const attendant = attendants.find(a => a.id === attendantId);
      if (!attendant) return;

      const { error } = await supabase
        .from('attendants')
        .update({ is_active: !attendant.isActive })
        .eq('id', attendantId);

      if (error) throw error;

      await loadAttendants();
    } catch (error) {
      console.error('Erro ao alterar status do atendente:', error);
    }
  }, [attendants]);

  const createTicket = useCallback(async (type: 'preferencial' | 'normal', attendantId: string): Promise<Ticket> => {
    try {
      const attendant = attendants.find(a => a.id === attendantId);
      if (!attendant) {
        throw new Error('Atendente não encontrado');
      }

      const isPreferential = type === 'preferencial';
      const maxNumber = isPreferential ? 2 : 10;
      
      // Encontra o próximo número disponível para este atendente
      const attendantActiveTickets = [
        ...(attendant.currentTicket && attendant.currentTicket.type === type ? [attendant.currentTicket] : []),
        ...attendant.queueTickets.filter(t => t.type === type)
      ];
      
      const usedNumbers = attendantActiveTickets.map(t => parseInt(t.number.substring(1)));
      let nextNumber = 1;
      for (let i = 1; i <= maxNumber; i++) {
        if (!usedNumbers.includes(i)) {
          nextNumber = i;
          break;
        }
      }

      const ticketNumber = isPreferential ? `P${nextNumber}` : `N${nextNumber}`;

      const { data, error } = await supabase
        .from('tickets')
        .insert({
          ticket_number: ticketNumber,
          ticket_type: type,
          attendant_id: attendantId,
          status: 'waiting'
        })
        .select()
        .single();

      if (error) throw error;

      await loadAttendants();
      
      return mapTicketFromDB(data);
    } catch (error) {
      console.error('Erro ao criar ticket:', error);
      throw error;
    }
  }, [attendants]);

  const createBulkTickets = useCallback(async (type: 'preferencial' | 'normal', attendantId: string, quantity: number): Promise<void> => {
    try {
      const attendant = attendants.find(a => a.id === attendantId);
      if (!attendant) {
        throw new Error('Atendente não encontrado');
      }

      const isPreferential = type === 'preferencial';
      const maxNumber = isPreferential ? 2 : 10;
      
      if (quantity > maxNumber) {
        throw new Error(`Quantidade máxima para ${type} é ${maxNumber}`);
      }

      // Encontra os números já usados
      const attendantActiveTickets = [
        ...(attendant.currentTicket && attendant.currentTicket.type === type ? [attendant.currentTicket] : []),
        ...attendant.queueTickets.filter(t => t.type === type)
      ];
      
      const usedNumbers = attendantActiveTickets.map(t => parseInt(t.number.substring(1)));
      
      // Verifica se há espaço para criar todas as fichas
      const availableNumbers = [];
      for (let i = 1; i <= maxNumber; i++) {
        if (!usedNumbers.includes(i)) {
          availableNumbers.push(i);
        }
      }

      if (availableNumbers.length < quantity) {
        throw new Error(`Só é possível criar ${availableNumbers.length} fichas ${type} para este atendente`);
      }

      // Cria as fichas em lote
      const ticketsToInsert = [];
      for (let i = 0; i < quantity; i++) {
        const ticketNumber = isPreferential ? `P${availableNumbers[i]}` : `N${availableNumbers[i]}`;
        ticketsToInsert.push({
          ticket_number: ticketNumber,
          ticket_type: type,
          attendant_id: attendantId,
          status: 'waiting'
        });
      }

      const { error } = await supabase
        .from('tickets')
        .insert(ticketsToInsert);

      if (error) throw error;

      await loadAttendants();
    } catch (error) {
      console.error('Erro ao criar fichas em lote:', error);
      throw error;
    }
  }, [attendants]);

  const callNextTicket = useCallback(async (attendantId: string) => {
    const operationKey = `call-${attendantId}`;
    
    // Evita múltiplas chamadas simultâneas
    if (operationsInProgress.has(operationKey)) return;
    
    setOperationsInProgress(prev => new Set(prev).add(operationKey));
    
    try {
      const attendant = attendants.find(a => a.id === attendantId);
      if (!attendant || attendant.currentTicket || attendant.queueTickets.length === 0) return;

      // Prioriza fichas preferenciais
      const nextTicket = attendant.queueTickets.find(t => t.type === 'preferencial') || 
                        attendant.queueTickets[0];

      if (!nextTicket) return;

      // Atualiza o estado local imediatamente para melhor UX
      const updatedAttendants = attendants.map(att => {
        if (att.id === attendantId) {
          const updatedQueueTickets = att.queueTickets.filter(t => t.id !== nextTicket.id);
          const currentTicket = { ...nextTicket, status: 'in-service' as const, calledAt: new Date() };
          return { ...att, currentTicket, queueTickets: updatedQueueTickets };
        }
        return att;
      });
      setAttendants(updatedAttendants);

      // Atualiza no banco em background
      const { error } = await supabase
        .from('tickets')
        .update({
          status: 'in-service',
          called_at: new Date().toISOString()
        })
        .eq('id', nextTicket.id);

      if (error) {
        console.error('Erro ao chamar próximo ticket:', error);
        // Reverte o estado local em caso de erro
        await loadAttendants();
      }
    } catch (error) {
      console.error('Erro ao chamar próximo ticket:', error);
      // Reverte o estado local em caso de erro
      await loadAttendants();
    } finally {
      setOperationsInProgress(prev => {
        const newSet = new Set(prev);
        newSet.delete(operationKey);
        return newSet;
      });
    }
  }, [attendants, operationsInProgress]);

  const completeTicket = useCallback(async (attendantId: string) => {
    const operationKey = `complete-${attendantId}`;
    
    // Evita múltiplas chamadas simultâneas
    if (operationsInProgress.has(operationKey)) return;
    
    setOperationsInProgress(prev => new Set(prev).add(operationKey));
    
    try {
      const attendant = attendants.find(a => a.id === attendantId);
      if (!attendant?.currentTicket) return;

      const completedAt = new Date();
      const calledAt = new Date(attendant.currentTicket.calledAt!);
      // Usar data local para evitar problemas de fuso horário
      const serviceDate = getLocalDateISO(completedAt);

      // Limpa timers antes de fazer as operações
      if (timers[attendantId]) {
        clearTimeout(timers[attendantId].timer);
        clearTimeout(timers[attendantId].warning);
        setTimers(prev => {
          const { [attendantId]: _, ...rest } = prev;
          return rest;
        });
      }

      // Atualiza o estado local imediatamente para melhor UX
      const updatedAttendants = attendants.map(att => {
        if (att.id === attendantId) {
          return { ...att, currentTicket: undefined };
        }
        return att;
      });
      setAttendants(updatedAttendants);

      const historyData = {
        attendant_id: attendantId,
        attendant_name: attendant.name,
        ticket_number: attendant.currentTicket.number,
        ticket_type: attendant.currentTicket.type,
        start_time: calledAt.toISOString(),
        end_time: completedAt.toISOString(),
        service_date: serviceDate
      };
      
      console.log('💾 Inserindo dados no histórico:', historyData);
      console.log('🔧 Usando função RPC para inserir no histórico:', historyData);

      // Executa as operações em paralelo para melhor performance
      const results = await Promise.allSettled([
        supabase
          .from('tickets')
          .update({
            status: 'completed',
            completed_at: completedAt.toISOString()
          })
          .eq('id', attendant.currentTicket.id),
        
        supabase.rpc('insert_attendance_history', historyData)
      ]);

      // Verifica se houve erros
      const [ticketResult, historyResult] = results;
      
      console.log('📊 Resultado da atualização do ticket:', ticketResult);
      console.log('📊 Resultado da inserção no histórico:', historyResult);
      
      if (ticketResult.status === 'rejected') {
        console.error('❌ Erro ao atualizar ticket:', ticketResult.reason);
        throw new Error(`Erro ao atualizar ticket: ${ticketResult.reason}`);
      }
      
      if (ticketResult.status === 'fulfilled' && ticketResult.value.error) {
        console.error('❌ Erro ao atualizar ticket:', ticketResult.value.error);
        throw new Error(`Erro ao atualizar ticket: ${ticketResult.value.error.message}`);
      }
      
      if (historyResult.status === 'rejected') {
        console.error('❌ Erro ao inserir no histórico:', historyResult.reason);
        throw new Error(`Erro ao salvar histórico: ${historyResult.reason}`);
      }
      
      if (historyResult.status === 'fulfilled' && historyResult.value.error) {
        console.error('❌ Erro ao inserir no histórico:', historyResult.value.error);
        throw new Error(`Erro ao salvar histórico: ${historyResult.value.error.message}`);
      }
      
      console.log('✅ Ticket atualizado e histórico salvo com sucesso');

      // Recarrega apenas o histórico se tudo deu certo
      await loadHistory();
    } catch (error) {
      console.error('💥 Erro ao completar ticket:', error);
      toast({
        title: "Erro ao completar atendimento",
        description: "Ocorreu um erro ao salvar o histórico. Verifique o console.",
        variant: "destructive",
      });
    } finally {
      setOperationsInProgress(prev => {
        const newSet = new Set(prev);
        newSet.delete(operationKey);
        return newSet;
      });
    }
  }, [attendants, timers, toast, operationsInProgress]);

  const removeTicket = useCallback(async (attendantId: string, ticketId: string) => {
    try {
      const { error } = await supabase
        .from('tickets')
        .delete()
        .eq('id', ticketId);

      if (error) throw error;

      // Limpa timers se necessário
      const attendant = attendants.find(a => a.id === attendantId);
      if (attendant?.currentTicket?.id === ticketId && timers[attendantId]) {
        clearTimeout(timers[attendantId].timer);
        clearTimeout(timers[attendantId].warning);
        setTimers(prev => {
          const { [attendantId]: _, ...rest } = prev;
          return rest;
        });
      }

      await loadAttendants();
    } catch (error) {
      console.error('Erro ao remover ticket:', error);
    }
  }, [attendants, timers]);

  const isTicketOverdue = useCallback((attendantId: string): boolean => {
    const attendant = attendants.find(a => a.id === attendantId);
    if (!attendant?.currentTicket?.calledAt) return false;
    
    const now = Date.now();
    const calledTime = attendant.currentTicket.calledAt.getTime();
    return (now - calledTime) > (15 * 60 * 1000);
  }, [attendants]);

  const getHistoryByDate = useCallback(async (date: string): Promise<AttendmentHistory[]> => {
    try {
      console.log('🔍 Buscando histórico para data com nova implementação:', date);
      
      const { data, error } = await getAttendanceHistoryByDate(date);

      if (error) {
        console.error('❌ Erro ao buscar histórico:', error);
        throw error;
      }

      console.log('📋 Dados encontrados:', data?.length || 0, 'registros');

      const mappedHistory: AttendmentHistory[] = (data || []).map(item => {
        return {
          id: item.id,
          attendantId: item.attendant_id,
          attendantName: item.attendant_name,
          ticketNumber: item.ticket_number,
          ticketType: item.ticket_type as 'preferencial' | 'normal',
          startTime: new Date(item.start_time),
          endTime: new Date(item.end_time),
          date: date, // Manter formato brasileiro
        };
      });

      // Verificar se há registros locais pendentes para esta data
      try {
        const pendingLocal = JSON.parse(localStorage.getItem('pendingHistoryRecords') || '[]');
        const [day, month, year] = date.split('/');
        const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        const localForDate = pendingLocal.filter((record: any) => 
          record.service_date === isoDate
        );
        
        if (localForDate.length > 0) {
          console.log('📱 Encontrados', localForDate.length, 'registros locais pendentes para', date);
          
          const localMapped: AttendmentHistory[] = localForDate.map((item: any) => ({
            id: item.id,
            attendantId: item.attendant_id,
            attendantName: item.attendant_name,
            ticketNumber: item.ticket_number,
            ticketType: item.ticket_type as 'preferencial' | 'normal',
            startTime: new Date(item.start_time),
            endTime: new Date(item.end_time),
            date: date,
          }));
          
          mappedHistory.push(...localMapped);
        }
      } catch (localError) {
        console.log('⚠️ Erro ao verificar registros locais:', localError);
      }

      console.log('✅ Histórico mapeado para', date, ':', mappedHistory);
      return mappedHistory;
    } catch (error) {
      console.error('💥 Erro ao buscar histórico:', error);
      return [];
    }
  }, []);

  return {
    attendants,
    queueState,
    history,
    createTicket,
    createBulkTickets,
    callNextTicket,
    completeTicket,
    removeTicket,
    isTicketOverdue,
    addAttendant,
    updateAttendant,
    deleteAttendant,
    getHistoryByDate,
    toggleAttendantActive,

  };
};