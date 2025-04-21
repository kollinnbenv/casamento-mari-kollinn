# Guia de Deployment

Este documento descreve como realizar o deployment da aplicação utilizando Docker, com ênfase na configuração segura da integração com o Google Drive.

## Requisitos

- Docker instalado
- Credenciais do Google Drive já configuradas (ver README.md)
- ID da pasta do Google Drive

## Construindo a Imagem Docker

```bash
docker build -t casamento-app .
```

## Configurando Arquivos Sensíveis

Para que a integração com o Google Drive funcione, você precisa fornecer os arquivos de credenciais e token. Existem três opções:

### Opção 1: Volumes Docker (Desenvolvimento)

```bash
docker run -p 3000:3000 \
  -e GOOGLE_DRIVE_FOLDER_ID=seu_id_da_pasta \
  -v $(pwd)/config:/app/config \
  casamento-app
```

### Opção 2: Copiar Arquivos para Imagem Personalizada (Não recomendado para produção)

Crie um Dockerfile personalizado:

```dockerfile
FROM casamento-app

COPY ./config/credentials.json /app/config/
COPY ./config/token.json /app/config/

ENV GOOGLE_DRIVE_FOLDER_ID=seu_id_da_pasta
```

### Opção 3: Usando Secrets (Recomendado para produção)

#### Para Kubernetes

1. Crie secrets para os arquivos sensíveis:

```bash
kubectl create secret generic drive-credentials \
  --from-file=credentials.json=./config/credentials.json \
  --from-file=token.json=./config/token.json
```

2. Configure o deployment para montar os secrets:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: casamento-app
spec:
  template:
    spec:
      containers:
      - name: casamento-app
        image: casamento-app
        env:
        - name: GOOGLE_DRIVE_FOLDER_ID
          valueFrom:
            secretKeyRef:
              name: drive-env
              key: folder-id
        volumeMounts:
        - name: drive-credentials
          mountPath: "/app/config"
          readOnly: true
      volumes:
      - name: drive-credentials
        secret:
          secretName: drive-credentials
```

#### Para Docker Swarm

```bash
# Crie os secrets
docker secret create credentials.json ./config/credentials.json
docker secret create token.json ./config/token.json

# Deploy com secrets
docker service create \
  --name casamento-app \
  --secret credentials.json \
  --secret token.json \
  --env GOOGLE_DRIVE_FOLDER_ID=seu_id_da_pasta \
  --publish 3000:3000 \
  casamento-app
```

## Deployment na Render

Para fazer deploy na Render com suporte ao Google Drive:

1. Adicione seus arquivos `credentials.json` e `token.json` como Secret Files na Render
2. Configure as variáveis de ambiente:
   - `GOOGLE_DRIVE_FOLDER_ID`: ID da pasta do Drive
   - `CONFIG_DIR`: `/etc/secrets` (onde a Render monta os Secret Files)

## Renovação de Tokens

O token do Google Drive pode expirar. Em ambientes de produção, você possui algumas opções:

1. **Renovação manual**: Gere um novo token localmente e atualize-o no ambiente de produção
2. **Renovação programada**: Implemente um cronjob que renova o token automaticamente (requer lógica adicional)

## Segurança Adicional

Considere as seguintes medidas de segurança:

1. Sempre use HTTPS em produção
2. Restrinja o acesso aos arquivos de configuração
3. Use redes privadas para comunicação entre containers
4. Implemente rate limiting para as rotas de API
5. Monitore o acesso às imagens do Drive 