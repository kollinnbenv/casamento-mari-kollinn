FROM golang:1.24-alpine AS build

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -o main ./cmd/server

FROM alpine:latest

WORKDIR /app

RUN apk --no-cache add ca-certificates && update-ca-certificates

COPY --from=build /app/main .

COPY --from=build /app/static ./static

RUN mkdir -p /app/config

ENV PORT=3000
ENV CONFIG_DIR=/app/config

EXPOSE 3000

COPY --from=build /app/docker-entrypoint.sh .
RUN chmod +x ./docker-entrypoint.sh

ENTRYPOINT ["./docker-entrypoint.sh"]