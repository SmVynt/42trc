class PlayerService {
  constructor(db) {
    this.db = db;
  }

  async createPlayer(playerId, username, roomId) {
    try {
      const result = await this.db.query(
        'INSERT INTO players (id, room_id, username) VALUES ($1, $2, $3) RETURNING *',
        [playerId, roomId, username]
      );
      console.log(`[PlayerService] Created player: ${playerId} in room ${roomId}`);
      return result.rows[0];
    } catch (error) {
      console.error('Error creating player:', error);
      throw error;
    }
  }

  async updatePlayerPosition(playerId, x, y, z) {
    try {
      await this.db.query(
        'UPDATE players SET x = $1, y = $2, z = $3, last_update = NOW() WHERE id = $4',
        [x, y, z, playerId]
      );
    } catch (error) {
      console.error('Error updating player position:', error);
    }
  }

  async updatePlayerRotation(playerId, rotationY) {
    try {
      await this.db.query(
        'UPDATE players SET rotation_y = $1, last_update = NOW() WHERE id = $2',
        [rotationY, playerId]
      );
    } catch (error) {
      console.error('Error updating player rotation:', error);
    }
  }

  async getPlayer(playerId) {
    try {
      const result = await this.db.query(
        'SELECT * FROM players WHERE id = $1',
        [playerId]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error getting player:', error);
      return null;
    }
  }

  async getRoomPlayers(roomId) {
    try {
      const result = await this.db.query(
        'SELECT id, username, x, y, z, rotation_y FROM players WHERE room_id = $1 AND id IS NOT NULL',
        [roomId]
      );
      return result.rows;
    } catch (error) {
      console.error('Error getting room players:', error);
      return [];
    }
  }

  async removePlayer(playerId) {
    try {
      await this.db.query(
        'DELETE FROM players WHERE id = $1',
        [playerId]
      );
      console.log(`[PlayerService] Removed player: ${playerId}`);
    } catch (error) {
      console.error('Error removing player:', error);
    }
  }

  async logPlayerEvent(playerId, roomId, eventType, eventData) {
    try {
      await this.db.query(
        'INSERT INTO game_events (player_id, room_id, event_type, event_data) VALUES ($1, $2, $3, $4)',
        [playerId, roomId, eventType, JSON.stringify(eventData)]
      );
    } catch (error) {
      console.error('Error logging event:', error);
    }
  }
}

module.exports = PlayerService;
