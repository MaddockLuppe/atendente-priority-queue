# 👤 Criação de Usuário Administrador

## 🎯 Usuário Criado

**Credenciais do Administrador:**
- **Usuário:** `lucas`
- **Senha:** `12061409`
- **Role:** `admin`
- **Nome de Exibição:** `Lucas - Administrador`

## 🚀 Como Aplicar no Banco de Dados

### Opção 1: Supabase Dashboard (Recomendado)
1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard)
2. Vá para seu projeto
3. Navegue até **SQL Editor**
4. Copie e cole o conteúdo do arquivo `create-admin-lucas.sql`
5. Execute o script
6. Verifique se o usuário foi criado na tabela `profiles`

### Opção 2: CLI do Supabase
```bash
# Se você tiver o Supabase CLI instalado
supabase db push
```

### Opção 3: Aplicação Manual
Se você tiver acesso direto ao PostgreSQL:
```sql
-- Execute este comando SQL
INSERT INTO profiles (user_id, username, display_name, role, password_hash)
VALUES (
  gen_random_uuid(),
  'lucas',
  'Lucas - Administrador',
  'admin',
  '$2b$10$ltSub8pDfKD3A4jy9ckh9uD3MO.GFi2lXssP/9WgkLyp8VJGcrEAe'
) ON CONFLICT (username) 
DO UPDATE SET 
  password_hash = '$2b$10$ltSub8pDfKD3A4jy9ckh9uD3MO.GFi2lXssP/9WgkLyp8VJGcrEAe',
  display_name = 'Lucas - Administrador',
  role = 'admin',
  updated_at = now();
```

## 🔧 Scripts Disponíveis

### Criar Novo Usuário Administrador
```bash
npm run create-admin
```
Este comando executa o script que:
- Gera hash bcrypt da senha
- Cria arquivo de migração SQL
- Fornece instruções de aplicação

## 📋 Verificação

Após aplicar a migração, verifique se o usuário foi criado:

```sql
-- Verificar usuário específico
SELECT id, username, display_name, role, created_at
FROM profiles 
WHERE username = 'lucas';

-- Verificar todos os administradores
SELECT username, display_name, created_at
FROM profiles 
WHERE role = 'admin';
```

## 🔐 Segurança

### ⚠️ IMPORTANTE - Primeiros Passos
1. **Faça login imediatamente** com as credenciais fornecidas
2. **Altere a senha** após o primeiro acesso
3. **Delete este arquivo** após configurar o usuário
4. **Não compartilhe** as credenciais por canais inseguros

### 🛡️ Boas Práticas
- Use senhas fortes (mínimo 8 caracteres, maiúsculas, minúsculas, números e símbolos)
- Ative autenticação de dois fatores se disponível
- Monitore logs de acesso regularmente
- Revise permissões de usuários periodicamente

## 🗂️ Arquivos Relacionados

- `scripts/create-admin-user.js` - Script para gerar novos usuários admin
- `create-admin-lucas.sql` - SQL para criar o usuário lucas
- `supabase/migrations/20250811171917_create_admin_user_lucas.sql` - Migração gerada
- `SECURITY.md` - Documentação completa de segurança

## 🆘 Solução de Problemas

### Erro: "duplicate key value violates unique constraint"
- O usuário já existe. Use UPDATE ao invés de INSERT
- Ou delete o usuário existente primeiro

### Erro: "password_hash too short"
- Verifique se o hash bcrypt foi gerado corretamente
- Hash deve começar com `$2b$10$` e ter ~60 caracteres

### Não consegue fazer login
- Verifique se a migração foi aplicada corretamente
- Confirme que o usuário existe na tabela `profiles`
- Teste a senha em um gerador bcrypt online

---

**Data de Criação:** 11/08/2025  
**Usuário Criado:** lucas  
**Hash da Senha:** `$2b$10$ltSub8pDfKD3A4jy9ckh9uD3MO.GFi2lXssP/9WgkLyp8VJGcrEAe`