import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database configuration
const POSTGRES_HOST = process.env.POSTGRES_HOST || 'localhost';
const POSTGRES_PORT = parseInt(process.env.POSTGRES_PORT || '5432', 10);
const POSTGRES_DB = process.env.POSTGRES_DB || 'frauddb';
const POSTGRES_USER = process.env.POSTGRES_USER || 'frauduser';
const POSTGRES_PASSWORD = process.env.POSTGRES_PASSWORD || 'fraudpass123';

export interface SeedUser {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'INVESTIGATOR' | 'VIEWER';
}

export const SAMPLE_USERS: SeedUser[] = [
  {
    id: 'a0000000-0000-0000-0000-000000000001',
    email: 'admin@fraudconsole.internal',
    password: 'Admin@123',
    firstName: 'Sarah',
    lastName: 'Lin',
    role: 'ADMIN',
  },
  {
    id: 'a0000000-0000-0000-0000-000000000002',
    email: 'investigator@fraudconsole.internal',
    password: 'Investigator@123',
    firstName: 'Marcus',
    lastName: 'Vance',
    role: 'INVESTIGATOR',
  },
  {
    id: 'a0000000-0000-0000-0000-000000000003',
    email: 'elena@fraudconsole.internal',
    password: 'Investigator@123',
    firstName: 'Elena',
    lastName: 'Rostova',
    role: 'INVESTIGATOR',
  },
  {
    id: 'a0000000-0000-0000-0000-000000000004',
    email: 'viewer@fraudconsole.internal',
    password: 'Viewer@123',
    firstName: 'Dave',
    lastName: 'Observer',
    role: 'VIEWER',
  },
];

export const SAMPLE_INVESTIGATIONS = [
  {
    id: 'b0000000-0000-0000-0000-000000000001',
    title: 'Operation Hydration: Circular Wire Routing Ring',
    description: 'Investigation into 3-hop and 4-hop circular funds routed between shell corporations in Panama, Cayman Islands, Belize, and Swiss accounts with layering depletion.',
    status: 'in_progress',
    createdBy: 'a0000000-0000-0000-0000-000000000001', // Sarah Lin
    assignedTo: 'a0000000-0000-0000-0000-000000000002', // Marcus Vance
    nodeIds: [
      'ACC-CYCLE-01', 'ACC-CYCLE-02', 'ACC-CYCLE-03',
      'ACC-RING-01', 'ACC-RING-02', 'ACC-RING-03', 'ACC-RING-04',
    ],
  },
  {
    id: 'b0000000-0000-0000-0000-000000000002',
    title: 'Project Micro-Wave: Sub-$10,000 Fan-In Structuring Influx',
    description: 'Detection of 10 coordinated mule accounts depositing amounts just under BSA CTR limits ($9,150 - $9,900) into single aggregator entity within 48 hours.',
    status: 'open',
    createdBy: 'a0000000-0000-0000-0000-000000000002', // Marcus Vance
    assignedTo: 'a0000000-0000-0000-0000-000000000003', // Elena Rostova
    nodeIds: [
      'ACC-SMURF-AGG-01', 'ACC-SMURF-01', 'ACC-SMURF-02', 'ACC-SMURF-03',
      'ACC-SMURF-04', 'ACC-SMURF-05', 'ACC-SMURF-06', 'ACC-SMURF-07',
      'ACC-SMURF-08', 'ACC-SMURF-09', 'ACC-SMURF-10',
    ],
  },
  {
    id: 'b0000000-0000-0000-0000-000000000003',
    title: 'Syndicate Beta: Mediterranean-Asian High-Density Entity Mesh',
    description: 'High-density inter-entity cluster showing abnormal internal transaction density and cyclical capital wash across Mediterranean and Asian banking jurisdictions.',
    status: 'open',
    createdBy: 'a0000000-0000-0000-0000-000000000001', // Sarah Lin
    assignedTo: 'a0000000-0000-0000-0000-000000000001', // Sarah Lin
    nodeIds: [
      'ACC-COMM2-01', 'ACC-COMM2-02', 'ACC-COMM2-03', 'ACC-COMM2-04',
      'ACC-COMM2-05', 'ACC-COMM2-06', 'ACC-COMM2-07', 'ACC-COMM2-08',
    ],
  },
];

