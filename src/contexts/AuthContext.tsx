import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import bcrypt from 'bcryptjs';

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
    initializeAdminUser();
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
      console.error('Erro ao carregar usuários:', error);
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

  const initializeAdminUser = async () => {
    try {
      // Gerar hash correto da senha
      const hashedPassword = await bcrypt.hash('xangoeoxum@2025@', 10);
      
      // Inserir ou atualizar usuário admin
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: crypto.randomUUID(),
          username: 'abassa',
          display_name: 'Administrador',
          role: 'admin',
          password_hash: hashedPassword
        }, {
          onConflict: 'username'
        });
      
      if (error && error.code !== '23505') {
        console.error('Erro ao criar usuário admin:', error);
      }
    } catch (error) {
      console.error('Erro ao inicializar usuário admin:', error);
    }
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      console.log('Tentando login com:', username);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, display_name, role, password_hash')
        .eq('username', username)
        .single();
      
      console.log('Resultado da consulta:', data, error);
      
      if (error || !data) {
        console.log('Usuário não encontrado');
        return false;
      }
      
      console.log('Comparando senhas...');
      const isValid = await bcrypt.compare(password, data.password_hash);
      console.log('Senha válida:', isValid);
      
      if (isValid) {
        const user: User = {
          id: data.id,
          username: data.username,
          name: data.display_name,
          role: data.role as UserRole
        };
        
        setUser(user);
        localStorage.setItem('currentUser', JSON.stringify(user));
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Erro no login:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  const addUser = async (username: string, password: string, name: string, role: UserRole): Promise<void> => {
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          user_id: crypto.randomUUID(),
          username,
          display_name: name,
          role,
          password_hash: hashedPassword
        })
        .select()
        .single();
      
      if (error) {
        if (error.code === '23505') {
          throw new Error('Nome de usuário já existe');
        }
        throw error;
      }
      
      // Recarrega lista de usuários
      await loadUsers();
    } catch (error) {
      console.error('Erro ao adicionar usuário:', error);
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
      console.error('Erro ao atualizar usuário:', error);
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
      console.error('Erro ao excluir usuário:', error);
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
      console.error('Erro ao alterar senha:', error);
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