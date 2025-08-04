import { useState, useCallback, useEffect } from 'react';
import { Ticket, Attendant, QueueState, AttendmentHistory } from '@/types';
import { supabase } from '@/integrations/supabase/client';

// Removed INITIAL_ATTENDANT_NAMES - now using database

export const useTicketSystem = () => {
  const [attendants, setAttendants] = useState<Attendant[]>([]);
  const [queueState, setQueueState] = useState<QueueState>({
    preferentialQueue: [],
    normalQueue: [],
    nextPreferentialNumber: 1,
    nextNormalNumber: 1,
  });
  const [timers, setTimers] = useState<Record<string, number>>({});
  const [history, setHistory] = useState<AttendmentHistory[]>([]);

  // Load data from Supabase on component mount
  useEffect(() => {
    loadAttendants();
    loadQueueState();
    loadHistory();
  }, []);

  const loadAttendants = async () => {
    try {
      const { data: attendantsData, error: attendantsError } = await supabase
        .from('attendants')
        .select('*')
        .order('created_at');

      const { data: ticketsData, error: ticketsError } = await supabase
        .from('tickets')
        .select('*')
        .neq('status', 'completed')
        .order('created_at');

      if (attendantsError) throw attendantsError;
      if (ticketsError) throw ticketsError;

      const formattedAttendants: Attendant[] = attendantsData.map(att => {
        const attendantTickets = ticketsData.filter(ticket => ticket.attendant_id === att.id);
        const currentTicket = attendantTickets.find(t => t.status === 'in-service');
        const queueTickets = attendantTickets.filter(t => t.status === 'waiting');

        return {
          id: att.id,
          name: att.name,
          isActive: att.is_active,
          currentTicket: currentTicket ? {
            id: currentTicket.id,
            number: currentTicket.ticket_number,
            type: currentTicket.ticket_type as 'preferencial' | 'normal',
            createdAt: new Date(currentTicket.created_at),
            calledAt: currentTicket.called_at ? new Date(currentTicket.called_at) : undefined,
            completedAt: currentTicket.completed_at ? new Date(currentTicket.completed_at) : undefined,
            attendantId: currentTicket.attendant_id,
            status: currentTicket.status as 'waiting' | 'in-service' | 'completed'
          } : undefined,
          queueTickets: queueTickets.map(t => ({
            id: t.id,
            number: t.ticket_number,
            type: t.ticket_type as 'preferencial' | 'normal',
            createdAt: new Date(t.created_at),
            calledAt: t.called_at ? new Date(t.called_at) : undefined,
            completedAt: t.completed_at ? new Date(t.completed_at) : undefined,
            attendantId: t.attendant_id,
            status: t.status as 'waiting' | 'in-service' | 'completed'
          }))
        };
      });

      setAttendants(formattedAttendants);
    } catch (error) {
      console.error('Error loading attendants:', error);
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
        preferentialQueue: [],
        normalQueue: [],
        nextPreferentialNumber: data.next_preferential_number,
        nextNormalNumber: data.next_normal_number,
      });
    } catch (error) {
      console.error('Error loading queue state:', error);
    }
  };

  const loadHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('attendance_history')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedHistory: AttendmentHistory[] = data.map(h => ({
        id: h.id,
        attendantId: h.attendant_id,
        attendantName: h.attendant_name,
        ticketNumber: h.ticket_number,
        ticketType: h.ticket_type as 'preferencial' | 'normal',
        startTime: new Date(h.start_time),
        endTime: new Date(h.end_time),
        date: h.service_date
      }));

      setHistory(formattedHistory);
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  const generateTicketId = useCallback((type: 'preferencial' | 'normal', number: number): string => {
    return type === 'preferencial' ? `P${number}` : `N${number}`;
  }, []);

  const addAttendant = useCallback(async (name: string) => {
    try {
      const { data, error } = await supabase
        .from('attendants')
        .insert({ name, is_active: false })
        .select()
        .single();

      if (error) throw error;

      await loadAttendants();
    } catch (error) {
      console.error('Error adding attendant:', error);
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
      console.error('Error updating attendant:', error);
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
      console.error('Error deleting attendant:', error);
    }
  }, []);

  const createTicket = useCallback(async (type: 'preferencial' | 'normal', attendantId: string): Promise<Ticket | null> => {
    try {
      const attendant = attendants.find(a => a.id === attendantId);
      if (!attendant) {
        throw new Error('Atendente não encontrado');
      }

      const isPreferential = type === 'preferencial';
      const maxNumber = isPreferential ? 2 : 10;
      
      // Encontra o próximo número disponível apenas para este atendente
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

      const ticketNumber = generateTicketId(type, nextNumber);

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

      const ticket: Ticket = {
        id: data.id,
        number: data.ticket_number,
        type: data.ticket_type as 'preferencial' | 'normal',
        createdAt: new Date(data.created_at),
        attendantId: data.attendant_id,
        status: data.status as 'waiting' | 'in-service' | 'completed'
      };

      return ticket;
    } catch (error) {
      console.error('Error creating ticket:', error);
      return null;
    }
  }, [attendants, generateTicketId]);

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

      // Inicia timer de 15 minutos
      const timerId = window.setTimeout(() => {
        // Timer apenas para referência, o alerta é verificado pelo isTicketOverdue
      }, 15 * 60 * 1000);

      setTimers(prevTimers => ({
        ...prevTimers,
        [attendantId]: timerId
      }));

      await loadAttendants();
    } catch (error) {
      console.error('Error calling next ticket:', error);
    }
  }, [attendants]);

  const completeTicket = useCallback(async (attendantId: string) => {
    try {
      const attendant = attendants.find(a => a.id === attendantId);
      if (!attendant?.currentTicket) return;

      const currentTicket = attendant.currentTicket;

      // Update ticket to completed in database
      const { error: ticketError } = await supabase
        .from('tickets')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', currentTicket.id);

      if (ticketError) throw ticketError;

      // Add to history
      const { error: historyError } = await supabase
        .from('attendance_history')
        .insert({
          attendant_id: attendantId,
          attendant_name: attendant.name,
          ticket_number: currentTicket.number,
          ticket_type: currentTicket.type,
          start_time: currentTicket.calledAt!.toISOString(),
          end_time: new Date().toISOString(),
          service_date: new Date().toISOString().split('T')[0]
        });

      if (historyError) throw historyError;

      // Limpa timer
      if (timers[attendantId]) {
        clearTimeout(timers[attendantId]);
        setTimers(prev => {
          const { [attendantId]: _, ...rest } = prev;
          return rest;
        });
      }

      await loadAttendants();
      await loadHistory();
    } catch (error) {
      console.error('Error completing ticket:', error);
    }
  }, [attendants, timers]);

  const isTicketOverdue = useCallback((attendantId: string): boolean => {
    const attendant = attendants.find(a => a.id === attendantId);
    if (!attendant?.currentTicket?.calledAt) return false;
    
    const now = Date.now();
    const calledTime = attendant.currentTicket.calledAt.getTime();
    return (now - calledTime) > (15 * 60 * 1000);
  }, [attendants]);

  const removeTicket = useCallback(async (attendantId: string, ticketId: string) => {
    try {
      const attendant = attendants.find(a => a.id === attendantId);
      if (!attendant) return;

      // Delete ticket from database
      const { error } = await supabase
        .from('tickets')
        .delete()
        .eq('id', ticketId);

      if (error) throw error;

      // Limpa timer se existir
      if (timers[attendantId]) {
        clearTimeout(timers[attendantId]);
        setTimers(prev => {
          const { [attendantId]: _, ...rest } = prev;
          return rest;
        });
      }

      await loadAttendants();
    } catch (error) {
      console.error('Error removing ticket:', error);
    }
  }, [attendants, timers]);

  const getHistoryByDate = useCallback((date: string) => {
    return history.filter(h => h.date === date);
  }, [history]);

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
      console.error('Error toggling attendant active:', error);
    }
  }, [attendants]);

  return {
    attendants,
    queueState,
    history,
    createTicket,
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