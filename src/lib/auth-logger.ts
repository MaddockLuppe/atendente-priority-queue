// Sistema de logging para autenticação e debugging

interface LogEntry {
  timestamp: string;
  action: string;
  username?: string;
  userId?: string;
  success?: boolean;
  error?: string;
  details?: any;
}

class AuthLogger {
  private static readonly STORAGE_KEY = 'auth_logs';
  private static readonly MAX_LOGS = 100;

  static log(action: string, details: Partial<LogEntry> = {}) {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      action,
      ...details
    };

    // Log no console para desenvolvimento
    console.log('[AUTH]', logEntry);

    try {
      // Salvar em localStorage para debug
      const logs = this.getLogs();
      logs.push(logEntry);

      // Manter apenas os últimos logs
      if (logs.length > this.MAX_LOGS) {
        logs.splice(0, logs.length - this.MAX_LOGS);
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(logs));
    } catch (error) {
      console.warn('Erro ao salvar log de autenticação:', error);
    }
  }

  static getLogs(): LogEntry[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn('Erro ao recuperar logs de autenticação:', error);
      return [];
    }
  }

  static clearLogs(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      console.log('[AUTH] Logs limpos');
    } catch (error) {
      console.warn('Erro ao limpar logs:', error);
    }
  }

  static exportLogs(): string {
    const logs = this.getLogs();
    return JSON.stringify(logs, null, 2);
  }

  // Métodos específicos para diferentes ações
  static loginAttempt(username: string, details?: any) {
    this.log('login_attempt', { username, ...details });
  }

  static loginSuccess(username: string, userId: string) {
    this.log('login_success', { username, userId, success: true });
  }

  static loginFailure(username: string, error: string, details?: any) {
    this.log('login_failure', { username, error, success: false, ...details });
  }

  static logout(username?: string, userId?: string) {
    this.log('logout', { username, userId });
  }

  static userCreated(username: string, userId: string, role: string) {
    this.log('user_created', { username, userId, success: true, details: { role } });
  }

  static userCreationFailed(username: string, error: string) {
    this.log('user_creation_failed', { username, error, success: false });
  }

  static passwordChanged(userId: string, username?: string) {
    this.log('password_changed', { userId, username, success: true });
  }

  static rateLimitExceeded(username: string, remainingTime: number) {
    this.log('rate_limit_exceeded', { 
      username, 
      error: 'Rate limit exceeded', 
      details: { remainingTime } 
    });
  }

  static validationError(action: string, username: string, errors: any) {
    this.log('validation_error', { 
      action, 
      username, 
      error: 'Validation failed', 
      details: { errors } 
    });
  }

  static databaseError(action: string, error: string, details?: any) {
    this.log('database_error', { 
      action, 
      error, 
      success: false, 
      details 
    });
  }

  // Método para debug - mostra estatísticas dos logs
  static getStats() {
    const logs = this.getLogs();
    const stats = {
      total: logs.length,
      byAction: {} as Record<string, number>,
      bySuccess: { success: 0, failure: 0, unknown: 0 },
      lastHour: 0,
      lastDay: 0
    };

    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    logs.forEach(log => {
      // Contar por ação
      stats.byAction[log.action] = (stats.byAction[log.action] || 0) + 1;

      // Contar por sucesso/falha
      if (log.success === true) stats.bySuccess.success++;
      else if (log.success === false) stats.bySuccess.failure++;
      else stats.bySuccess.unknown++;

      // Contar por tempo
      const logTime = new Date(log.timestamp);
      if (logTime > oneHourAgo) stats.lastHour++;
      if (logTime > oneDayAgo) stats.lastDay++;
    });

    return stats;
  }
}

export default AuthLogger;

// Função utilitária para debug no console
export const debugAuth = () => {
  console.group('🔐 Auth Debug Info');
  console.log('📊 Estatísticas:', AuthLogger.getStats());
  console.log('📝 Últimos 10 logs:', AuthLogger.getLogs().slice(-10));
  console.groupEnd();
};

// Adicionar ao window para debug no console do navegador
if (typeof window !== 'undefined') {
  (window as any).debugAuth = debugAuth;
  (window as any).authLogs = AuthLogger;
}