// PostgreSQL repository - stub
import { pgPool } from '../config/postgres';

export class PostgresRepository {
  async query<T = unknown>(sql: string, params?: unknown[]): Promise<T[]> {
    const { rows } = await pgPool.query(sql, params);
    return rows as T[];
  }

  async queryOne<T = unknown>(sql: string, params?: unknown[]): Promise<T | null> {
    const rows = await this.query<T>(sql, params);
    return rows[0] ?? null;
  }

  async execute(sql: string, params?: unknown[]): Promise<number> {
    const result = await pgPool.query(sql, params);
    return result.rowCount ?? 0;
  }

  async transaction<T>(fn: (repo: PostgresRepository) => Promise<T>): Promise<T> {
    const client = await pgPool.connect();
    try {
      await client.query('BEGIN');
      const result = await fn(this);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}

export const postgresRepository = new PostgresRepository();
