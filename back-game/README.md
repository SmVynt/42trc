# 42trc Game Backend

Multiplayer game server for 42trc using Socket.IO and PostgreSQL.

## Setup

### 1. Install dependencies
```bash
cd back-game
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env with your PostgreSQL credentials
```

### 3. Database setup
Make sure PostgreSQL is running and create the database:
```bash
createdb 42trc_game
```

### 4. Run server
```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

Server will start on `http://localhost:5001`

## API Endpoints

- `GET /health` - Health check
- `GET /api/rooms` - List active rooms
- `POST /api/rooms` - Create new room

## Socket.IO Events

### From Client

**Join Room**
```javascript
socket.emit('player:join', {
  roomId: 1,
  username: 'player_name'
});
```

**Send Movement**
```javascript
socket.emit('player:move', {
  position: { x: 0, y: 0, z: 0 },
  rotation: { y: 0 }
});
```

**Send Action**
```javascript
socket.emit('player:action', {
  action: 'jump',
  payload: {}
});
```

### From Server

**Player Joined**
```javascript
socket.on('player:joined', (data) => {
  // data.playerId, data.username, data.playersInRoom
});
```

**Player Moved**
```javascript
socket.on('player:moved', (data) => {
  // data.playerId, data.position, data.rotation
});
```

**Room State**
```javascript
socket.on('room:state', (data) => {
  // data.roomId, data.players, data.timestamp
});
```

## Architecture

- `src/index.js` - Server entry point
- `src/services/database.js` - PostgreSQL connection pool
- `src/services/roomManager.js` - In-memory room state management
- `src/services/playerService.js` - Player database operations
- `src/handlers/socketHandlers.js` - Socket.IO event handlers

## Features

- Real-time player synchronization
- Room-based multiplayer
- PostgreSQL persistence
- RESTful API for room management
- Event logging
