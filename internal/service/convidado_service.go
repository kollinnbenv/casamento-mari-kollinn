package service

import (
	"context"
	"fmt"
	"net/url"

	"github.com/kollinn/casamento-mari-kollinn/internal/model"
	"github.com/kollinn/casamento-mari-kollinn/internal/repository"
)

// ConvidadoService handles business logic for guests
type ConvidadoService struct {
	repo repository.ConvidadoRepository
}

// NewConvidadoService creates a new service instance
func NewConvidadoService(repo repository.ConvidadoRepository) *ConvidadoService {
	return &ConvidadoService{repo: repo}
}

// ValidatePhone validates if a phone exists
func (s *ConvidadoService) ValidatePhone(ctx context.Context, phone string) (bool, error) {
	return s.repo.ValidatePhone(ctx, phone)
}

// GetConvidadosByPhone returns all guests for a phone
func (s *ConvidadoService) GetConvidadosByPhone(ctx context.Context, phone string) ([]model.Convidado, error) {
	return s.repo.GetConvidadosByPhone(ctx, phone)
}

// ProcessarConfirmacao processes the confirmation responses
func (s *ConvidadoService) ProcessarConfirmacao(ctx context.Context, req *model.ConfirmacaoRequest) (string, error) {
	// Verifica se o telefone existe
	convidados, err := s.repo.GetConvidadosByPhone(ctx, req.Phone)
	if err != nil {
		return "", fmt.Errorf("erro ao processar confirmação: %w", err)
	}

	// Monta a mensagem
	mensagem := "Respostas do Formulário de Casamento:\n"
	mensagem += fmt.Sprintf("Telefone: %s\n\n", req.Phone)

	for i, convidado := range convidados {
		if i < len(req.Respostas) {
			resposta := req.Respostas[i]
			mensagem += fmt.Sprintf("Convidado: %s\n", convidado)
			mensagem += fmt.Sprintf("  Vegetariano: %s\n", resposta.Vegetariano)
			mensagem += fmt.Sprintf("  Frutos do Mar: %s\n", resposta.FrutosDoMar)
			mensagem += fmt.Sprintf("  Preferência: %s\n\n", resposta.Preferencia)
		}
	}

	// Codifica mensagem para URL
	mensagemCodificada := url.QueryEscape(mensagem)
	return mensagemCodificada, nil
}
