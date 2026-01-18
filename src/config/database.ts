import dotenv from 'dotenv';

dotenv.config();

export interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  url?: string;
}

/**
 * Build database configuration from environment variables
 * Supports both connection string and individual components
 */
export function buildDatabaseConfig(): DatabaseConfig {
  // Check if connection URL is provided
  const connectionUrl = process.env.DATABASE_URL || process.env.DB_URL;

  if (connectionUrl) {
    // Parse connection URL
    const parsed = parseConnectionUrl(connectionUrl);
    return {
      ...parsed,
      url: connectionUrl,
    };
  }

  // Fall back to individual components
  return {
    host: process.env.DB_HOST || process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || process.env.DATABASE_PORT || '5432', 10),
    user: process.env.DB_USER || process.env.DATABASE_USER || 'postgres',
    password: process.env.DB_PASSWORD || process.env.DATABASE_PASSWORD || 'password',
    database: process.env.DB_NAME || process.env.DATABASE_NAME || 'notification_db',
  };
}

/**
 * Parse PostgreSQL connection URL
 * Format: postgresql://user:password@host:port/database
 * or: postgres://user:password@host:port/database
 * or: mysql://user:password@host:port/database
 */
function parseConnectionUrl(url: string): Omit<DatabaseConfig, 'url'> {
  try {
    const parsed = new URL(url);

    const host = parsed.hostname || 'localhost';
    const port = parsed.port ? parseInt(parsed.port, 10) : getDefaultPort(parsed.protocol);
    const user = parsed.username || 'postgres';
    const password = parsed.password || '';
    const database = parsed.pathname?.replace(/^\//, '') || 'notification_db';

    return {
      host,
      port,
      user,
      password,
      database,
    };
  } catch (error) {
    throw new Error(`Invalid database connection URL: ${url}`);
  }
}

/**
 * Get default port based on database protocol
 */
function getDefaultPort(protocol: string): number {
  const defaults: Record<string, number> = {
    'postgresql:': 5432,
    'postgres:': 5432,
    'mysql:': 3306,
    'mariadb:': 3306,
    'mongodb:': 27017,
  };

  return defaults[protocol] || 5432;
}

/**
 * Format config back to connection string (for reference)
 */
export function formatConnectionString(config: DatabaseConfig): string {
  if (config.url) {
    return config.url;
  }

  return `postgresql://${config.user}:${config.password}@${config.host}:${config.port}/${config.database}`;
}

export default buildDatabaseConfig;
