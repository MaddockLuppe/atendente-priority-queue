import { useState } from 'react';
import { useTicketSystem } from '@/hooks/useTicketSystem';
import { AttendantCard } from '@/components/AttendantCard';
import { QueueManagement } from '@/components/QueueManagement';
import { useToast } from '@/hooks/use-toast';
import { Users, Clock } from 'lucide-react';

const Index = () => {
  const { 
    attendants, 
    queueState, 
    createTicket, 
    callNextTicket, 
    completeTicket, 
    isTicketOverdue 
  } = useTicketSystem();
  
  const { toast } = useToast();

  const handleCreateTicket = (type: 'preferencial' | 'normal') => {
    try {
      const ticket = createTicket(type);
      toast({
        title: "Ficha gerada com sucesso!",
        description: `Ficha ${ticket.number} (${type}) foi criada.`,
      });
    } catch (error) {
      toast({
        title: "Erro ao gerar ficha",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    }
  };

  const handleCallNext = (attendantId: string) => {
    try {
      callNextTicket(attendantId);
      const attendant = attendants.find(a => a.id === attendantId);
      toast({
        title: "Ficha chamada!",
        description: `${attendant?.name} está atendendo a próxima ficha.`,
      });
    } catch (error) {
      toast({
        title: "Erro ao chamar ficha",
        description: "Não há fichas na fila.",
        variant: "destructive",
      });
    }
  };

  const handleComplete = (attendantId: string) => {
    const attendant = attendants.find(a => a.id === attendantId);
    completeTicket(attendantId);
    toast({
      title: "Atendimento concluído!",
      description: `${attendant?.name} finalizou o atendimento.`,
    });
  };

  const getNextTicketsForAttendant = () => {
    return [...queueState.preferentialQueue, ...queueState.normalQueue];
  };

  const getTotalQueue = () => {
    return queueState.preferentialQueue.length + queueState.normalQueue.length;
  };

  const hasTicketsInQueue = () => {
    return getTotalQueue() > 0;
  };

  return (
    <div className="min-h-screen bg-gradient-main">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="p-3 rounded-full bg-white/20 backdrop-blur-sm">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white">
              Sistema de Gerenciamento de Atendentes
            </h1>
          </div>
          <p className="text-white/90 text-lg">
            Gerencie fichas e organize o atendimento de forma eficiente
          </p>
        </div>

        {/* Estatísticas Gerais */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/95 backdrop-blur-sm rounded-lg p-6 shadow-elevated">
            <div className="flex items-center gap-3">
              <Clock className="w-6 h-6 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Fichas na Fila</p>
                <p className="text-2xl font-bold">{getTotalQueue()}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/95 backdrop-blur-sm rounded-lg p-6 shadow-elevated">
            <div className="flex items-center gap-3">
              <Users className="w-6 h-6 text-attendant-active" />
              <div>
                <p className="text-sm text-muted-foreground">Atendentes Ativos</p>
                <p className="text-2xl font-bold">
                  {attendants.filter(a => a.isActive).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/95 backdrop-blur-sm rounded-lg p-6 shadow-elevated">
            <div className="flex items-center gap-3">
              <Clock className="w-6 h-6 text-queue-preferential" />
              <div>
                <p className="text-sm text-muted-foreground">Preferenciais</p>
                <p className="text-2xl font-bold">{queueState.preferentialQueue.length}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Painel de Gerenciamento de Fila */}
          <div className="lg:col-span-1">
            <QueueManagement 
              queueState={queueState}
              onCreateTicket={handleCreateTicket}
            />
          </div>

          {/* Grade de Atendentes */}
          <div className="lg:col-span-3">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {attendants.map((attendant) => (
                <AttendantCard
                  key={attendant.id}
                  attendant={attendant}
                  queueLength={getTotalQueue()}
                  nextTickets={getNextTicketsForAttendant()}
                  isOverdue={isTicketOverdue(attendant.id)}
                  onCallNext={() => handleCallNext(attendant.id)}
                  onComplete={() => handleComplete(attendant.id)}
                  canCallNext={hasTicketsInQueue()}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
