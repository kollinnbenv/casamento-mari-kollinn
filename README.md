# Casamento Mari e Kollinn

## Configuração da Integração com Google Drive

Este projeto permite exibir imagens do Google Drive de forma segura na página da galeria. Siga os passos abaixo para configurar:

### 1. Criar Credenciais no Google Cloud

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Ative a API do Google Drive para o projeto
4. Crie credenciais OAuth 2.0:
   - Vá para "APIs e Serviços" > "Credenciais"
   - Clique em "Criar Credenciais" > "ID do Cliente OAuth"
   - Configure como "Aplicativo de Desktop"
   - Faça o download do arquivo JSON de credenciais

### 2. Configurar o Projeto

1. Crie uma pasta `config` na raiz do projeto
2. Renomeie o arquivo de credenciais baixado para `credentials.json` e coloque-o na pasta `config`
3. Defina as variáveis de ambiente no arquivo `.env`:
   ```
   GOOGLE_DRIVE_FOLDER_ID=id_da_pasta_com_fotos
   CONFIG_DIR=./config
   ```

### 3. Autorizar o Aplicativo e Gerar Token

1. Execute a ferramenta de configuração para gerar o token de acesso:
   ```
   go run cmd/tools/setup_auth.go ./config/credentials.json
   ```
2. Siga as instruções no terminal: abra a URL fornecida, autorize o aplicativo e cole o código recebido
3. Um arquivo `token.json` será criado na pasta `config`

### 4. Executar o Servidor

```
go run cmd/server/main.go
```

## Notas de Segurança

- A integração usa apenas acesso de leitura ao Google Drive
- O token e as credenciais são armazenados localmente e não são enviados aos clientes
- As URLs de imagens são temporárias e geradas sob demanda
- Certifique-se de que o arquivo `.env`, a pasta `config/`, `credentials.json` e `token.json` estejam no `.gitignore`