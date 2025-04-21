package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"os"
	"path/filepath"

	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
	"google.golang.org/api/drive/v3"
)

// Estrutura para armazenar as credenciais do OAuth2
func main() {
	// Verifica argumentos
	if len(os.Args) < 2 {
		fmt.Println("Uso: setup_auth <caminho_credenciais.json>")
		fmt.Println("Exemplo: setup_auth ./credentials.json")
		os.Exit(1)
	}

	credPath := os.Args[1]
	// Lê as credenciais do OAuth2
	credBytes, err := ioutil.ReadFile(credPath)
	if err != nil {
		log.Fatalf("Não foi possível ler o arquivo de credenciais: %v", err)
	}

	// Configura o escopo para acesso de leitura ao Drive
	config, err := google.ConfigFromJSON(credBytes, drive.DriveReadonlyScope)
	if err != nil {
		log.Fatalf("Não foi possível analisar as credenciais: %v", err)
	}

	// Gera a URL de autorização
	authURL := config.AuthCodeURL("state-token", oauth2.AccessTypeOffline)
	fmt.Printf("Acesse este URL para autorizar o aplicativo:\n%v\n\n", authURL)
	fmt.Println("Cole o código de autorização recebido:")

	// Lê o código de autorização do usuário
	var authCode string
	if _, err := fmt.Scan(&authCode); err != nil {
		log.Fatalf("Não foi possível ler o código de autorização: %v", err)
	}

	// Troca o código de autorização por um token
	token, err := config.Exchange(context.Background(), authCode)
	if err != nil {
		log.Fatalf("Não foi possível trocar o código pelo token: %v", err)
	}

	// Salva o token em um arquivo
	tokenPath := filepath.Join(filepath.Dir(credPath), "token.json")
	saveToken(tokenPath, token)
	fmt.Printf("Token salvo em: %s\n", tokenPath)
	fmt.Println("\nConfigurações necessárias para o .env:")
	fmt.Println("CONFIG_DIR=<diretório_dos_arquivos_de_configuração>")
	fmt.Println("GOOGLE_DRIVE_FOLDER_ID=<id_da_pasta_com_fotos>")
}

// saveToken salva o token em um arquivo
func saveToken(path string, token *oauth2.Token) {
	fmt.Printf("Salvando token em: %s\n", path)

	// Cria o diretório se não existir
	dir := filepath.Dir(path)
	if _, err := os.Stat(dir); os.IsNotExist(err) {
		if err := os.MkdirAll(dir, 0700); err != nil {
			log.Fatalf("Não foi possível criar o diretório para o token: %v", err)
		}
	}

	// Codifica o token para JSON
	tokenJSON, err := json.Marshal(token)
	if err != nil {
		log.Fatalf("Não foi possível codificar o token: %v", err)
	}

	// Salva o token com permissões restritas (apenas o usuário pode ler)
	if err := ioutil.WriteFile(path, tokenJSON, 0600); err != nil {
		log.Fatalf("Não foi possível salvar o token: %v", err)
	}
}
