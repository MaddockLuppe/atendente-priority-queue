import { useState } from 'react';
import { useTicketSystem } from '@/hooks/useTicketSystem';
import { AttendantCard } from '@/components/AttendantCard';
import { QueueManagement } from '@/components/QueueManagement';
import { AttendantManager } from '@/components/AttendantManager';
import { HistoryViewer } from '@/components/HistoryViewer';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Users, Clock } from 'lucide-react';
const Index = () => {
  const {
    attendants,
    queueState,
    createTicket,
    callNextTicket,
    completeTicket,
    isTicketOverdue,
    addAttendant,
    updateAttendant,
    deleteAttendant,
    getHistoryByDate,
  } = useTicketSystem();
  const { toast } = useToast();
  const [confirmingCompletion, setConfirmingCompletion] = useState<string | null>(null);
  const handleCreateTicket = (type: 'preferencial' | 'normal', attendantId: string) => {
    try {
      const ticket = createTicket(type, attendantId);
      const attendant = attendants.find(a => a.id === attendantId);
      toast({
        title: "Ficha gerada com sucesso!",
        description: `Ficha ${ticket.number} (${type}) foi criada para ${attendant?.name}.`
      });
    } catch (error) {
      toast({
        title: "Erro ao gerar ficha",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    }
  };
  const handleCallNext = (attendantId: string) => {
    callNextTicket(attendantId);
    const attendant = attendants.find(a => a.id === attendantId);
    toast({
      title: "Ficha chamada!",
      description: `${attendant?.name} chamou a próxima ficha.`
    });
  };

  const handleComplete = (attendantId: string) => {
    setConfirmingCompletion(attendantId);
  };

  const confirmComplete = () => {
    if (confirmingCompletion) {
      const attendant = attendants.find(a => a.id === confirmingCompletion);
      completeTicket(confirmingCompletion);
      toast({
        title: "Atendimento concluído!",
        description: `${attendant?.name} finalizou o atendimento.`
      });
      setConfirmingCompletion(null);
    }
  };
  const getTotalQueue = () => {
    return attendants.reduce((total, a) => total + a.queueTickets.length, 0);
  };
  return <div className="min-h-screen bg-gradient-main">
      <div className="container mx-auto px-4 py-8 bg-red-600">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="p-3 rounded-full bg-white/20 backdrop-blur-sm">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white">Sistema de Gerenciamento de Atendimentos</h1>
          </div>
          <p className="text-white/90 text-lg">Controle de Atendimentos</p>
          
          {/* Controles de Gerenciamento */}
          <div className="flex justify-center gap-4 mt-6">
            <div className="bg-white/95 backdrop-blur-sm rounded-lg p-4">
              <AttendantManager
                attendants={attendants}
                onAddAttendant={addAttendant}
                onUpdateAttendant={updateAttendant}
                onDeleteAttendant={deleteAttendant}
              />
            </div>
            <div className="bg-white/95 backdrop-blur-sm rounded-lg p-4">
              <HistoryViewer onGetHistoryByDate={getHistoryByDate} />
            </div>
          </div>
        </div>

        {/* Estatísticas Gerais */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/95 backdrop-blur-sm rounded-lg p-6 shadow-elevated">
            <div className="flex items-center gap-3">
              <Clock className="w-6 h-6 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Atendimentos Ativos</p>
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
                <p className="text-sm text-muted-foreground">Atendimentos Preferenciais</p>
                <p className="text-2xl font-bold">{attendants.filter(a => a.currentTicket?.type === 'preferencial').length}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Painel de Gerenciamento de Fila */}
          <div className="lg:col-span-1">
            <QueueManagement queueState={queueState} attendants={attendants} onCreateTicket={handleCreateTicket} />
          </div>

          {/* Grade de Atendentes */}
          <div className="lg:col-span-3">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {attendants.map(attendant => (
                <AttendantCard 
                  key={attendant.id} 
                  attendant={attendant} 
                  queueLength={attendant.queueTickets.length} 
                  nextTickets={attendant.queueTickets} 
                  isOverdue={isTicketOverdue(attendant.id)} 
                  onCallNext={() => handleCallNext(attendant.id)} 
                  onComplete={() => handleComplete(attendant.id)} 
                  canCallNext={attendant.queueTickets.length > 0}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Diálogo de Confirmação */}
        <AlertDialog open={!!confirmingCompletion} onOpenChange={() => setConfirmingCompletion(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Conclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja concluir este atendimento? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmComplete}>
                Concluir Atendimento
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>;
};
export default Index;