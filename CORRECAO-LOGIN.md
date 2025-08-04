# Correção do Login - Sistema de Atendentes

## Problemas

1. O sistema está apresentando problemas de login devido à falta do usuário administrador no banco de dados.
2. Erro "bcrypt is not defined" ao tentar criar o usuário administrador, indicando problemas com o carregamento da biblioteca bcrypt.js.

## Solução

Foram criados os seguintes arquivos para corrigir os problemas:

1. **create-admin-user.cjs** - Script Node.js para verificar e criar o usuário administrador
2. **create-admin-browser.html** - Página HTML para verificar e criar o usuário administrador através do navegador
3. **abrir-pagina.ps1** - Script PowerShell para abrir a página HTML no navegador padrão
4. **public/bcrypt.min.js** - Biblioteca bcrypt.js local para garantir o funcionamento mesmo sem acesso à internet

## Como usar

### Opção 1: Usando o navegador (recomendado)

1. Execute o script PowerShell para abrir a página HTML no navegador:
   ```
   powershell -ExecutionPolicy Bypass -File .\abrir-pagina.ps1
   ```

2. Na página aberta no navegador, clique no botão "Verificar/Criar Usuário Lucas".

3. A página irá verificar se o usuário lucas existe e, caso não exista, irá criá-lo como administrador com as seguintes credenciais:
   - Usuário: `lucas`
   - Senha: `12345`

### Opção 2: Usando Node.js (avançado)

> **Nota**: Esta opção requer conhecimentos técnicos e instalação de dependências. Recomendamos usar a Opção 1 (navegador) sempre que possível.

1. Certifique-se de que o Node.js está instalado no sistema.

2. Instale as dependências necessárias:
   ```
   npm install @supabase/supabase-js bcryptjs
   ```

3. Execute o script Node.js:
   ```
   node create-admin-user.cjs
   ```

4. O script irá verificar se o usuário administrador existe e, caso não exista, irá criá-lo com as seguintes credenciais:
   - Usuário: `lucas`
   - Senha: `12345`

## Verificação

Após executar um dos métodos acima, você poderá fazer login no sistema usando as seguintes credenciais:

- Usuário: `admin`
- Senha: `admin123`

## Observações

- O usuário admin criado terá o papel (role) de "admin", o que lhe dará acesso a todas as funcionalidades do sistema.
- Se o usuário admin já existir, mas a senha estiver incorreta, o script irá atualizá-la para "admin123".
- Se o usuário admin já existir e a senha estiver correta, o script não fará nenhuma alteração.
- A página HTML foi melhorada para carregar a biblioteca bcrypt.js de múltiplas fontes, incluindo uma cópia local, para evitar o erro "bcrypt is not defined".
- Foram adicionadas verificações para garantir que as bibliotecas necessárias estejam disponíveis antes de executar as operações.