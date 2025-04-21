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
        console.log("Dados recebidos da API:", data);
        console.log("Número de imagens recebidas:", data.length);
        
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
            console.log(`Processando imagem ${index}:`, image);
            
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
        
        // Função para carregar imagens em lotes para evitar sobrecarregar o servidor
        async function loadImagesInBatches(elements, batchSize = 4, delay = 1000) {
            // Dividir elementos em lotes
            for (let i = 0; i < elements.length; i += batchSize) {
                const batch = elements.slice(i, i + batchSize);
                
                // Carregar lote atual
                const promises = batch.map(item => loadSingleImage(item));
                await Promise.allSettled(promises);
                
                // Esperar antes de carregar o próximo lote (se não for o último)
                if (i + batchSize < elements.length) {
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }
        
        // Função para carregar uma única imagem com retry usando algoritmo do Google
        async function loadSingleImage({element, imageId, index, alt, imageData}) {
            // Adiciona um placeholder enquanto carrega
            element.innerHTML = '<p>Carregando...</p>';
            
            try {
                // Encapsula toda a lógica de carregamento da imagem em uma função para usar com backoff
                await exponentialBackoff(async () => {
                    // Cria a tag de imagem
                    const img = document.createElement('img');
                    
                    // URL direta para o Google Drive
                    img.src = `https://lh3.googleusercontent.com/d/${imageId}?cb=${Date.now()}`;
                    img.alt = alt;
                    
                    // Retorna uma promessa que resolve quando a imagem carrega ou rejeita em erro
                    return new Promise((resolve, reject) => {
                        img.onload = () => {
                            // Limpa conteúdo atual e adiciona a imagem
                            element.innerHTML = '';
                            
                            // Ao clicar na imagem, abre o modal
                            img.onclick = () => {
                                openModal(imageId);
                            };
                            
                            element.appendChild(img);
                            resolve();
                        };
                        
                        img.onerror = (error) => {
                            console.error(`Erro ao carregar imagem ${index}:`, error);
                            reject(error);
                        };
                    });
                });
            } catch (error) {
                // Se todas as tentativas falharam após backoff exponencial
                console.error(`Erro fatal ao carregar imagem ${index} após várias tentativas:`, error);
                element.innerHTML = '<p>Imagem indisponível</p>';
            }
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

function openModal(imageId) {
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
    
    // Carrega a imagem do modal com backoff exponencial
    (async () => {
        try {
            await exponentialBackoff(async () => {
                return new Promise((resolve, reject) => {
                    // URL direta com parâmetro anti-cache
                    modalImg.src = `https://lh3.googleusercontent.com/d/${imageId}?cb=${Date.now()}`;
                    
                    modalImg.onload = () => {
                        resolve();
                    };
                    
                    modalImg.onerror = (error) => {
                        console.error(`Erro ao carregar imagem modal ${imageId}:`, error);
                        reject(error);
                    };
                });
            });
            
            // Imagem carregada com sucesso após possíveis retentativas
            const modalLoader = document.getElementById('modal-loader');
            if (modalLoader) modalLoader.remove();
            modalImg.style.display = "block";
            
        } catch (error) {
            // Todas as tentativas falharam
            console.error(`Falha ao carregar imagem modal ${imageId} após múltiplas tentativas`);
            
            // Remove o loader
            const modalLoader = document.getElementById('modal-loader');
            if (modalLoader) modalLoader.remove();
            
            // Mostra mensagem de erro
            const errorMsg = document.createElement('p');
            errorMsg.innerText = "Não foi possível carregar a imagem. Tente novamente mais tarde.";
            errorMsg.style.color = "white";
            errorMsg.style.textAlign = "center";
            errorMsg.style.padding = "20px";
            errorMsg.style.position = "relative";
            errorMsg.style.top = "50%";
            errorMsg.style.transform = "translateY(-50%)";
            modal.appendChild(errorMsg);
        }
    })();
    
    // Configura o fechamento do modal ao clicar fora da imagem
    modal.onclick = function(event) {
        if (event.target === modal) {
            closeModal();
        }
    };
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

// Função para aplicar espera exponencial conforme documentação Google
// Implementada diretamente das recomendações em: 
// https://developers.google.com/workspace/drive/labels/limits?hl=pt_BR
async function exponentialBackoff(retryFunction, maxRetries = 5) {
    let retryCount = 0;
    const maxBackoff = 64000; // 64 segundos em milissegundos (valor recomendado pelo Google)
    
    while (retryCount < maxRetries) {
        try {
            return await retryFunction();
        } catch (error) {
            retryCount++;
            
            if (retryCount >= maxRetries) {
                throw error; // Desiste após número máximo de tentativas
            }
            
            // Cálculo do tempo de espera: min(((2^n)+random_number_milliseconds), maximum_backoff)
            const randomMs = Math.floor(Math.random() * 1000); // Valor aleatório até 1000ms
            const waitTime = Math.min(((Math.pow(2, retryCount) * 1000) + randomMs), maxBackoff);
            
            console.log(`Tentativa ${retryCount} falhou. Aguardando ${waitTime}ms antes de tentar novamente...`);
            
            // Espera o tempo calculado
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
    }
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