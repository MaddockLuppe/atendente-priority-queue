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
    const initializeAuth = async () => {
      await checkStoredSession();
      // loadUsers será chamado automaticamente se for admin
    };
    
    initializeAuth();
  }, []);

  const loadUsers = async () => {
    try {
      console.log('🔄 Carregando usuários da tabela profiles...');
      console.log('👤 Usuário atual:', user);
      
      // Verificar conectividade com Supabase
      console.log('🔗 Testando conectividade com Supabase...');
      const { data: testData, error: testError } = await supabase
        .from('profiles')
        .select('count', { count: 'exact', head: true });
      
      console.log('🧪 Teste de conectividade:', { testData, testError });
      
      // Verificar se o usuário atual é admin
      console.log('🔍 Verificando se usuário é admin...');
      const { data: adminCheck, error: adminError } = await supabase
        .rpc('is_current_user_admin');
      
      console.log('📊 Resultado is_current_user_admin:', adminCheck);
      if (adminError) {
        console.log('⚠️ Erro ao verificar admin:', adminError);
      }
      
      // Consultar diretamente a tabela profiles para obter todos os usuários
      console.log('📊 Executando consulta principal...');
      
      let data, error;
      
      if (adminCheck === true) {
        // Admin pode ver todos os usuários
        console.log('🔑 Consultando como admin - todos os usuários');
        const result = await supabase
          .from('profiles')
          .select('id, username, display_name, role')
          .order('display_name');
        data = result.data;
        error = result.error;
      } else {
        // Usuário comum vê apenas seu próprio perfil
        console.log('👤 Consultando como usuário comum - apenas próprio perfil');
        if (user) {
          const result = await supabase
            .from('profiles')
            .select('id, username, display_name, role')
            .eq('id', user.id)
            .single();
          data = result.data ? [result.data] : [];
          error = result.error;
        } else {
          data = [];
          error = null;
        }
      }
      
      console.log('📊 Resultado da consulta profiles:', { 
        data, 
        error, 
        count: data?.length,
        usuarios: data?.map(u => ({ username: u.username, role: u.role })) 
      });
      
      if (error) {
        console.error('❌ Erro ao consultar tabela profiles:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        
        // Tentar consulta sem filtros para debug
        console.log('🔍 Tentando consulta de debug sem filtros...');
        try {
          const { data: debugData, error: debugError } = await supabase
            .from('profiles')
            .select('*');
          console.log('🔍 Resultado debug:', { debugData, debugError });
        } catch (debugErr) {
          console.log('🔍 Erro na consulta debug:', debugErr);
        }
        
        // Se houver erro, manter lista vazia e mostrar apenas o usuário atual se existir
        if (user) {
          const currentUserAsProfile = {
            id: user.id,
            username: user.username,
            display_name: user.name,
            role: user.role
          };
          console.log('⚠️ Usando apenas usuário atual devido ao erro:', currentUserAsProfile);
          setUsers([{
            id: currentUserAsProfile.id,
            username: currentUserAsProfile.username,
            name: currentUserAsProfile.display_name,
            role: currentUserAsProfile.role as UserRole
          }]);
        } else {
          setUsers([]);
        }
        return;
      }
      
      // data já vem como array de objetos JSON
      if (data && data.length > 0) {
        const mappedUsers = data.map((profile: any) => ({
          id: profile.id,
          username: profile.username,
          name: profile.display_name,
          role: profile.role as UserRole
        }));
        
        console.log('✅ Usuários carregados com sucesso:', mappedUsers.length);
        console.log('👥 Lista de usuários:', mappedUsers);
        setUsers(mappedUsers);
      } else {
        console.log('⚠️ Nenhum usuário encontrado na consulta');
        
        // Se há um usuário logado, mostrar pelo menos ele
        if (user) {
          const currentUserOnly = {
            id: user.id,
            username: user.username,
            name: user.name,
            role: user.role
          };
          console.log('🔄 Mostrando apenas usuário atual:', currentUserOnly);
          setUsers([currentUserOnly]);
        } else {
          console.log('❌ Nenhum usuário para exibir');
          setUsers([]);
        }
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
      console.log('Iniciando alteração de senha para usuário:', userId);
      
      // Validar entrada
      if (!userId || !newPassword) {
        throw new Error('ID do usuário e nova senha são obrigatórios');
      }
      
      if (newPassword.length < 6) {
        throw new Error('A senha deve ter pelo menos 6 caracteres');
      }
      
      // Gerar hash da nova senha
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      console.log('Hash da senha gerado com sucesso');
      
      // Atualizar senha no banco
      const { data, error } = await supabase
        .from('profiles')
        .update({ password_hash: hashedPassword })
        .eq('id', userId)
        .select();
      
      if (error) {
        console.error('Erro do Supabase ao alterar senha:', error);
        throw new Error(`Erro ao alterar senha: ${error.message}`);
      }
      
      if (!data || data.length === 0) {
        throw new Error('Usuário não encontrado');
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