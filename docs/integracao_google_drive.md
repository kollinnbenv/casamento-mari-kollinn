# Integração com Google Drive - Documentação Técnica

## Visão Geral da Implementação

A integração com o Google Drive foi implementada de forma a priorizar a segurança, privacidade e manutenção. Esta solução permite exibir imagens de uma pasta específica do Google Drive na rota `/galeria` da aplicação web, sem expor tokens, credenciais ou URLs públicas.

## Arquitetura da Solução

### 1. Modelo de Dados
- `DriveImage`: Representa uma imagem armazenada no Google Drive, incluindo ID, nome, tipo MIME e links para visualização.

### 2. Gerenciamento de Tokens e Credenciais
- Todas as credenciais sensíveis são armazenadas localmente em arquivos protegidos
- Tokens OAuth2 são armazenados com permissões restritas (apenas leitura pelo usuário)
- Nenhuma credencial ou token é exposto no frontend ou no código-fonte do projeto

### 3. Camada de Serviço
- `DriveService`: Gerencia a interação com a API do Google Drive
  - Acesso restrito apenas para leitura (`DriveReadonlyScope`)
  - Conexão com pasta específica via ID armazenado em variável de ambiente
  - Validação e verificação de erros em todas as operações

### 4. Camada de Controlador (Handler)
- `ImageHandler`: Gerencia as requisições HTTP relacionadas às imagens
  - `/galeria`: Renderiza a página HTML da galeria
  - `/api/images`: Retorna a lista de imagens da pasta do Drive
  - `/api/images/{id}/url`: Gera URLs temporárias e seguras para visualização das imagens

### 5. Frontend
- JavaScript moderno para carregamento assíncrono das imagens
- Exibição de thumbnails para melhor performance
- Carregamento de imagens completas apenas ao clicar
- Feedback visual ao usuário durante carregamento
- Tratamento adequado de erros

## Fluxo de Dados

1. O usuário acessa a rota `/galeria` do site
2. O servidor retorna a página HTML com JavaScript
3. O JavaScript faz uma requisição AJAX para `/api/images`
4. O servidor autentica com o Google Drive usando o token armazenado localmente
5. O servidor busca a lista de imagens da pasta configurada
6. O servidor retorna os metadados das imagens (sem as URLs diretas)
7. O JavaScript renderiza a galeria com thumbnails
8. Quando o usuário clica em uma imagem, o JavaScript faz uma requisição para `/api/images/{id}/url`
9. O servidor gera uma URL temporária para a imagem específica
10. O JavaScript exibe a imagem em um modal

## Medidas de Segurança Implementadas

### Princípio do Privilégio Mínimo
- Acesso restrito apenas para leitura das imagens
- Limitação a uma pasta específica do Drive
- Sem acesso a outros dados do usuário

### Proteção de Credenciais
- Arquivos de credenciais armazenados fora do diretório publicado
- Arquivos protegidos com permissões restritas
- Inclusão no .gitignore para evitar exposição acidental

### Gerenciamento de Tokens
- Tokens armazenados localmente com segurança
- Regeneração manual de tokens (sem auto-refresh no servidor)
- Ferramenta dedicada para geração inicial do token

### Proteção contra Ataques
- Validação de entradas em todas as rotas
- Timeouts para evitar ataques de negação de serviço
- Headers de cache apropriados para evitar requisições desnecessárias

## Configuração e Manutenção

### Variáveis de Ambiente
- `GOOGLE_DRIVE_FOLDER_ID`: ID da pasta do Drive contendo as imagens
- `CONFIG_DIR`: Diretório onde os arquivos de configuração estão armazenados

### Arquivos de Configuração
- `credentials.json`: Credenciais OAuth2 para o Google Drive
- `token.json`: Token de acesso gerado pela ferramenta de configuração

### Processo de Renovação do Token
Quando o token expirar, siga os passos:

1. Execute a ferramenta de configuração:
   ```
   go run cmd/tools/setup_auth.go ./config/credentials.json
   ```
2. Siga as instruções para autorizar novamente e gerar um novo token

## Considerações Finais

Esta implementação prioriza a segurança das credenciais e dos dados do Google Drive, enquanto oferece uma experiência fluida ao usuário final. O código foi estruturado seguindo boas práticas de separação de responsabilidades e manutenibilidade.

O uso de variáveis de ambiente e arquivos de configuração externos permite uma fácil migração entre ambientes de desenvolvimento, homologação e produção, sem comprometer a segurança das credenciais. 