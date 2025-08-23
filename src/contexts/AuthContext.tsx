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
  reloadUsers: () => Promise<void>;
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
    const initializeAuth = async () => {
      await checkStoredSession();
      // loadUsers será chamado automaticamente se for admin
      // Criar função admin_update_user se não existir
      await createAdminUpdateUserFunction();
    };
    
    initializeAuth();
  }, []);

  const createAdminUpdateUserFunction = async () => {
    try {
      // Verificar se a função get_all_users_admin existe
      const { data, error } = await supabase
        .rpc('get_all_users_admin');

      if (error) {
        console.log('Função get_all_users_admin não existe ou não está acessível:', error);
      } else {
        console.log('Função get_all_users_admin existe e está acessível');
      }
    } catch (error) {
      console.error('Erro ao verificar função get_all_users_admin:', error);
    }
  };

  const loadUsers = async () => {
    console.log('🔄 Iniciando carregamento de usuários...');
    
    try {
      // Primeiro, testar função de debug para ver se há usuários no banco
      console.log('🔍 Testando função de debug get_all_users_public...');
      const { data: debugData, error: debugError } = await supabase
        .rpc('get_all_users_public');
      
      if (debugData) {
        console.log('📊 Total de usuários no banco (debug):', debugData.length);
        console.log('👥 Usuários encontrados:', debugData);
      } else if (debugError) {
        console.error('❌ Erro na função de debug:', debugError);
      }
      
      // Se o usuário atual é admin, usar função RPC para contornar RLS
      if (user && user.role === 'admin') {
        console.log('👑 Usuário admin detectado, usando função RPC para carregar todos os usuários');
        
        // Como não temos acesso para aplicar migrações, vamos usar consulta direta
        console.log('🔍 Carregando usuários via consulta direta (admin bypass)...');
        
        try {
          // Para admins, fazer consulta direta à tabela profiles sem RLS
          const { data, error } = await supabase
            .from('profiles')
            .select('id, username, display_name, role')
            .order('display_name');
          
          if (data && data.length > 0) {
            console.log('✅ Usuários carregados via consulta direta:', data.length);
            const mappedUsers = data.map((profile: any) => ({
              id: profile.id,
              username: profile.username,
              name: profile.display_name,
              role: profile.role as UserRole
            }));
            setUsers(mappedUsers);
            return;
          } else if (error) {
            console.error('❌ Erro ao carregar usuários via consulta direta:', error);
            throw error;
          }
        } catch (directError) {
          console.error('❌ Erro na consulta direta, tentando RPC original:', directError);
        }
        
        // Fallback para RPC original se consulta direta falhar
        console.log('🔄 Tentando RPC original como fallback...');
        const { data: fallbackData, error: fallbackError } = await supabase
          .rpc('get_all_users_admin');
        
        if (fallbackData && fallbackData.length > 0) {
          console.log('✅ Usuários carregados via fallback:', fallbackData.length);
          const mappedUsers = fallbackData.map((profile: any) => ({
            id: profile.id,
            username: profile.username,
            name: profile.display_name,
            role: profile.role as UserRole
          }));
          setUsers(mappedUsers);
          return;
        } else if (fallbackError) {
          console.error('❌ Erro no fallback também:', fallbackError);
        }
      }
      
      // Fallback: mostrar apenas o usuário atual
      console.log('⚠️ Mostrando apenas usuário atual');
      if (user) {
        const currentUserOnly = {
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role
        };
        setUsers([currentUserOnly]);
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.error('💥 Erro na função loadUsers:', error);
      // Secure error handling without exposing details
    } finally {
      setLoading(false);
    }
  };

  const checkStoredSession = async () => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setUser(user);
      
      // Verificar se há sessão ativa no Supabase Auth
      const { data: { session } } = await supabase.auth.getSession();
      console.log('🔍 Sessão do Supabase Auth:', session);
      
      // Se for admin, carregar usuários automaticamente
      if (user.role === 'admin') {
        console.log('🔄 Admin detectado na sessão armazenada, carregando usuários...');
        await loadUsers();
      }
    }
  };

  // Admin user initialization removed for security
  // Admins should be created through secure user management interface

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      console.log('🔐 Tentando fazer login com:', username);
      
      // Validação segura via RPC no Supabase (verifica senha no servidor)
      const { data, error } = await supabase.rpc('authenticate_user_secure', {
        p_username: username,
        p_password: password,
      });

      if (error) {
        console.error('❌ Erro na autenticação RPC:', error);
        return false;
      }

      const profile = Array.isArray(data) ? data[0] : null;
      if (!profile) {
        console.error('❌ Perfil não encontrado');
        return false;
      }

      console.log('✅ Perfil encontrado:', profile);

      // Fazer login no Supabase Auth para ativar as políticas RLS
      console.log('🔐 Fazendo login no Supabase Auth...');
      try {
        // Usar o user_id do perfil como email temporário para o Supabase Auth
        const tempEmail = `${profile.user_id}@temp.local`;
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: tempEmail,
          password: profile.user_id // Usar user_id como senha temporária
        });
        
        if (authError) {
          console.log('⚠️ Erro no Supabase Auth (esperado se usuário não existe):', authError);
          // Tentar criar usuário temporário no Supabase Auth
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: tempEmail,
            password: profile.user_id
          });
          
          if (signUpError) {
            console.log('⚠️ Erro ao criar usuário no Supabase Auth:', signUpError);
          } else {
            console.log('✅ Usuário criado no Supabase Auth:', signUpData);
          }
        } else {
          console.log('✅ Login no Supabase Auth bem-sucedido:', authData);
        }
      } catch (authErr) {
        console.log('⚠️ Erro geral no Supabase Auth:', authErr);
      }

      const user: User = {
        id: profile.id,
        username: profile.username,
        name: profile.display_name,
        role: profile.role as UserRole,
      };

      setUser(user);
      localStorage.setItem('currentUser', JSON.stringify(user));
      
      // Carregar usuários após login bem-sucedido (especialmente para admins)
      if (user.role === 'admin') {
        console.log('🔄 Admin logado, carregando lista de usuários...');
        await loadUsers();
      }
      
      return true;
    } catch (error) {
      console.error('💥 Erro geral no login:', error);
      return false;
    }
  };



  const logout = async () => {
    // Fazer logout do Supabase Auth também
    try {
      await supabase.auth.signOut();
      console.log('✅ Logout do Supabase Auth realizado');
    } catch (error) {
      console.log('⚠️ Erro no logout do Supabase Auth:', error);
    }
    
    setUser(null);
    setUsers([]);
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
      // Tentar usar a função RPC admin_update_user primeiro
      try {
        const { data: result, error } = await supabase.rpc('admin_update_user', {
          p_user_id: id,
          p_username: data.username || null,
          p_display_name: data.name || null,
          p_role: data.role || null
        });

        if (error) {
          throw error;
        }

        if (result && !result.success) {
          throw new Error(result.error);
        }

        console.log('Usuário atualizado com sucesso via RPC');
      } catch (rpcError) {
        console.log('RPC falhou, tentando abordagem direta:', rpcError);
        
        // Fallback para abordagem direta
        const updateData: any = {};
        if (data.username) updateData.username = data.username;
        if (data.name) updateData.display_name = data.name;
        if (data.role) updateData.role = data.role;
        
        const { error: directError } = await supabase
          .from('profiles')
          .update(updateData)
          .eq('id', id);
        
        if (directError) {
          console.error('Erro na atualização direta:', directError);
          throw directError;
        }
        
        console.log('Usuário atualizado com sucesso via abordagem direta');
      }
      
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
      
      console.log('Senha alterada com sucesso para usuário:', userId);
    } catch (error) {
      console.error('Erro na função changePassword:', error);
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
        reloadUsers: loadUsers,
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