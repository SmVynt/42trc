const { Pool } = require('pg');

class DatabaseService {
  constructor(config) {
    this.pool = new Pool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    this.pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });
  }

  async initialize() {
    try {
      // Test connection
      const result = await this.pool.query('SELECT NOW()');
      console.log('PostgreSQL connected:', result.rows[0]);

      // Create tables if they don't exist
      await this.createTables();
    } catch (error) {
      console.error('Database initialization error:', error);
      throw error;
    }
  }

  async createTables() {
    const queries = [
      // Rooms table
      `CREATE TABLE IF NOT EXISTS rooms (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        max_players INT DEFAULT 4,
        player_count INT DEFAULT 0,
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      // Players table
      `CREATE TABLE IF NOT EXISTS players (
        id VARCHAR(255) PRIMARY KEY,
        room_id INT REFERENCES rooms(id) ON DELETE CASCADE,
        username VARCHAR(255),
        x FLOAT DEFAULT 0,
        y FLOAT DEFAULT 0,
        z FLOAT DEFAULT 0,
        rotation_y FLOAT DEFAULT 0,
        connected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      // Player sessions table for tracking
      `CREATE TABLE IF NOT EXISTS player_sessions (
        id SERIAL PRIMARY KEY,
        player_id VARCHAR(255) REFERENCES players(id) ON DELETE CASCADE,
        room_id INT REFERENCES rooms(id) ON DELETE CASCADE,
        join_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        leave_time TIMESTAMP
      )`,

      // Game events log (optional)
      `CREATE TABLE IF NOT EXISTS game_events (
        id SERIAL PRIMARY KEY,
        player_id VARCHAR(255) REFERENCES players(id) ON DELETE CASCADE,
        room_id INT REFERENCES rooms(id) ON DELETE CASCADE,
        event_type VARCHAR(50),
        event_data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`
    ];

    for (const query of queries) {
      try {
        await this.pool.query(query);
      } catch (error) {
        console.error('Table creation error:', error.message);
      }
    }
  }

  async query(text, params) {
    try {
      return await this.pool.query(text, params);
    } catch (error) {
      console.error('Query error:', error);
      throw error;
    }
  }

  async getClient() {
    return await this.pool.connect();
  }

  async close() {
    await this.pool.end();
  }
}

module.exports = DatabaseService;
