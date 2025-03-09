require('dotenv').config(); // Caso queira usar variáveis de ambiente num arquivo .env
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

// Carrega o JSON com os convidados
const dbFilePath = path.join(__dirname, 'db.json');
const dbData = JSON.parse(fs.readFileSync(dbFilePath, 'utf8'));

// Defina aqui o número de WhatsApp que receberá as mensagens
// ou utilize uma variável de ambiente: process.env.WHATSAPP_NUMBER
const WHATSAPP_NUMBER = process.env.WHATSAPP_NUMBER || '';

// Servir arquivos estáticos da pasta 'public'
app.use(express.static(path.join(__dirname, 'public')));

/**
 * Rota para validar telefone.
 * Verifica se o telefone existe no db.json.
 * GET /api/validate-phone?phone=XX
 */
app.get('/api/validate-phone', (req, res) => {
  const { phone } = req.query;
  if (!phone) {
    return res.status(400).json({ error: 'Número de telefone não fornecido.' });
  }

  const convidados = dbData.convidados[phone];
  if (convidados) {
    return res.json({ valid: true });
  } else {
    return res.json({ valid: false });
  }
});

/**
 * Rota para obter a lista de convidados de um telefone
 * GET /api/convidados?phone=XX
 */
app.get('/api/convidados', (req, res) => {
  const { phone } = req.query;
  if (!phone) {
    return res.status(400).json({ error: 'Número de telefone não fornecido.' });
  }

  const convidados = dbData.convidados[phone];
  if (convidados) {
    return res.json({ convidados });
  } else {
    return res.status(404).json({ error: 'Telefone não encontrado no db.json' });
  }
});

/**
 * Rota para enviar as respostas do formulário de confirmação e gerar link do WhatsApp
 * POST /api/confirmar
 * Body esperado:
 * {
 *   "phone": ",
 *   "respostas": [
 *      { "vegetariano": "Sim", "frutosDoMar": "Não", "preferencia": "Carne" },
 *      ...
 *   ]
 * }
 */
app.post('/api/confirmar', (req, res) => {
  const { phone, respostas } = req.body;

  // Obtém lista de convidados para o telefone informado
  const convidados = dbData.convidados[phone];
  if (!convidados) {
    return res.status(404).json({ error: 'Telefone não encontrado no db.json' });
  }

  // Monta a mensagem para o WhatsApp
  let mensagem = `Respostas do Formulário de Casamento:\nNúmero de Telefone: ${phone}\n`;

  convidados.forEach((convidado, index) => {
    mensagem += `\nConvidado ${index + 1}: ${convidado}\n`;
    mensagem += `  Vegetariano: ${respostas[index]?.vegetariano}\n`;
    mensagem += `  Frutos do Mar: ${respostas[index]?.frutosDoMar}\n`;
    mensagem += `  Carne ou Frango: ${respostas[index]?.preferencia}\n`;

  });

  const mensagemCodificada = encodeURIComponent(mensagem);
  const linkWhatsApp = `https://wa.me/${WHATSAPP_NUMBER}?text=${mensagemCodificada}`;

  return res.json({ sucesso: true, link: linkWhatsApp });
});

// Inicia servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
