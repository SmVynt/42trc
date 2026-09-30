SHELL := /bin/sh
.DEFAULT_GOAL := help

GREEN  := \033[0;32m
YELLOW := \033[0;33m
BLUE   := \033[0;34m
RED    := \033[0;31m
RESET  := \033[0m

PROJECT       := transcendence
BACK_DIR      := back
BACK_GAME_DIR := back-game
FRONT_DIR     := front
COMPOSE_FILE  ?= docker-compose.yml
ENV_FILE      ?= .env
BIN_DIR       ?= .build

COMPOSE      := docker compose --env-file $(ENV_FILE) -f $(COMPOSE_FILE)

BACK_PORT    ?= 5000
GAME_PORT    ?= 5001
FRONT_PORT   ?= 5173
HTTP_PORT    ?= 5173

TARGET_DEV   := development
TARGET_PROD  := production

help:
	@printf '%b\n' "$(BLUE)$(PROJECT) targets:$(RESET)"
	@printf '%s\n' "  make install          Install Go and frontend dependencies"
	@printf '%s\n' "  make build            Build the frontend"
	@printf '%s\n' "  make dev              Start the development stack"
	@printf '%s\n' "  make dev-prod         Start the production frontend locally"
	@printf '%s\n' "  make check            Run tests, lint, build, and Compose validation"
	@printf '%s\n' "  make backend-build    Build the backend binary"
	@printf '%s\n' "  make game-build       Build the game-server binary"
	@printf '%s\n' "  make seed-stars       Seed stars; TEST_USERS=1 uses five test accounts"
	@printf '%s\n' "  make docker-build     Build all production images"
	@printf '%s\n' "  make docker-up        Start the production Compose stack"
	@printf '%s\n' "  make docker-down      Stop the Compose stack"
	@printf '%s\n' "  make logs             Follow all service logs"
	@printf '%s\n' "  make clean            Remove generated local dependencies/build output"
	@printf '%s\n' "  make fclean           Clean and stop containers (keeps database data)"
	@printf '%s\n' "  make purge-data       Stop containers and delete database volumes"

check-env:
	@test -f "$(ENV_FILE)" || { \
		printf '%b\n' "$(RED)Missing $(ENV_FILE). Copy .env.example to .env and configure it.$(RESET)"; \
		exit 1; \
	}

install:
	@printf '%b\n' "$(YELLOW)Installing backend dependencies...$(RESET)"
	@cd $(BACK_DIR) && go mod download
	@printf '%b\n' "$(YELLOW)Installing game-server dependencies...$(RESET)"
	@cd $(BACK_GAME_DIR) && go mod download
	@printf '%b\n' "$(YELLOW)Installing frontend dependencies...$(RESET)"
	@cd $(FRONT_DIR) && npm ci
	@printf '%b\n' "$(GREEN)Dependencies installed.$(RESET)"

all: install build

back-dev: check-env
	@printf '%b\n' "$(GREEN)Starting backend on port $(BACK_PORT)...$(RESET)"
	@cd $(BACK_DIR) && PORT=$(BACK_PORT) go run .

backend-build:
	@mkdir -p $(BIN_DIR)
	@cd $(BACK_DIR) && CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o ../$(BIN_DIR)/backend .

back-prod: check-env backend-build
	@printf '%b\n' "$(GREEN)Starting backend on port $(BACK_PORT)...$(RESET)"
	@cd $(BACK_DIR) && PORT=$(BACK_PORT) ../$(BIN_DIR)/backend

back-game-dev: check-env
	@printf '%b\n' "$(GREEN)Starting game server on port $(GAME_PORT)...$(RESET)"
	@cd $(BACK_GAME_DIR) && PORT=$(GAME_PORT) go run .

game-build:
	@mkdir -p $(BIN_DIR)
	@cd $(BACK_GAME_DIR) && CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o ../$(BIN_DIR)/game-server .

game-prod: check-env game-build
	@printf '%b\n' "$(GREEN)Starting game server on port $(GAME_PORT)...$(RESET)"
	@cd $(BACK_GAME_DIR) && PORT=$(GAME_PORT) ../$(BIN_DIR)/game-server

front-dev:
	@printf '%b\n' "$(GREEN)Starting frontend on port $(FRONT_PORT)...$(RESET)"
	@cd $(FRONT_DIR) && VITE_API_URL=http://localhost:$(BACK_PORT) VITE_GAME_SERVER_URL=ws://localhost:$(GAME_PORT)/ws npm run dev -- --port $(FRONT_PORT) --strictPort

front-build:
	@printf '%b\n' "$(YELLOW)Building frontend...$(RESET)"
	@cd $(FRONT_DIR) && npm run build

build: front-build

front-preview:
	@cd $(FRONT_DIR) && npm run preview

backend-test:
	@cd $(BACK_DIR) && go test ./... && go vet ./...

game-test:
	@cd $(BACK_GAME_DIR) && go test ./... && go vet ./...

frontend-check:
	@cd $(FRONT_DIR) && npm ci && npm run lint && npm run build

compose-config: check-env
	@$(COMPOSE) config --quiet

test: backend-test game-test

check: backend-test game-test frontend-check compose-config

dev: check-env stop
	@printf '%b\n' "$(GREEN)Starting development stack on http://localhost:$(HTTP_PORT)...$(RESET)"
	@TRC_TARGET=$(TARGET_DEV) HTTP_PORT=$(HTTP_PORT) FRONT_CONTAINER_PORT=$(FRONT_PORT) BACKEND_PORT=$(BACK_PORT) GAME_PORT=$(GAME_PORT) $(COMPOSE) up -d --build

dev-prod: check-env stop
	@printf '%b\n' "$(GREEN)Starting production frontend stack on http://localhost:$(HTTP_PORT)...$(RESET)"
	@TRC_TARGET=$(TARGET_PROD) HTTP_PORT=$(HTTP_PORT) FRONT_CONTAINER_PORT=80 BACKEND_PORT=$(BACK_PORT) GAME_PORT=$(GAME_PORT) $(COMPOSE) up -d --build

docker-build: check-env
	@TRC_TARGET=$(TARGET_PROD) FRONT_CONTAINER_PORT=80 BACKEND_PORT=$(BACK_PORT) GAME_PORT=$(GAME_PORT) $(COMPOSE) build

prod: docker-build

docker-up: check-env
	@TRC_TARGET=$(TARGET_PROD) HTTP_PORT=$(HTTP_PORT) FRONT_CONTAINER_PORT=80 BACKEND_PORT=$(BACK_PORT) GAME_PORT=$(GAME_PORT) $(COMPOSE) up --build

docker-down: check-env
	@$(COMPOSE) down --remove-orphans

stop: docker-down

logs: check-env
	@$(COMPOSE) logs -f

docker-logs: logs

backend-logs: check-env
	@$(COMPOSE) logs -f --tail=200 backend

frontend-logs: check-env
	@$(COMPOSE) logs -f --tail=200 frontend

ps: check-env
	@$(COMPOSE) ps

seed: check-env
	@printf '%b\n' "$(YELLOW)Seeding database from 42 API...$(RESET)"
	@$(COMPOSE) --profile tools run --rm seed sh -c 'if [ -n "$(CAMPUS_ID)" ]; then export SEED_CAMPUS_ID="$(CAMPUS_ID)"; fi; if [ -n "$(API_CONCURRENCY)" ]; then export SEED_API_CONCURRENCY="$(API_CONCURRENCY)"; fi; if [ -n "$(API_RATE)" ]; then export SEED_API_RATE="$(API_RATE)"; fi; if [ "$(TEST_USERS)" = "1" ]; then TEST_FLAG=--test-users; fi; exec go run ./cmd/seed $(STARS) $$TEST_FLAG'
	@printf '%b\n' "$(GREEN)Seed complete.$(RESET)"

seed-stars:
	@$(MAKE) seed STARS=--stars

reseed: check-env
	@printf '%b\n' "$(YELLOW)Truncating user data...$(RESET)"
	@$(COMPOSE) exec -T postgres sh -c 'psql -U "$$POSTGRES_USER" -d "$$POSTGRES_DB" -c "TRUNCATE user_projects, user_cursus, user_inventories, users RESTART IDENTITY CASCADE;"'
	@$(MAKE) seed

reseed-stars: check-env
	@$(COMPOSE) exec -T postgres sh -c 'psql -U "$$POSTGRES_USER" -d "$$POSTGRES_DB" -c "TRUNCATE user_projects, user_cursus, user_inventories, users RESTART IDENTITY CASCADE;"'
	@$(MAKE) seed-stars

clean:
	@printf '%b\n' "$(YELLOW)Removing frontend dependencies and generated output...$(RESET)"
	@rm -rf $(FRONT_DIR)/node_modules $(FRONT_DIR)/dist $(BIN_DIR)

fclean: clean
	@$(COMPOSE) down --remove-orphans 2>/dev/null || true

purge-data: check-env
	@printf '%b\n' "$(RED)Stopping containers and deleting database volumes...$(RESET)"
	@$(COMPOSE) down --volumes --remove-orphans

re: fclean all

.PHONY: all help check-env install back-dev backend-build back-prod back-game-dev game-build game-prod front-dev front-build build front-preview \
	backend-test game-test frontend-check compose-config test check dev dev-prod \
	docker-build prod docker-up docker-down stop logs docker-logs backend-logs \
	frontend-logs ps seed seed-stars reseed reseed-stars clean fclean purge-data re
