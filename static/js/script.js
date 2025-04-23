async function loadImages() {
    console.log("Iniciando carregamento das imagens");
    
    // Elementos da galeria
    const loadingElement = document.getElementById('loading');
    const errorElement = document.getElementById('error');
    const galleryContainer = document.getElementById('gallery-container');
    
    if (!galleryContainer) {
        console.error("Container da galeria não encontrado");
        return;
    }
    
    loadingElement.style.display = 'block';
    errorElement.style.display = 'none';
    galleryContainer.innerHTML = '';
    
    try {
        // Fazendo requisição para a API
        console.log("Requisitando imagens da API...");
        const response = await fetch('/api/images');
        console.log("Resposta da API:", response.status, response.statusText);
        
        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }
        
        // Convertendo resposta para JSON
        const data = await response.json();
        console.log(`Recebidas ${data.length} imagens da API`);
        
        // Esconde o loader
        loadingElement.style.display = 'none';
        
        // Se não houver imagens, mostra mensagem
        if (!data || data.length === 0) {
            errorElement.textContent = "Nenhuma imagem encontrada.";
            errorElement.style.display = 'block';
            return;
        }
        
        // Cria todos os contêineres primeiro, depois carrega as imagens em lotes
        const imageElements = [];
        
        // Renderiza cada imagem na galeria
        data.forEach((image, index) => {
            console.log(`Processando metadados da imagem ${index}:`, image);
            
            // Cria container da imagem
            const imgElement = document.createElement('div');
            imgElement.className = 'gallery-item';
            
            // Extrai o ID da imagem (diretamente ou do WebViewLink)
            let imageId = image.ID || image.id;
            
            // Se não tiver ID direto, tenta extrair do WebViewLink
            if (!imageId && image.WebViewLink) {
                // Extrai o ID do WebViewLink usando regex para encontrar o ID na URL
                const matches = image.WebViewLink.match(/\/d\/([^\/]+)/);
                if (matches && matches[1]) {
                    imageId = matches[1];
                }
            }
            
            if (!imageId) {
                console.error(`Imagem ${index} sem ID válido:`, image);
                imgElement.innerHTML = '<p>Imagem indisponível</p>';
                galleryContainer.appendChild(imgElement);
                return;
            }
            
            // Adiciona um placeholder para a imagem
            imgElement.innerHTML = '<p>Carregando...</p>';
            galleryContainer.appendChild(imgElement);
            
            // Armazena os dados para carregar mais tarde
            imageElements.push({
                element: imgElement,
                imageId,
                index,
                alt: image.Name || image.name || `Imagem ${index}`,
                imageData: image
            });
        });
        
        // Função para criar timestamp
        function getTimestamp() {
            const now = new Date();
            return `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}.${now.getMilliseconds()}`;
        }
        
        // Função para obter o thumbnailLink independente do formato de nome de propriedade
        function getThumbnailLink(imageData) {
            if (!imageData) return null;
            
            // Tenta diferentes formatos de propriedade que podem estar presentes nos dados da imagem
            return imageData.ThumbnailLink || imageData.thumbnailLink || imageData.Thumbnaillink || imageData.thumbnaillink;
        }
        
        // Função para extrair o ID da imagem de uma URL
        function extractImageId(url) {
            if (!url) return null;
            
            // Para URLs de drive-storage
            if (url.includes('drive-storage')) {
                const match = url.match(/drive-storage\/([^\/=]+)/);
                if (match && match[1]) return match[1];
            }
            
            // Para URLs diretas do Google Drive
            const driveMatch = url.match(/\/d\/([^\/]+)/);
            if (driveMatch && driveMatch[1]) return driveMatch[1];
            
            return null;
        }
        
        // Função para criar URL do proxy local
        function createProxyUrl(imageData) {
            if (!imageData) return null;
            
            const imageId = imageData.ID || imageData.id;
            if (imageId) {
                // Usa o proxy local para esta imagem
                return `/api/images/${imageId}/proxy`;
            }
            
            return null;
        }
        
        // Função simplificada para carregar imagens
        async function loadSingleImage({element, imageId, index, alt, imageData}) {
            // Adiciona um placeholder enquanto carrega
            element.innerHTML = '<p>Carregando...</p>';
            
            try {
                // Cria a tag de imagem
                const img = document.createElement('img');
                img.alt = alt;
                
                // Usa o proxy local em vez de acessar diretamente o Google Drive
                const proxyUrl = createProxyUrl(imageData);
                
                if (proxyUrl) {
                    console.log(`Usando proxy local para imagem ${index}:`, proxyUrl);
                    img.src = proxyUrl;
                    
                    // Promessa que resolve quando a imagem carrega ou rejeita em erro
                    await new Promise((resolve, reject) => {
                        img.onload = () => {
                            // Limpa conteúdo atual e adiciona a imagem
                            element.innerHTML = '';
                            
                            // Ao clicar na imagem, abre o modal
                            img.onclick = () => {
                                openModalWithProxy(imageData);
                            };
                            
                            element.appendChild(img);
                            console.log(`Imagem ${index} carregada com sucesso`);
                            resolve();
                        };
                        
                        img.onerror = (error) => {
                            console.error(`Erro ao carregar imagem ${index}:`, error);
                            reject(error);
                        };
                    });
                } else {
                    console.warn(`Sem ID para imagem ${index}, usando placeholder`);
                    element.innerHTML = '<p>Imagem indisponível</p>';
                }
            } catch (error) {
                console.error(`Erro ao carregar imagem ${index}:`, error);
                element.innerHTML = '<p>Imagem indisponível</p>';
            }
        }
        
        // Função para abrir o modal usando proxy
        function openModalWithProxy(imageData) {
            const modal = document.getElementById('imageModal');
            const modalImg = document.getElementById('modalImg');
            
            if (!modal || !modalImg) {
                console.error("Elementos do modal não encontrados");
                return;
            }
            
            // Mostra o modal com um estado de carregamento
            modal.style.display = "block";
            modalImg.style.display = "none";
            
            // Adiciona um loader ao modal enquanto a imagem carrega
            const loader = document.createElement('div');
            loader.className = 'loader';
            loader.id = 'modal-loader';
            modal.appendChild(loader);
            
            // Obtém o ID da imagem
            const imageId = imageData.ID || imageData.id;
            
            if (imageId) {
                // URL para versão de alta resolução através do proxy
                const proxyUrlHighRes = `/api/images/${imageId}/proxy?size=large`;
                
                // Definir atributos e fonte
                modalImg.alt = imageData.Name || imageData.name || "";
                modalImg.src = proxyUrlHighRes;
                
                // Handler para quando a imagem carregar
                modalImg.onload = function() {
                    // Remove o loader
                    const modalLoader = document.getElementById('modal-loader');
                    if (modalLoader) modalLoader.remove();
                    
                    // Mostra a imagem
                    modalImg.style.display = "block";
                };
                
                // Handler para erros
                modalImg.onerror = function() {
                    // Remove o loader
                    const modalLoader = document.getElementById('modal-loader');
                    if (modalLoader) modalLoader.remove();
                    
                    // Mostra mensagem de erro
                    const errorMsg = document.createElement('p');
                    errorMsg.innerText = "Não foi possível carregar a imagem.";
                    errorMsg.style.color = "white";
                    errorMsg.style.textAlign = "center";
                    errorMsg.style.padding = "20px";
                    modal.appendChild(errorMsg);
                };
            } else {
                // Remove o loader
                const modalLoader = document.getElementById('modal-loader');
                if (modalLoader) modalLoader.remove();
                
                // Mostra mensagem de erro
                const errorMsg = document.createElement('p');
                errorMsg.innerText = "ID da imagem indisponível";
                errorMsg.style.color = "white";
                errorMsg.style.textAlign = "center";
                errorMsg.style.padding = "20px";
                modal.appendChild(errorMsg);
            }
            
            // Configura o fechamento do modal ao clicar fora da imagem
            modal.onclick = function(event) {
                if (event.target === modal) {
                    closeModal();
                }
            };
        }
        
        // Função simples para carregar imagens em lotes
        async function loadImagesInBatches(elements, batchSize = 5, delay = 500) {
            console.log(`Iniciando carregamento de imagens em lotes de ${batchSize} com delay de ${delay}ms`);
            
            // Dividir elementos em lotes
            for (let i = 0; i < elements.length; i += batchSize) {
                const batch = elements.slice(i, i + batchSize);
                console.log(`Carregando lote ${Math.floor(i/batchSize) + 1} de ${Math.ceil(elements.length/batchSize)}`);
                
                // Carregar lote atual
                const promises = batch.map(item => loadSingleImage(item));
                await Promise.allSettled(promises);
                
                // Esperar antes de carregar o próximo lote (se não for o último)
                if (i + batchSize < elements.length) {
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
            
            console.log("Carregamento em lotes concluído");
        }
        
        // Inicia o carregamento das imagens em lotes
        loadImagesInBatches(imageElements);
        
    } catch (error) {
        console.error("Erro ao carregar imagens:", error);
        loadingElement.style.display = 'none';
        errorElement.textContent = `Erro ao carregar imagens: ${error.message}`;
        errorElement.style.display = 'block';
    }
}

function closeModal() {
    const modal = document.getElementById('imageModal');
    if (modal) {
        // Remove qualquer conteúdo de erro ou loader
        const modalLoader = document.getElementById('modal-loader');
        if (modalLoader) modalLoader.remove();
        
        // Remove mensagens de erro se existirem
        const errorMessages = modal.querySelectorAll('p');
        errorMessages.forEach(msg => msg.remove());
        
        modal.style.display = "none";
    }
}

// Menu principal sempre visível (sem validação por telefone)
function exibirMenu(isVisible) {
  const mainMenu = document.getElementById('mainMenu');
  if (mainMenu) {
    mainMenu.style.display = isVisible ? 'block' : 'none';
  }
}

// Função para navegar para outra página
function goToPage(page) {
  console.log(`Função goToPage chamada com destino: ${page}`);
  window.location.href = page;
}

// Ao carregar a página "confirmar.html", criamos o formulário dinâmico
function criarFormularioDinamico() {
  const formDinamico = document.getElementById('formDinamico');
  if (!formDinamico) return;

  formDinamico.innerHTML = `
    <h3>Respostas para Convidado</h3>

    <p>Você é vegetariano/vegano?</p>
    <label>
      <input type="radio" name="vegetariano" value="Sim" required> 
      Sim
    </label>
    <label>
      <input type="radio" name="vegetariano" value="Não"> 
      Não
    </label>

    <p>Você come frutos do mar?</p>
    <label>
      <input type="radio" name="frutosDoMar" value="Sim" required> 
      Sim
    </label>
    <label>
      <input type="radio" name="frutosDoMar" value="Não"> 
      Não
    </label>

    <p>Se não come frutos do mar, prefere frango ou carne?</p>
    <select name="preferencia">
      <option value="Frango">Frango</option>
      <option value="Carne">Carne</option>
    </select>
  `;
}

// Função para enviar as respostas do formulário
function enviarFormulario() {
  const vegetariano = document.querySelector('input[name="vegetariano"]:checked');
  const frutosDoMar = document.querySelector('input[name="frutosDoMar"]:checked');
  const preferenciaSelect = document.querySelector('select[name="preferencia"]');

  if (!vegetariano || !frutosDoMar) {
    alert('Por favor, preencha todos os campos obrigatórios.');
    return;
  }

  const respostas = {
    vegetariano: vegetariano.value,
    frutosDoMar: frutosDoMar.value,
    preferencia: preferenciaSelect ? preferenciaSelect.value : ''
  };

  // Exibe mensagem de confirmação
  const resultadoEnvio = document.getElementById('resultadoEnvio');
  resultadoEnvio.innerHTML = `
    <div style="color: green; margin-top: 20px;">
      <h3>Respostas enviadas com sucesso!</h3>
      <p>Agradecemos a sua confirmação.</p>
    </div>
  `;
}

// Ao carregar a página, inicializa os componentes necessários
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM carregado, página:", window.location.pathname);
    
    // Menu sempre visível
    exibirMenu(true);
    
    // Se estiver na página da galeria, carrega as imagens
    if (window.location.pathname.includes('/galeria')) {
        console.log("Estamos na página da galeria, iniciando carregamento");
        loadImages();
        
        // Configura o botão de fechar modal
        const closeButton = document.querySelector('.close');
        if (closeButton) {
            closeButton.onclick = closeModal;
        }
    }
    
    // Se estiver na página confirmar, cria formulário
    if (window.location.pathname.includes('/confirmar')) {
        criarFormularioDinamico();
    }
    
    // Adiciona event listeners para os botões de navegação
    document.querySelectorAll('.nav-button').forEach(button => {
        button.addEventListener('click', function() {
            const href = this.getAttribute('data-href');
            if (href) {
                console.log(`Navegando para: ${href}`);
                window.location.href = href;
            }
        });
    });
}); 