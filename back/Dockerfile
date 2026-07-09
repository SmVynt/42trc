# --- build stage ---
FROM golang:1.26-alpine AS build

WORKDIR /app

# Cache deps first
COPY go.mod go.sum ./
RUN go mod download

# Build the server binary
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /server .

# --- run stage ---
FROM alpine:3.20

WORKDIR /app

# CA certs for outbound HTTPS (42 API)
RUN apk add --no-cache ca-certificates

COPY --from=build /server /server

EXPOSE 5000

CMD ["/server"]