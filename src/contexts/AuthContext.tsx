import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import bcrypt from 'bcryptjs';

export type UserRole = 'admin' | 'user';

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
  addUser: (username: string, password: string, name: string, role: UserRole) => Promise<boolean>;
  updateUser: (id: string, data: Partial<User>) => Promise<boolean>;
  deleteUser: (id: string) => Promise<boolean>;
  changePassword: (userId: string, newPassword: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    // Load current user from localStorage on startup
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    
    // Load all users from Supabase
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, display_name, role')
        .order('created_at');

      if (error) throw error;

      const formattedUsers: User[] = data.map(profile => ({
        id: profile.id,
        username: profile.username,
        name: profile.display_name,
        role: profile.role as UserRole
      }));

      setUsers(formattedUsers);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, display_name, role, password_hash')
        .eq('username', username)
        .single();

      if (error || !data) return false;

      const isPasswordValid = await bcrypt.compare(password, data.password_hash);
      
      if (isPasswordValid) {
        const loggedInUser: User = {
          id: data.id,
          username: data.username,
          name: data.display_name,
          role: data.role as UserRole
        };
        
        setUser(loggedInUser);
        localStorage.setItem('currentUser', JSON.stringify(loggedInUser));
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error during login:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  const addUser = async (username: string, password: string, name: string, role: UserRole): Promise<boolean> => {
    try {
      // Check if username already exists
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .single();

      if (existingUser) {
        alert('Nome de usuário já existe');
        return false;
      }

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

      if (error) throw error;

      // Reload users list
      await loadUsers();
      return true;
    } catch (error) {
      console.error('Error adding user:', error);
      return false;
    }
  };

  const updateUser = async (id: string, data: Partial<User>): Promise<boolean> => {
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

      // Reload users list
      await loadUsers();
      
      // Update current user if it's the same user
      if (user?.id === id) {
        const updatedUser = { ...user, ...data };
        setUser(updatedUser);
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      }
      
      return true;
    } catch (error) {
      console.error('Error updating user:', error);
      return false;
    }
  };

  const deleteUser = async (id: string): Promise<boolean> => {
    try {
      // Prevent deleting the last admin user
      const adminUsers = users.filter(u => u.role === 'admin');
      const targetUser = users.find(u => u.id === id);
      
      if (targetUser?.role === 'admin' && adminUsers.length <= 1) {
        alert('Não é possível excluir o último usuário administrador');
        return false;
      }

      // Prevent deleting current user
      if (user?.id === id) {
        alert('Não é possível excluir o usuário logado');
        return false;
      }

      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Reload users list
      await loadUsers();
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  };

  const changePassword = async (userId: string, newPassword: string): Promise<boolean> => {
    try {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      const { error } = await supabase
        .from('profiles')
        .update({ password_hash: hashedPassword })
        .eq('id', userId);

      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error('Error changing password:', error);
      return false;
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