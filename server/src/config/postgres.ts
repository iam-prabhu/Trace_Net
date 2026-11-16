import { Pool } from 'pg';
import { env } from './env';

export const pgPool = new Pool({
  host: env.POSTGRES_HOST,
  port: env.POSTGRES_PORT,
  database: env.POSTGRES_DB,
  user: env.POSTGRES_USER,
  password: env.POSTGRES_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

let isPostgresConnected = false;

export function isPostgresAvailable(): boolean {
  return isPostgresConnected;
}

export async function connectPostgres(): Promise<boolean> {
  try {
    const client = await pgPool.connect();
    client.release();
    isPostgresConnected = true;
    console.log('✅ PostgreSQL connected');
    return true;
  } catch (err: any) {
    isPostgresConnected = false;
    console.warn('⚠️ PostgreSQL unavailable (' + (err.message || 'connection failed') + '). Falling back to In-Memory Data Store.');
    return false;
  }
}
