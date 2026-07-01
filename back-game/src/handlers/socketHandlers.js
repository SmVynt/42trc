// Socket.IO Event Handlers
function registerHandlers(socket, io, roomManager, playerService, db) {
  // Player joins a room
  socket.on('player:join', async (data) => {
    try {
      const { roomId, username } = data;
      console.log(`[Handler] Player ${socket.id} joining room ${roomId} as ${username}`);

      // Join socket room
      socket.join(`room:${roomId}`);

      // Create player in room manager
      roomManager.addPlayerToRoom(socket.id, roomId, { username });

      // Save to database
      await playerService.createPlayer(socket.id, username, roomId);

      // Get all players in room
      const playersInRoom = roomManager.getRoomPlayers(roomId);

      // Tell everyone in room about new player
      io.to(`room:${roomId}`).emit('player:joined', {
        playerId: socket.id,
        username: username,
        playersInRoom: playersInRoom
      });

      // Send current players to new player
      socket.emit('room:players', playersInRoom);

      console.log(`[Handler] Player ${socket.id} joined room ${roomId}. Total players: ${playersInRoom.length}`);
    } catch (error) {
      console.error('Error joining room:', error);
      socket.emit('error', { message: 'Failed to join room' });
    }
  });

  // Player movement update
  socket.on('player:move', async (data) => {
    try {
      const { position, rotation } = data;
      const roomId = roomManager.getPlayerRoom(socket.id);

      if (roomId) {
        // Update in memory
        roomManager.updatePlayerPosition(socket.id, position);
        roomManager.updatePlayerRotation(socket.id, rotation);

        // Update in database (async, don't await)
        playerService.updatePlayerPosition(socket.id, position.x, position.y, position.z);
        playerService.updatePlayerRotation(socket.id, rotation.y);

        // Broadcast to other players in room
        socket.to(`room:${roomId}`).emit('player:moved', {
          playerId: socket.id,
          position,
          rotation
        });
      }
    } catch (error) {
      console.error('Error handling player move:', error);
    }
  });

  // Player uses action (jump, attack, etc)
  socket.on('player:action', async (data) => {
    try {
      const { action, payload } = data;
      const roomId = roomManager.getPlayerRoom(socket.id);

      if (roomId) {
        // Log event
        await playerService.logPlayerEvent(socket.id, roomId, `action:${action}`, payload);

        // Broadcast action to room
        io.to(`room:${roomId}`).emit('player:action', {
          playerId: socket.id,
          action,
          payload
        });
      }
    } catch (error) {
      console.error('Error handling player action:', error);
    }
  });

  // Get room state
  socket.on('room:getState', (data) => {
    try {
      const { roomId } = data;
      const playersInRoom = roomManager.getRoomPlayers(roomId);

      socket.emit('room:state', {
        roomId,
        players: playersInRoom,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Error getting room state:', error);
    }
  });

  // Chat message in room
  socket.on('room:chat', (data) => {
    try {
      const { message } = data;
      const roomId = roomManager.getPlayerRoom(socket.id);

      if (roomId) {
        io.to(`room:${roomId}`).emit('room:message', {
          playerId: socket.id,
          message,
          timestamp: Date.now()
        });
      }
    } catch (error) {
      console.error('Error sending chat message:', error);
    }
  });

  // Ping/Pong for connection check
  socket.on('ping', () => {
    socket.emit('pong', { timestamp: Date.now() });
  });
}

module.exports = {
  registerHandlers
};
