import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
      const { data: attendantsData, error: attendantsError } = await supabase
        .from('attendants')
        .select('*')
        .order('name');

      if (attendantsError) throw attendantsError;

      const { data: ticketsData, error: ticketsError } = await supabase
        .from('tickets')
        .select('*')
        .in('status', ['waiting', 'in-service']);

      if (ticketsError) throw ticketsError;

      const mappedAttendants: Attendant[] = attendantsData.map(attendant => {
        const attendantTickets = ticketsData.filter(t => t.attendant_id === attendant.id);
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
      const { data, error } = await supabase
        .from('queue_state')
        .select('*')
        .single();

      if (error) throw error;

      setQueueState({
        nextPreferentialNumber: data.next_preferential_number,
        nextNormalNumber: data.next_normal_number,
      });
    } catch (error) {
      console.error('Erro ao carregar estado da fila:', error);
    }
  };

  const loadHistory = async () => {
    try {
      const today = new Date().toLocaleDateString('pt-BR');
      const { data, error } = await supabase
        .from('attendance_history')
        .select('*')
        .eq('service_date', today)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mappedHistory: AttendmentHistory[] = data.map(item => ({
        id: item.id,
        attendantId: item.attendant_id,
        attendantName: item.attendant_name,
        ticketNumber: item.ticket_number,
        ticketType: item.ticket_type as 'preferencial' | 'normal',
        startTime: new Date(item.start_time),
        endTime: new Date(item.end_time),
        date: item.service_date,
      }));

      setHistory(mappedHistory);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
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
    try {
      const attendant = attendants.find(a => a.id === attendantId);
      if (!attendant || attendant.currentTicket || attendant.queueTickets.length === 0) return;

      // Prioriza fichas preferenciais
      const nextTicket = attendant.queueTickets.find(t => t.type === 'preferencial') || 
                        attendant.queueTickets[0];

      if (!nextTicket) return;

      const { error } = await supabase
        .from('tickets')
        .update({
          status: 'in-service',
          called_at: new Date().toISOString()
        })
        .eq('id', nextTicket.id);

      if (error) throw error;

      await loadAttendants();
    } catch (error) {
      console.error('Erro ao chamar próximo ticket:', error);
    }
  }, [attendants]);

  const completeTicket = useCallback(async (attendantId: string) => {
    try {
      const attendant = attendants.find(a => a.id === attendantId);
      if (!attendant?.currentTicket) return;

      const completedAt = new Date();
      const calledAt = new Date(attendant.currentTicket.calledAt!);
      const serviceDate = completedAt.toLocaleDateString('pt-BR');

      // Limpa timers antes de fazer as operações
      if (timers[attendantId]) {
        clearTimeout(timers[attendantId].timer);
        clearTimeout(timers[attendantId].warning);
        setTimers(prev => {
          const { [attendantId]: _, ...rest } = prev;
          return rest;
        });
      }

      // Executa as operações em paralelo para melhor performance
      const [ticketResult, historyResult] = await Promise.all([
        supabase
          .from('tickets')
          .update({
            status: 'completed',
            completed_at: completedAt.toISOString()
          })
          .eq('id', attendant.currentTicket.id),
        
        supabase
          .from('attendance_history')
          .insert({
            attendant_id: attendantId,
            attendant_name: attendant.name,
            ticket_number: attendant.currentTicket.number,
            ticket_type: attendant.currentTicket.type,
            start_time: calledAt.toISOString(),
            end_time: completedAt.toISOString(),
            service_date: serviceDate
          })
      ]);

      if (ticketResult.error) throw ticketResult.error;
      if (historyResult.error) throw historyResult.error;

      // Recarrega apenas os dados necessários
      await Promise.all([loadAttendants(), loadHistory()]);
    } catch (error) {
      console.error('Erro ao completar ticket:', error);
    }
  }, [attendants, timers]);

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
      // A data já vem no formato brasileiro (DD-MM-YYYY) do HistoryViewer
      const { data, error } = await supabase
        .from('attendance_history')
        .select('*')
        .eq('service_date', date)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map(item => ({
        id: item.id,
        attendantId: item.attendant_id,
        attendantName: item.attendant_name,
        ticketNumber: item.ticket_number,
        ticketType: item.ticket_type as 'preferencial' | 'normal',
        startTime: new Date(item.start_time),
        endTime: new Date(item.end_time),
        date: item.service_date,
      }));
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
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