import { useState, useCallback } from 'react';
import { Ticket, Attendant, QueueState } from '@/types';

const ATTENDANT_NAMES = [
  "pai", "mae", "moane", "elizabeth", "jeovane", 
  "felipe", "luiz walter", "lara", "levi", "talles", "wellingtom"
];

export const useTicketSystem = () => {
  // Inicializa atendentes
  const [attendants] = useState<Attendant[]>(() =>
    ATTENDANT_NAMES.map((name, index) => ({
      id: `attendant-${index}`,
      name,
      isActive: false,
    }))
  );

  const [attendantStates, setAttendantStates] = useState<Record<string, Attendant>>(() =>
    attendants.reduce((acc, attendant) => ({
      ...acc,
      [attendant.id]: attendant
    }), {})
  );

  const [queueState, setQueueState] = useState<QueueState>({
    preferentialQueue: [],
    normalQueue: [],
    nextPreferentialNumber: 1,
    nextNormalNumber: 1,
  });

  const [timers, setTimers] = useState<Record<string, number>>({});

  const generateTicketId = useCallback((type: 'preferencial' | 'normal', number: number): string => {
    return type === 'preferencial' ? `P${number}` : `N${number}`;
  }, []);

  const createTicket = useCallback((type: 'preferencial' | 'normal', attendantId: string): Ticket => {
    const attendant = attendantStates[attendantId];
    
    // Verifica se o atendente já está ocupado
    if (attendant?.isActive) {
      throw new Error('Atendente já está ocupado');
    }

    const isPreferential = type === 'preferencial';
    const maxNumber = isPreferential ? 2 : 10;
    
    // Encontra o próximo número disponível baseado nos atendentes ativos
    const allActiveTickets = Object.values(attendantStates)
      .filter(a => a.currentTicket && a.currentTicket.type === type)
      .map(a => a.currentTicket!);
    
    const usedNumbers = allActiveTickets.map(t => parseInt(t.number.substring(1)));
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
      calledAt: new Date(),
      attendantId,
    };

    // Adiciona ficha diretamente ao atendente
    setAttendantStates(prevAttendants => ({
      ...prevAttendants,
      [attendantId]: {
        ...prevAttendants[attendantId],
        currentTicket: ticket,
        isActive: true,
      }
    }));

    // Inicia timer de 15 minutos
    const timerId = window.setTimeout(() => {
      // Timer apenas para referência, o alerta é verificado pelo isTicketOverdue
    }, 15 * 60 * 1000);

    setTimers(prevTimers => ({
      ...prevTimers,
      [attendantId]: timerId
    }));

    return ticket;
  }, [attendantStates, generateTicketId]);

  const callNextTicket = useCallback((attendantId: string) => {
    // Esta função não é mais necessária já que as fichas vão diretamente para os atendentes
    // Mantemos apenas para compatibilidade
  }, []);

  const completeTicket = useCallback((attendantId: string) => {
    const attendant = attendantStates[attendantId];
    if (!attendant?.currentTicket) return;

    // Limpa timer
    if (timers[attendantId]) {
      clearTimeout(timers[attendantId]);
      setTimers(prev => {
        const { [attendantId]: _, ...rest } = prev;
        return rest;
      });
    }

    setAttendantStates(prev => ({
      ...prev,
      [attendantId]: {
        ...prev[attendantId],
        currentTicket: undefined,
        isActive: false,
      }
    }));
  }, [attendantStates, timers]);

  const isTicketOverdue = useCallback((attendantId: string): boolean => {
    const attendant = attendantStates[attendantId];
    if (!attendant?.currentTicket?.calledAt) return false;
    
    const now = Date.now();
    const calledTime = attendant.currentTicket.calledAt.getTime();
    return (now - calledTime) > (15 * 60 * 1000);
  }, [attendantStates]);

  return {
    attendants: Object.values(attendantStates),
    queueState,
    createTicket,
    callNextTicket,
    completeTicket,
    isTicketOverdue,
  };
};