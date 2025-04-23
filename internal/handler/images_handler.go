package handler

import (
	"context"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"strings"
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
	altTextService  *service.AltTextService
	responseCache   *ResponseCache
	responseMutex   sync.RWMutex
	cacheExpiration time.Duration
}

// NewImageHandler cria uma nova instância do ImageHandler
func NewImageHandler(driveService *service.DriveService, altTextService *service.AltTextService) *ImageHandler {
	if driveService == nil {
		log.Fatal("DriveService não pode ser nil")
	}
	return &ImageHandler{
		driveService:    driveService,
		altTextService:  altTextService,
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

	// Enriquece as imagens com textos alternativos personalizados
	if h.altTextService != nil {
		images = h.altTextService.EnrichImagesWithAltText(images)
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

	// Usamos a URL do proxy em vez de uma URL direta
	proxyURL := "/api/images/" + imageID + "/proxy"
	log.Printf("URL de proxy gerada para imagem %s: %s", imageID, proxyURL)

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Cache-Control", "private, max-age=300")

	response := map[string]string{"url": proxyURL}
	if err := json.NewEncoder(w).Encode(response); err != nil {
		log.Printf("Erro ao codificar resposta JSON: %v", err)
		http.Error(w, "Erro ao processar resposta", http.StatusInternalServerError)
		return
	}

	log.Printf("Resposta enviada com sucesso")
}

// ProxyImage atua como um proxy para a imagem do Google Drive
func (h *ImageHandler) ProxyImage(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	imageID := vars["id"]
	size := r.URL.Query().Get("size")

	log.Printf("Recebida requisição GET /api/images/%s/proxy?size=%s", imageID, size)

	if imageID == "" {
		log.Printf("ID da imagem não fornecido")
		http.Error(w, "ID da imagem não fornecido", http.StatusBadRequest)
		return
	}

	// Determina qual imagem buscar (thumbnail ou alta resolução)
	var err error
	var imageURL string

	ctx, cancel := context.WithTimeout(r.Context(), 30*time.Second)
	defer cancel()

	// Busca a imagem no cache de Drive
	images, err := h.driveService.GetDriveImages(ctx)
	if err != nil {
		log.Printf("Erro ao buscar imagens: %v", err)
		http.Error(w, "Erro ao buscar imagem", http.StatusInternalServerError)
		return
	}

	// Encontra a imagem específica pelo ID
	var thumbnailLink string
	for _, img := range images {
		if img.ID == imageID {
			thumbnailLink = img.ThumbnailLink
			break
		}
	}

	if thumbnailLink == "" {
		log.Printf("Imagem com ID %s não encontrada", imageID)
		http.Error(w, "Imagem não encontrada", http.StatusNotFound)
		return
	}

	// Modifica o tamanho da imagem conforme solicitado
	if size == "large" {
		// Substitui =s220 por =s1000 para imagens maiores
		if strings.Contains(thumbnailLink, "=s") {
			imageURL = strings.Replace(thumbnailLink, "=s220", "=s1000", 1)
		} else {
			imageURL = thumbnailLink
		}
	} else {
		// Usa o thumbnailLink original
		imageURL = thumbnailLink
	}

	log.Printf("Fazendo proxy para URL: %s", imageURL)

	// Configura um cliente HTTP com timeout
	client := &http.Client{
		Timeout: 30 * time.Second,
	}

	// Faz a requisição para o Google Drive
	req, err := http.NewRequestWithContext(ctx, "GET", imageURL, nil)
	if err != nil {
		log.Printf("Erro ao criar requisição: %v", err)
		http.Error(w, "Erro interno", http.StatusInternalServerError)
		return
	}

	// Adiciona headers para evitar problemas de CORS
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/100.0.1000.0")

	// Faz a requisição e obtém resposta
	resp, err := client.Do(req)
	if err != nil {
		log.Printf("Erro ao buscar imagem: %v", err)
		http.Error(w, "Erro ao buscar imagem", http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	// Verifica se a resposta foi bem-sucedida
	if resp.StatusCode != http.StatusOK {
		log.Printf("Erro do Google Drive: %s", resp.Status)
		http.Error(w, "Erro ao buscar imagem", resp.StatusCode)
		return
	}

	// Copia os headers relevantes da resposta
	contentType := resp.Header.Get("Content-Type")
	if contentType != "" {
		w.Header().Set("Content-Type", contentType)
	} else {
		w.Header().Set("Content-Type", "image/jpeg")
	}

	// Define headers de cache
	w.Header().Set("Cache-Control", "public, max-age=7200") // Cache de 2 horas

	// Copia a imagem para a resposta
	_, err = io.Copy(w, resp.Body)
	if err != nil {
		log.Printf("Erro ao copiar resposta: %v", err)
		// Não podemos fazer mais nada aqui pois já começamos a escrever a resposta
	}

	log.Printf("Imagem enviada com sucesso")
}

// GetAltText retorna o texto alternativo para uma imagem específica
func (h *ImageHandler) GetAltText(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	imageID := vars["id"]

	log.Printf("Recebida requisição GET /api/images/%s/alt-text", imageID)

	if imageID == "" {
		log.Printf("ID da imagem não fornecido")
		http.Error(w, "ID da imagem não fornecido", http.StatusBadRequest)
		return
	}

	altText := ""
	if h.altTextService != nil {
		altText = h.altTextService.GetAltText(imageID)
	}

	w.Header().Set("Content-Type", "application/json")
	response := map[string]string{"altText": altText}
	if err := json.NewEncoder(w).Encode(response); err != nil {
		log.Printf("Erro ao codificar resposta JSON: %v", err)
		http.Error(w, "Erro ao processar resposta", http.StatusInternalServerError)
		return
	}

	log.Printf("Texto alternativo enviado com sucesso para a imagem %s", imageID)
}

// SetAltText define o texto alternativo para uma imagem específica
func (h *ImageHandler) SetAltText(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	imageID := vars["id"]

	log.Printf("Recebida requisição POST /api/images/%s/alt-text", imageID)

	if imageID == "" {
		log.Printf("ID da imagem não fornecido")
		http.Error(w, "ID da imagem não fornecido", http.StatusBadRequest)
		return
	}

	if h.altTextService == nil {
		log.Printf("Serviço de textos alternativos não disponível")
		http.Error(w, "Serviço indisponível", http.StatusInternalServerError)
		return
	}

	// Lê o corpo da requisição
	var requestBody struct {
		AltText string `json:"altText"`
	}

	if err := json.NewDecoder(r.Body).Decode(&requestBody); err != nil {
		log.Printf("Erro ao decodificar corpo da requisição: %v", err)
		http.Error(w, "Corpo da requisição inválido", http.StatusBadRequest)
		return
	}

	// Define o texto alternativo
	if err := h.altTextService.SetAltText(imageID, requestBody.AltText); err != nil {
		log.Printf("Erro ao definir texto alternativo: %v", err)
		http.Error(w, "Erro ao salvar texto alternativo", http.StatusInternalServerError)
		return
	}

	// Limpa o cache para que as próximas requisições reflitam a mudança
	h.responseMutex.Lock()
	h.responseCache = nil
	h.responseMutex.Unlock()

	w.Header().Set("Content-Type", "application/json")
	response := map[string]string{"status": "success", "altText": requestBody.AltText}
	if err := json.NewEncoder(w).Encode(response); err != nil {
		log.Printf("Erro ao codificar resposta JSON: %v", err)
		http.Error(w, "Erro ao processar resposta", http.StatusInternalServerError)
		return
	}

	log.Printf("Texto alternativo definido com sucesso para a imagem %s", imageID)
}
