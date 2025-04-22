# Arquitetura de Integração de API 

Este documento explica a arquitetura de integração da API do Google Drive implementada no projeto, incluindo os padrões de design, medidas de segurança e otimizações de desempenho.

## Visão Geral da Arquitetura

A aplicação implementa uma arquitetura limpa em três camadas para integração com a API do Google Drive:

1. **Camada de Modelo (Model)**: Define as estruturas de dados utilizadas na aplicação
2. **Camada de Serviço (Service)**: Contém a lógica de negócios e interação com APIs externas
3. **Camada de Handler (Controller)**: Gerencia as requisições HTTP e respostas

```
┌─────────────┐     ┌──────────────┐     ┌───────────────┐     ┌─────────────┐
│   Cliente   │ ──► │   Handler    │ ──► │    Service    │ ──► │ Google Drive │
│  (Browser)  │ ◄── │  (Endpoints) │ ◄── │ (Drive Logic) │ ◄── │     API     │
└─────────────┘     └──────────────┘     └───────────────┘     └─────────────┘
```

## Implementação da Integração com Google Drive

### Autenticação e Autorização

A aplicação utiliza o fluxo OAuth2 para autenticação com o Google Drive API:

1. Credenciais OAuth2 são armazenadas no arquivo `config/credentials.json`
2. Um token de acesso é gerado através de uma aplicação auxiliar e armazenado em `config/token.json`
3. O token é utilizado para autenticar as requisições à API do Google Drive
4. O escopo da autenticação é limitado a leitura, não permitindo modificações no Drive (`drive.DriveReadonlyScope`)

O processo de autorização é realizado através de uma ferramenta separada, o que aumenta a segurança ao não implementar a lógica de refresh de tokens no servidor principal.

### Segurança

A aplicação implementa várias práticas de segurança:

1. **Princípio do Privilégio Mínimo**: 
   - Acesso apenas de leitura às imagens
   - Limitação a uma pasta específica configurada via variável de ambiente

2. **Proteção de Credenciais**:
   - Arquivos sensíveis (credentials.json e token.json) armazenados fora do diretório público
   - Variáveis de ambiente para configurações sensíveis
   - Inclusão de arquivos sensíveis no .gitignore

3. **Isolamento**:
   - Clientes nunca acessam diretamente o Google Drive
   - A aplicação atua como proxy, validando todas as requisições

4. **Validação e Sanitização**:
   - Todas as entradas do usuário são validadas
   - IDs de imagens são validados antes de serem usados

### Otimizações de Performance

A aplicação utiliza diversas estratégias para otimizar o desempenho:

1. **Cache em Memória**:
   - Lista de imagens armazenada em cache no servidor
   - URLs temporárias são cacheadas com tempo de expiração
   - Cache multi-nível (dados do Drive e URLs geradas)

2. **Carregamento Antecipado (Prefetching)**:
   - Lista de imagens é pré-carregada em uma goroutine quando o servidor inicia
   - Evita atrasos na primeira requisição do usuário

3. **Headers de Cache HTTP**:
   - Implementação apropriada de headers de cache nas respostas
   - Cache-Control configurado para recursos estáticos e dinâmicos

4. **Otimização de Rede**:
   - Uso de thumbnails para visualização prévia, reduzindo a quantidade de dados transferidos
   - Carregamento das imagens em alta resolução apenas quando necessário

## Fluxo de Dados

### Listar Imagens

```
┌─────────┐     ┌────────────┐     ┌────────────┐     ┌────────────┐
│ Cliente │ ──► │ ImageHandler │ ──► │ DriveService │ ──► │ Google Drive │
│         │ ◄── │   /images   │ ◄── │  GetImages   │ ◄── │     API     │
└─────────┘     └────────────┘     └────────────┘     └────────────┘
                      │                  │
                      ▼                  ▼
                ┌─────────────┐    ┌─────────────┐
                │  Response   │    │    Cache    │
                │    Cache    │    │   Images    │
                └─────────────┘    └─────────────┘
```

1. O cliente faz uma requisição GET para `/api/images`
2. O `ImageHandler` verifica se existe um cache válido da resposta
3. Se não houver cache válido, ele solicita as imagens ao `DriveService`
4. O `DriveService` verifica se as imagens já estão em cache na memória
5. Se não estiverem em cache, ele faz uma requisição ao Google Drive API
6. A resposta é armazenada em cache no `DriveService` e no `ImageHandler`
7. Os metadados das imagens são retornados ao cliente

### Obter URL da Imagem

```
┌─────────┐     ┌─────────────────┐     ┌───────────────────┐     ┌────────────┐
│ Cliente │ ──► │   ImageHandler  │ ──► │   DriveService    │ ──► │ Google Drive │
│         │ ◄── │ /images/{id}/url │ ◄── │ GenerateAccessURL │ ◄── │     API     │
└─────────┘     └─────────────────┘     └───────────────────┘     └────────────┘
                                               │
                                               ▼
                                        ┌─────────────┐
                                        │    Cache    │
                                        │     URL     │
                                        └─────────────┘
```

1. O cliente faz uma requisição GET para `/api/images/{id}/url`
2. O `ImageHandler` valida o ID da imagem
3. O `ImageHandler` solicita a URL de acesso ao `DriveService`
4. O `DriveService` verifica se a URL está em cache e válida
5. Se não houver cache válido, ele gera uma nova URL de acesso via Google Drive API
6. A URL é armazenada em cache com um tempo de expiração
7. A URL é retornada ao cliente

## Considerações sobre Design

A arquitetura foi projetada para:

1. **Manutenibilidade**: Separação clara de responsabilidades entre os componentes
2. **Escalabilidade**: Cache em múltiplos níveis para reduzir requisições à API externa
3. **Segurança**: Isolamento entre o cliente e a API do Google Drive
4. **Performance**: Otimizações para reduzir tempos de resposta e uso de banda

## Decisões Técnicas

1. **Uso de Go**: Escolhido pela sua excelente performance em aplicações de servidor, suporte nativo a concorrência e excelente biblioteca padrão
2. **Gorilla Mux**: Utilizado para roteamento HTTP devido à sua flexibilidade e recursos avançados
3. **Cache em Memória**: Preferido sobre soluções externas como Redis para simplificar o deployment
4. **Acesso Direto às Imagens**: Para imagens públicas, optamos por gerar URLs diretas do Google Drive em vez de proxy, balanceando performance e simplicidade 