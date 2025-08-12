import { useState } from 'react';
import { Plus, Users, Clock, Ticket } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QueueState, Attendant } from '@/types';

interface QueueManagementProps {
  queueState: QueueState;
  attendants: Attendant[];
  onCreateTicket: (type: 'preferencial' | 'normal', attendantId: string) => void;
  onCreateBulkTickets: (type: 'preferencial' | 'normal', attendantId: string, quantity: number) => Promise<void>;
}

export const QueueManagement = ({ queueState, attendants, onCreateTicket, onCreateBulkTickets }: QueueManagementProps) => {
  const [selectedAttendant, setSelectedAttendant] = useState<string>('');
  const [bulkQuantity, setBulkQuantity] = useState<string>('');
  const [bulkType, setBulkType] = useState<'preferencial' | 'normal'>('normal');
  const [isCreatingBulk, setIsCreatingBulk] = useState(false);
  
  
  const totalQueue = attendants.filter(a => a.isActive).length;
  const canCreatePreferential = queueState.nextPreferentialNumber <= 2;
  const canCreateNormal = queueState.nextNormalNumber <= 10;

  const handleBulkCreate = async () => {
    const quantity = parseInt(bulkQuantity);
    if (!selectedAttendant || !quantity || quantity < 1) return;
    
    setIsCreatingBulk(true);
    try {
      await onCreateBulkTickets(bulkType, selectedAttendant, quantity);
      setBulkQuantity('');
      setSelectedAttendant('');
    } catch (error) {
      console.error('Erro ao criar fichas em lote:', error);
    } finally {
      setIsCreatingBulk(false);
    }
  };

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
              {totalQueue} atendimentos ativos
            </p>
          </div>
        </div>
        
        <Badge variant="outline" className="text-lg px-3 py-1">
          <Clock size={16} className="mr-2" />
          {totalQueue}
        </Badge>
      </div>

      {/* Estatísticas dos Atendimentos */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 rounded-lg bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full bg-queue-preferential"></div>
            <span className="font-medium">Preferenciais</span>
          </div>
          <div className="text-2xl font-bold text-queue-preferential">
            {attendants.filter(a => a.currentTicket?.type === 'preferencial').length}
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
            {attendants.filter(a => a.currentTicket?.type === 'normal').length}
          </div>
          <div className="text-sm text-muted-foreground">
            Próxima: N{queueState.nextNormalNumber > 10 ? 1 : queueState.nextNormalNumber}
          </div>
        </div>
      </div>

      {/* Seleção do Atendente */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Selecionar Atendente</label>
        <Select value={selectedAttendant} onValueChange={setSelectedAttendant}>
          <SelectTrigger>
            <SelectValue placeholder="Escolha um atendente" />
          </SelectTrigger>
          <SelectContent>
            {attendants
              .filter(attendant => attendant.isActive)
              .map(attendant => (
                <SelectItem key={attendant.id} value={attendant.id}>
                  {attendant.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      {/* Abas para Criação Individual e em Lote */}
      <Tabs defaultValue="single" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="single" className="flex items-center gap-2">
            <Plus size={16} />
            Individual
          </TabsTrigger>
          <TabsTrigger value="bulk" className="flex items-center gap-2">
            <Ticket size={16} />
            Em Lote
          </TabsTrigger>
        </TabsList>

        {/* Criação Individual */}
        <TabsContent value="single" className="space-y-3">
          <Button 
            onClick={() => {
              if (selectedAttendant) {
                onCreateTicket('preferencial', selectedAttendant);
                setSelectedAttendant('');
              }
            }}
            disabled={!canCreatePreferential || !selectedAttendant}
            variant="preferential"
            size="lg"
            className="w-full"
          >
            <Plus size={18} className="mr-2" />
            Gerar Ficha Preferencial
            {!canCreatePreferential && ' (Limite atingido)'}
          </Button>
          
          <Button 
            onClick={() => {
              if (selectedAttendant) {
                onCreateTicket('normal', selectedAttendant);
                setSelectedAttendant('');
              }
            }}
            disabled={!canCreateNormal || !selectedAttendant}
            variant="normal"
            size="lg"
            className="w-full"
          >
            <Plus size={18} className="mr-2" />
            Gerar Ficha Normal
            {!canCreateNormal && ' (Limite atingido)'}
          </Button>
        </TabsContent>

        {/* Criação em Lote */}
        <TabsContent value="bulk" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="bulk-type">Tipo</Label>
              <Select value={bulkType} onValueChange={(value: 'preferencial' | 'normal') => setBulkType(value)}>
                <SelectTrigger id="bulk-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal (max: 10)</SelectItem>
                  <SelectItem value="preferencial">Preferencial (max: 2)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="bulk-quantity">Quantidade</Label>
              <Input
                id="bulk-quantity"
                type="number"
                min="1"
                max={bulkType === 'preferencial' ? 2 : 10}
                value={bulkQuantity}
                placeholder="Digite a quantidade"
                onChange={(e) => setBulkQuantity(e.target.value)}
              />
            </div>
          </div>

          <Button
            onClick={handleBulkCreate}
            disabled={!selectedAttendant || isCreatingBulk || !bulkQuantity || parseInt(bulkQuantity) < 1}
            className="w-full"
            size="lg"
          >
            <Ticket className="w-4 h-4 mr-2" />
            {isCreatingBulk ? 'Criando...' : `Criar ${bulkQuantity || '0'} Fichas ${bulkType === 'preferencial' ? 'Preferenciais' : 'Normais'}`}
          </Button>
        </TabsContent>
      </Tabs>
    </Card>
  );
};