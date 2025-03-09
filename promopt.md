Quero que você crie uma aplicação web completa, utilizando Node.js, Express e HTML/CSS/JavaScript (ou React, caso prefira trabalhar com React). Essa aplicação deve ser responsiva, para ser utilizada em dispositivos móveis, e conter o código completo (front-end e back-end). Segue o detalhamento do que desejo:

Estrutura de dados (db.json)

Quero um arquivo db.json que contenha a seguinte estrutura:
json

{
  "convidados": {
    "-": ["Kollinn Benvenutti", "Maria da Silva"],
    "48 88888-8888": ["Ana Oliveira"],
    "48 77777-7777": ["Pedro Souza", "Carla Souza", "Paulo Santos"]
  }
}
Páginas do site e menu

O site terá quatro páginas, todas com a mesma estética (remetendo às cores das bandeiras trans e bissexual):

Home: um carrossel de fotos (que podem vir de um JSON) exibidas no centro da tela.
Informações: contendo informações do casamento (texto simples, também centralizado).
Localização: exibindo um iframe de mapa do Google Maps, já com o local do evento.
(Por exemplo:
html
<iframe
  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3535.480009606254!2d-48.45001948787135!3d-27.609646576139593!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x95273e82d45c478d%3A0x7d22b6fedb7f3c97!2sMaria%20Farinha!5e0!3m2!1spt-BR!2sbr!4v1736803513827!5m2!1spt-BR!2sbr"
  width="100%"
  height="300"
  style="border:0;"
  allowfullscreen
></iframe>
)
Confirmar presença: onde estará o formulário dinâmico para coletar preferências alimentares e gerar um link do WhatsApp.
O layout deve ter um menu (com botões) para navegar entre essas quatro páginas, sendo que o menu fique organizado em 2 botões por linha quando visualizado em formato mobile (mas ajustável/responsivo em telas maiores).

Centralizar o conteúdo na tela, para que o site mantenha a mesma estética em todo lugar.

Controle de acesso pelas rotas (validação de telefone)

Antes de permitir o acesso às páginas (além da Home), o usuário deverá inserir um número de telefone.
Se o telefone digitado existir como chave em db.json (por exemplo, "4"), então o usuário poderá acessar as demais páginas. Caso contrário, não terá acesso.
Formulário dinâmico de confirmação

Na página de Confirmar presença, ao carregar, deve-se buscar no db.json os convidados (array de nomes) referentes ao telefone que o usuário digitou.
Para cada convidado, criar campos de perguntas dinâmicos, como:
js
convidados.forEach((convidado, index) => {
  formDinamico.innerHTML += `
    <h3>Respostas para ${convidado}</h3>
    <p>Você é vegetariano/vegano?</p>
    <label><input type="radio" name="vegetariano-${index}" value="Sim" required> Sim</label>
    <label><input type="radio" name="vegetariano-${index}" value="Não"> Não</label>

    <p>Você come frutos do mar?</p>
    <label><input type="radio" name="frutos-do-mar-${index}" value="Sim" required> Sim</label>
    <label><input type="radio" name="frutos-do-mar-${index}" value="Não"> Não</label>

    <p>Se não come frutos do mar, prefere frango ou carne?</p>
    <select name="preferencia-${index}">
      <option value="Frango">Frango</option>
      <option value="Carne">Carne</option>
    </select>
  `;
});
Ao enviar o formulário, essas informações devem ser formatadas em um texto que será codificado e enviado via link do WhatsApp. Por exemplo:
js
let mensagem = `Respostas do Formulário de Casamento:\nNúmero de Telefone: ${telefone}\n`;
convidados.forEach((convidado, index) => {
  mensagem += `\nConvidado ${index + 1}: ${convidado}\n`;
  mensagem += `  Vegetariano: ${respostas[index]?.vegetariano || 'Não informado'}\n`;
  mensagem += `  Frutos do Mar: ${respostas[index]?.frutosDoMar || 'Não informado'}\n`;
  mensagem += `  Carne ou Frango: ${respostas[index]?.preferencia || 'Não informado'}\n`;
});

const mensagemCodificada = encodeURIComponent(mensagem);
const whatsAppNumber = process.env.WHATSAPP_NUMBER; // Pode ser fixo ou variável
const linkWhatsApp = \`https://wa.me/\${whatsAppNumber}?text=\${mensagemCodificada}\`;

res.json({ sucesso: true, link: linkWhatsApp });
Enviar esse link de retorno como JSON para o front-end, onde será exibido um botão que direciona o usuário ao WhatsApp.
Estética e responsividade

Todas as páginas devem remeter às cores das bandeiras trans e bissexual.
Centralize todo o conteúdo na tela, garanta que funcione em dispositivos móveis e que seja fácil trocar as imagens do carrossel (pode ser via JSON ou array estático).
Inclua comentários no código explicando como alterar as fotos do carrossel e como fazer o deploy em um serviço de hospedagem (se possível).
Resultado esperado:

Um projeto completo, com pastas bem definidas (por exemplo, routes, public, views ou client, db.json, etc.).
Ao rodar o projeto, teremos:
Uma página de Home com carrossel de fotos.
Uma página de Informações.
Uma página de Localização com o iframe do Google Maps.
Uma página de Confirmar presença contendo o formulário dinâmico que gera o link de WhatsApp ao enviar.
Somente após a validação do número de telefone (comparado ao db.json), o usuário pode navegar para as outras páginas.
Crie todo o código (front-end e back-end), explique o passo a passo para rodar a aplicação e descreva onde inserir o número de WhatsApp que receberá as respostas (variável WHATSAPP_NUMBER ou outro lugar). Se possível, inclua package.json (dependências), scripts de inicialização e dicas de como colocar tudo em produção.