import { User, Clock, CheckCircle, Phone } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Attendant, Ticket } from '@/types';
import { TicketCard } from './TicketCard';

interface AttendantCardProps {
  attendant: Attendant;
  queueLength: number;
  nextTickets: Ticket[];
  isOverdue: boolean;
  onCallNext: () => void;
  onComplete: () => void;
  canCallNext: boolean;
}

export const AttendantCard = ({
  attendant,
  queueLength,
  nextTickets,
  isOverdue,
  onCallNext,
  onComplete,
  canCallNext
}: AttendantCardProps) => {
  return (
    <Card className="p-6 shadow-elevated bg-gradient-card border-0">
      {/* Header do Atendente */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${
            attendant.isActive ? 'bg-attendant-active' : 'bg-muted'
          }`}>
            <User className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-lg capitalize">{attendant.name}</h3>
            <div className="flex items-center gap-2">
              <Badge variant={attendant.isActive ? "default" : "secondary"}>
                {attendant.isActive ? 'Ativo' : 'Livre'}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {queueLength} na fila
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Ficha Atual */}
      <div className="mb-4">
        <h4 className="font-medium mb-2 flex items-center gap-2">
          <Clock size={16} />
          Atendimento Atual
        </h4>
        {attendant.currentTicket ? (
          <TicketCard 
            ticket={attendant.currentTicket}
            isOverdue={isOverdue}
            showActions
            onComplete={onComplete}
          />
        ) : (
          <div className="p-4 text-center text-muted-foreground border-2 border-dashed border-border rounded-lg">
            Nenhuma ficha em atendimento
          </div>
        )}
      </div>

      {/* Próximas Fichas */}
      <div className="mb-4">
        <h4 className="font-medium mb-2">Próximas Fichas</h4>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {nextTickets.length > 0 ? (
            nextTickets.slice(0, 3).map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} />
            ))
          ) : (
            <div className="p-3 text-center text-muted-foreground text-sm border border-border rounded">
              Fila vazia
            </div>
          )}
          {nextTickets.length > 3 && (
            <div className="text-center text-sm text-muted-foreground">
              +{nextTickets.length - 3} mais na fila
            </div>
          )}
        </div>
      </div>

      {/* Ações */}
      <div className="flex gap-2">
        <Button 
          onClick={onCallNext}
          disabled={!canCallNext || attendant.isActive}
          variant="default"
          className="flex-1"
        >
          <Phone size={16} className="mr-2" />
          Chamar Próxima
        </Button>
        
        {attendant.currentTicket && (
          <Button 
            onClick={onComplete}
            variant="success"
            className="flex-1"
          >
            <CheckCircle size={16} className="mr-2" />
            Concluir
          </Button>
        )}
      </div>
    </Card>
  );
};