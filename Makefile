GREEN			= \033[0;32m
YELLOW			= \033[0;33m
BLUE			= \033[0;34m
RESET			= \033[0m

PROJECT			= transcendance
BACK_DIR		= back
FRONT_DIR		= front
COMPOSE_FILE	= docker-compose.yml

BACK_START		= npm start
BACK_PROD		= npm run start:prod
FRONT_DEV		= npm run dev
FRONT_BUILD		= npm run build
FRONT_PREVIEW	= npm run preview

all: install build

help:
	@echo "$(BLUE)$(PROJECT) available targets:$(RESET)"
	@echo "  make install       Install dependencies for backend and frontend"
	@echo "  make dev           Run backend and frontend in development mode"
	@echo "  make build         Build the frontend and prepare production assets"
	@echo "  make back-dev      Run the backend in development mode"
	@echo "  make front-dev     Run the frontend in development mode"
	@echo "  make docker-up     Start the stack with Docker Compose"
	@echo "  make docker-down   Stop the Docker Compose stack"
	@echo "  make clean         Remove local node_modules folders"
	@echo "  make fclean        Remove local dependencies and stop Docker containers"

install:
	@echo "$(YELLOW)Installing backend dependencies...$(RESET)"
	@cd $(BACK_DIR) && npm install
	@echo "$(YELLOW)Installing frontend dependencies...$(RESET)"
	@cd $(FRONT_DIR) && npm install
	@echo "$(GREEN)Dependencies installed.$(RESET)"

back-dev:
	@echo "$(YELLOW)Starting backend in development mode...$(RESET)"
	@cd $(BACK_DIR) && $(BACK_START)

back-prod:
	@echo "$(YELLOW)Starting backend in production mode...$(RESET)"
	@cd $(BACK_DIR) && $(BACK_PROD)

front-dev:
	@echo "$(YELLOW)Starting frontend in development mode...$(RESET)"
	@cd $(FRONT_DIR) && $(FRONT_DEV)

front-build:
	@echo "$(YELLOW)Building frontend...$(RESET)"
	@cd $(FRONT_DIR) && $(FRONT_BUILD)
	@echo "$(GREEN)Frontend build complete.$(RESET)"

front-preview:
	@echo "$(YELLOW)Previewing frontend production build...$(RESET)"
	@cd $(FRONT_DIR) && $(FRONT_PREVIEW)

dev: install
	@echo "$(BLUE)Starting the full development stack...$(RESET)"
	@printf '%s\n' "Use separate terminals for back-dev and front-dev, or replace this target with a custom runner if desired."

build: front-build
	@echo "$(GREEN)Project build complete.$(RESET)"

clean:
	@echo "$(YELLOW)Removing backend dependencies...$(RESET)"
	@rm -rf $(BACK_DIR)/node_modules
	@echo "$(YELLOW)Removing frontend dependencies...$(RESET)"
	@rm -rf $(FRONT_DIR)/node_modules
	@echo "$(GREEN)Local dependencies removed.$(RESET)"

fclean: clean
	@echo "$(YELLOW)Stopping Docker Compose services...$(RESET)"
	@docker compose -f $(COMPOSE_FILE) down --remove-orphans 2>/dev/null || true
	@echo "$(GREEN)Full cleanup complete.$(RESET)"

docker-up:
	@echo "$(YELLOW)Starting Docker Compose stack...$(RESET)"
	@docker compose -f $(COMPOSE_FILE) up --build

docker-down:
	@echo "$(YELLOW)Stopping Docker Compose stack...$(RESET)"
	@docker compose -f $(COMPOSE_FILE) down --remove-orphans

docker-logs:
	@docker compose -f $(COMPOSE_FILE) logs -f

re: fclean all

.PHONY: all help install back-dev back-prod front-dev front-build front-preview dev build clean fclean docker-up docker-down docker-logs re
