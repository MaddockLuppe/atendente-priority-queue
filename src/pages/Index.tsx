import { useState } from 'react';
import { useTicketSystem } from '@/hooks/useTicketSystem';
import { AttendantCard } from '@/components/AttendantCard';
import { QueueManagement } from '@/components/QueueManagement';
import { AttendantManager } from '@/components/AttendantManager';
import { HistoryViewer } from '@/components/HistoryViewer';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Monitor, UserPlus, Clock, Users } from 'lucide-react';
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
  return (
    <div className="fixed inset-0 bg-gradient-main">
      <Tabs defaultValue="dashboard" className="h-full flex flex-col">
        {/* Conteúdo Principal */}
        <div className="flex-1 overflow-auto">
          {/* Tela Principal - Dashboard */}
          <TabsContent value="dashboard" className="h-full m-0 p-4 pb-20">
            <div className="h-full">
              {/* Header Simplificado */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 mb-2">
                  <div className="p-2 rounded-full bg-white/20 backdrop-blur-sm">
                    <Monitor className="w-6 h-6 text-white" />
                  </div>
                  <h1 className="text-2xl font-bold text-white">Atendimentos</h1>
                </div>
              </div>

              {/* Estatísticas Compactas */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-elevated">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Fila</p>
                    <p className="text-lg font-bold">{getTotalQueue()}</p>
                  </div>
                </div>
                
                <div className="bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-elevated">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Ativos</p>
                    <p className="text-lg font-bold">
                      {attendants.filter(a => a.isActive).length}
                    </p>
                  </div>
                </div>

                <div className="bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-elevated">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Prefer.</p>
                    <p className="text-lg font-bold">
                      {attendants.filter(a => a.currentTicket?.type === 'preferencial').length}
                    </p>
                  </div>
                </div>
              </div>

              {/* Painel de Criação de Fichas */}
              <div className="mb-6">
                <QueueManagement 
                  queueState={queueState} 
                  attendants={attendants} 
                  onCreateTicket={handleCreateTicket} 
                />
              </div>

              {/* Grade de Atendentes */}
              <div className="grid gap-4">
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
          </TabsContent>

          {/* Gerenciamento de Atendentes */}
          <TabsContent value="attendants" className="h-full m-0 p-4 pb-20">
            <div className="h-full">
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 mb-2">
                  <div className="p-2 rounded-full bg-white/20 backdrop-blur-sm">
                    <UserPlus className="w-6 h-6 text-white" />
                  </div>
                  <h1 className="text-2xl font-bold text-white">Atendentes</h1>
                </div>
              </div>
              
              <div className="bg-white/95 backdrop-blur-sm rounded-lg p-4">
                <AttendantManager
                  attendants={attendants}
                  onAddAttendant={addAttendant}
                  onUpdateAttendant={updateAttendant}
                  onDeleteAttendant={deleteAttendant}
                />
              </div>
            </div>
          </TabsContent>

          {/* Histórico */}
          <TabsContent value="history" className="h-full m-0 p-4 pb-20">
            <div className="h-full">
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 mb-2">
                  <div className="p-2 rounded-full bg-white/20 backdrop-blur-sm">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <h1 className="text-2xl font-bold text-white">Histórico</h1>
                </div>
              </div>
              
              <div className="bg-white/95 backdrop-blur-sm rounded-lg p-4">
                <HistoryViewer onGetHistoryByDate={getHistoryByDate} />
              </div>
            </div>
          </TabsContent>
        </div>

        {/* Navegação Inferior Fixa */}
        <TabsList className="fixed bottom-0 left-0 right-0 h-16 w-full rounded-none bg-white/95 backdrop-blur-sm border-t border-border/50 grid-cols-3">
          <TabsTrigger 
            value="dashboard" 
            className="flex-col gap-1 h-full data-[state=active]:text-primary"
          >
            <Monitor className="w-5 h-5" />
            <span className="text-xs">Dashboard</span>
          </TabsTrigger>
          <TabsTrigger 
            value="attendants" 
            className="flex-col gap-1 h-full data-[state=active]:text-primary"
          >
            <UserPlus className="w-5 h-5" />
            <span className="text-xs">Atendentes</span>
          </TabsTrigger>
          <TabsTrigger 
            value="history" 
            className="flex-col gap-1 h-full data-[state=active]:text-primary"
          >
            <Clock className="w-5 h-5" />
            <span className="text-xs">Histórico</span>
          </TabsTrigger>
        </TabsList>

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
      </Tabs>
    </div>
  );
};
export default Index;