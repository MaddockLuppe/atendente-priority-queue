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

  const createTicket = useCallback((type: 'preferencial' | 'normal'): Ticket => {
    const isPreferential = type === 'preferencial';
    const currentQueue = isPreferential ? queueState.preferentialQueue : queueState.normalQueue;
    const maxNumber = isPreferential ? 2 : 10;
    
    // Verifica se já atingiu o limite
    if (currentQueue.length >= maxNumber) {
      throw new Error(`Limite de fichas ${type} atingido (${maxNumber} fichas)`);
    }

    // Encontra o próximo número disponível
    const usedNumbers = currentQueue.map(t => parseInt(t.number.substring(1)));
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
    };

    setQueueState(prev => ({
      ...prev,
      [isPreferential ? 'preferentialQueue' : 'normalQueue']: [
        ...prev[isPreferential ? 'preferentialQueue' : 'normalQueue'],
        ticket
      ].sort((a, b) => {
        const aNum = parseInt(a.number.substring(1));
        const bNum = parseInt(b.number.substring(1));
        return aNum - bNum;
      }),
      [isPreferential ? 'nextPreferentialNumber' : 'nextNormalNumber']: nextNumber + 1
    }));

    return ticket;
  }, [queueState, generateTicketId]);

  const callNextTicket = useCallback((attendantId: string) => {
    setQueueState(prev => {
      const nextTicket = prev.preferentialQueue[0] || prev.normalQueue[0];
      
      if (!nextTicket) return prev;

      const isFromPreferential = prev.preferentialQueue[0] === nextTicket;
      
      const updatedTicket = {
        ...nextTicket,
        calledAt: new Date(),
        attendantId,
      };

      setAttendantStates(prevAttendants => ({
        ...prevAttendants,
        [attendantId]: {
          ...prevAttendants[attendantId],
          currentTicket: updatedTicket,
          isActive: true,
        }
      }));

      // Inicia timer de 15 minutos
      const timerId = window.setTimeout(() => {
        setTimers(prevTimers => ({
          ...prevTimers,
          [attendantId]: Date.now() + (15 * 60 * 1000)
        }));
      }, 15 * 60 * 1000);

      setTimers(prevTimers => ({
        ...prevTimers,
        [attendantId]: timerId
      }));

      return {
        ...prev,
        preferentialQueue: isFromPreferential 
          ? prev.preferentialQueue.slice(1)
          : prev.preferentialQueue,
        normalQueue: isFromPreferential 
          ? prev.normalQueue
          : prev.normalQueue.slice(1),
      };
    });
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