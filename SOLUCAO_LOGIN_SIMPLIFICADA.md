# Solução de Login Simplificada

## Problema Identificado
A tabela `profiles` estava vazia, impedindo o login no sistema. O sistema de autenticação consulta esta tabela para validar usuários.

## Solução Implementada
Criação de apenas **2 usuários** na tabela `profiles` com hashes de senha atualizados para atender às constraints de segurança:

### 1. Usuário Administrador
- **Username:** `admin`
- **Senha:** `admin123`
- **Role:** `admin`
- **Display Name:** Administrador
- **Hash atualizado:** Para atender constraint de 50+ caracteres

### 2. Usuário Atendente Genérico
- **Username:** `atendente`
- **Senha:** `123456`
- **Role:** `attendant`
- **Display Name:** Atendente
- **Hash atualizado:** Para atender constraint de 50+ caracteres

## Arquivos Criados

### `migrate-admin-only.sql`
Script SQL que:
- Limpa a tabela `profiles`
- Insere o usuário `admin`
- Insere o usuário `atendente` genérico
- Inclui verificações finais

## Como Executar

1. **Acesse o Supabase Dashboard**
   - Vá para [supabase.com](https://supabase.com)
   - Faça login na sua conta
   - Selecione seu projeto

2. **Abra o SQL Editor**
   - No menu lateral, clique em "SQL Editor"
   - Clique em "New query"

3. **Execute o Script**
   - Copie todo o conteúdo do arquivo `migrate-admin-only.sql`
   - Cole no editor SQL
   - Clique em "Run" para executar

4. **Verifique o Resultado**
   - O script deve retornar:
     - Lista dos 2 usuários criados
     - Contagem total: 2 usuários

## Login no Sistema

Após executar o script, você pode fazer login com:

### Como Administrador:
- **Username:** `admin`
- **Senha:** `admin123`

### Como Atendente:
- **Username:** `atendente`
- **Senha:** `123456`

## Vantagens desta Solução

✅ **Simplicidade:** Apenas 2 usuários para gerenciar
✅ **Sem cadastros individuais:** Todos os atendentes usam o mesmo login
✅ **Segurança:** Senhas hasheadas com bcrypt
✅ **Flexibilidade:** Admin pode gerenciar o sistema, usuário attendant pode atender

## Segurança

- Todas as senhas são hasheadas usando bcrypt
- Hash do admin: `$2b$12$SvpqA7CZM8.Q5us1BCCbf.r/I216kblHhkg1zYIzHr3aOssyaqxF6`
- Hash do atendente: `$2b$12$R.NDP/Ecgie2FUN8b686Q.XXXYeleagq4NKj9vM./y1TiqXJWxceq`

## Observações Importantes

- Os hashes de senha para os usuários 'admin' e 'atendente' foram atualizados para atender às constraints de segurança de comprimento mínimo (50 caracteres)
- As credenciais de login permanecem as mesmas: 'admin123' e '123456' respectivamente
- O script pode ser executado múltiplas vezes sem problemas (usa ON CONFLICT)
- **IMPORTANTE**: Se houver erro de constraint `profiles_role_check`, execute primeiro a migração `20250812170000_fix_profiles_role_constraint.sql` no Supabase para corrigir a constraint da coluna role

## Próximos Passos

1. Execute o script `migrate-admin-only.sql` no Supabase Dashboard
2. Teste o login com ambos os usuários
3. Se necessário, altere as senhas padrão através do sistema
4. Configure permissões específicas conforme necessário

---

**Nota:** Esta solução atende à necessidade de não ter cadastros individuais para cada atendente, mantendo a funcionalidade do sistema de login.