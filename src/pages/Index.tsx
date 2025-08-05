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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Monitor, UserPlus, Clock, Users, UserCog, LogOut, Key } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
const Index = () => {
  const {
    attendants,
    queueState,
    createTicket,
    createBulkTickets,
    callNextTicket,
    completeTicket,
    removeTicket,
    isTicketOverdue,
    addAttendant,
    updateAttendant,
    deleteAttendant,
    getHistoryByDate,
    toggleAttendantActive,
  } = useTicketSystem();
  const { toast } = useToast();
  const { user, users, logout, changePassword } = useAuth();
  const navigate = useNavigate();
  const [confirmingCompletion, setConfirmingCompletion] = useState<string | null>(null);
  const [showOnlyActive, setShowOnlyActive] = useState<boolean>(false);
  const [confirmingLogout, setConfirmingLogout] = useState<boolean>(false);
  const [showChangePasswordDialog, setShowChangePasswordDialog] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const handleCreateTicket = async (type: 'preferencial' | 'normal', attendantId: string) => {
    try {
      const ticket = await createTicket(type, attendantId);
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

  const handleRemoveTicket = (attendantId: string, ticketId: string) => {
    const attendant = attendants.find(a => a.id === attendantId);
    const ticket = attendant?.queueTickets.find(t => t.id === ticketId) || attendant?.currentTicket;
    
    removeTicket(attendantId, ticketId);
    toast({
      title: "Ficha removida!",
      description: `Ficha ${ticket?.number} foi removida.`
    });
  };

  const handleToggleActive = (attendantId: string) => {
    const attendant = attendants.find(a => a.id === attendantId);
    toggleAttendantActive(attendantId);
    
    if (attendant) {
      toast({
        title: attendant.isActive ? "Atendente desativado" : "Atendente ativado",
        description: `${attendant.name} foi ${attendant.isActive ? "desativado" : "ativado"} com sucesso.`
      });
    }
  };
  const getTotalQueue = () => {
    return attendants.reduce((total, a) => total + a.queueTickets.length, 0);
  };
  return (
    <div className="fixed inset-0 bg-gradient-main">
      <Tabs defaultValue="atendimentos" className="h-full flex flex-col">
        {/* Conteúdo Principal */}
        <div className="flex-1 overflow-auto">
          {/* Tela Principal - Atendimentos */}
          <TabsContent value="atendimentos" className="h-full m-0 p-4 pb-20">
            <div className="h-full">
              {/* Header Simplificado */}
              <div className="flex justify-between items-center mb-6">
                <div className="inline-flex items-center gap-2">
                  <div className="p-2 rounded-full bg-white/20 backdrop-blur-sm">
                    <Monitor className="w-6 h-6 text-white" />
                  </div>
                  <h1 className="text-2xl font-bold text-white">Atendimentos</h1>
                </div>
                <div className="flex gap-2">
                  {user?.role === 'admin' && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="bg-white/20 text-white hover:bg-white/30"
                      onClick={() => setShowChangePasswordDialog(true)}
                    >
                      <Key className="w-4 h-4 mr-1" />
                      Alterar Senhas
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="bg-white/20 text-white hover:bg-white/30"
                    onClick={() => setConfirmingLogout(true)}
                  >
                    <LogOut className="w-4 h-4 mr-1" />
                    Sair
                  </Button>
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
                  onCreateBulkTickets={createBulkTickets}
                />
              </div>

              {/* Filtro de Atendentes Ativos */}
              <div className="flex items-center justify-between mb-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-elevated">
                <div className="flex items-center gap-2">
                  <Switch 
                    id="show-active" 
                    checked={showOnlyActive} 
                    onCheckedChange={setShowOnlyActive}
                  />
                  <Label htmlFor="show-active" className="cursor-pointer">
                    Mostrar apenas atendentes ativos
                  </Label>
                </div>
                <div className="text-sm text-muted-foreground">
                  {attendants.filter(a => a.isActive).length} ativos / {attendants.length} total
                </div>
              </div>

              {/* Grade de Atendentes */}
              <div className="grid gap-4">
                {attendants
                  .filter(attendant => !showOnlyActive || attendant.isActive)
                  .map(attendant => (
                    <AttendantCard 
                      key={attendant.id} 
                      attendant={attendant} 
                      queueLength={attendant.queueTickets.length} 
                      nextTickets={attendant.queueTickets} 
                      isOverdue={isTicketOverdue(attendant.id)} 
                      onCallNext={() => handleCallNext(attendant.id)} 
                      onComplete={() => handleComplete(attendant.id)}
                      onRemoveTicket={(ticketId) => handleRemoveTicket(attendant.id, ticketId)}
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
                  onToggleActive={handleToggleActive}
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
        <TabsList className="fixed bottom-0 left-0 right-0 h-16 w-full rounded-none bg-white/95 backdrop-blur-sm border-t border-border/50 grid-cols-4">
          <TabsTrigger 
            value="atendimentos" 
            className="flex-col gap-1 h-full data-[state=active]:text-primary"
          >
            <Monitor className="w-5 h-5" />
            <span className="text-xs">Atendimentos</span>
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
          <Link 
            to="/users" 
            className="flex flex-col items-center justify-center gap-1 h-full text-muted-foreground hover:text-primary transition-colors"
          >
            <UserCog className="w-5 h-5" />
            <span className="text-xs">Usuários</span>
          </Link>
        </TabsList>

        {/* Diálogo de Confirmação de Conclusão */}
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

        {/* Diálogo de Confirmação de Logout */}
        <AlertDialog open={confirmingLogout} onOpenChange={setConfirmingLogout}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Saída</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja sair do sistema?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => {
                logout();
                navigate('/login');
              }}>
                Sair
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Diálogo de Alteração de Senha */}
        <Dialog open={showChangePasswordDialog} onOpenChange={setShowChangePasswordDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Alterar Senha de Usuário</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="user-select">Selecione o Usuário</Label>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger id="user-select">
                    <SelectValue placeholder="Escolha um usuário" />
                  </SelectTrigger>
                  <SelectContent>
                    {user?.role === 'admin' && user.id !== '1' && (
                      <SelectItem value={user.id}>{user.name} (Você)</SelectItem>
                    )}
                    {users
                      .filter(u => u.id !== user?.id && u.role !== 'admin')
                      .map(u => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.name} ({u.role === 'admin' ? 'Admin' : u.role === 'attendant' ? 'Atendente' : 'Visualizador'})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="new-password">Nova Senha</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Digite a nova senha"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => {
                  setShowChangePasswordDialog(false);
                  setSelectedUser('');
                  setNewPassword('');
                }}>
                  Cancelar
                </Button>
                <Button
                  onClick={() => {
                    if (selectedUser && newPassword) {
                      // Já temos acesso ao changePassword do contexto de autenticação
                      // através da desestruturação no início do componente
                      changePassword(selectedUser, newPassword);
                      toast({
                        title: "Senha alterada",
                        description: "A senha foi alterada com sucesso."
                      });
                      setShowChangePasswordDialog(false);
                      setSelectedUser('');
                      setNewPassword('');
                    }
                  }}
                  disabled={!selectedUser || !newPassword}
                >
                  Salvar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </Tabs>
    </div>
  );
};
export default Index;