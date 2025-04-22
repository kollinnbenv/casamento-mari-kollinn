# Implementação do Frontend

Este documento detalha a implementação do frontend da aplicação, incluindo a estrutura HTML, estilos CSS, funcionalidades JavaScript e considerações de responsividade.

## Estrutura da Interface

A interface do usuário é composta por cinco páginas principais:

1. **Home (/)**: Página de boas-vindas com imagem de destaque
2. **Informações (/informacoes)**: Detalhes sobre o evento
3. **Localização (/localizacao)**: Mapa e instruções de como chegar
4. **Galeria (/galeria)**: Visualização das fotos do casal
5. **Confirmação (/confirmar)**: Formulário para confirmação de presença

Todas as páginas compartilham um cabeçalho e menu de navegação consistentes, garantindo uma experiência unificada.

## Design Responsivo

O site foi desenvolvido seguindo a abordagem "mobile-first", garantindo uma experiência otimizada em todos os dispositivos:

### Principais Técnicas

1. **Media Queries**: Ajustes específicos para diferentes tamanhos de tela
   ```css
   /* Exemplo de media query para telas médias */
   @media (min-width: 768px) {
     .gallery-grid {
       grid-template-columns: repeat(3, 1fr);
     }
   }
   ```

2. **Grid e Flexbox**: Layout flexível que se adapta automaticamente
   ```css
   .gallery-grid {
     display: grid;
     grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
     gap: 1rem;
   }
   ```

3. **Unidades Relativas**: Uso de rem, %, e vh para dimensionamento proporcional
   ```css
   .container {
     width: 90%;
     max-width: 1200px;
     margin: 0 auto;
   }
   ```

4. **Imagens Responsivas**: Otimização para diferentes densidades de pixel
   ```css
   .hero-image {
     width: 100%;
     height: auto;
     max-height: 70vh;
     object-fit: cover;
   }
   ```

## Galeria de Fotos

A galeria implementa um carregamento dinâmico e eficiente das imagens do Google Drive:

### Características Principais

1. **Carregamento Assíncrono**: As imagens são carregadas via AJAX após o carregamento inicial da página
2. **Visualização em Grid**: Layout em grade que se adapta à tela do dispositivo
3. **Modal para Visualização**: Ao clicar em uma imagem, ela é exibida em tamanho ampliado
4. **Lazy Loading**: Imagens são carregadas apenas quando entram na viewport
5. **Thumbnails Otimizados**: Versões reduzidas são exibidas inicialmente para economizar banda

### Implementação do Carregamento de Imagens

```javascript
// Trecho simplificado do código de carregamento da galeria
async function loadGalleryImages() {
  try {
    showLoading();
    
    // Busca metadados das imagens
    const response = await fetch('/api/images');
    const images = await response.json();
    
    // Cria thumbnails para visualização rápida
    const gallery = document.getElementById('gallery-grid');
    images.forEach(image => {
      const imgElement = createGalleryItem(image);
      gallery.appendChild(imgElement);
      
      // Configura lazy loading
      observeElement(imgElement);
    });
    
    hideLoading();
  } catch (error) {
    showError('Não foi possível carregar as imagens');
    console.error('Erro ao carregar galeria:', error);
  }
}
```

### Modal de Visualização

O modal de visualização permite ver as imagens em tamanho maior:

```javascript
// Modal para visualização ampliada
function openImageModal(imageId) {
  const modal = document.getElementById('image-modal');
  const modalImg = document.getElementById('modal-image');
  const loader = document.getElementById('modal-loader');
  
  // Exibe loader enquanto carrega
  modalImg.style.display = 'none';
  loader.style.display = 'block';
  modal.style.display = 'flex';
  
  // Carrega imagem em alta resolução
  fetch(`/api/images/${imageId}/url`)
    .then(response => response.json())
    .then(data => {
      modalImg.src = data.url;
      modalImg.onload = () => {
        loader.style.display = 'none';
        modalImg.style.display = 'block';
      };
    })
    .catch(error => {
      console.error('Erro ao carregar imagem:', error);
      closeModal();
      showError('Erro ao carregar imagem');
    });
}
```

## Animações e Transições

Pequenas animações são utilizadas para melhorar a experiência do usuário:

1. **Transições de Hover**: Feedback visual ao passar o mouse sobre elementos clicáveis
2. **Animações de Fade**: Transições suaves ao mostrar/esconder elementos
3. **Loading Spinners**: Indicadores visuais durante carregamento de dados
4. **Transições de Página**: Efeitos sutis de transição entre páginas

```css
/* Exemplo de transição */
.gallery-item {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.gallery-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
}
```

## Otimizações de Performance

Diversas técnicas foram empregadas para garantir carregamento rápido e experiência fluida:

1. **Minificação**: CSS e JavaScript minificados para produção
2. **Lazy Loading**: Carregamento de recursos apenas quando necessário
3. **Debouncing**: Limitação de eventos em operações intensivas (como redimensionamento)
4. **Cache de Recursos**: Utilização efetiva do cache do navegador
5. **Pré-conexão**: Estabelecimento antecipado de conexões

```html
<!-- Exemplo de otimização com preconnect -->
<link rel="preconnect" href="https://drive.google.com">
```

## Acessibilidade

Implementamos práticas fundamentais de acessibilidade:

1. **Contraste Adequado**: Texto legível em relação ao fundo
2. **Alt Text**: Descrições alternativas para todas as imagens
3. **Navegação por Teclado**: Todos os elementos interativos acessíveis via teclado
4. **Aria Labels**: Atributos ARIA para melhorar a experiência com leitores de tela
5. **Textos Redimensionáveis**: Fontes que se adaptam às configurações do usuário

```html
<!-- Exemplo de botão acessível -->
<button 
  aria-label="Abrir galeria de fotos" 
  class="nav-button" 
  data-href="/galeria">
  Galeria de fotos
</button>
```

## Estratégia de Organização do JavaScript

O código JavaScript segue uma organização modular:

1. **Módulos por Funcionalidade**: Separação lógica por recursos
2. **Event Delegation**: Uso eficiente de event listeners
3. **Padrão Assíncrono**: Uso de Promises e async/await para operações assíncronas
4. **Tratamento de Erros**: Gerenciamento consistente de exceções

## Considerações de Compatibilidade

Garantimos suporte a navegadores modernos:

1. **Fallbacks**: Alternativas para funcionalidades não suportadas
2. **Feature Detection**: Verificação de suporte antes de usar recursos avançados
3. **Polyfills**: Implementações alternativas para navegadores mais antigos

## Conclusão

A implementação do frontend prioriza a experiência do usuário, com carregamento eficiente de recursos, design responsivo e interações intuitivas. A galeria de fotos, como elemento central do convite, recebeu atenção especial para garantir visualização otimizada em qualquer dispositivo. 