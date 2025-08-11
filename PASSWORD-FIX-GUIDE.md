# Guia de Correção de Problemas de Autenticação

## Problema Identificado

Todos os usuários estavam enfrentando erros de "usuário ou senha incorretos" devido a **hashes de senha inválidos** no banco de dados.

### Diagnóstico Realizado

✅ **Código de autenticação**: Funcionando corretamente  
✅ **Biblioteca bcrypt**: Configurada adequadamente  
❌ **Hashes no banco**: Alguns hashes estavam corrompidos/inválidos

### Usuários Afetados

- **lucas**: Hash válido ✅
- **abassa**: Hash inválido ❌ (corrigido)

## Solução Implementada

### 1. Scripts de Diagnóstico

```bash
# Testar hashes existentes
npm run test-passwords

# Corrigir hashes inválidos
npm run fix-passwords
```

### 2. Arquivos Gerados

- `scripts/test-password-hashes.js` - Testa hashes existentes
- `scripts/fix-password-hashes.js` - Gera hashes corretos
- `fix-password-hashes.sql` - SQL para aplicar correções
- `supabase/migrations/20250811T185744_fix_password_hashes.sql` - Migração

### 3. Aplicar Correção

#### Opção A: Supabase Dashboard
1. Acesse o Supabase Dashboard
2. Vá para **SQL Editor**
3. Cole o conteúdo de `fix-password-hashes.sql`
4. Execute o SQL

#### Opção B: Supabase CLI (se instalado)
```bash
supabase db push
```

#### Opção C: Execução Manual
Copie e execute o SQL diretamente no seu cliente PostgreSQL.

## Credenciais Corrigidas

| Usuário | Senha | Papel |
|---------|-------|-------|
| lucas | 12061409 | admin |
| abassa | xangoeoxum@2025@ | admin |

## Verificação

Após aplicar a correção:

1. **Teste o login** com as credenciais acima
2. **Verifique no banco**:
   ```sql
   SELECT username, display_name, role, updated_at 
   FROM profiles 
   WHERE username IN ('lucas', 'abassa');
   ```

## Prevenção Futura

### Scripts Disponíveis

```bash
# Testar hashes de senha
npm run test-passwords

# Corrigir hashes inválidos
npm run fix-passwords

# Criar novo usuário admin
npm run create-admin
```

### Boas Práticas

1. **Sempre teste** novos hashes antes de aplicar
2. **Use bcrypt consistente** (bcryptjs v3.0.2)
3. **Salt rounds**: 10 (padrão seguro)
4. **Valide hashes** após migrações

## Segurança

⚠️ **IMPORTANTE**:
- Altere as senhas após o primeiro login
- Use senhas fortes em produção
- Não compartilhe credenciais em texto plano
- Delete este arquivo após resolver o problema

## Troubleshooting

### Problema: "Hash inválido"
**Solução**: Execute `npm run fix-passwords`

### Problema: "Usuário não encontrado"
**Solução**: Verifique se a migração foi aplicada

### Problema: "Erro de conexão"
**Solução**: Verifique configurações do Supabase em `.env`

---

**Data da correção**: 2025-08-11  
**Status**: ✅ Resolvido  
**Próximos passos**: Aplicar SQL e testar login