require('dotenv').config();

const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const DatabaseService = require('./services/database');
const RoomManager = require('./services/roomManager');
const PlayerService = require('./services/playerService');
const socketHandlers = require('./handlers/socketHandlers');

const app = express();
const httpServer = createServer(app);

// Parse frontend URL to get origin (remove path/query)
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
const frontendOrigin = new URL(frontendUrl).origin;

const io = new Server(httpServer, {
  cors: {
    origin: frontendOrigin,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: frontendOrigin,
  credentials: true
}));
app.use(express.json());

// Initialize Services
const db = new DatabaseService({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || '42trc_game',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres'
});

const roomManager = new RoomManager();
const playerService = new PlayerService(db);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', server: 'back-game', timestamp: new Date().toISOString() });
});

// REST API endpoints
app.get('/api/rooms', async (req, res) => {
  try {
    const rooms = await db.query('SELECT id, name, player_count, max_players FROM rooms WHERE active = true');
    res.json(rooms.rows);
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/rooms', async (req, res) => {
  try {
    const { name, max_players = 4 } = req.body;
    const result = await db.query(
      'INSERT INTO rooms (name, max_players, active) VALUES ($1, $2, true) RETURNING id, name',
      [name, max_players]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Socket.IO Connection Handler
io.on('connection', (socket) => {
  console.log(`[Socket] Player connected: ${socket.id}`);

  // Register Socket handlers
  socketHandlers.registerHandlers(socket, io, roomManager, playerService, db);

  socket.on('disconnect', async () => {
    console.log(`[Socket] Player disconnected: ${socket.id}`);
    await playerService.removePlayer(socket.id);
    roomManager.removePlayer(socket.id);
  });
});

// Initialize Database and Start Server
async function start() {
  try {
    await db.initialize();
    console.log('✅ Database connected');

    const PORT = process.env.PORT || 5001;
    httpServer.listen(PORT, () => {
      console.log(`🎮 Game server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

start();

module.exports = { app, io, roomManager, playerService };
