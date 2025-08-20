import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

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
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
    checkStoredSession();
  }, []);

  const loadUsers = async () => {
    try {
      // Usar função RPC que bypassa RLS
      const { data, error } = await supabase.rpc('get_all_users');
      
      if (error) {
        console.error('Erro ao carregar usuários:', error);
        throw error;
      }
      
      // data já vem como array de objetos JSON
      const mappedUsers = (data || []).map((profile: any) => ({
        id: profile.id,
        username: profile.username,
        name: profile.display_name,
        role: profile.role as UserRole
      }));
      
      setUsers(mappedUsers);
    } catch (error) {
      console.error('Erro na função loadUsers:', error);
      // Secure error handling without exposing details
    } finally {
      setLoading(false);
    }
  };

  const checkStoredSession = () => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  };

  // Admin user initialization removed for security
  // Admins should be created through secure user management interface

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      // Validação segura via RPC no Supabase (verifica senha no servidor)
      const { data, error } = await supabase.rpc('authenticate_user_secure', {
        p_username: username,
        p_password: password,
      });

      if (error) {
        return false;
      }

      const profile = Array.isArray(data) ? data[0] : null;
      if (!profile) return false;

      const user: User = {
        id: profile.id,
        username: profile.username,
        name: profile.display_name,
        role: profile.role as UserRole,
      };

      setUser(user);
      localStorage.setItem('currentUser', JSON.stringify(user));
      return true;
    } catch (error) {
      return false;
    }
  };



  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  const addUser = async (username: string, password: string, name: string, role: UserRole): Promise<void> => {
    try {
      // Verificar se o usuário atual é admin
      if (user?.role !== 'admin') {
        throw new Error('Apenas administradores podem criar usuários');
      }
      
      // Usar função RPC simplificada para criar usuário
      const { data, error } = await supabase.rpc('admin_create_user', {
        p_username: username,
        p_password: password,
        p_display_name: name,
        p_role: role
      });
      
      if (error) {
        console.error('Erro ao criar usuário:', error);
        throw new Error('Erro ao criar usuário: ' + error.message);
      }
      
      // Verificar se a resposta indica sucesso
      if (data && !data.success) {
        throw new Error(data.error || 'Erro desconhecido ao criar usuário');
      }
      
      console.log('Usuário criado com sucesso:', data);
      // Recarrega lista de usuários
      await loadUsers();
    } catch (error) {
      console.error('Erro na função addUser:', error);
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
      // Verificar se o usuário atual é admin
      if (user?.role !== 'admin') {
        throw new Error('Apenas administradores podem deletar usuários');
      }
      
      // Usar função RPC que bypassa RLS
      const { data, error } = await supabase.rpc('admin_delete_user', {
        p_user_id: id
      });
      
      if (error) {
        console.error('Erro ao deletar usuário:', error);
        throw new Error('Erro ao deletar usuário: ' + error.message);
      }
      
      // Verificar se a resposta indica sucesso
      if (data && !data.success) {
        throw new Error(data.error || 'Erro desconhecido ao deletar usuário');
      }
      
      console.log('Usuário deletado com sucesso:', data);
      // Recarrega lista de usuários
      await loadUsers();
    } catch (error) {
      console.error('Erro na função deleteUser:', error);
      throw error;
    }
  };

  const changePassword = async (userId: string, newPassword: string): Promise<void> => {
    try {
      // Use RPC to update password securely on the server
      const { error } = await supabase.rpc('admin_update_password', {
        p_user_id: userId,
        p_new_password: newPassword
      });
      
      if (error) {
        throw new Error(error.message || 'Erro ao alterar senha');
      }
      
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
        isAuthenticated: !!user,
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