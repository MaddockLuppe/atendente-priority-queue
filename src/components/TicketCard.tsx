import { Clock, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Ticket } from '@/types';

interface TicketCardProps {
  ticket: Ticket;
  isOverdue?: boolean;
  showActions?: boolean;
  onCall?: () => void;
  onComplete?: () => void;
}

export const TicketCard = ({ 
  ticket, 
  isOverdue = false, 
  showActions = false,
  onCall,
  onComplete 
}: TicketCardProps) => {
  const getTicketTypeColor = (type: Ticket['type']) => {
    return type === 'preferencial' ? 'queue-preferential' : 'queue-normal';
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <Card className={`p-4 shadow-card transition-all duration-300 ${
      isOverdue ? 'border-alert-danger bg-red-50' : 'bg-gradient-card'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Badge 
            className={`text-white font-bold ${
              ticket.type === 'preferencial' 
                ? 'bg-queue-preferential' 
                : 'bg-queue-normal'
            }`}
          >
            {ticket.number}
          </Badge>
          {isOverdue && (
            <div className="flex items-center gap-1 text-alert-danger">
              <AlertTriangle size={16} />
              <span className="text-sm font-medium">Tempo Excedido</span>
            </div>
          )}
        </div>
        
        {ticket.calledAt && (
          <div className="flex items-center gap-1 text-muted-foreground text-sm">
            <Clock size={14} />
            <span>{formatTime(ticket.calledAt)}</span>
          </div>
        )}
      </div>

      <div className="text-sm text-muted-foreground mb-3">
        <p>Criado às {formatTime(ticket.createdAt)}</p>
        {ticket.type === 'preferencial' && (
          <p className="text-queue-preferencial font-medium">Atendimento Preferencial</p>
        )}
      </div>

      {showActions && (
        <div className="flex gap-2">
          {!ticket.calledAt && onCall && (
            <Button 
              onClick={onCall}
              variant="default"
              size="sm"
              className="flex-1"
            >
              Chamar
            </Button>
          )}
          {ticket.calledAt && onComplete && (
            <Button 
              onClick={onComplete}
              variant="success"
              size="sm"
              className="flex-1"
            >
              Concluir
            </Button>
          )}
        </div>
      )}
    </Card>
  );
};