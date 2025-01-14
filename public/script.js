// ---------------------------------------------------------------------
// Exibe ou oculta o menu principal
// ---------------------------------------------------------------------
function exibirMenu(isVisible) {
    const mainMenu = document.getElementById('mainMenu');
    if (mainMenu) {
      mainMenu.style.display = isVisible ? 'block' : 'none';
    }
  }
  
  function formatarTelefoneParaDB(input) {
    // Remove tudo que não seja dígito
    const apenasDigitos = input.replace(/\D/g, '');
  
    // Se tiver 11 dígitos (DDD + 9 dígitos)
    // Exemplo: 48996790679 -> "48 99679-0679"
    if (apenasDigitos.length === 11) {
      const ddd = apenasDigitos.slice(0, 2);
      const parte1 = apenasDigitos.slice(2, 7);
      const parte2 = apenasDigitos.slice(7);
      return `${ddd} ${parte1}-${parte2}`;
    }
  
    // Se tiver 10 dígitos (DDD + 8 dígitos)
    // Exemplo: 4832223333 -> "48 3222-3333"
    if (apenasDigitos.length === 10) {
      const ddd = apenasDigitos.slice(0, 2);
      const parte1 = apenasDigitos.slice(2, 6);
      const parte2 = apenasDigitos.slice(6);
      return `${ddd} ${parte1}-${parte2}`;
    }
  
    // Se não for 10 ou 11 dígitos, devolve como está
    // (ou pode exibir mensagem de erro/alert para o usuário)
    return input;
  }

  

  // ---------------------------------------------------------------------
  // Ao carregar a página, checa se há telefone no localStorage e exibe menu
  // ---------------------------------------------------------------------
  window.addEventListener('DOMContentLoaded', () => {
    const phone = localStorage.getItem('phone');
    exibirMenu(!!phone);  // se existir phone, true => exibe menu
  });
  
  // ---------------------------------------------------------------------
  // Função para navegar para outra página, verificando se o telefone existe
  // ---------------------------------------------------------------------
  function validarAcesso(page) {
    const phone = localStorage.getItem('phone');
    if (!phone) {
      alert('Por favor, insira seu telefone para ter acesso às outras páginas.');
      return;
    }
    window.location.href = page;
  }
  
  // ---------------------------------------------------------------------
  // Função simples de navegação (sem validação de telefone)
  // ---------------------------------------------------------------------
  function goToPage(page) {
    window.location.href = page;
  }
  
  // ---------------------------------------------------------------------
  // Validação de telefone - chamada à rota /api/validate-phone
  // ---------------------------------------------------------------------
  async function validarTelefone() {
    const phoneInput = document.getElementById('phone');
    const phoneValidationMsg = document.getElementById('phone-validation-msg');
    const phone = formatarTelefoneParaDB(phoneInput.value);

    if (!phone) {
        phoneValidationMsg.textContent = 'Digite um número de telefone.';
        phoneValidationMsg.style.color = 'red';
        return;
    }

    try {
        const response = await fetch(`/api/validate-phone?phone=${encodeURIComponent(phone)}`);
        const data = await response.json();

        if (data.valid) {
            // Salvar telefone no localStorage
            localStorage.setItem('phone', phone);

            // Buscar nomes dos convidados
            const convidadosResponse = await fetch(`/api/convidados?phone=${encodeURIComponent(phone)}`);
            const convidadosData = await convidadosResponse.json();

            if (convidadosData.convidados) {
                const nomesConvidados = convidadosData.convidados.join(', ');

                // Exibir mensagem de sucesso com os nomes
                phoneValidationMsg.innerHTML = `
                    <p style="color: blue;">Conectado! Você é o convidado: <strong>${nomesConvidados}</strong>.</p>
                    <p style="color: red;">Antes de confirmar presença, por favor dê atenção na página <button onclick="validarAcesso('informacoes.html')">Informações</button>.</p>
                `;
                exibirMenu(true); // Exibe o menu
            }
        } else {
            phoneValidationMsg.textContent = 'Telefone não encontrado. Tente novamente.';
            phoneValidationMsg.style.color = 'red';
            exibirMenu(false);
        }
    } catch (error) {
        console.error('Erro ao validar telefone:', error);
        phoneValidationMsg.textContent = 'Erro na validação. Tente novamente.';
        phoneValidationMsg.style.color = 'red';
        exibirMenu(false);
    }
}


