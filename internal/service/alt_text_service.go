package service

import (
	"encoding/json"
	"io/ioutil"
	"log"
	"os"
	"sync"

	"github.com/kollinn/casamento-mari-kollinn/internal/model"
)

// AltTextMap mapeia IDs de imagens para seus textos alternativos
type AltTextMap map[string]string

// AltTextService gerencia os textos alternativos para as imagens
type AltTextService struct {
	altTexts    AltTextMap
	dataFile    string
	mutex       sync.RWMutex
	initialized bool
}

// NewAltTextService cria uma nova instância do AltTextService
func NewAltTextService() *AltTextService {
	service := &AltTextService{
		altTexts:    make(AltTextMap),
		dataFile:    "./data/alt_texts.json",
		initialized: false,
	}

	// Assegura que o diretório data existe
	os.MkdirAll("./data", 0755)

	// Carrega os textos alternativos existentes
	service.loadAltTexts()

	return service
}

// loadAltTexts carrega os textos alternativos do arquivo
func (ats *AltTextService) loadAltTexts() error {
	ats.mutex.Lock()
	defer ats.mutex.Unlock()

	// Verifica se o arquivo existe
	if _, err := os.Stat(ats.dataFile); os.IsNotExist(err) {
		// O arquivo não existe, inicializamos com um mapa vazio
		ats.altTexts = make(AltTextMap)
		ats.initialized = true
		return nil
	}

	// Lê o arquivo
	data, err := ioutil.ReadFile(ats.dataFile)
	if err != nil {
		log.Printf("Erro ao ler arquivo de textos alternativos: %v", err)
		return err
	}

	// Decodifica o JSON
	if len(data) > 0 {
		err = json.Unmarshal(data, &ats.altTexts)
		if err != nil {
			log.Printf("Erro ao decodificar textos alternativos: %v", err)
			return err
		}
	} else {
		// Arquivo vazio, inicializa com mapa vazio
		ats.altTexts = make(AltTextMap)
	}

	ats.initialized = true
	log.Printf("Carregados %d textos alternativos", len(ats.altTexts))
	return nil
}

// saveAltTexts salva os textos alternativos no arquivo
func (ats *AltTextService) saveAltTexts() error {
	ats.mutex.RLock()
	defer ats.mutex.RUnlock()

	data, err := json.MarshalIndent(ats.altTexts, "", "  ")
	if err != nil {
		log.Printf("Erro ao codificar textos alternativos: %v", err)
		return err
	}

	err = ioutil.WriteFile(ats.dataFile, data, 0644)
	if err != nil {
		log.Printf("Erro ao salvar textos alternativos: %v", err)
		return err
	}

	log.Printf("Textos alternativos salvos com sucesso: %d entradas", len(ats.altTexts))
	return nil
}

// GetAltText retorna o texto alternativo para uma imagem específica
func (ats *AltTextService) GetAltText(imageID string) string {
	ats.mutex.RLock()
	defer ats.mutex.RUnlock()

	if text, ok := ats.altTexts[imageID]; ok {
		return text
	}
	return ""
}

// SetAltText define o texto alternativo para uma imagem
func (ats *AltTextService) SetAltText(imageID, text string) error {
	ats.mutex.Lock()
	ats.altTexts[imageID] = text
	ats.mutex.Unlock()

	return ats.saveAltTexts()
}

// EnrichImages adiciona textos alternativos às imagens do modelo
func (ats *AltTextService) EnrichImagesWithAltText(images []model.DriveImage) []model.DriveImage {
	ats.mutex.RLock()
	defer ats.mutex.RUnlock()

	// Para cada imagem, verifica se temos um texto alternativo personalizado
	for i := range images {
		if altText, ok := ats.altTexts[images[i].ID]; ok && altText != "" {
			// Se temos um texto alternativo personalizado, usa-o
			images[i].AltText = altText
		}
	}

	return images
}
