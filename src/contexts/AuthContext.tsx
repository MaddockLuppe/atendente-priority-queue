import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

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
  login: (username: string, password: string) => boolean;
  logout: () => void;
  addUser: (username: string, password: string, name: string, role: UserRole) => void;
  updateUser: (id: string, data: Partial<User>) => void;
  deleteUser: (id: string) => void;
  changePassword: (userId: string, newPassword: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(() => {
    const storedUsers = localStorage.getItem('users');
    if (storedUsers) {
      return JSON.parse(storedUsers);
    }
    // Default admin user
    return [
      {
        id: '1',
        username: 'admin',
        name: 'Administrador',
        role: 'admin' as UserRole,
      },
    ];
  });
  
  // Store passwords separately for security
  const [passwords, setPasswords] = useState<Record<string, string>>(() => {
    const storedPasswords = localStorage.getItem('passwords');
    if (storedPasswords) {
      return JSON.parse(storedPasswords);
    }
    // Default admin password
    return { '1': 'lumenix' };
  });

  useEffect(() => {
    // Save users to localStorage whenever they change
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('passwords', JSON.stringify(passwords));
  }, [users, passwords]);

  useEffect(() => {
    // Check if user is already logged in
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = (username: string, password: string): boolean => {
    const foundUser = users.find(u => u.username === username);
    
    if (foundUser && passwords[foundUser.id] === password) {
      setUser(foundUser);
      localStorage.setItem('currentUser', JSON.stringify(foundUser));
      return true;
    }
    
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  const addUser = (username: string, password: string, name: string, role: UserRole) => {
    const id = Date.now().toString();
    const newUser = { id, username, name, role };
    
    setUsers(prev => [...prev, newUser]);
    setPasswords(prev => ({ ...prev, [id]: password }));
  };

  const updateUser = (id: string, data: Partial<User>) => {
    setUsers(prev => prev.map(user => 
      user.id === id ? { ...user, ...data } : user
    ));
  };

  const deleteUser = (id: string) => {
    // Prevent deleting the last admin user
    const adminUsers = users.filter(u => u.role === 'admin');
    const targetUser = users.find(u => u.id === id);
    
    if (targetUser?.role === 'admin' && adminUsers.length <= 1) {
      alert('Não é possível excluir o último usuário administrador');
      return;
    }
    
    setUsers(prev => prev.filter(user => user.id !== id));
    
    // Also remove password
    setPasswords(prev => {
      const newPasswords = { ...prev };
      delete newPasswords[id];
      return newPasswords;
    });
  };

  const changePassword = (userId: string, newPassword: string) => {
    // Atualiza a senha do usuário
    setPasswords(prev => ({
      ...prev,
      [userId]: newPassword
    }));
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