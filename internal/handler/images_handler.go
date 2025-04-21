package handler

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/mux"
	"github.com/kollinn/casamento-mari-kollinn/internal/service"
)

// ResponseCache guarda a resposta JSON em cache
type ResponseCache struct {
	Data      []byte
	ExpiresAt time.Time
}

// ImageHandler gerencia as requisições relacionadas às imagens
type ImageHandler struct {
	driveService    *service.DriveService
	responseCache   *ResponseCache
	responseMutex   sync.RWMutex
	cacheExpiration time.Duration
}

// NewImageHandler cria uma nova instância do ImageHandler
func NewImageHandler(driveService *service.DriveService) *ImageHandler {
	if driveService == nil {
		log.Fatal("DriveService não pode ser nil")
	}
	return &ImageHandler{
		driveService:    driveService,
		cacheExpiration: 5 * time.Minute, // Cache expira em 5 minutos
	}
}

// GetImages retorna a lista de imagens disponíveis no Drive
func (h *ImageHandler) GetImages(w http.ResponseWriter, r *http.Request) {
	log.Printf("Recebida requisição GET /api/images")

	// Verifica se temos cache válido
	h.responseMutex.RLock()
	if h.responseCache != nil && time.Now().Before(h.responseCache.ExpiresAt) {
		log.Printf("Retornando resposta em cache (%d bytes)", len(h.responseCache.Data))
		h.responseMutex.RUnlock()

		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Cache-Control", "public, max-age=300")
		w.Write(h.responseCache.Data)
		return
	}
	h.responseMutex.RUnlock()

	ctx, cancel := context.WithTimeout(r.Context(), 30*time.Second)
	defer cancel()

	images, err := h.driveService.GetDriveImages(ctx)
	if err != nil {
		log.Printf("Erro ao buscar imagens: %v", err)
		http.Error(w, "Erro ao buscar imagens", http.StatusInternalServerError)
		return
	}

	log.Printf("Encontradas %d imagens", len(images))

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Cache-Control", "public, max-age=300")

	// Codificamos em um buffer primeiro para cachear
	jsonData, err := json.Marshal(images)
	if err != nil {
		log.Printf("Erro ao codificar resposta JSON: %v", err)
		http.Error(w, "Erro ao processar resposta", http.StatusInternalServerError)
		return
	}

	// Atualiza o cache
	h.responseMutex.Lock()
	h.responseCache = &ResponseCache{
		Data:      jsonData,
		ExpiresAt: time.Now().Add(h.cacheExpiration),
	}
	h.responseMutex.Unlock()

	// Envia a resposta
	w.Write(jsonData)

	log.Printf("Resposta enviada com sucesso")
}

// GetImageURL retorna uma URL temporária para acessar uma imagem específica
func (h *ImageHandler) GetImageURL(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	imageID := vars["id"]

	log.Printf("Recebida requisição GET /api/images/%s/url", imageID)

	if imageID == "" {
		log.Printf("ID da imagem não fornecido")
		http.Error(w, "ID da imagem não fornecido", http.StatusBadRequest)
		return
	}

	// Usamos a URL direta em vez de chamar o serviço
	directURL := "https://drive.google.com/uc?export=view&id=" + imageID
	log.Printf("URL direta gerada para imagem %s", imageID)

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Cache-Control", "private, max-age=300")

	response := map[string]string{"url": directURL}
	if err := json.NewEncoder(w).Encode(response); err != nil {
		log.Printf("Erro ao codificar resposta JSON: %v", err)
		http.Error(w, "Erro ao processar resposta", http.StatusInternalServerError)
		return
	}

	log.Printf("Resposta enviada com sucesso")
}
