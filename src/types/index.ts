export interface Ticket {
  id: string;
  number: string;
  type: 'preferencial' | 'normal';
  createdAt: Date;
  calledAt?: Date;
  completedAt?: Date;
  attendantId: string;
  status: 'waiting' | 'in-service' | 'completed';
}

export interface Attendant {
  id: string;
  name: string;
  currentTicket?: Ticket;
  queueTickets: Ticket[];
  isActive: boolean;
}

export interface QueueState {
  preferentialQueue: Ticket[];
  normalQueue: Ticket[];
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