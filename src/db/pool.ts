import { Pool, QueryResult } from 'pg';
import logger from '../logger';
import { buildDatabaseConfig, formatConnectionString } from '../config/database';

export class DatabasePool {
  private pool: Pool;
  private isConnected: boolean = false;

  constructor() {
    const config = buildDatabaseConfig();

    this.pool = new Pool({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: config.database,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    this.pool.on('error', (err: Error) => {
      logger.error('Unexpected error on idle client', {
        source: 'DATABASE',
        error: err,
        timestamp: new Date().toISOString(),
      });
    });
  }

  /**
   * Connect to the database
   */
  async connect(): Promise<void> {
    try {
      const config = buildDatabaseConfig();
      const connectionString = formatConnectionString(config);

      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();

      this.isConnected = true;

      logger.info('Database connection established', {
        source: 'DATABASE',
        host: config.host,
        port: config.port,
        database: config.database,
        connectionString: connectionString.replace(config.password, '****'),
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.isConnected = false;
      logger.error('Failed to connect to database', {
        source: 'DATABASE',
        error,
        timestamp: new Date().toISOString(),
      });
      throw error;
    }
  }

  /**
   * Execute a query
   */
  async query(sql: string, values?: any[]): Promise<QueryResult<any>> {
    try {
      return await this.pool.query<any>(sql, values);
    } catch (error) {
      logger.error('Database query error', {
        source: 'DATABASE',
        error,
        timestamp: new Date().toISOString(),
      });
      throw error;
    }
  }

  /**
   * Check if connected
   */
  isHealthy(): boolean {
    return this.isConnected;
  }

  /**
   * Disconnect from the database
   */
  async disconnect(): Promise<void> {
    try {
      await this.pool.end();
      this.isConnected = false;

      logger.info('Database connection closed', {
        source: 'DATABASE',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Error closing database connection', {
        source: 'DATABASE',
        error,
        timestamp: new Date().toISOString(),
      });
      throw error;
    }
  }
}

export const dbPool = new DatabasePool();

export default DatabasePool;
