# Guia de Segurança - Sistema de Atendimento por Prioridade

## 🔒 Configurações de Segurança Implementadas

### 1. Variáveis de Ambiente

**CRÍTICO**: Antes de executar a aplicação, configure as seguintes variáveis de ambiente:

```bash
# Copie o arquivo .env.example para .env
cp .env.example .env

# Configure as variáveis obrigatórias:
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
```

### 2. Configurações do Banco de Dados

#### Políticas RLS (Row Level Security)
- ✅ RLS habilitado em todas as tabelas
- ✅ Políticas restritivas implementadas
- ✅ Separação de permissões por role (admin/attendant)
- ✅ Auditoria de operações sensíveis

#### Executar Migração de Segurança
```bash
# Execute a migração de melhorias de segurança
supabase db push
```

### 3. Autenticação e Sessões

#### Recursos Implementados:
- ✅ Sessões com expiração automática (30 min)
- ✅ Timeout por inatividade (15 min)
- ✅ Rate limiting para tentativas de login
- ✅ Validação de força de senha
- ✅ Hash bcrypt com salt rounds altos
- ✅ Tokens CSRF para proteção

#### Configurações de Sessão:
```typescript
// Timeouts configuráveis via .env
VITE_SESSION_TIMEOUT=1800000  // 30 minutos
VITE_MAX_LOGIN_ATTEMPTS=5
VITE_LOCKOUT_TIME=1800000     // 30 minutos
```

### 4. Validação de Entrada

#### Implementado:
- ✅ Sanitização de strings (XSS prevention)
- ✅ Validação com Zod schemas
- ✅ Detecção de padrões suspeitos
- ✅ Validação de força de senha
- ✅ Rate limiting por IP/usuário

#### Regras de Senha:
- Mínimo 8 caracteres
- Pelo menos 1 letra maiúscula
- Pelo menos 1 letra minúscula
- Pelo menos 1 número
- Pelo menos 1 caractere especial

### 5. Headers de Segurança

#### Headers Aplicados:
- ✅ Content Security Policy (CSP)
- ✅ X-Frame-Options: DENY
- ✅ X-Content-Type-Options: nosniff
- ✅ Referrer-Policy: strict-origin-when-cross-origin
- ✅ Permissions-Policy (câmera, microfone, localização)

#### Produção (adicional):
- ✅ Strict-Transport-Security (HSTS)
- ✅ Cross-Origin policies
- ✅ X-XSS-Protection

### 6. Auditoria e Logging

#### Eventos Auditados:
- ✅ Login/logout de usuários
- ✅ Criação/edição/exclusão de usuários
- ✅ Alterações em atendentes
- ✅ Tentativas de acesso não autorizado
- ✅ Rate limiting hits

## 🚨 Ações Urgentes Antes da Produção

### 1. Rotacionar Credenciais
```bash
# CRÍTICO: As senhas expostas nas migrações devem ser alteradas
# Criar novos usuários admin com senhas seguras
# Remover usuários com credenciais expostas
```

### 2. Configurar Ambiente de Produção
```bash
# Configurar variáveis de ambiente de produção
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_de_producao
VITE_SESSION_TIMEOUT=1800000
VITE_MAX_LOGIN_ATTEMPTS=3
VITE_LOCKOUT_TIME=3600000
```

### 3. Configurar HTTPS
- ✅ Certificado SSL válido
- ✅ Redirecionamento HTTP → HTTPS
- ✅ HSTS headers configurados

### 4. Configurar Firewall
```bash
# Restringir acesso ao banco de dados
# Apenas IPs autorizados
# Portas não utilizadas fechadas
```

## 🔧 Configurações Recomendadas

### Supabase Dashboard
1. **Authentication**:
   - Desabilitar signup público
   - Configurar rate limiting
   - Habilitar email confirmation

2. **Database**:
   - Backup automático habilitado
   - Point-in-time recovery configurado
   - Conexões SSL obrigatórias

3. **API**:
   - Rate limiting configurado
   - CORS restritivo
   - API keys rotacionadas regularmente

### Monitoramento
1. **Logs de Segurança**:
   - Tentativas de login falhadas
   - Acessos administrativos
   - Alterações de dados sensíveis

2. **Alertas**:
   - Múltiplas tentativas de login
   - Acessos fora do horário
   - Operações administrativas

## 🛡️ Checklist de Segurança

### Antes do Deploy
- [ ] Variáveis de ambiente configuradas
- [ ] Migração de segurança executada
- [ ] Credenciais padrão alteradas
- [ ] HTTPS configurado
- [ ] Firewall configurado
- [ ] Backup configurado
- [ ] Monitoramento ativo

### Manutenção Regular
- [ ] Rotação de chaves (trimestral)
- [ ] Auditoria de usuários (mensal)
- [ ] Revisão de logs (semanal)
- [ ] Teste de backup (mensal)
- [ ] Atualização de dependências (mensal)

## 📞 Contato de Segurança

Em caso de incidente de segurança:
1. Isole o sistema imediatamente
2. Documente o incidente
3. Notifique os administradores
4. Execute plano de recuperação

## 📚 Recursos Adicionais

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase Security](https://supabase.com/docs/guides/platform/security)
- [React Security Best Practices](https://snyk.io/blog/10-react-security-best-practices/)

---

**⚠️ IMPORTANTE**: Este sistema contém dados sensíveis. Siga todas as práticas de segurança e mantenha as configurações atualizadas.