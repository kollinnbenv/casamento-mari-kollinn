#!/bin/sh
set -e

# Verificar se o ID da pasta do Drive está configurado
if [ -z "$GOOGLE_DRIVE_FOLDER_ID" ]; then
  echo "[AVISO] A variável GOOGLE_DRIVE_FOLDER_ID não está definida."
  echo "As funcionalidades do Google Drive não funcionarão corretamente."
  echo "Configure esta variável no seu ambiente de deploy."
fi

# Verificar se as credenciais do Google Drive existem
if [ ! -f "$CONFIG_DIR/credentials.json" ]; then
  echo "[AVISO] Arquivo de credenciais não encontrado em $CONFIG_DIR/credentials.json"
  echo "As funcionalidades do Google Drive não funcionarão corretamente."
  echo "Monte um volume com o arquivo de credenciais ou use secrets."
  
  # Criar diretório de configuração se não existir
  mkdir -p "$CONFIG_DIR"
fi

# Verificar se o credentials.json já existe
if [ ! -f "$CONFIG_DIR/credentials.json" ]; then
  echo "[AVISO] Arquivo de credentials.json não encontrado em $CONFIG_DIR/credentials.json"
  echo "As funcionalidades do Google Drive não funcionarão corretamente."
  echo "Monte um volume com o arquivo de credentials.json ou use secrets."
fi

# Iniciar a aplicação
echo "Iniciando o servidor..."
exec ./main "$@" 