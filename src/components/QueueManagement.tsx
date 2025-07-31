import { Plus, Users, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { QueueState } from '@/types';

interface QueueManagementProps {
  queueState: QueueState;
  onCreateTicket: (type: 'preferencial' | 'normal') => void;
}

export const QueueManagement = ({ queueState, onCreateTicket }: QueueManagementProps) => {
  const totalQueue = queueState.preferentialQueue.length + queueState.normalQueue.length;
  
  const canCreatePreferential = queueState.nextPreferentialNumber <= 2;
  const canCreateNormal = queueState.nextNormalNumber <= 10;

  return (
    <Card className="p-6 shadow-elevated bg-gradient-card border-0">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-primary">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Gerenciamento de Fila</h2>
            <p className="text-muted-foreground">
              {totalQueue} fichas aguardando atendimento
            </p>
          </div>
        </div>
        
        <Badge variant="outline" className="text-lg px-3 py-1">
          <Clock size={16} className="mr-2" />
          {totalQueue}
        </Badge>
      </div>

      {/* Estatísticas da Fila */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 rounded-lg bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full bg-queue-preferential"></div>
            <span className="font-medium">Preferenciais</span>
          </div>
          <div className="text-2xl font-bold text-queue-preferential">
            {queueState.preferentialQueue.length}
          </div>
          <div className="text-sm text-muted-foreground">
            Próxima: P{queueState.nextPreferentialNumber > 2 ? 1 : queueState.nextPreferentialNumber}
          </div>
        </div>

        <div className="p-4 rounded-lg bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full bg-queue-normal"></div>
            <span className="font-medium">Normais</span>
          </div>
          <div className="text-2xl font-bold text-queue-normal">
            {queueState.normalQueue.length}
          </div>
          <div className="text-sm text-muted-foreground">
            Próxima: N{queueState.nextNormalNumber > 10 ? 1 : queueState.nextNormalNumber}
          </div>
        </div>
      </div>

      {/* Botões de Criação */}
      <div className="space-y-3">
        <Button 
          onClick={() => onCreateTicket('preferencial')}
          disabled={!canCreatePreferential}
          variant="preferential"
          size="lg"
          className="w-full"
        >
          <Plus size={18} className="mr-2" />
          Gerar Ficha Preferencial
          {!canCreatePreferential && ' (Limite atingido)'}
        </Button>
        
        <Button 
          onClick={() => onCreateTicket('normal')}
          disabled={!canCreateNormal}
          variant="normal"
          size="lg"
          className="w-full"
        >
          <Plus size={18} className="mr-2" />
          Gerar Ficha Normal
          {!canCreateNormal && ' (Limite atingido)'}
        </Button>
      </div>

      {/* Lista de Fichas na Fila */}
      {totalQueue > 0 && (
        <div className="mt-6">
          <h3 className="font-medium mb-3">Ordem de Atendimento</h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {/* Preferenciais primeiro */}
            {queueState.preferentialQueue.map((ticket, index) => (
              <div 
                key={ticket.id}
                className="flex items-center justify-between p-2 rounded bg-orange-50 border border-orange-200"
              >
                <div className="flex items-center gap-2">
                  <Badge className="bg-queue-preferential text-white">{ticket.number}</Badge>
                  <span className="text-sm">Preferencial</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  #{index + 1}
                </span>
              </div>
            ))}
            {/* Normais depois */}
            {queueState.normalQueue.map((ticket, index) => (
              <div 
                key={ticket.id}
                className="flex items-center justify-between p-2 rounded bg-blue-50 border border-blue-200"
              >
                <div className="flex items-center gap-2">
                  <Badge className="bg-queue-normal text-white">{ticket.number}</Badge>
                  <span className="text-sm">Normal</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  #{queueState.preferentialQueue.length + index + 1}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};