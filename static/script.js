// ---------------------------------------------------------------------
// Menu principal sempre visível (sem validação por telefone)
// ---------------------------------------------------------------------
function exibirMenu(isVisible) {
  const mainMenu = document.getElementById('mainMenu');
  if (mainMenu) {
    mainMenu.style.display = isVisible ? 'block' : 'none';
  }
}

// ---------------------------------------------------------------------
// Ao carregar a página, sempre exibe o menu
// ---------------------------------------------------------------------
window.addEventListener('DOMContentLoaded', () => {
  exibirMenu(true);  // Menu sempre visível
});

// ---------------------------------------------------------------------
// Função para navegar para outra página (sem validação)
// ---------------------------------------------------------------------
function validarAcesso(page) {
  window.location.href = page;
}

// ---------------------------------------------------------------------
// Função simples de navegação
// ---------------------------------------------------------------------
function goToPage(page) {
  window.location.href = page;
}

// ---------------------------------------------------------------------
// Ao carregar a página "confirmar.html", criamos o formulário dinâmico
// ---------------------------------------------------------------------
function criarFormularioDinamico() {
  const formDinamico = document.getElementById('formDinamico');
  if (!formDinamico) return; // Se não está na página confirmar.html, sai

  // Gera um formulário com campos para um convidado
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

// ---------------------------------------------------------------------
// Função para enviar as respostas do formulário
// ---------------------------------------------------------------------
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

// ---------------------------------------------------------------------
// Chama a função de criação do formulário dinâmico quando a página carrega
// ---------------------------------------------------------------------
window.addEventListener('DOMContentLoaded', criarFormularioDinamico);

// ---------------------------------------------------------------------
// Funções para galeria de imagens
// ---------------------------------------------------------------------
function openModal(src) {
  // Mostra o modal
  const modal = document.getElementById('myModal');
  if (modal) {
    const modalImg = document.getElementById('modalImg');
    modal.style.display = "block";
    modalImg.src = src;
  }
}

function closeModal() {
  // Fecha o modal
  const modal = document.getElementById('myModal');
  if (modal) {
    modal.style.display = "none";
  }
}
  