# Configuração e Contribuição

Este documento fornece instruções detalhadas para configurar o ambiente de desenvolvimento e contribuir com o projeto.

## Pré-requisitos

- [Go](https://golang.org/dl/) (versão 1.18 ou superior)
- [Git](https://git-scm.com/downloads)
- [Docker](https://www.docker.com/get-started) (opcional, para deployment)
- Conta no Google Cloud Platform (para integração com Google Drive)

## Configuração do Ambiente

### 1. Clonar o Repositório

```bash
git clone https://github.com/kollinn/casamento-mari-kollinn.git
cd casamento-mari-kollinn
```

### 2. Instalar Dependências

O projeto utiliza Go Modules para gerenciamento de dependências. Execute:

```bash
go mod download
```

### 3. Configurar a Integração com Google Drive

#### 3.1. Criar Projeto no Google Cloud

1. Acesse o [Console do Google Cloud](https://console.cloud.google.com/)
2. Crie um novo projeto
3. Ative a API do Google Drive para o projeto

#### 3.2. Obter Credenciais

1. No console do Google Cloud, vá para "APIs e Serviços" > "Credenciais"
2. Clique em "Criar Credenciais" > "ID do Cliente OAuth"
3. Configure como "Aplicativo de Desktop"
4. Faça o download do arquivo JSON de credenciais

#### 3.3. Configurar Arquivos Locais

1. Crie uma pasta `config` na raiz do projeto:
   ```bash
   mkdir -p config
   ```
2. Copie o arquivo de credenciais para a pasta:
   ```bash
   cp caminho/para/seu/arquivo-baixado.json config/credentials.json
   ```
3. Crie um arquivo `.env` na raiz do projeto:
   ```bash
   echo "GOOGLE_DRIVE_FOLDER_ID=seu_id_da_pasta_do_drive" > .env
   echo "CONFIG_DIR=./config" >> .env
   ```

   > Nota: Substitua `seu_id_da_pasta_do_drive` pelo ID da pasta no Google Drive onde suas fotos estão armazenadas. O ID pode ser encontrado na URL quando você abre a pasta no Google Drive.

#### 3.4. Gerar Token de Acesso

Execute a ferramenta de autenticação para gerar o token de acesso:

```bash
go run cmd/tools/setup_auth.go ./config/credentials.json
```

Siga as instruções exibidas no terminal:
1. Acesse a URL fornecida em seu navegador
2. Faça login com sua conta Google
3. Autorize o acesso solicitado
4. Copie o código de autorização
5. Cole o código no terminal

Um arquivo `token.json` será criado na pasta `config/`.

### 4. Executar o Servidor em Modo de Desenvolvimento

```bash
go run cmd/server/main.go
```

O servidor estará disponível em: http://localhost:3000

## Estrutura do Projeto

```
casamento-mari-kollinn/
├── cmd/                   # Pontos de entrada da aplicação
│   ├── server/            # Servidor principal
│   └── tools/             # Ferramentas de suporte
├── config/                # Arquivos de configuração (não versionados)
├── docs/                  # Documentação
├── internal/              # Código privado da aplicação
│   ├── handler/           # Handlers de requisições HTTP
│   ├── model/             # Modelos de dados
│   ├── repository/        # Acesso a dados (opcional)
│   └── service/           # Serviços e lógica de negócios
├── static/                # Arquivos estáticos (CSS, JS, HTML)
├── .dockerignore          # Arquivos ignorados no build Docker
├── .env                   # Variáveis de ambiente (local)
├── .gitignore             # Arquivos ignorados pelo Git
├── Dockerfile             # Configuração para build de imagem Docker
├── go.mod                 # Definição de módulo Go e dependências
└── README.md              # Documentação principal
```

## Fluxo de Desenvolvimento

### Branches

Recomendamos o seguinte padrão para branches:

- `main`: Código de produção
- `feature/nome-da-feature`: Para novas funcionalidades
- `fix/descricao-do-bug`: Para correção de bugs
- `docs/descricao`: Para atualizações de documentação

### Processo de Commit

1. Crie uma branch a partir de `main`:
   ```bash
   git checkout -b feature/sua-feature
   ```

2. Faça suas alterações e commits:
   ```bash
   git add .
   git commit -m "feat: descrição clara da alteração"
   ```

3. Envie a branch para o repositório remoto:
   ```bash
   git push origin feature/sua-feature
   ```

4. Abra um Pull Request para a branch `main`

### Convenções de Commit

Utilizamos o padrão [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` Nova funcionalidade
- `fix:` Correção de bug
- `docs:` Alterações na documentação
- `style:` Formatação, ponto-e-vírgula faltando; sem alteração de código
- `refactor:` Refatoração de código
- `test:` Adição ou correção de testes
- `chore:` Atualizações de tarefas de build, configurações, etc.

## Testes

### Executar Testes Unitários

```bash
go test ./...
```

### Testes de Integração

```bash
go test -tags=integration ./...
```

## Build e Deployment

### Build Local

Para compilar o projeto localmente:

```bash
go build -o casamento-app ./cmd/server
```

### Usando Docker

Para construir uma imagem Docker:

```bash
docker build -t casamento-app .
```

Para executar a imagem:

```bash
docker run -p 3000:3000 \
  -e GOOGLE_DRIVE_FOLDER_ID=seu_id_da_pasta \
  -v $(pwd)/config:/app/config \
  casamento-app
```

## Considerações para Contribuição

### Antes de Enviar um Pull Request

1. Certifique-se de que seu código segue o estilo do projeto
2. Execute os testes e verifique se estão passando
3. Atualize a documentação, se necessário
4. Descreva suas alterações no PR de forma clara e objetiva

### Diretrizes de Código

- Utilize nomes significativos para variáveis e funções
- Adicione comentários quando necessário, especialmente em código complexo
- Siga o padrão de tratamento de erros do Go (retorne erros, não use panic)
- Mantenha funções pequenas e com responsabilidade única
- Use interfaces para desacoplar componentes

## Resolução de Problemas

### Erros Comuns

1. **Erro de permissão no Google Drive**
   - Verifique se o token.json está atualizado
   - Execute novamente a ferramenta de autenticação

2. **Imagens não aparecem na galeria**
   - Confirme se o ID da pasta do Drive está correto
   - Verifique se a pasta contém imagens
   - Confira as permissões de compartilhamento da pasta

3. **Erro ao compilar**
   - Execute `go mod tidy` para atualizar dependências
   - Verifique se você está usando a versão correta do Go 