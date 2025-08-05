import { useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
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
  const [editingAttendant, setEditingAttendant] = useState<Attendant | null>(null);
  const [editName, setEditName] = useState('');
  const [deletingAttendant, setDeletingAttendant] = useState<Attendant | null>(null);

  const handleEdit = (attendant: Attendant) => {
    setEditingAttendant(attendant);
    setEditName(attendant.name);
  };

  const handleSaveEdit = () => {
    if (editingAttendant && editName.trim()) {
      onUpdateAttendant(editingAttendant.id, editName.trim());
      setEditingAttendant(null);
      setEditName('');
    }
  };

  const handleDelete = (attendant: Attendant) => {
    setDeletingAttendant(attendant);
  };

  const confirmDelete = () => {
    if (deletingAttendant) {
      onDeleteAttendant(deletingAttendant.id);
      setDeletingAttendant(null);
    }
  };

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

      <div className="grid gap-2 max-h-[400px] overflow-y-auto">
        {attendants.map((attendant) => (
          <Card key={attendant.id} className="p-3 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="capitalize font-medium">{attendant.name}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${attendant.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {attendant.isActive ? 'Ativo' : 'Inativo'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(attendant)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(attendant)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
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

      {/* Dialog de Edição */}
      <Dialog open={!!editingAttendant} onOpenChange={() => setEditingAttendant(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Atendente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Nome do Atendente</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Digite o nome do atendente"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingAttendant(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit} disabled={!editName.trim()}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={!!deletingAttendant} onOpenChange={() => setDeletingAttendant(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o atendente "{deletingAttendant?.name}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
