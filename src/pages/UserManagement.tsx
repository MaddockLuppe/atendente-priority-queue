import React, { useState } from 'react';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, UserX, Edit, User, ArrowLeft } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';

const UserManagement = () => {
  const { users, addUser, updateUser, deleteUser, user: currentUser } = useAuth();
  const { toast } = useToast();

  // Estado para o formulário de adição
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    name: '',
    role: 'attendant' as UserRole,
  });

  // Estado para o formulário de edição
  const [editingUser, setEditingUser] = useState<{
    id: string;
    username: string;
    name: string;
    role: UserRole;
  } | null>(null);

  // Estado para o diálogo de edição
  const [showEditDialog, setShowEditDialog] = useState(false);

  // Estado para o diálogo de confirmação de exclusão
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewUser(prev => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (value: string) => {
    setNewUser(prev => ({ ...prev, role: value as UserRole }));
  };

  const handleEditingRoleChange = (value: string) => {
    if (editingUser) {
      setEditingUser({ ...editingUser, role: value as UserRole });
    }
  };

  const handleEditingInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (editingUser) {
      setEditingUser({ ...editingUser, [name]: value });
    }
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newUser.username || !newUser.password || !newUser.name) {
      toast({
        title: "Erro ao criar usuário",
        description: "Preencha todos os campos",
        variant: "destructive",
      });
      return;
    }
    
    // Verificar se o nome de usuário já existe
    if (users.some(u => u.username === newUser.username)) {
      toast({
        title: "Erro ao criar usuário",
        description: "Nome de usuário já existe",
        variant: "destructive",
      });
      return;
    }
    
    addUser(newUser.username, newUser.password, newUser.name, newUser.role);
    
    toast({
      title: "Usuário criado com sucesso",
      description: `${newUser.name} foi adicionado como ${newUser.role}`,
    });
    
    // Limpar campos
    setNewUser({
      username: '',
      password: '',
      name: '',
      role: 'attendant',
    });
  };

  const startEdit = (userId: string) => {
    const userToEdit = users.find(u => u.id === userId);
    if (userToEdit) {
      setEditingUser({
        id: userToEdit.id,
        username: userToEdit.username,
        name: userToEdit.name,
        role: userToEdit.role,
      });
      setShowEditDialog(true);
    }
  };

  const handleUpdateUser = () => {
    if (!editingUser) return;

    // Verificar se o nome de usuário já existe (exceto para o próprio usuário)
    const usernameExists = users.some(
      u => u.username === editingUser.username && u.id !== editingUser.id
    );

    if (usernameExists) {
      toast({
        title: "Erro ao atualizar usuário",
        description: "Nome de usuário já existe",
        variant: "destructive",
      });
      return;
    }

    // Verificar se está tentando alterar o último administrador
    const isLastAdmin = 
      editingUser.role !== 'admin' && 
      editingUser.id === currentUser?.id && 
      users.filter(u => u.role === 'admin').length <= 1;

    if (isLastAdmin) {
      toast({
        title: "Operação não permitida",
        description: "Não é possível rebaixar o último administrador",
        variant: "destructive",
      });
      return;
    }

    updateUser(editingUser.id, {
      username: editingUser.username,
      name: editingUser.name,
      role: editingUser.role,
    });

    toast({
      title: "Usuário atualizado",
      description: `${editingUser.name} foi atualizado com sucesso`,
    });

    setShowEditDialog(false);
    setEditingUser(null);
  };

  const confirmDelete = () => {
    if (!userToDelete) return;

    // Verificar se está tentando excluir o último administrador
    const targetUser = users.find(u => u.id === userToDelete);
    const isLastAdmin = 
      targetUser?.role === 'admin' && 
      users.filter(u => u.role === 'admin').length <= 1;

    if (isLastAdmin) {
      toast({
        title: "Operação não permitida",
        description: "Não é possível excluir o último administrador",
        variant: "destructive",
      });
      setUserToDelete(null);
      return;
    }

    // Verificar se está tentando excluir a si mesmo
    if (userToDelete === currentUser?.id) {
      toast({
        title: "Operação não permitida",
        description: "Não é possível excluir seu próprio usuário",
        variant: "destructive",
      });
      setUserToDelete(null);
      return;
    }

    deleteUser(userToDelete);
    
    toast({
      title: "Usuário removido",
      description: `O usuário foi removido do sistema`,
    });
    
    setUserToDelete(null);
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-blue-500">Administrador</Badge>;
      case 'attendant':
        return <Badge className="bg-green-500">Atendente</Badge>;
      case 'viewer':
        return <Badge className="bg-gray-500">Visualizador</Badge>;
      default:
        return <Badge>{role}</Badge>;
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Link to="/atendimentos">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Gerenciamento de Usuários</h1>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Novo Usuário
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Novo Usuário</DialogTitle>
              <DialogDescription>
                Preencha os dados para criar um novo usuário no sistema.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Nome de Usuário</Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="Digite o nome de usuário"
                  value={newUser.username}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Digite a senha"
                  value={newUser.password}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Digite o nome completo"
                  value={newUser.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Tipo de Usuário</Label>
                <Select
                  value={newUser.role}
                  onValueChange={handleRoleChange}
                >
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="attendant">Atendente</SelectItem>
                    <SelectItem value="viewer">Visualizador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="submit">Criar Usuário</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-6">
          <Table>
            <TableCaption>Lista de usuários do sistema</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map(user => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{getRoleBadge(user.role)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => startEdit(user.id)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => setUserToDelete(user.id)}
                          >
                            <UserX className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir o usuário {user.name}? Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setUserToDelete(null)}>
                              Cancelar
                            </AlertDialogCancel>
                            <AlertDialogAction onClick={confirmDelete}>
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Diálogo de Edição */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>
              Atualize as informações do usuário.
            </DialogDescription>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-username">Nome de Usuário</Label>
                <Input
                  id="edit-username"
                  name="username"
                  type="text"
                  placeholder="Digite o nome de usuário"
                  value={editingUser.username}
                  onChange={handleEditingInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nome Completo</Label>
                <Input
                  id="edit-name"
                  name="name"
                  type="text"
                  placeholder="Digite o nome completo"
                  value={editingUser.name}
                  onChange={handleEditingInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-role">Tipo de Usuário</Label>
                <Select
                  value={editingUser.role}
                  onValueChange={handleEditingRoleChange}
                >
                  <SelectTrigger id="edit-role">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="attendant">Atendente</SelectItem>
                    <SelectItem value="viewer">Visualizador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleUpdateUser}>
                  Salvar Alterações
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;