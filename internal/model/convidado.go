package model

// Convidado agora representa apenas o nome do convidado, conforme usado no frontend
type Convidado string

// ConfirmacaoRequest representa a solicitação de confirmação recebida do frontend
type ConfirmacaoRequest struct {
	Phone     string     `json:"phone"`
	Respostas []Resposta `json:"respostas"`
}

// Resposta representa a resposta de um convidado
type Resposta struct {
	Vegetariano string `json:"vegetariano"`
	FrutosDoMar string `json:"frutos_do_mar"`
	Preferencia string `json:"preferencia"`
}
