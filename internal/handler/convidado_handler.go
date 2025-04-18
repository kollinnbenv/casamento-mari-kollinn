package handler

import (
	"encoding/json"
	"net/http"
	"os"

	"github.com/kollinn/casamento-mari-kollinn/internal/model"
	"github.com/kollinn/casamento-mari-kollinn/internal/service"
)

type Handler struct {
	service *service.ConvidadoService
}

func NewHandler(service *service.ConvidadoService) *Handler {
	return &Handler{service: service}
}

// ValidatePhone handles phone validation requests
func (h *Handler) ValidatePhone(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	phone := r.URL.Query().Get("phone")
	if phone == "" {
		http.Error(w, "Telefone não fornecido", http.StatusBadRequest)
		return
	}

	valid, err := h.service.ValidatePhone(r.Context(), phone)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]bool{"valid": valid})
}

// GetConvidados handles guest list requests by phone
func (h *Handler) GetConvidados(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	phone := r.URL.Query().Get("phone")
	if phone == "" {
		http.Error(w, "Telefone não fornecido", http.StatusBadRequest)
		return
	}

	convidados, err := h.service.GetConvidadosByPhone(r.Context(), phone)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{"convidados": convidados})
}

// Confirmar handles confirmation requests
func (h *Handler) Confirmar(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	var req model.ConfirmacaoRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Erro ao decodificar requisição", http.StatusBadRequest)
		return
	}

	mensagemCodificada, err := h.service.ProcessarConfirmacao(r.Context(), &req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	whatsappNumber := os.Getenv("WHATSAPP_NUMBER")
	if whatsappNumber == "" {
		// Usar um número padrão para testes se não estiver definido
		whatsappNumber = "5500000000000"
	}

	link := "https://wa.me/" + whatsappNumber + "?text=" + mensagemCodificada
	json.NewEncoder(w).Encode(map[string]interface{}{
		"sucesso": true,
		"link":    link,
	})
}
