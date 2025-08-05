import { useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { Attendant } from '@/types';

interface AttendantManagerProps {
  attendants: Attendant[];
  onAddAttendant: (name: string) => void;
  onUpdateAttendant: (id: string, name: string) => void;
  onDeleteAttendant: (id: string) => void;
  onToggleActive?: (id: string) => void;
}

export const AttendantManager = ({
  attendants,
  onAddAttendant,
  onUpdateAttendant,
  onDeleteAttendant,
  onToggleActive,
}: AttendantManagerProps) => {
  const [newAttendantName, setNewAttendantName] = useState('');

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Nome do atendente"
          value={newAttendantName}
          onChange={(e) => setNewAttendantName(e.target.value)}
          className="max-w-xs"
        />
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => {
            if (newAttendantName.trim()) {
              onAddAttendant(newAttendantName.trim());
              setNewAttendantName('');
            }
          }}
        >
          <Plus className="w-4 h-4 mr-1" />
          Adicionar
        </Button>
      </div>

      <div className="grid gap-2 max-h-40 overflow-y-auto">
        {attendants.map((attendant) => (
          <Card key={attendant.id} className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="capitalize font-medium">{attendant.name}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${attendant.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {attendant.isActive ? 'Ativo' : 'Inativo'}
                </span>
              </div>
              <div className="flex items-center gap-2">                
                <div className="flex items-center gap-1">
                  <Switch 
                    id={`active-${attendant.id}`}
                    checked={attendant.isActive}
                    onCheckedChange={() => onToggleActive && onToggleActive(attendant.id)}
                  />
                  <Label htmlFor={`active-${attendant.id}`} className="sr-only">Ativar/Desativar</Label>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
