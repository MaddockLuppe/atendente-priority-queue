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
  onAddAttendant: (name: string) => Promise<void>;
  onUpdateAttendant: (id: string, name: string) => Promise<void>;
  onDeleteAttendant: (id: string) => Promise<void>;
  onToggleActive?: (id: string) => Promise<void>;
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
        <Button variant="outline" size="sm">
          <Plus className="w-4 h-4 mr-1" />
          Novo Atendente
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
                     onCheckedChange={async () => {
                       if (onToggleActive) {
                         await onToggleActive(attendant.id);
                       }
                     }}
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
