import { User } from '../types/user.types';
import { isPostgresAvailable } from '../config/postgres';
import { postgresRepository } from './postgres.repository';
import { inMemoryStore } from './in-memory.store';

export class UserRepository {
  async findByEmail(email: string): Promise<User | null> {
    const cleanEmail = email.toLowerCase().trim();

    if (isPostgresAvailable()) {
      try {
        const row = await postgresRepository.queryOne<any>(
          `SELECT id, email, password_hash as "passwordHash", first_name as "firstName",
                  last_name as "lastName", role, is_active as "isActive",
                  created_at as "createdAt", updated_at as "updatedAt"
           FROM users WHERE LOWER(email) = $1`,
          [cleanEmail]
        );
        if (row) {
          row.name = `${row.firstName} ${row.lastName}`.trim();
          return row as User;
        }
      } catch (err) {
        console.warn('Postgres findByEmail failed, using in-memory store:', err);
      }
    }

    const user = inMemoryStore.users.get(cleanEmail);
    return user || null;
  }

  async findById(id: string): Promise<User | null> {
    if (isPostgresAvailable()) {
      try {
        const row = await postgresRepository.queryOne<any>(
          `SELECT id, email, password_hash as "passwordHash", first_name as "firstName",
                  last_name as "lastName", role, is_active as "isActive",
                  created_at as "createdAt", updated_at as "updatedAt"
           FROM users WHERE id = $1`,
          [id]
        );
        if (row) {
          row.name = `${row.firstName} ${row.lastName}`.trim();
          return row as User;
        }
      } catch (err) {
        console.warn('Postgres findById failed, using in-memory store:', err);
      }
    }

    const user = inMemoryStore.users.get(id);
    return user || null;
  }

  async createUser(user: User): Promise<User> {
    if (isPostgresAvailable()) {
      try {
        const res = await postgresRepository.queryOne<any>(
          `INSERT INTO users (id, email, password_hash, first_name, last_name, role, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING id, email, password_hash as "passwordHash", first_name as "firstName",
                     last_name as "lastName", role, is_active as "isActive",
                     created_at as "createdAt", updated_at as "updatedAt"`,
          [
            user.id,
            user.email.toLowerCase(),
            user.passwordHash,
            user.firstName,
            user.lastName,
            user.role.toLowerCase(),
            user.isActive,
          ]
        );
        if (res) {
          res.name = `${res.firstName} ${res.lastName}`.trim();
          return res as User;
        }
      } catch (err) {
        console.warn('Postgres createUser failed, falling back to in-memory store:', err);
      }
    }

    inMemoryStore.users.set(user.id, user);
    inMemoryStore.users.set(user.email.toLowerCase(), user);
    return user;
  }

  async findAll(): Promise<User[]> {
    if (isPostgresAvailable()) {
      try {
        const rows = await postgresRepository.query<any>(
          `SELECT id, email, first_name as "firstName", last_name as "lastName",
                  role, is_active as "isActive", created_at as "createdAt"
           FROM users`
        );
        return rows.map(r => ({
          ...r,
          name: `${r.firstName} ${r.lastName}`.trim(),
        }));
      } catch (err) {
        console.warn('Postgres findAll failed, using in-memory store:', err);
      }
    }

    const set = new Set<string>();
    const result: User[] = [];
    for (const [, u] of inMemoryStore.users) {
      if (!set.has(u.id)) {
        set.add(u.id);
        result.push(u);
      }
    }
    return result;
  }
}

export const userRepository = new UserRepository();
