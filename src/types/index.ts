export interface Ticket {
  id: string;
  number: string;
  type: 'preferencial' | 'normal';
  createdAt: Date;
  calledAt?: Date;
  completedAt?: Date;
  attendantId?: string;
}

export interface Attendant {
  id: string;
  name: string;
  currentTicket?: Ticket;
  isActive: boolean;
}

export interface QueueState {
  preferentialQueue: Ticket[];
  normalQueue: Ticket[];
  nextPreferentialNumber: number;
  nextNormalNumber: number;
}