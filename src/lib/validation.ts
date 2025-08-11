import { z } from 'zod';

// Schema para validação de login
export const loginSchema = z.object({
  username: z
    .string()
    .min(3, 'Nome de usuário deve ter pelo menos 3 caracteres')
    .max(50, 'Nome de usuário deve ter no máximo 50 caracteres')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Nome de usuário deve conter apenas letras, números, _ e -'),
  password: z
    .string()
    .min(8, 'Senha deve ter pelo menos 8 caracteres')
    .max(128, 'Senha deve ter no máximo 128 caracteres')
});

// Schema para validação de criação de usuário
export const createUserSchema = z.object({
  username: z
    .string()
    .min(3, 'Nome de usuário deve ter pelo menos 3 caracteres')
    .max(50, 'Nome de usuário deve ter no máximo 50 caracteres')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Nome de usuário deve conter apenas letras, números, _ e -'),
  password: z
    .string()
    .min(8, 'Senha deve ter pelo menos 8 caracteres')
    .max(128, 'Senha deve ter no máximo 128 caracteres')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
           'Senha deve conter pelo menos: 1 letra minúscula, 1 maiúscula, 1 número e 1 caractere especial'),
  name: z
    .string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome deve conter apenas letras e espaços'),
  role: z.enum(['admin', 'attendant', 'viewer'])
});

// Schema para validação de atualização de usuário
export const updateUserSchema = z.object({
  username: z
    .string()
    .min(3, 'Nome de usuário deve ter pelo menos 3 caracteres')
    .max(50, 'Nome de usuário deve ter no máximo 50 caracteres')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Nome de usuário deve conter apenas letras, números, _ e -')
    .optional(),
  name: z
    .string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome deve conter apenas letras e espaços')
    .optional(),
  role: z.enum(['admin', 'attendant', 'viewer']).optional()
});

// Função para sanitizar strings
export const sanitizeString = (input: string): string => {
  return input
    .trim()
    .replace(/[<>"'&]/g, (char) => {
      const entities: { [key: string]: string } = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '&': '&amp;'
      };
      return entities[char] || char;
    });
};

// Função para validar força da senha
export const validatePasswordStrength = (password: string): {
  isValid: boolean;
  score: number;
  feedback: string[];
} => {
  const feedback: string[] = [];
  let score = 0;

  // Verificar comprimento
  if (password.length >= 8) score += 1;
  else feedback.push('Use pelo menos 8 caracteres');

  if (password.length >= 12) score += 1;

  // Verificar caracteres
  if (/[a-z]/.test(password)) score += 1;
  else feedback.push('Inclua pelo menos uma letra minúscula');

  if (/[A-Z]/.test(password)) score += 1;
  else feedback.push('Inclua pelo menos uma letra maiúscula');

  if (/\d/.test(password)) score += 1;
  else feedback.push('Inclua pelo menos um número');

  if (/[@$!%*?&]/.test(password)) score += 1;
  else feedback.push('Inclua pelo menos um caractere especial (@$!%*?&)');

  // Verificar padrões comuns
  const commonPatterns = [
    /123456/,
    /password/i,
    /qwerty/i,
    /admin/i,
    /(.)\1{2,}/ // caracteres repetidos
  ];

  if (commonPatterns.some(pattern => pattern.test(password))) {
    score -= 2;
    feedback.push('Evite padrões comuns e caracteres repetidos');
  }

  return {
    isValid: score >= 4,
    score: Math.max(0, Math.min(5, score)),
    feedback
  };
};

// Rate limiting simples para tentativas de login
class RateLimiter {
  private attempts: Map<string, { count: number; lastAttempt: number }> = new Map();
  private readonly maxAttempts: number;
  private readonly windowMs: number;

  constructor(maxAttempts = 5, windowMs = 15 * 60 * 1000) { // 15 minutos
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const record = this.attempts.get(identifier);

    if (!record) {
      this.attempts.set(identifier, { count: 1, lastAttempt: now });
      return true;
    }

    // Reset se passou da janela de tempo
    if (now - record.lastAttempt > this.windowMs) {
      this.attempts.set(identifier, { count: 1, lastAttempt: now });
      return true;
    }

    // Incrementar tentativas
    record.count++;
    record.lastAttempt = now;

    return record.count <= this.maxAttempts;
  }

  getRemainingTime(identifier: string): number {
    const record = this.attempts.get(identifier);
    if (!record || record.count <= this.maxAttempts) return 0;

    const elapsed = Date.now() - record.lastAttempt;
    return Math.max(0, this.windowMs - elapsed);
  }

  reset(identifier: string): void {
    this.attempts.delete(identifier);
  }
}

export const loginRateLimiter = new RateLimiter();

// Função para gerar token CSRF simples
export const generateCSRFToken = (): string => {
  return crypto.randomUUID();
};

// Função para validar token CSRF
export const validateCSRFToken = (token: string, storedToken: string): boolean => {
  return token === storedToken && token.length > 0;
};