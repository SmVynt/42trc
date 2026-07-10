# Transcendence

Transcendence is a cozy multiplayer web game focused on social interaction, character personalization, and shared spaces.

Players create their own accounts, customize their characters, and earn in-game currency through the 42 API based on their school points, projects, and achievements. That currency can then be spent on cosmetics and other customization options.

The game world is designed as a warm shared space where players can gather close to each other, explore the space, and chat in a public channel. It combines a lightweight social experience with progression, customization, and live multiplayer interaction.

## Project Overview

- Character customization in personal user accounts
- In-game currency earned from 42 school points and achievements through the 42 API
- Cosmetic items and customization options available for purchase
- A cozy 3D social space where players can meet and stay near each other
- Shared public chat for live communication between players

## Tech Stack

- Frontend: React, Three.js
- Backend: Node.js
- Database: PostgreSQL

## Getting Started

### 1. Installation
Install dependencies for the frontend and backends:
```bash
make install
```

### 2. Run the Development Stack
Start all services (frontend, backend, game-backend, and postgres database) in development mode:
```bash
make dev
```
Once started, the site will be available at [http://localhost:5173](http://localhost:5173).

### 3. Seed the Database
To populate the database with initial development mock data:
```bash
make seed
```

---

## Database Backup & Transfer

To copy/transfer your database between different development computers:

### Exporting the Database (on the source computer)
Generate a database dump file:
```bash
docker compose exec postgres pg_dump -U postgres -d 42trc_game > db_dump.sql
```

### Importing the Database (on the target computer)
Ensure the containers are running, then restore the dump file:
```bash
docker compose exec -T postgres psql -U postgres -d 42trc_game < db_dump.sql
```
