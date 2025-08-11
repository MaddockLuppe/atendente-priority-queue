import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import bcrypt from 'bcryptjs';

interface AdminSetupProps {
  onAdminCreated: () => void;
}

const AdminSetup: React.FC<AdminSetupProps> = ({ onAdminCreated }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    displayName: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [needsSetup, setNeedsSetup] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkForAdminUsers();
  }, []);

  const checkForAdminUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'admin')
        .limit(1);

      if (error) throw error;
      
      // Only show setup if no admin users exist
      setNeedsSetup(!data || data.length === 0);
    } catch (error) {
      setNeedsSetup(true); // Show setup on error to be safe
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem",
        variant: "destructive"
      });
      return;
    }

    if (formData.password.length < 8) {
      toast({
        title: "Erro", 
        description: "A senha deve ter pelo menos 8 caracteres",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Hash the password securely
      const hashedPassword = await bcrypt.hash(formData.password, 12);
      
      // Create the first admin user
      const { error } = await supabase
        .from('profiles')
        .insert({
          user_id: crypto.randomUUID(),
          username: formData.username,
          display_name: formData.displayName,
          role: 'admin',
          password_hash: hashedPassword
        });

      if (error) {
        if (error.code === '23505') {
          toast({
            title: "Erro",
            description: "Nome de usuário já existe",
            variant: "destructive"
          });
          return;
        }
        throw error;
      }

      toast({
        title: "Sucesso",
        description: "Administrador criado com sucesso!"
      });
      
      onAdminCreated();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar administrador",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  if (!needsSetup) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">
            Configuração Inicial
          </CardTitle>
          <CardDescription>
            Crie o primeiro usuário administrador do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Nome Completo</Label>
              <Input
                id="displayName"
                name="displayName"
                value={formData.displayName}
                onChange={handleInputChange}
                required
                placeholder="Digite seu nome completo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Nome de Usuário</Label>
              <Input
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                required
                placeholder="Digite o nome de usuário"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                placeholder="Digite uma senha forte (min. 8 caracteres)"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Senha</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
                placeholder="Confirme a senha"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Criando...' : 'Criar Administrador'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSetup;