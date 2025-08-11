// Configurações de segurança para a aplicação

// Headers de segurança para desenvolvimento
export const securityHeaders = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Para desenvolvimento
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; '),
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
};

// Headers de segurança para produção (mais restritivos)
export const productionSecurityHeaders = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'", // Necessário para styled-components
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests"
  ].join('; '),
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Cross-Origin-Embedder-Policy': 'require-corp',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin'
};

// Função para aplicar headers de segurança
export const applySecurityHeaders = (isDevelopment: boolean = true) => {
  const headers = isDevelopment ? securityHeaders : productionSecurityHeaders;
  
  // Aplicar headers via meta tags (limitado, mas melhor que nada)
  Object.entries(headers).forEach(([name, value]) => {
    if (name === 'Content-Security-Policy') {
      const meta = document.createElement('meta');
      meta.httpEquiv = 'Content-Security-Policy';
      meta.content = value;
      document.head.appendChild(meta);
    }
  });
};

// Configurações de sessão segura
export const sessionConfig = {
  // Timeout padrão (pode ser sobrescrito por variável de ambiente)
  defaultTimeout: 30 * 60 * 1000, // 30 minutos
  
  // Timeout de inatividade
  inactivityTimeout: 15 * 60 * 1000, // 15 minutos
  
  // Chave para localStorage (com prefixo para evitar conflitos)
  storageKey: 'atendente_queue_session',
  
  // Configurações de cookie (se usar cookies no futuro)
  cookieOptions: {
    httpOnly: true,
    secure: true,
    sameSite: 'strict' as const,
    maxAge: 30 * 60 // 30 minutos
  }
};

// Configurações de rate limiting
export const rateLimitConfig = {
  // Login attempts
  login: {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutos
    lockoutTime: 30 * 60 * 1000 // 30 minutos de bloqueio
  },
  
  // API calls gerais
  api: {
    maxRequests: 100,
    windowMs: 15 * 60 * 1000 // 15 minutos
  }
};

// Função para detectar ataques comuns
export const detectSuspiciousActivity = (input: string): boolean => {
  const suspiciousPatterns = [
    // SQL Injection
    /('|(\-\-)|(;)|(\||\|)|(\*|\*))/i,
    /(union|select|insert|delete|update|drop|create|alter|exec|execute)/i,
    
    // XSS
    /<script[^>]*>.*?<\/script>/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    
    // Path traversal
    /\.\.\/|\.\.\\/gi,
    
    // Command injection
    /(;|\||&|`|\$\(|\$\{)/gi
  ];
  
  return suspiciousPatterns.some(pattern => pattern.test(input));
};

// Função para sanitizar URLs
export const sanitizeUrl = (url: string): string => {
  try {
    const parsed = new URL(url);
    
    // Permitir apenas HTTP e HTTPS
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('Protocolo não permitido');
    }
    
    return parsed.toString();
  } catch {
    return '';
  }
};

// Função para gerar nonce para CSP
export const generateNonce = (): string => {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array));
};

// Configurações de logging de segurança
export const securityLogger = {
  logSuspiciousActivity: (activity: string, details: any) => {
    console.warn('[SECURITY]', activity, details);
    // Em produção, enviar para serviço de logging
  },
  
  logAuthEvent: (event: string, userId?: string) => {
    console.info('[AUTH]', event, userId ? `User: ${userId}` : '');
    // Em produção, enviar para serviço de auditoria
  },
  
  logRateLimitHit: (identifier: string, endpoint: string) => {
    console.warn('[RATE_LIMIT]', `${identifier} hit rate limit on ${endpoint}`);
    // Em produção, alertar administradores
  }
};

// Função para validar origem da requisição
export const validateOrigin = (origin: string): boolean => {
  const allowedOrigins = [
    'http://localhost:8080',
    'http://localhost:3000',
    'http://127.0.0.1:8080',
    'http://127.0.0.1:3000'
    // Adicionar domínios de produção aqui
  ];
  
  return allowedOrigins.includes(origin);
};

// Configurações de backup e recuperação
export const backupConfig = {
  // Frequência de backup automático (em produção)
  autoBackupInterval: 24 * 60 * 60 * 1000, // 24 horas
  
  // Retenção de backups
  retentionDays: 30,
  
  // Criptografia de backup
  encryptBackups: true
};