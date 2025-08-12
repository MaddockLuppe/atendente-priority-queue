# 🔧 GUIA COMPLETO: Criação do Usuário Admin

## 📋 Problema Identificado

O debug revelou que **a tabela `profiles` está vazia**, por isso o login falha. As políticas RLS (Row Level Security) do Supabase estão impedindo a criação automática do usuário.

## ✅ Solução: Criação Manual no Supabase Dashboard

### Passo 1: Acessar o Supabase Dashboard

1. Acesse: https://supabase.com
2. Faça login na sua conta
3. Selecione o projeto: `rahidenugbgnfrddtpxm`

### Passo 2: Abrir o SQL Editor

1. No menu lateral, clique em **"SQL Editor"**
2. Clique em **"New query"** ou use uma query existente

### Passo 3: Executar o SQL de Criação

Copie e cole o seguinte SQL no editor:

```sql
-- Remover todos os usuários existentes e criar novo admin
-- Usuário: admin
-- Senha: admin123
-- Gerado automaticamente em: 2025-08-12T15:52:02.794Z

-- Remover todos os usuários existentes
DELETE FROM profiles;

-- Criar novo usuário administrador
INSERT INTO profiles (user_id, username, display_name, role, password_hash)
VALUES (
  gen_random_uuid(),
  'admin',
  'Administrador',
  'admin',
  '$2b$10$5EnGfQWsZ2O9xX.TdNYiu.vvkrZCOEOnIFlzhQPYp03ojsqeUl77O'
);

-- Verificar se o usuário foi criado corretamente
SELECT 
  id,
  username,
  display_name,
  role,
  created_at
FROM profiles 
WHERE username = 'admin';

-- Contar total de usuários
SELECT COUNT(*) as total_users FROM profiles;
```

### Passo 4: Executar a Query

1. Clique no botão **"Run"** (▶️) ou pressione `Ctrl+Enter`
2. Verifique se a execução foi bem-sucedida
3. Você deve ver o resultado mostrando o usuário admin criado

### Passo 5: Verificar a Criação

Após executar o SQL, você deve ver algo como:

```
| id                                   | username | display_name  | role  | created_at           |
|--------------------------------------|----------|---------------|-------|----------------------|
| 12345678-1234-1234-1234-123456789012 | admin    | Administrador | admin | 2025-01-15 10:30:00  |

total_users: 1
```

## 🧪 Teste do Login

### Opção 1: Script de Verificação

Execute no terminal:

```bash
node scripts/verify-admin-login.cjs
```

### Opção 2: Teste na Aplicação

1. Acesse: http://localhost:8080/
2. Use as credenciais:
   - **Usuário:** `admin`
   - **Senha:** `admin123`

## 🔍 Troubleshooting

### Se o SQL falhar:

1. **Erro de permissão:** Verifique se você está logado como proprietário do projeto
2. **Tabela não existe:** Execute primeiro as migrações do projeto
3. **Política RLS:** O SQL acima deve funcionar no dashboard (bypass automático)

### Se o login ainda falhar:

1. Execute o debug:
   ```bash
   node scripts/debug-login-process.cjs
   ```

2. Verifique se o usuário foi criado:
   ```sql
   SELECT * FROM profiles WHERE username = 'admin';
   ```

3. Teste o hash da senha:
   ```javascript
   const bcrypt = require('bcryptjs');
   bcrypt.compare('admin123', '$2b$10$5EnGfQWsZ2O9xX.TdNYiu.vvkrZCOEOnIFlzhQPYp03ojsqeUl77O')
     .then(result => console.log('Senha válida:', result));
   ```

## 📊 Informações Técnicas

- **Hash da senha:** `$2b$10$5EnGfQWsZ2O9xX.TdNYiu.vvkrZCOEOnIFlzhQPYp03ojsqeUl77O`
- **Salt rounds:** 10 (compatível com bcryptjs)
- **Algoritmo:** bcrypt
- **Senha original:** `admin123`

## 🎯 Próximos Passos

1. ✅ Executar SQL no Supabase Dashboard
2. ✅ Verificar criação com script de debug
3. ✅ Testar login na aplicação
4. ✅ Criar outros usuários conforme necessário

---

**💡 Dica:** Após criar o usuário admin, você pode usar a interface da aplicação para criar outros usuários normalmente, pois o admin terá permissões para isso.