export const SAMPLE_FINDINGS = [
  {
    id: 'c0000000-0000-0000-0000-000000000001',
    investigationId: 'b0000000-0000-0000-0000-000000000001',
    title: 'Closed 3-Hop Cycle: ACC-CYCLE-01 -> ACC-CYCLE-02 -> ACC-CYCLE-03 -> ACC-CYCLE-01',
    description: 'Cyclical flow identified across ACC-CYCLE-01 -> ACC-CYCLE-02 -> ACC-CYCLE-03 -> ACC-CYCLE-01 totaling $141,700 within 22 hours.',
    severity: 'critical',
    status: 'confirmed',
    nodeIds: ['ACC-CYCLE-01', 'ACC-CYCLE-02', 'ACC-CYCLE-03'],
    edgeIds: ['TXN-CYC1-001', 'TXN-CYC1-002', 'TXN-CYC1-003'],
    metadata: {
      pattern: 'CIRCULAR_ROUTING',
      hops: 3,
      totalVolume: 141700,
      confidence: 0.98,
    },
    createdBy: 'a0000000-0000-0000-0000-000000000002', // Marcus Vance
  },
  {
    id: 'c0000000-0000-0000-0000-000000000002',
    investigationId: 'b0000000-0000-0000-0000-000000000002',
    title: 'High-Velocity Structuring Influx ($95.5k across 10 mule accounts)',
    description: '10 mule accounts deposited amounts between $9,150 and $9,900 into single aggregator ACC-SMURF-AGG-01 within 48 hours.',
    severity: 'high',
    status: 'confirmed',
    nodeIds: ['ACC-SMURF-AGG-01', 'ACC-SMURF-01', 'ACC-SMURF-02', 'ACC-SMURF-03', 'ACC-SMURF-04', 'ACC-SMURF-05'],
    edgeIds: ['TXN-SMURF-001', 'TXN-SMURF-002', 'TXN-SMURF-003'],
    metadata: {
      pattern: 'SMURFING_FAN_IN',
      muleCount: 10,
      totalVolume: 95550,
      confidence: 0.95,
    },
    createdBy: 'a0000000-0000-0000-0000-000000000003', // Elena Rostova
  },
  {
    id: 'c0000000-0000-0000-0000-000000000003',
    investigationId: 'b0000000-0000-0000-0000-000000000001',
    title: 'Cross-Border 4-Stage Crypto-Fiat Roundtrip Ring',
    description: '4-stage cross-border carousel cycling $85k through shell company, crypto exchange, and European escrow.',
    severity: 'critical',
    status: 'pending',
    nodeIds: ['ACC-RING-01', 'ACC-RING-02', 'ACC-RING-03', 'ACC-RING-04'],
    edgeIds: ['TXN-CYC2-001', 'TXN-CYC2-002', 'TXN-CYC2-003', 'TXN-CYC2-004'],
    metadata: {
      pattern: 'CIRCULAR_ROUTING',
      hops: 4,
      totalVolume: 330300,
      confidence: 0.96,
    },
    createdBy: 'a0000000-0000-0000-0000-000000000001', // Sarah Lin
  },
];

export const SAMPLE_NOTES = [
  {
    id: 'd0000000-0000-0000-0000-000000000001',
    investigationId: 'b0000000-0000-0000-0000-000000000001',
    content: 'Subpoena issued for Shell Co bank records in Panama. Corresponding Swiss account shows incoming matching balance.',
    authorId: 'a0000000-0000-0000-0000-000000000002', // Marcus Vance
    isPinned: true,
  },
  {
    id: 'd0000000-0000-0000-0000-000000000002',
    investigationId: 'b0000000-0000-0000-0000-000000000002',
    content: 'Aggregator account ACC-SMURF-AGG-01 opened 14 days prior to first structuring transaction. High likelihood of shell entity.',
    authorId: 'a0000000-0000-0000-0000-000000000003', // Elena Rostova
    isPinned: true,
  },
  {
    id: 'd0000000-0000-0000-0000-000000000003',
    investigationId: 'b0000000-0000-0000-0000-000000000001',
    content: 'SAR (Suspicious Activity Report) filed with FinCEN reference #SAR-2026-9921-X.',
    authorId: 'a0000000-0000-0000-0000-000000000001', // Sarah Lin
    isPinned: false,
  },
];

