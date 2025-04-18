FROM golang:1.21-alpine AS build

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -o main ./cmd/server

FROM alpine:latest

WORKDIR /app

COPY --from=build /app/main .

COPY --from=build /app/static ./static

EXPOSE 3000

ENV PORT=3000

CMD ["./main"] 