import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import bcrypt from 'bcryptjs';
import { loginSchema, createUserSchema, sanitizeString, loginRateLimiter } from '@/lib/validation';
import { useSecureSession } from '@/hooks/useSecureSession';
import { useToast } from '@/hooks/use-toast';

export type UserRole = 'admin' | 'attendant' | 'viewer';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  users: User[];
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  addUser: (username: string, password: string, name: string, role: UserRole) => Promise<void>;
  updateUser: (id: string, data: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  changePassword: (userId: string, newPassword: string) => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const {
    user,
    isSessionValid,
    updateSession,
    clearSession,
    getCSRFToken
  } = useSecureSession();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, display_name, role');
      
      if (error) throw error;
      
      const mappedUsers = data.map(profile => ({
        id: profile.id,
        username: profile.username,
        name: profile.display_name,
        role: profile.role as UserRole
      }));
      
      setUsers(mappedUsers);
    } catch (error) {
      // Secure error handling without exposing details
    } finally {
      setLoading(false);
    }
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      // Sanitizar entradas
      const sanitizedUsername = sanitizeString(username);
      const sanitizedPassword = password; // Não sanitizar senha para preservar caracteres especiais

      // Validar entrada
      const validation = loginSchema.safeParse({
        username: sanitizedUsername,
        password: sanitizedPassword
      });

      if (!validation.success) {
        toast({
          title: "Dados inválidos",
          description: validation.error.errors[0].message,
          variant: "destructive"
        });
        return false;
      }

      // Verificar rate limiting
      const clientId = `${sanitizedUsername}_${window.navigator.userAgent.slice(0, 50)}`;
      if (!loginRateLimiter.isAllowed(clientId)) {
        const remainingTime = Math.ceil(loginRateLimiter.getRemainingTime(clientId) / 1000 / 60);
        toast({
          title: "Muitas tentativas",
          description: `Tente novamente em ${remainingTime} minutos`,
          variant: "destructive"
        });
        return false;
      }

      // Buscar dados do usuário
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('id, username, display_name, role, password_hash')
        .eq('username', sanitizedUsername)
        .single();
        
      if (error || !profileData) {
        toast({
          title: "Erro no login",
          description: "Usuário ou senha incorretos",
          variant: "destructive"
        });
        return false;
      }
      
      // Verificar senha
      const isValid = await bcrypt.compare(sanitizedPassword, profileData.password_hash);
      
      if (isValid) {
        const user: User = {
          id: profileData.id,
          username: profileData.username,
          name: profileData.display_name,
          role: profileData.role as UserRole
        };
        
        // Usar sessão segura
        updateSession(user);
        
        // Reset rate limiting em caso de sucesso
        loginRateLimiter.reset(clientId);
        
        toast({
          title: "Login realizado",
          description: "Bem-vindo ao sistema!"
        });
        
        return true;
      }
      
      toast({
        title: "Erro no login",
        description: "Usuário ou senha incorretos",
        variant: "destructive"
      });
      return false;
    } catch (error) {
      console.error('Erro no login:', error);
      toast({
        title: "Erro no sistema",
        description: "Tente novamente mais tarde",
        variant: "destructive"
      });
      return false;
    }
  };

  const logout = () => {
    clearSession();
    toast({
      title: "Logout realizado",
      description: "Até logo!"
    });
  };

  const addUser = async (username: string, password: string, name: string, role: UserRole): Promise<void> => {
    try {
      // Sanitizar entradas
      const sanitizedData = {
        username: sanitizeString(username),
        password: password, // Não sanitizar senha
        name: sanitizeString(name),
        role
      };

      // Validar dados
      const validation = createUserSchema.safeParse(sanitizedData);
      if (!validation.success) {
        throw new Error(validation.error.errors[0].message);
      }

      // Verificar se usuário já existe
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', sanitizedData.username)
        .single();

      if (existingUser) {
        throw new Error('Nome de usuário já existe');
      }

      // Hash da senha com salt mais forte
      const hashedPassword = await bcrypt.hash(sanitizedData.password, 12);
      
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          user_id: crypto.randomUUID(),
          username: sanitizedData.username,
          display_name: sanitizedData.name,
          role: sanitizedData.role,
          password_hash: hashedPassword
        })
        .select()
        .single();
      
      if (error) {
        if (error.code === '23505') {
          throw new Error('Nome de usuário já existe');
        }
        throw new Error('Erro ao criar usuário no banco de dados');
      }
      
      // Recarrega lista de usuários
      await loadUsers();
      
      toast({
        title: "Usuário criado",
        description: `${sanitizedData.name} foi adicionado com sucesso`
      });
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      throw error;
    }
  };

  const updateUser = async (id: string, data: Partial<User>): Promise<void> => {
    try {
      const updateData: any = {};
      if (data.username) updateData.username = data.username;
      if (data.name) updateData.display_name = data.name;
      if (data.role) updateData.role = data.role;
      
      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', id);
      
      if (error) throw error;
      
      // Recarrega lista de usuários
      await loadUsers();
    } catch (error) {
      throw error;
    }
  };

  const deleteUser = async (id: string): Promise<void> => {
    try {
      // Verificar se é o último admin
      const adminCount = users.filter(u => u.role === 'admin').length;
      const targetUser = users.find(u => u.id === id);
      
      if (targetUser?.role === 'admin' && adminCount <= 1) {
        throw new Error('Não é possível excluir o último usuário administrador');
      }
      
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Recarrega lista de usuários
      await loadUsers();
    } catch (error) {
      throw error;
    }
  };

  const changePassword = async (userId: string, newPassword: string): Promise<void> => {
    try {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      const { error } = await supabase
        .from('profiles')
        .update({ password_hash: hashedPassword })
        .eq('id', userId);
      
      if (error) throw error;
    } catch (error) {
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        users,
        isAuthenticated: !!user && isSessionValid,
        login,
        logout,
        addUser,
        updateUser,
        deleteUser,
        changePassword,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};