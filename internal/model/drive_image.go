package model

// DriveImage representa uma imagem armazenada no Google Drive
type DriveImage struct {
	ID            string
	Name          string
	MimeType      string
	WebViewLink   string
	ThumbnailLink string
}
