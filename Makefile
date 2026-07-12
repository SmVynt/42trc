GREEN			= \033[0;32m
YELLOW			= \033[0;33m
BLUE			= \033[0;34m
RESET			= \033[0m

PROJECT			= transcendence
BACK_DIR		= back
BACK_GAME_DIR	= back-game
FRONT_DIR		= front
COMPOSE_FILE	= docker-compose.yml

BACK_START		= npm start
BACK_PROD		= npm start
BACK_GAME_START	= go run .
FRONT_DEV		= npm run dev
FRONT_BUILD		= npm run build
FRONT_PREVIEW	= npm run preview
BACK_DEV_PORT	= 5001
BACK_GAME_PORT	= 5001
FRONT_DEV_PORT	= 5173
FRONT_API_URL	= http://localhost:5000
GAME_API_URL	= http://localhost:5001

TARGET_DEV		:= development
TARGET_PROD		:= production

POSTGRES_USER	:= root
POSTGRES_DB		:= transcendence

all: install build

help:
	@echo "$(BLUE)$(PROJECT) available targets:$(RESET)"
	@echo "  make install       Install dependencies for backend, game-server, and frontend"
	@echo "  make dev           Run the Docker-based development stack"
	@echo "  make dev-prod      Run the Docker-based development stack with production frontend (no double effect runs)"
	@echo "  make build         Build the frontend and prepare production assets"
	@echo "  make prod          Build production Docker image (Nginx)"
	@echo "  make back-dev      Run the backend in development mode"
	@echo "  make back-game-dev Run the game server in development mode (Go)"
	@echo "  make front-dev     Run the frontend in development mode"
	@echo "  make stop          Stop the Docker-based development stack"
	@echo "  make docker-up     Start the stack with Docker Compose"
	@echo "  make docker-down   Stop the Docker Compose stack"
	@echo "  make clean         Remove local node_modules folders"
	@echo "  make fclean        Remove local dependencies and stop Docker containers"

install:
	@echo "$(YELLOW)Installing backend dependencies...$(RESET)"
	@cd $(BACK_DIR) && go mod download
	@echo "$(YELLOW)Installing game-server dependencies...$(RESET)"
	@cd $(BACK_GAME_DIR) && go mod download
	@echo "$(YELLOW)Installing frontend dependencies...$(RESET)"
	@cd $(FRONT_DIR) && npm install
	@echo "$(GREEN)Dependencies installed.$(RESET)"

back-dev:
	@echo "$(YELLOW)Starting backend in development mode...$(RESET)"
	@cd $(BACK_DIR) && PORT=$(BACK_DEV_PORT) $(BACK_START)

back-game-dev:
	@echo "$(YELLOW)Starting game server in development mode (Go)...$(RESET)"
	@cd $(BACK_GAME_DIR) && PORT=$(BACK_GAME_PORT) go run .

back-prod:
	@echo "$(YELLOW)Starting backend in production mode...$(RESET)"
	@cd $(BACK_DIR) && $(BACK_PROD)

front-dev:
	@echo "$(YELLOW)Starting frontend in development mode...$(RESET)"
	@cd $(FRONT_DIR) && VITE_API_URL=$(FRONT_API_URL) $(FRONT_DEV) -- --port $(FRONT_DEV_PORT) --strictPort

front-build:
	@echo "$(YELLOW)Building frontend...$(RESET)"
	@cd $(FRONT_DIR) && $(FRONT_BUILD)
	@echo "$(GREEN)Frontend build complete.$(RESET)"

# cd /root/projects/42trc/front && npm run build 2>&1 | grep -E "✓|✗|error" && cd /root/projects/42trc && docker-compose restart frontend 2>&1 | tail -2

front-preview:
	@echo "$(YELLOW)Previewing frontend production build...$(RESET)"
	@cd $(FRONT_DIR) && $(FRONT_PREVIEW)

dev: stop
	@echo "$(BLUE)Starting the Docker-based development stack...$(RESET)"
	@NODE_ENV=development HTTP_PORT=$(FRONT_DEV_PORT) FRONT_CONTAINER_PORT=$(FRONT_DEV_PORT) TRC_TARGET=$(TARGET_DEV) docker compose --env-file .env -f $(COMPOSE_FILE) up -d --build
	@echo "$(GREEN)Site is running. Link: http://localhost:$(FRONT_DEV_PORT)$(RESET)"

dev-prod: stop
	@echo "$(BLUE)Starting the Docker-based development stack with production frontend...$(RESET)"
	@NODE_ENV=production HTTP_PORT=$(FRONT_DEV_PORT) FRONT_CONTAINER_PORT=80 TRC_TARGET=$(TARGET_PROD) docker compose --env-file .env -f $(COMPOSE_FILE) up -d --build
	@echo "$(GREEN)Site is running. Link: http://localhost:$(FRONT_DEV_PORT)$(RESET)"

stop:
	@echo "$(YELLOW)Stopping the Docker-based development stack...$(RESET)"
	@docker compose --env-file .env -f $(COMPOSE_FILE) down --remove-orphans
	@for port in $(BACK_DEV_PORT) $(FRONT_DEV_PORT); do \
		pids=$$(ss -ltnp "( sport = :$$port )" 2>/dev/null | awk 'match($$0, /pid=([0-9]+)/, m) { print m[1] }' | sort -u); \
		if [ -n "$$pids" ]; then \
			kill $$pids 2>/dev/null || true; \
		fi; \
	done
	@echo "$(GREEN)Development stack stopped.$(RESET)"

build: front-build
	@echo "$(GREEN)Project build complete.$(RESET)"

prod:
	@echo "$(BLUE)Building production Docker image...$(RESET)"
	@HTTP_PORT=80 FRONT_CONTAINER_PORT=80 TRC_TARGET=$(TARGET_PROD) docker compose --env-file .env -f $(COMPOSE_FILE) build frontend
	@echo "$(GREEN)Production image build complete.$(RESET)"

clean:
	@echo "$(YELLOW)Removing backend dependencies...$(RESET)"
	@rm -rf $(BACK_DIR)/node_modules
	@echo "$(YELLOW)Removing frontend dependencies...$(RESET)"
	@rm -rf $(FRONT_DIR)/node_modules
	@echo "$(GREEN)Local dependencies removed.$(RESET)"

fclean: clean
	@echo "$(YELLOW)Stopping Docker Compose services...$(RESET)"
	@docker compose --env-file .env -f $(COMPOSE_FILE) down --remove-orphans 2>/dev/null || true
	@echo "$(GREEN)Full cleanup complete.$(RESET)"

docker-up:
	@echo "$(YELLOW)Starting Docker Compose stack...$(RESET)"
	@export TRC_TARGET=$(TARGET_PROD)
	@docker compose --env-file .env -f $(COMPOSE_FILE) up --build

docker-down:
	@echo "$(YELLOW)Stopping Docker Compose stack...$(RESET)"
	@docker compose --env-file .env -f $(COMPOSE_FILE) down --remove-orphans

docker-logs:
	@docker compose --env-file .env -f $(COMPOSE_FILE) logs -f

backend-logs:
	@echo "$(YELLOW)Tailing backend logs...$(RESET)"
	@docker compose --env-file .env -f $(COMPOSE_FILE) logs -f --tail=200 backend

frontend-logs:
	@echo "$(YELLOW)Tailing frontend logs...$(RESET)"
	@docker compose --env-file .env -f $(COMPOSE_FILE) logs -f --tail=200 frontend

ps:
	@docker compose --env-file .env -f $(COMPOSE_FILE) ps
	
seed:
	@echo "$(YELLOW)Seeding database from 42 API...$(RESET)"
	@docker compose -f $(COMPOSE_FILE) run --rm seed go run ./cmd/seed $(STARS)
	@echo "$(GREEN)Seed complete.$(RESET)"

seed-stars:
	@$(MAKE) seed STARS=--stars

reseed:
	@echo "$(YELLOW)Truncating tables...$(RESET)"
	@docker compose --env-file .env -f $(COMPOSE_FILE) exec -T postgres psql -U $(POSTGRES_USER) -d $(POSTGRES_DB) -c "TRUNCATE user_projects, user_cursus, users RESTART IDENTITY CASCADE;"
	@$(MAKE) seed

reseed-stars:
	@echo "$(YELLOW)Truncating tables...$(RESET)"
	@docker compose --env-file .env -f $(COMPOSE_FILE) exec -T postgres psql -U $(POSTGRES_USER) -d $(POSTGRES_DB) -c "TRUNCATE user_projects, user_cursus, users RESTART IDENTITY CASCADE;"
	@$(MAKE) seed-stars

re: fclean all

.PHONY: all help install back-dev back-prod front-dev front-build front-preview dev dev-prod build clean fclean docker-up docker-down docker-logs backend-logs frontend-logs ps seed reseed re
