class RoomManager {
  constructor() {
    this.rooms = new Map(); // roomId -> { players: Map, state: {} }
    this.playerToRoom = new Map(); // playerId -> roomId
  }

  createRoom(roomId, roomData = {}) {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, {
        id: roomId,
        players: new Map(),
        createdAt: Date.now(),
        ...roomData
      });
      console.log(`[RoomManager] Created room: ${roomId}`);
    }
    return this.rooms.get(roomId);
  }

  addPlayerToRoom(playerId, roomId, playerData = {}) {
    let room = this.rooms.get(roomId);
    if (!room) {
      room = this.createRoom(roomId);
    }

    room.players.set(playerId, {
      id: playerId,
      position: { x: 0, y: 0, z: 0 },
      rotation: { y: 0 },
      joinedAt: Date.now(),
      ...playerData
    });

    this.playerToRoom.set(playerId, roomId);
    console.log(`[RoomManager] Added player ${playerId} to room ${roomId}. Total: ${room.players.size}`);
    return room;
  }

  removePlayer(playerId) {
    const roomId = this.playerToRoom.get(playerId);
    if (roomId) {
      const room = this.rooms.get(roomId);
      if (room) {
        room.players.delete(playerId);
        console.log(`[RoomManager] Removed player ${playerId} from room ${roomId}. Remaining: ${room.players.size}`);

        // Delete empty room
        if (room.players.size === 0) {
          this.rooms.delete(roomId);
          console.log(`[RoomManager] Deleted empty room ${roomId}`);
        }
      }
    }
    this.playerToRoom.delete(playerId);
  }

  updatePlayerPosition(playerId, position) {
    const roomId = this.playerToRoom.get(playerId);
    if (roomId) {
      const room = this.rooms.get(roomId);
      if (room && room.players.has(playerId)) {
        room.players.get(playerId).position = position;
      }
    }
  }

  updatePlayerRotation(playerId, rotation) {
    const roomId = this.playerToRoom.get(playerId);
    if (roomId) {
      const room = this.rooms.get(roomId);
      if (room && room.players.has(playerId)) {
        room.players.get(playerId).rotation = rotation;
      }
    }
  }

  getRoom(roomId) {
    return this.rooms.get(roomId);
  }

  getRoomPlayers(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) return [];
    
    return Array.from(room.players.values()).map(player => ({
      id: player.id,
      username: player.username || `player_${player.id.slice(0, 8)}`,
      position: player.position,
      rotation: player.rotation
    }));
  }

  getPlayerRoom(playerId) {
    return this.playerToRoom.get(playerId);
  }

  getAllRooms() {
    return Array.from(this.rooms.values()).map(room => ({
      id: room.id,
      playerCount: room.players.size,
      createdAt: room.createdAt
    }));
  }
}

module.exports = RoomManager;
