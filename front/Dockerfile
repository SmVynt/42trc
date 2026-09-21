# syntax=docker/dockerfile:1.7

# Frontend build stage
FROM node:22-alpine AS build
WORKDIR /app
ARG VITE_API_URL
ARG VITE_42_CLIENT_ID
ARG VITE_42_REDIRECT_URI
ARG VITE_42_SCOPE
ARG VITE_GAME_SERVER_URL
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_42_CLIENT_ID=$VITE_42_CLIENT_ID
ENV VITE_42_REDIRECT_URI=$VITE_42_REDIRECT_URI
ENV VITE_42_SCOPE=$VITE_42_SCOPE
ENV VITE_GAME_SERVER_URL=$VITE_GAME_SERVER_URL
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --no-audit --no-fund
COPY . .
RUN npm run build

# Development stage
FROM node:22-alpine AS development
WORKDIR /app
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --no-audit --no-fund
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]

# Production stage
FROM nginx:1.27-alpine AS production
COPY conf/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
