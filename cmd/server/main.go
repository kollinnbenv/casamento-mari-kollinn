package main

import (
	"log"
	"net/http"
	"os"
	"path/filepath"

	"github.com/gorilla/mux"
)

func main() {
	router := mux.NewRouter()

	// API routes não são mais necessárias, pois removemos a validação de telefone

	// Configuração para servir arquivos HTML específicos em rotas específicas
	router.HandleFunc("/", serveIndexPage)
	router.HandleFunc("/confirmar", serveHTMLPage("confirmar.html"))
	router.HandleFunc("/galeria", serveHTMLPage("galeria.html"))
	router.HandleFunc("/informacoes", serveHTMLPage("informacoes.html"))
	router.HandleFunc("/localizacao", serveHTMLPage("localizacao.html"))

	// Servir arquivos estáticos (CSS, JS, imagens)
	staticFileServer := http.FileServer(http.Dir("./static"))
	router.PathPrefix("/").Handler(staticFileServer)

	port := os.Getenv("PORT")
	if port == "" {
		port = "3000"
	}

	log.Printf("Servidor rodando na porta %s", port)
	log.Fatal(http.ListenAndServe(":"+port, router))
}

// Função para servir a página inicial
func serveIndexPage(w http.ResponseWriter, r *http.Request) {
	http.ServeFile(w, r, "./static/index.html")
}

// Função para servir as páginas HTML específicas
func serveHTMLPage(htmlFile string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		filePath := filepath.Join("./static", htmlFile)
		http.ServeFile(w, r, filePath)
	}
}
