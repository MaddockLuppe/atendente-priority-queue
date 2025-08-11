import { useState, useEffect, useCallback } from 'react';
import { User } from '@/contexts/AuthContext';

interface SessionData {
  user: User;
  timestamp: number;
  csrfToken: string;
}

interface UseSecureSessionReturn {
  user: User | null;
  isSessionValid: boolean;
  updateSession: (user: User) => void;
  clearSession: () => void;
  refreshSession: () => void;
  getCSRFToken: () => string | null;
}

const SESSION_KEY = 'secure_session';
const SESSION_TIMEOUT = parseInt(import.meta.env.VITE_SESSION_TIMEOUT || '3600000'); // 1 hora padrão
const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutos de inatividade

export const useSecureSession = (): UseSecureSessionReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [isSessionValid, setIsSessionValid] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());

  // Função para validar sessão
  const validateSession = useCallback((sessionData: SessionData): boolean => {
    const now = Date.now();
    const sessionAge = now - sessionData.timestamp;
    const inactivityTime = now - lastActivity;

    // Verificar se a sessão expirou por tempo ou inatividade
    if (sessionAge > SESSION_TIMEOUT || inactivityTime > INACTIVITY_TIMEOUT) {
      return false;
    }

    // Verificar se o token CSRF existe
    if (!sessionData.csrfToken || sessionData.csrfToken.length === 0) {
      return false;
    }

    return true;
  }, [lastActivity]);

  // Função para carregar sessão do localStorage
  const loadSession = useCallback(() => {
    try {
      const storedSession = localStorage.getItem(SESSION_KEY);
      if (!storedSession) {
        setIsSessionValid(false);
        return;
      }

      const sessionData: SessionData = JSON.parse(storedSession);
      
      if (validateSession(sessionData)) {
        setUser(sessionData.user);
        setIsSessionValid(true);
      } else {
        // Sessão inválida, limpar
        localStorage.removeItem(SESSION_KEY);
        setUser(null);
        setIsSessionValid(false);
      }
    } catch (error) {
      console.error('Erro ao carregar sessão:', error);
      localStorage.removeItem(SESSION_KEY);
      setUser(null);
      setIsSessionValid(false);
    }
  }, [validateSession]);

  // Função para atualizar sessão
  const updateSession = useCallback((newUser: User) => {
    const sessionData: SessionData = {
      user: newUser,
      timestamp: Date.now(),
      csrfToken: crypto.randomUUID()
    };

    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
      setUser(newUser);
      setIsSessionValid(true);
      setLastActivity(Date.now());
    } catch (error) {
      console.error('Erro ao salvar sessão:', error);
      setIsSessionValid(false);
    }
  }, []);

  // Função para limpar sessão
  const clearSession = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
    setIsSessionValid(false);
  }, []);

  // Função para renovar sessão
  const refreshSession = useCallback(() => {
    if (user) {
      updateSession(user);
    }
  }, [user, updateSession]);

  // Função para obter token CSRF
  const getCSRFToken = useCallback((): string | null => {
    try {
      const storedSession = localStorage.getItem(SESSION_KEY);
      if (!storedSession) return null;

      const sessionData: SessionData = JSON.parse(storedSession);
      return sessionData.csrfToken || null;
    } catch {
      return null;
    }
  }, []);

  // Monitorar atividade do usuário
  useEffect(() => {
    const updateActivity = () => {
      setLastActivity(Date.now());
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, updateActivity, true);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateActivity, true);
      });
    };
  }, []);

  // Verificar sessão periodicamente
  useEffect(() => {
    const interval = setInterval(() => {
      if (user) {
        const storedSession = localStorage.getItem(SESSION_KEY);
        if (storedSession) {
          try {
            const sessionData: SessionData = JSON.parse(storedSession);
            if (!validateSession(sessionData)) {
              clearSession();
            }
          } catch {
            clearSession();
          }
        } else {
          clearSession();
        }
      }
    }, 60000); // Verificar a cada minuto

    return () => clearInterval(interval);
  }, [user, validateSession, clearSession]);

  // Carregar sessão na inicialização
  useEffect(() => {
    loadSession();
  }, [loadSession]);

  // Aviso antes da expiração da sessão
  useEffect(() => {
    if (!user || !isSessionValid) return;

    const warningTime = SESSION_TIMEOUT - 5 * 60 * 1000; // 5 minutos antes
    const timeoutId = setTimeout(() => {
      const shouldRenew = window.confirm(
        'Sua sessão expirará em 5 minutos. Deseja renovar?'
      );
      
      if (shouldRenew) {
        refreshSession();
      }
    }, warningTime);

    return () => clearTimeout(timeoutId);
  }, [user, isSessionValid, refreshSession]);

  return {
    user,
    isSessionValid,
    updateSession,
    clearSession,
    refreshSession,
    getCSRFToken
  };
};