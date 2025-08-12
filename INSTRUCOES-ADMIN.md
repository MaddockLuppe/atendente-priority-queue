# 🔧 Instruções para Criar Usuário Admin

## ✅ Script Gerado
O script SQL foi criado com sucesso: `remove-users-create-admin.sql`

## 📋 Credenciais do Novo Admin
- **Usuário**: `admin`
- **Senha**: `admin123`
- **Função**: Administrador

## 🚀 Como Aplicar o Script

### Opção 1: Supabase Dashboard (Recomendado)
1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto "Abassa"
3. Vá em **SQL Editor** no menu lateral
4. Clique em **New Query**
5. Copie e cole o conteúdo do arquivo `remove-users-create-admin.sql`
6. Clique em **Run** para executar

### Opção 2: Via CLI (Se configurado)
```bash
supabase db push
```

## 🔍 Verificação
Após executar o script, você deve ver:
- ✅ 1 usuário criado (admin)
- ✅ Total de usuários: 1
- ✅ Hash da senha com 60 caracteres

## 🧪 Testar o Login
1. Abra a aplicação: http://localhost:8080/
2. Use as credenciais:
   - **Usuário**: `admin`
   - **Senha**: `admin123`

## ⚠️ Importante
- Todos os usuários anteriores foram removidos
- Altere a senha após o primeiro login
- Guarde as credenciais em local seguro

## 🔧 Scripts Disponíveis
- `npm run test-db` - Testar conexão com banco
- `npm run create-admin` - Gerar novo script de admin
- `npm run dev` - Iniciar aplicação

---
**Status**: ✅ Script criado e pronto para aplicação