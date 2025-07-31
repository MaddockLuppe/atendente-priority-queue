import { useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Card } from '@/components/ui/card';
import { Attendant } from '@/types';

interface AttendantManagerProps {
  attendants: Attendant[];
  onAddAttendant: (name: string) => void;
  onUpdateAttendant: (id: string, name: string) => void;
  onDeleteAttendant: (id: string) => void;
}

export const AttendantManager = ({
  attendants,
  onAddAttendant,
  onUpdateAttendant,
  onDeleteAttendant,
}: AttendantManagerProps) => {
  const [newAttendantName, setNewAttendantName] = useState('');
  const [editingAttendant, setEditingAttendant] = useState<{ id: string; name: string } | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const handleAddAttendant = () => {
    if (newAttendantName.trim()) {
      onAddAttendant(newAttendantName.trim());
      setNewAttendantName('');
      setShowAddDialog(false);
    }
  };

  const handleEditAttendant = () => {
    if (editingAttendant && editingAttendant.name.trim()) {
      onUpdateAttendant(editingAttendant.id, editingAttendant.name.trim());
      setEditingAttendant(null);
      setShowEditDialog(false);
    }
  };

  const startEdit = (attendant: Attendant) => {
    setEditingAttendant({ id: attendant.id, name: attendant.name });
    setShowEditDialog(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Novo Atendente
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Novo Atendente</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="attendant-name">Nome do Atendente</Label>
                <Input
                  id="attendant-name"
                  value={newAttendantName}
                  onChange={(e) => setNewAttendantName(e.target.value)}
                  placeholder="Digite o nome..."
                  onKeyDown={(e) => e.key === 'Enter' && handleAddAttendant()}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleAddAttendant} disabled={!newAttendantName.trim()}>
                  Adicionar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-2 max-h-40 overflow-y-auto">
        {attendants.map((attendant) => (
          <Card key={attendant.id} className="p-3">
            <div className="flex items-center justify-between">
              <span className="capitalize font-medium">{attendant.name}</span>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => startEdit(attendant)}
                >
                  <Edit className="w-3 h-3" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja excluir o atendente "{attendant.name}"? 
                        Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => onDeleteAttendant(attendant.id)}>
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Atendente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-attendant-name">Nome do Atendente</Label>
              <Input
                id="edit-attendant-name"
                value={editingAttendant?.name || ''}
                onChange={(e) => 
                  setEditingAttendant(prev => 
                    prev ? { ...prev, name: e.target.value } : null
                  )
                }
                placeholder="Digite o nome..."
                onKeyDown={(e) => e.key === 'Enter' && handleEditAttendant()}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleEditAttendant} 
                disabled={!editingAttendant?.name.trim()}
              >
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};