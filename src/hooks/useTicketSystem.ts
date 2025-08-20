import { useState, useCallback, useEffect } from 'react';
import { supabase, insertAttendanceHistory } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
      const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD
      
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
  
  // Função para testar a conexão com o histórico
  const testHistoryConnection = useCallback(async () => {
    try {
      console.log('🧪 Testando conexão com attendance_history...');
      
      // Primeiro, verificar se há dados
      const { data: existingData, error: readError } = await supabase
        .from('attendance_history')
        .select('*');
      
      if (readError) {
        console.error('❌ Erro ao ler dados:', readError);
        return;
      }
      
      console.log('📋 Dados existentes:', existingData);
      console.log('📊 Total de registros:', existingData?.length || 0);
      
      // Sempre criar dados de teste para garantir que há dados para hoje
      console.log('📝 Criando registros de teste...');
      const testResult = await createTestHistoryData();
      
      if (testResult) {
        console.log('✅ Dados de teste criados com sucesso');
      } else {
        console.log('⚠️ Falha ao criar dados de teste');
      }
      
      // Verificar novamente após inserção
      const { data: newData, error: newError } = await supabase
        .from('attendance_history')
        .select('*');
      
      if (newError) {
        console.error('❌ Erro ao ler dados após inserção:', newError);
        return;
      }
      
      console.log('📋 Dados após inserção:', newData);
      console.log('📊 Total de registros após inserção:', newData?.length || 0);
      
      // Testar busca por data específica
      const today = new Date().toISOString().split('T')[0];
      console.log('🔍 Testando busca por data:', today);
      
      const { data: todayData, error: todayError } = await supabase
        .from('attendance_history')
        .select('*')
        .eq('service_date', today);
      
      if (todayError) {
        console.error('❌ Erro ao buscar dados de hoje:', todayError);
        return;
      }
      
      console.log('📋 Dados de hoje encontrados:', todayData);
      console.log('📊 Total de registros de hoje:', todayData?.length || 0);
      
    } catch (error) {
      console.error('💥 Erro no teste:', error);
    }
  }, [createTestHistoryData]);

  const loadHistory = async () => {
    try {
      console.log('📊 Carregando histórico do dia atual...');
      const today = new Date().toISOString().split('T')[0];
      console.log('📅 Data de hoje:', today);
      
      const { data, error } = await supabase
        .from('attendance_history')
        .select('*')
        .eq('service_date', today)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erro ao carregar histórico:', error);
        throw error;
      }

      console.log('📊 Dados do histórico carregados:', data);
      console.log('📈 Quantidade de registros:', data?.length || 0);

      const mappedHistory: AttendmentHistory[] = data.map(item => {
        // Converter data do banco (YYYY-MM-DD) para formato brasileiro (DD/MM/YYYY)
        const dbDate = new Date(item.service_date + 'T00:00:00');
        const brazilianDate = dbDate.toLocaleDateString('pt-BR');
        
        return {
          id: item.id,
          attendantId: item.attendant_id,
          attendantName: item.attendant_name,
          ticketNumber: item.ticket_number,
          ticketType: item.ticket_type as 'preferencial' | 'normal',
          startTime: new Date(item.start_time),
          endTime: new Date(item.end_time),
          date: brazilianDate,
        };
      });

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
      const serviceDate = completedAt.toISOString().split('T')[0];

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
        
        insertAttendanceHistory(historyData)
      ]);

      // Verifica se houve erros
      const [ticketResult, historyResult] = results;
      
      console.log('📊 Resultado da atualização do ticket:', ticketResult);
      console.log('📊 Resultado da inserção no histórico:', historyResult);
      
      if (ticketResult.error) {
        console.error('❌ Erro ao atualizar ticket:', ticketResult.error);
        throw new Error(`Erro ao atualizar ticket: ${ticketResult.error.message}`);
      }
      
      if (historyResult.error) {
        console.error('❌ Erro ao inserir no histórico:', historyResult.error);
        throw new Error(`Erro ao salvar histórico: ${historyResult.error.message}`);
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
      console.log('🔍 Buscando histórico para a data:', date);
      
      // Converter data brasileira (DD/MM/YYYY) para formato do banco (YYYY-MM-DD)
      let dbDate: string;
      
      if (date.includes('/')) {
        const [day, month, year] = date.split('/');
        dbDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        console.log('📅 Componentes da data:', { day, month, year });
      } else {
        // Se já estiver no formato YYYY-MM-DD
        dbDate = date;
      }
      
      console.log('📅 Data convertida para o banco:', dbDate);
      
      // Primeiro, vamos verificar se há dados na tabela
      const { data: totalCount, error: countError } = await supabase
        .from('attendance_history')
        .select('*');
      
      console.log('📊 Total de registros na tabela attendance_history:', totalCount?.length || 0);
      console.log('📋 Todos os registros:', totalCount);
      
      if (countError) {
        console.error('❌ Erro ao contar registros:', countError);
      }
      
      // Buscar registros para a data específica
      console.log('🔍 Executando consulta com service_date =', dbDate);
      
      const { data, error } = await supabase
        .from('attendance_history')
        .select('*')
        .eq('service_date', dbDate)
        .order('created_at', { ascending: false });
      
      console.log('📊 Resultado da consulta:', {
        dbDate,
        recordsFound: data?.length || 0,
        data,
        error
      });

      if (error) {
        console.error('❌ Erro na consulta Supabase:', error);
        console.error('❌ Detalhes do erro:', JSON.stringify(error, null, 2));
        throw error;
      }

      console.log('📊 Dados retornados do banco para a data específica:', data);
      console.log('📈 Quantidade de registros encontrados:', data?.length || 0);

      if (!data || data.length === 0) {
        console.log('⚠️ Nenhum registro encontrado para a data:', dbDate);
        
        // Se não encontrou dados para a data específica, vamos buscar todos os registros
        console.log('🔍 Buscando todos os registros para debug...');
        const { data: allData, error: allError } = await supabase
          .from('attendance_history')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (!allError && allData && allData.length > 0) {
          console.log('📋 Todos os registros encontrados:', allData);
          console.log('📋 Datas disponíveis:', allData.map(item => item.service_date));
          
          // Se a data solicitada for hoje e não há registros, retorna array vazio
          // Se há registros mas não para a data específica, também retorna vazio
          return [];
        } else {
          console.log('📋 Nenhum registro encontrado na tabela attendance_history');
          return [];
        }
      }

      const mappedData = data.map(item => {
        // Converter data do banco (YYYY-MM-DD) para formato brasileiro (DD/MM/YYYY)
        const dbDate = new Date(item.service_date + 'T00:00:00');
        const brazilianDate = dbDate.toLocaleDateString('pt-BR');
        
        return {
          id: item.id,
          attendantId: item.attendant_id,
          attendantName: item.attendant_name,
          ticketNumber: item.ticket_number,
          ticketType: item.ticket_type as 'preferencial' | 'normal',
          startTime: new Date(item.start_time),
          endTime: new Date(item.end_time),
          date: brazilianDate,
        };
      });
      
      console.log('✅ Dados mapeados:', mappedData);
      return mappedData;
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
    testHistoryConnection,
  };
};