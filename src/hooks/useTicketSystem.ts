import { useState, useCallback } from 'react';
import { Ticket, Attendant, QueueState, AttendmentHistory } from '@/types';

const INITIAL_ATTENDANT_NAMES = [
  "pai", "mae", "moane", "elizabeth", "jeovane", 
  "felipe", "luiz walter", "lara", "levi", "talles", "wellingtom"
];

export const useTicketSystem = () => {
  // Inicializa atendentes
  const [attendants, setAttendants] = useState<Attendant[]>(() =>
    INITIAL_ATTENDANT_NAMES.map((name, index) => ({
      id: `attendant-${index}`,
      name,
      isActive: false,
      queueTickets: [],
    }))
  );

  const [queueState, setQueueState] = useState<QueueState>({
    preferentialQueue: [],
    normalQueue: [],
    nextPreferentialNumber: 1,
    nextNormalNumber: 1,
  });

  const [timers, setTimers] = useState<Record<string, number>>({});
  const [history, setHistory] = useState<AttendmentHistory[]>([]);

  const generateTicketId = useCallback((type: 'preferencial' | 'normal', number: number): string => {
    return type === 'preferencial' ? `P${number}` : `N${number}`;
  }, []);

  const addAttendant = useCallback((name: string) => {
    const newId = `attendant-${Date.now()}`;
    setAttendants(prev => [...prev, {
      id: newId,
      name,
      isActive: false,
      queueTickets: [],
    }]);
  }, []);

  const updateAttendant = useCallback((id: string, name: string) => {
    setAttendants(prev => prev.map(attendant => 
      attendant.id === id ? { ...attendant, name } : attendant
    ));
  }, []);

  const deleteAttendant = useCallback((id: string) => {
    setAttendants(prev => prev.filter(attendant => attendant.id !== id));
  }, []);

  const createTicket = useCallback((type: 'preferencial' | 'normal', attendantId: string): Ticket => {
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

    const ticket: Ticket = {
      id: generateTicketId(type, nextNumber),
      number: generateTicketId(type, nextNumber),
      type,
      createdAt: new Date(),
      attendantId,
      status: 'waiting',
    };

    // Adiciona ficha à fila do atendente
    setAttendants(prev => prev.map(a => 
      a.id === attendantId 
        ? { ...a, queueTickets: [...a.queueTickets, ticket] }
        : a
    ));

    return ticket;
  }, [attendants, generateTicketId]);

  const callNextTicket = useCallback((attendantId: string) => {
    const attendant = attendants.find(a => a.id === attendantId);
    if (!attendant || attendant.currentTicket || attendant.queueTickets.length === 0) return;

    // Prioriza fichas preferenciais
    const nextTicket = attendant.queueTickets.find(t => t.type === 'preferencial') || 
                      attendant.queueTickets[0];

    if (!nextTicket) return;

    const updatedTicket = {
      ...nextTicket,
      calledAt: new Date(),
      status: 'in-service' as const,
    };

    // Inicia timer de 15 minutos
    const timerId = window.setTimeout(() => {
      // Timer apenas para referência, o alerta é verificado pelo isTicketOverdue
    }, 15 * 60 * 1000);

    setTimers(prevTimers => ({
      ...prevTimers,
      [attendantId]: timerId
    }));

    setAttendants(prev => prev.map(a => 
      a.id === attendantId 
        ? { 
            ...a, 
            currentTicket: updatedTicket,
            queueTickets: a.queueTickets.filter(t => t.id !== nextTicket.id),
            isActive: true 
          }
        : a
    ));
  }, [attendants]);

  const completeTicket = useCallback((attendantId: string) => {
    const attendant = attendants.find(a => a.id === attendantId);
    if (!attendant?.currentTicket) return;

    const completedTicket = {
      ...attendant.currentTicket,
      completedAt: new Date(),
      status: 'completed' as const,
    };

    // Adiciona ao histórico
    const historyEntry: AttendmentHistory = {
      id: `history-${Date.now()}`,
      attendantId,
      attendantName: attendant.name,
      ticketNumber: completedTicket.number,
      ticketType: completedTicket.type,
      startTime: completedTicket.calledAt!,
      endTime: completedTicket.completedAt!,
      date: new Date().toISOString().split('T')[0],
    };

    setHistory(prev => [...prev, historyEntry]);

    // Limpa timer
    if (timers[attendantId]) {
      clearTimeout(timers[attendantId]);
      setTimers(prev => {
        const { [attendantId]: _, ...rest } = prev;
        return rest;
      });
    }

    setAttendants(prev => prev.map(a => 
      a.id === attendantId 
        ? { 
            ...a, 
            currentTicket: undefined,
            isActive: a.queueTickets.length > 0 
          }
        : a
    ));
  }, [attendants, timers]);

  const isTicketOverdue = useCallback((attendantId: string): boolean => {
    const attendant = attendants.find(a => a.id === attendantId);
    if (!attendant?.currentTicket?.calledAt) return false;
    
    const now = Date.now();
    const calledTime = attendant.currentTicket.calledAt.getTime();
    return (now - calledTime) > (15 * 60 * 1000);
  }, [attendants]);

  const getHistoryByDate = useCallback((date: string) => {
    return history.filter(h => h.date === date);
  }, [history]);

  return {
    attendants,
    queueState,
    history,
    createTicket,
    callNextTicket,
    completeTicket,
    isTicketOverdue,
    addAttendant,
    updateAttendant,
    deleteAttendant,
    getHistoryByDate,
  };
};