// ---------------------------------------------------------------------
// Ao carregar a página "confirmar.html", criamos o formulário dinâmico
// ---------------------------------------------------------------------
async function criarFormularioDinamico() {
  const formDinamico = document.getElementById('formDinamico');
  if (!formDinamico) return; // Se não está na página confirmar.html, sai

  const phone = localStorage.getItem('phone');
  if (!phone) {
    // Se não tem phone em localStorage, redireciona para Home
    alert('Por favor, insira seu telefone antes de confirmar presença.');
    window.location.href = 'index.html';
    return;
  }

  try {
    // Busca a lista de convidados para este telefone
    const response = await fetch(`/api/convidados?phone=${encodeURIComponent(phone)}`);
    const data = await response.json();

    if (data.convidados) {
      const convidados = data.convidados;

      convidados.forEach((convidado, index) => {
        formDinamico.innerHTML += `
          <h3>Respostas para ${convidado}</h3>

          <p>Você é vegetariano/vegano?</p>
          <label>
            <input type="radio" name="vegetariano-${index}" value="Sim" required> 
            Sim
          </label>
          <label>
            <input type="radio" name="vegetariano-${index}" value="Não"> 
            Não
          </label>

          <p>Você come frutos do mar?</p>
          <label>
            <input type="radio" name="frutosDoMar-${index}" value="Sim" required> 
            Sim
          </label>
          <label>
            <input type="radio" name="frutosDoMar-${index}" value="Não"> 
            Não
          </label>

          <p>Se não come frutos do mar, prefere frango ou carne?</p>
          <select name="preferencia-${index}">
            <option value="Frango">Frango</option>
            <option value="Carne">Carne</option>
          </select>
        `;
      });
    }
  } catch (error) {
    console.error('Erro ao buscar convidados:', error);
    formDinamico.innerHTML = '<p>Erro ao carregar formulário. Tente novamente.</p>';
  }
}

// ---------------------------------------------------------------------
// Função para enviar as respostas do formulário e receber o link do WhatsApp
// ---------------------------------------------------------------------
async function enviarFormulario() {
  const phone = localStorage.getItem('phone');
  if (!phone) {
    alert('Não foi possível identificar o telefone.');
    return;
  }

  // Para cada convidado (índice), coletar as respostas
  // Precisamos primeiro buscar quantos convidados existem
  let numConvidados = 0;
  try {
    const response = await fetch(`/api/convidados?phone=${encodeURIComponent(phone)}`);
    const data = await response.json();
    if (data.convidados) {
      numConvidados = data.convidados.length;
    }
  } catch (error) {
    console.error('Erro ao buscar número de convidados:', error);
    return;
  }

  const respostas = [];
  for (let i = 0; i < numConvidados; i++) {
    const vegetariano = document.querySelector(`input[name="vegetariano-${i}"]:checked`);
    const frutosDoMar = document.querySelector(`input[name="frutosDoMar-${i}"]:checked`);
    const preferenciaSelect = document.querySelector(`select[name="preferencia-${i}"]`);

    respostas.push({
      vegetariano: vegetariano ? vegetariano.value : '',
      frutosDoMar: frutosDoMar ? frutosDoMar.value : '',
      preferencia: preferenciaSelect ? preferenciaSelect.value : ''
    });
  }

  // Envia para a rota /api/confirmar
  try {
    const response = await fetch('/api/confirmar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, respostas })
    });
    const result = await response.json();

    if (result.sucesso) {
      // Exibe o botão/Link do WhatsApp
      const resultadoEnvio = document.getElementById('resultadoEnvio');
      resultadoEnvio.innerHTML = `
        <a href="${result.link}" target="_blank">
          <button>Enviar Respostas via WhatsApp</button>
        </a>
      `;
    } else {
      alert('Ocorreu um erro ao enviar o formulário.');
    }
  } catch (error) {
    console.error('Erro ao enviar formulário:', error);
    alert('Erro ao enviar formulário. Tente novamente.');
  }
}

// ---------------------------------------------------------------------
// Chama a função de criação do formulário dinâmico quando a página carrega
// ---------------------------------------------------------------------
window.addEventListener('DOMContentLoaded', criarFormularioDinamico);


// galeria de imagem 
function openModal(src) {
    // Mostra o modal
    const modal = document.getElementById('myModal');
    modal.style.display = 'flex';  // usa 'flex' ou 'block', tanto faz, contanto que apareça
  
    // Muda a imagem do modal para a imagem clicada
    const modalImg = document.getElementById('modalImg');
    modalImg.src = src;
  }
  
  function closeModal() {
    // Fecha o modal
    const modal = document.getElementById('myModal');
    modal.style.display = 'none';
  }
  
  // Fechar o modal ao clicar em qualquer área fora da imagem (opcional)
  window.addEventListener('click', (event) => {
    const modal = document.getElementById('myModal');
    const modalImg = document.getElementById('modalImg');
    if (event.target === modalImg) {
      // se quiser, pode impedir fechar ao clicar na imagem
      return;
    }
    if (event.target === modal) {
      modal.style.display = 'none';
    }
  });
  