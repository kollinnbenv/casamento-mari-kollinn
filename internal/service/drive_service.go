package service

import (
	"context"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"sync"
	"time"

	"github.com/kollinn/casamento-mari-kollinn/internal/model"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
	"google.golang.org/api/drive/v3"
	"google.golang.org/api/option"
)

// URLCache representa uma URL em cache com seu tempo de expiração
type URLCache struct {
	URL       string
	ExpiresAt time.Time
}

// DriveService gerencia a interação com o Google Drive
type DriveService struct {
	folderID      string
	tokenFilePath string
	credFilePath  string
	urlCache      map[string]URLCache
	cacheMutex    sync.RWMutex
	lastRequest   time.Time
	requestMutex  sync.Mutex
	initialized   bool
	imageCache    []model.DriveImage
	cacheLock     sync.RWMutex
}

// NewDriveService cria uma nova instância do DriveService
func NewDriveService() *DriveService {
	folderID := os.Getenv("GOOGLE_DRIVE_FOLDER_ID")
	if folderID == "" {
		log.Printf("AVISO: GOOGLE_DRIVE_FOLDER_ID não configurado")
		return nil
	}

	configDir := "./config"
	tokenPath := filepath.Join(configDir, "token.json")
	credPath := filepath.Join(configDir, "credentials.json")

	log.Printf("Inicializando serviço do Drive com folder ID: %s", folderID)

	return &DriveService{
		folderID:      folderID,
		tokenFilePath: tokenPath,
		credFilePath:  credPath,
		urlCache:      make(map[string]URLCache),
		initialized:   false,
		imageCache:    make([]model.DriveImage, 0),
	}
}

// getClient retorna um cliente HTTP autenticado para o Google Drive
func (ds *DriveService) getClient(ctx context.Context) (*http.Client, error) {
	log.Printf("Obtendo cliente autenticado para Google Drive")

	b, err := ioutil.ReadFile(ds.credFilePath)
	if err != nil {
		return nil, fmt.Errorf("não foi possível ler o arquivo de credenciais: %v", err)
	}

	config, err := google.ConfigFromJSON(b, drive.DriveReadonlyScope)
	if err != nil {
		return nil, fmt.Errorf("não foi possível analisar o arquivo de credenciais: %v", err)
	}

	tokenBytes, err := ioutil.ReadFile(ds.tokenFilePath)
	if err != nil {
		return nil, fmt.Errorf("não foi possível ler o token: %v", err)
	}

	token := &oauth2.Token{}
	err = json.Unmarshal(tokenBytes, token)
	if err != nil {
		return nil, fmt.Errorf("não foi possível analisar o token: %v", err)
	}

	return config.Client(ctx, token), nil
}

// GetDriveImages recupera imagens da pasta especificada do Google Drive
func (ds *DriveService) GetDriveImages(ctx context.Context) ([]model.DriveImage, error) {
	// Verifica se já temos as imagens em cache
	ds.cacheLock.RLock()
	if ds.initialized && len(ds.imageCache) > 0 {
		log.Printf("Retornando %d imagens do cache", len(ds.imageCache))
		images := ds.imageCache
		ds.cacheLock.RUnlock()
		return images, nil
	}
	ds.cacheLock.RUnlock()

	// Não temos cache, precisamos buscar do Drive
	log.Printf("Buscando imagens da pasta %s no Google Drive", ds.folderID)

	client, err := ds.getClient(ctx)
	if err != nil {
		return nil, fmt.Errorf("erro ao obter cliente: %v", err)
	}

	srv, err := drive.NewService(ctx, option.WithHTTPClient(client))
	if err != nil {
		return nil, fmt.Errorf("erro ao criar serviço Drive: %v", err)
	}

	query := fmt.Sprintf("'%s' in parents and mimeType contains 'image/'", ds.folderID)
	log.Printf("Executando query: %s", query)

	fileList, err := srv.Files.List().
		Q(query).
		Fields("files(id, name, mimeType, webViewLink, thumbnailLink)").
		PageSize(100).
		OrderBy("name").
		Do()
	if err != nil {
		return nil, fmt.Errorf("erro ao listar arquivos: %v", err)
	}

	var images []model.DriveImage
	for _, file := range fileList.Files {
		images = append(images, model.DriveImage{
			ID:            file.Id,
			Name:          file.Name,
			MimeType:      file.MimeType,
			WebViewLink:   file.WebViewLink,
			ThumbnailLink: file.ThumbnailLink,
		})
	}

	// Atualiza o cache
	ds.cacheLock.Lock()
	ds.imageCache = images
	ds.initialized = true
	ds.cacheLock.Unlock()

	log.Printf("Encontradas %d imagens no Google Drive", len(images))
	return images, nil
}

// GenerateTemporaryAccessURL gera URLs temporárias para acesso às imagens
func (ds *DriveService) GenerateTemporaryAccessURL(ctx context.Context, imageID string) (string, error) {
	ds.cacheMutex.RLock()
	if cached, ok := ds.urlCache[imageID]; ok {
		if time.Now().Before(cached.ExpiresAt) {
			ds.cacheMutex.RUnlock()
			return cached.URL, nil
		}
	}
	ds.cacheMutex.RUnlock()

	client, err := ds.getClient(ctx)
	if err != nil {
		return "", fmt.Errorf("erro ao obter cliente: %v", err)
	}

	srv, err := drive.NewService(ctx, option.WithHTTPClient(client))
	if err != nil {
		return "", fmt.Errorf("erro ao criar serviço Drive: %v", err)
	}

	file, err := srv.Files.Get(imageID).Fields("webContentLink").Do()
	if err != nil {
		return "", fmt.Errorf("erro ao obter arquivo: %v", err)
	}

	if file.WebContentLink == "" {
		return "", fmt.Errorf("link de conteúdo não disponível")
	}

	ds.cacheMutex.Lock()
	ds.urlCache[imageID] = URLCache{
		URL:       file.WebContentLink,
		ExpiresAt: time.Now().Add(30 * time.Minute),
	}
	ds.cacheMutex.Unlock()

	return file.WebContentLink, nil
}
