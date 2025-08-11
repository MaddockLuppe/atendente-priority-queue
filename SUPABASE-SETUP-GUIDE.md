# Guia de Configuração do Supabase

## Problema Atual

A aplicação está configurada com URLs de exemplo do Supabase e não consegue conectar a um banco de dados real. Para que o sistema funcione corretamente, você precisa:

1. **Criar uma conta no Supabase**
2. **Criar um novo projeto**
3. **Configurar as credenciais reais**
4. **Aplicar as migrações do banco**

## Passo a Passo

### 1. Criar Conta no Supabase

1. Acesse [https://supabase.com](https://supabase.com)
2. Clique em "Start your project"
3. Faça login com GitHub, Google ou email

### 2. Criar Novo Projeto

1. No dashboard, clique em "New Project"
2. Escolha uma organização (ou crie uma nova)
3. Preencha:
   - **Name**: `atendente-priority-queue`
   - **Database Password**: Crie uma senha forte (anote ela!)
   - **Region**: Escolha a região mais próxima (ex: South America)
4. Clique em "Create new project"
5. Aguarde alguns minutos para o projeto ser criado

### 3. Obter Credenciais

Após o projeto ser criado:

1. No dashboard do projeto, vá em **Settings** → **API**
2. Copie as seguintes informações:
   - **Project URL** (algo como: `https://abc123def.supabase.co`)
   - **anon public** key (chave longa que começa com `eyJ...`)

### 4. Configurar Arquivo .env

Substitua o conteúdo do arquivo `.env` pelas credenciais reais:

```env
# Supabase Configuration - SUBSTITUA PELAS CREDENCIAIS REAIS
VITE_SUPABASE_URL=https://SEU_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=SUA_CHAVE_ANON_AQUI

# Security Configuration
VITE_SESSION_TIMEOUT=3600000
VITE_MAX_LOGIN_ATTEMPTS=5
VITE_LOGIN_LOCKOUT_TIME=900000

# Application Configuration
VITE_APP_NAME="Sistema de Atendimento"
VITE_APP_VERSION="1.0.0"
```

### 5. Aplicar Migrações

Após configurar as credenciais:

#### Opção A: Via Supabase Dashboard (Recomendado)

1. No dashboard do Supabase, vá em **SQL Editor**
2. Execute os seguintes arquivos SQL na ordem:
   - `supabase/migrations/20250805110234_3d7a7699-153f-401e-b8be-97cacfadd6be.sql`
   - `supabase/migrations/20250805110318_459f0a3c-803f-492a-9d51-27bdadf1750f.sql`
   - E assim por diante...
3. Execute também o arquivo de correção: `fix-password-hashes.sql`

#### Opção B: Via Supabase CLI

```bash
# Instalar Supabase CLI
npm install -g supabase

# Fazer login
supabase login

# Linkar ao projeto
supabase link --project-ref SEU_PROJECT_ID

# Aplicar migrações
supabase db push
```

### 6. Verificar Configuração

Após configurar tudo:

```bash
# Testar conexão
npm run test-db

# Testar senhas
npm run test-passwords

# Reiniciar servidor
npm run dev
```

## Credenciais de Teste

Após aplicar as migrações e correções:

- **Usuário**: `lucas`
  - **Senha**: `admin123`
  - **Papel**: Administrador

- **Usuário**: `abassa`
  - **Senha**: `senha123`
  - **Papel**: Atendente

## Solução de Problemas

### Erro "fetch failed"
- Verifique se as credenciais estão corretas
- Confirme se o projeto Supabase está ativo
- Teste a URL no navegador

### Erro "Invalid login credentials"
- Execute `npm run fix-passwords` para corrigir hashes
- Verifique se as migrações foram aplicadas
- Confirme se os usuários existem na tabela `profiles`

### Erro de CORS
- No Supabase Dashboard, vá em **Authentication** → **Settings**
- Adicione `http://localhost:8080` em **Site URL**

## Status Atual

❌ **Problema**: URLs de exemplo no `.env`
✅ **Solução**: Configurar Supabase real
✅ **Código**: Funcionando corretamente
✅ **Migrações**: Prontas para aplicar
✅ **Scripts**: Disponíveis para teste

## Próximos Passos

1. [ ] Criar conta no Supabase
2. [ ] Criar novo projeto
3. [ ] Configurar credenciais no `.env`
4. [ ] Aplicar migrações
5. [ ] Testar login
6. [ ] Verificar funcionalidades

---

**Importante**: Mantenha suas credenciais seguras e nunca as compartilhe publicamente!