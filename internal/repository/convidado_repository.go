package repository

import (
	"context"
	"errors"

	"github.com/kollinn/casamento-mari-kollinn/internal/model"
)

var (
	ErrConvidadoNaoEncontrado = errors.New("convidado não encontrado")
)

// ConvidadoRepository define a interface para acesso aos dados de convidados
type ConvidadoRepository interface {
	GetConvidadosByPhone(ctx context.Context, phone string) ([]model.Convidado, error)
	ValidatePhone(ctx context.Context, phone string) (bool, error)
	AddConvidados(ctx context.Context, phone string, convidados []model.Convidado)
}

// InMemoryConvidadoRepository implementa ConvidadoRepository com armazenamento em memória
type InMemoryConvidadoRepository struct {
	convidados map[string][]model.Convidado
}

// NewInMemoryConvidadoRepository cria um novo repositório em memória com dados de exemplo
func NewInMemoryConvidadoRepository() *InMemoryConvidadoRepository {
	repo := &InMemoryConvidadoRepository{
		convidados: make(map[string][]model.Convidado),
	}

	// Adiciona dados de exemplo
	repo.convidados["48 99999-9999"] = []model.Convidado{"Mariana", "Kollinn"}
	repo.convidados["11 88888-8888"] = []model.Convidado{"João", "Maria"}

	return repo
}

func (r *InMemoryConvidadoRepository) GetConvidadosByPhone(ctx context.Context, phone string) ([]model.Convidado, error) {
	convidados, exists := r.convidados[phone]
	if !exists {
		return nil, ErrConvidadoNaoEncontrado
	}
	return convidados, nil
}

func (r *InMemoryConvidadoRepository) ValidatePhone(ctx context.Context, phone string) (bool, error) {
	_, exists := r.convidados[phone]
	return exists, nil
}

func (r *InMemoryConvidadoRepository) AddConvidados(ctx context.Context, phone string, convidados []model.Convidado) {
	r.convidados[phone] = convidados
}
