package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"sync"
	"time"

	"github.com/gorilla/mux"
	"github.com/joho/godotenv"
	"github.com/kollinn/casamento-mari-kollinn/internal/handler"
	"github.com/kollinn/casamento-mari-kollinn/internal/service"
)

func main() {
	// Configura o logger para incluir data e hora
	log.SetFlags(log.LstdFlags | log.Lshortfile)
	log.Println("Iniciando servidor...")

	// Carrega as variáveis de ambiente do arquivo .env
	if err := godotenv.Load(); err != nil {
		log.Printf("Aviso: Arquivo .env não encontrado: %v", err)
	}

	router := mux.NewRouter()

	// Inicializa o serviço do Drive
	driveService := service.NewDriveService()
	if driveService == nil {
		log.Println("AVISO: GOOGLE_DRIVE_FOLDER_ID não configurado. Use variável de ambiente para definir a pasta do Drive.")
	}

	// Inicializa handlers
	imageHandler := handler.NewImageHandler(driveService)

	// Registra rotas para API de imagens
	apiRouter := router.PathPrefix("/api").Subrouter()
	apiRouter.HandleFunc("/images", imageHandler.GetImages).Methods("GET")
	apiRouter.HandleFunc("/images/{id}/url", imageHandler.GetImageURL).Methods("GET")

	// Configuração para servir arquivos HTML específicos em rotas específicas
	router.HandleFunc("/", serveIndexPage)
	router.HandleFunc("/confirmar", serveHTMLPage("confirmar.html"))
	router.HandleFunc("/galeria", serveHTMLPage("galeria.html"))
	router.HandleFunc("/informacoes", serveHTMLPage("informacoes.html"))
	router.HandleFunc("/localizacao", serveHTMLPage("localizacao.html"))

	// Servir arquivos estáticos (CSS, JS, imagens)
	fs := http.FileServer(http.Dir("static"))
	router.PathPrefix("/").Handler(http.StripPrefix("/", fs))

	// Determina a porta para o servidor
	port := os.Getenv("PORT")
	if port == "" {
		port = "3000"
	}

	// Pré-carrega as imagens do Drive em uma goroutine separada para não bloquear o servidor
	var wg sync.WaitGroup
	if driveService != nil {
		wg.Add(1)
		go func() {
			defer wg.Done()
			ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
			defer cancel()

			log.Println("Iniciando pré-carregamento das imagens em segundo plano...")
			_, err := driveService.GetDriveImages(ctx)
			if err != nil {
				log.Printf("Aviso: Erro ao pré-carregar imagens: %v", err)
			}
			log.Println("Pré-carregamento de imagens concluído")
		}()
	}

	// Inicia o servidor
	log.Printf("Servidor iniciando na porta %s", port)
	log.Printf("Acesse http://localhost:%s/galeria para ver a galeria", port)

	// Se quiser aguardar o carregamento completo:
	// wg.Wait()
	// log.Println("Todas as inicializações concluídas, servidor pronto")

	// Inicia o servidor HTTP
	log.Fatal(http.ListenAndServe(":"+port, router))
}

// Função para servir a página inicial
func serveIndexPage(w http.ResponseWriter, r *http.Request) {
	log.Printf("Servindo página inicial: %s", r.URL.Path)
	http.ServeFile(w, r, "./static/index.html")
}

// Função para servir as páginas HTML específicas
func serveHTMLPage(htmlFile string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		log.Printf("Servindo página %s: %s", htmlFile, r.URL.Path)
		filePath := filepath.Join("./static", htmlFile)
		http.ServeFile(w, r, filePath)
	}
}