export async function seedPostgres(): Promise<{
  success: boolean;
  usersSeeded: number;
  investigationsSeeded: number;
  findingsSeeded: number;
  notesSeeded: number;
}> {
  console.log(`\nConnecting to PostgreSQL at ${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}...`);

  const pool = new Pool({
    host: POSTGRES_HOST,
    port: POSTGRES_PORT,
    database: POSTGRES_DB,
    user: POSTGRES_USER,
    password: POSTGRES_PASSWORD,
    connectionTimeoutMillis: 2500,
  });

  let client: any = null;
  try {
    client = await pool.connect();
    console.log('✅ PostgreSQL connection verified successfully.');

    // 1. Run migrations in order
    const migrationsDir = path.resolve(__dirname, '../postgres/migrations');
    if (fs.existsSync(migrationsDir)) {
      console.log(`Running database migrations from ${migrationsDir}...`);
      const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
      for (const file of files) {
        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
        await client.query(sql);
      }
      console.log(`✅ Applied ${files.length} SQL migrations.`);
    }

    // 2. Seed Users
    console.log(`Seeding ${SAMPLE_USERS.length} sample users with hashed credentials...`);
    let usersSeeded = 0;
    for (const u of SAMPLE_USERS) {
      const passwordHash = await bcrypt.hash(u.password, 10);
      const query = `
        INSERT INTO users (id, email, password_hash, first_name, last_name, role, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, true)
        ON CONFLICT (email) DO UPDATE SET
          password_hash = EXCLUDED.password_hash,
          first_name = EXCLUDED.first_name,
          last_name = EXCLUDED.last_name,
          role = EXCLUDED.role,
          is_active = true
        RETURNING id;
      `;
      await client.query(query, [u.id, u.email, passwordHash, u.firstName, u.lastName, u.role]);
      usersSeeded++;
    }
    console.log(`✅ Seeded ${usersSeeded} users:`);
    SAMPLE_USERS.forEach(u => console.log(`   - ${u.email} (${u.role}) -> password: ${u.password}`));

    // 3. Seed Investigations
    console.log(`Seeding ${SAMPLE_INVESTIGATIONS.length} sample investigations...`);
    let investigationsSeeded = 0;
    for (const inv of SAMPLE_INVESTIGATIONS) {
      const query = `
        INSERT INTO investigations (id, title, description, status, created_by, assigned_to, node_ids)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          description = EXCLUDED.description,
          status = EXCLUDED.status,
          assigned_to = EXCLUDED.assigned_to,
          node_ids = EXCLUDED.node_ids;
      `;
      await client.query(query, [
        inv.id, inv.title, inv.description, inv.status,
        inv.createdBy, inv.assignedTo, inv.nodeIds,
      ]);
      investigationsSeeded++;
    }
    console.log(`✅ Seeded ${investigationsSeeded} investigations.`);

    // 4. Seed Findings
    console.log(`Seeding ${SAMPLE_FINDINGS.length} sample findings...`);
    let findingsSeeded = 0;
    for (const f of SAMPLE_FINDINGS) {
      const query = `
        INSERT INTO findings (id, investigation_id, title, description, severity, status, node_ids, edge_ids, metadata, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          description = EXCLUDED.description,
          severity = EXCLUDED.severity,
          status = EXCLUDED.status,
          node_ids = EXCLUDED.node_ids,
          edge_ids = EXCLUDED.edge_ids,
          metadata = EXCLUDED.metadata;
      `;
      await client.query(query, [
        f.id, f.investigationId, f.title, f.description,
        f.severity, f.status, f.nodeIds, f.edgeIds,
        JSON.stringify(f.metadata), f.createdBy,
      ]);
      findingsSeeded++;
    }
    console.log(`✅ Seeded ${findingsSeeded} findings.`);

    // 5. Seed Notes
    console.log(`Seeding ${SAMPLE_NOTES.length} sample notes...`);
    let notesSeeded = 0;
    for (const n of SAMPLE_NOTES) {
      const query = `
        INSERT INTO notes (id, investigation_id, content, author_id, is_pinned)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (id) DO UPDATE SET
          content = EXCLUDED.content,
          is_pinned = EXCLUDED.is_pinned;
      `;
      await client.query(query, [n.id, n.investigationId, n.content, n.authorId, n.isPinned]);
      notesSeeded++;
    }
    console.log(`✅ Seeded ${notesSeeded} notes.`);

    // 6. Seed Dataset Record
    const datasetQuery = `
      INSERT INTO datasets (id, name, description, file_path, status, record_count, node_count, edge_count, uploaded_by)
      VALUES (
        'e0000000-0000-0000-0000-000000000001',
        'Default Synthetic Banking Network',
        'Comprehensive 700-node graph with circular routes, smurfing, and layering corridors.',
        'database/seed/default_dataset.json',
        'ready',
        3900,
        700,
        3200,
        $1
      )
      ON CONFLICT (id) DO UPDATE SET status = 'ready';
    `;
    await client.query(datasetQuery, [SAMPLE_USERS[0].id]);
    console.log('✅ Seeded default dataset record in PostgreSQL.');

    return {
      success: true,
      usersSeeded,
      investigationsSeeded,
      findingsSeeded,
      notesSeeded,
    };
  } catch (error: any) {
    console.warn(`⚠️ PostgreSQL seeding notice: Could not connect to PostgreSQL (${error.message || error}).`);
    console.warn('   The server will operate in high-performance in-memory mode using database/seed/default_dataset.json.');
    return {
      success: false,
      usersSeeded: 0,
      investigationsSeeded: 0,
      findingsSeeded: 0,
      notesSeeded: 0,
    };
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

// Direct execution entrypoint
const isMain = Boolean(
  process.argv[1] &&
  (process.argv[1] === __filename || process.argv[1].endsWith('seed_postgres.ts'))
);

if (isMain) {
  seedPostgres()
    .then((result) => {
      console.log(`PostgreSQL seed process exited cleanly (success=${result.success}).`);
    })
    .catch((err) => {
      console.error('Unexpected error in seed_postgres:', err);
    });
}
