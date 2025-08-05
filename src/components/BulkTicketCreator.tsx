import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Attendant } from '@/types';
import { Plus, Ticket } from 'lucide-react';

interface BulkTicketCreatorProps {
  attendants: Attendant[];
  onCreateTickets: (type: 'preferencial' | 'normal', attendantId: string, quantity: number) => Promise<void>;
}

export const BulkTicketCreator = ({ attendants, onCreateTickets }: BulkTicketCreatorProps) => {
  const [selectedAttendant, setSelectedAttendant] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [ticketType, setTicketType] = useState<'preferencial' | 'normal'>('normal');
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const handleCreateBulkTickets = async () => {
    if (!selectedAttendant || quantity < 1) {
      toast({
        title: "Erro",
        description: "Selecione um atendente e quantidade válida",
        variant: "destructive"
      });
      return;
    }

    const maxLimit = ticketType === 'preferencial' ? 2 : 10;
    if (quantity > maxLimit) {
      toast({
        title: "Erro",
        description: `Quantidade máxima para ${ticketType} é ${maxLimit}`,
        variant: "destructive"
      });
      return;
    }

    setIsCreating(true);
    try {
      await onCreateTickets(ticketType, selectedAttendant, quantity);
      const attendant = attendants.find(a => a.id === selectedAttendant);
      toast({
        title: "Fichas criadas com sucesso!",
        description: `${quantity} fichas ${ticketType} criadas para ${attendant?.name}`
      });
      setQuantity(1);
      setSelectedAttendant('');
    } catch (error) {
      toast({
        title: "Erro ao criar fichas",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Card className="p-4 mb-4">
      <div className="flex items-center gap-2 mb-4">
        <Ticket className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Criação de Fichas em Lote</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <Label htmlFor="attendant-select">Atendente</Label>
          <Select value={selectedAttendant} onValueChange={setSelectedAttendant}>
            <SelectTrigger id="attendant-select">
              <SelectValue placeholder="Selecione..." />
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

        <div>
          <Label htmlFor="ticket-type">Tipo</Label>
          <Select value={ticketType} onValueChange={(value: 'preferencial' | 'normal') => setTicketType(value)}>
            <SelectTrigger id="ticket-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="normal">Normal (max: 10)</SelectItem>
              <SelectItem value="preferencial">Preferencial (max: 2)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="quantity">Quantidade</Label>
          <Input
            id="quantity"
            type="number"
            min="1"
            max={ticketType === 'preferencial' ? 2 : 10}
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
          />
        </div>

        <div className="flex items-end">
          <Button
            onClick={handleCreateBulkTickets}
            disabled={!selectedAttendant || isCreating}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            {isCreating ? 'Criando...' : 'Criar Fichas'}
          </Button>
        </div>
      </div>
    </Card>
  );
};