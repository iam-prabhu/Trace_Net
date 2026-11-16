import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import neo4j, { Driver, Session } from 'neo4j-driver';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Connection configuration
const NEO4J_URI = process.env.NEO4J_URI || 'bolt://localhost:7687';
const NEO4J_USERNAME = process.env.NEO4J_USERNAME || 'neo4j';
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || 'frauddetect123';

export async function seedNeo4j(datasetPath?: string): Promise<{ success: boolean; accountsSeeded: number; relationshipsSeeded: number }> {
  console.log(`\nConnecting to Neo4j at ${NEO4J_URI}...`);

  const driver: Driver = neo4j.driver(
    NEO4J_URI,
    neo4j.auth.basic(NEO4J_USERNAME, NEO4J_PASSWORD),
    {
      connectionTimeout: 3000,
      maxConnectionLifetime: 30 * 60 * 1000,
    }
  );

  let session: Session | null = null;
  try {
    await driver.verifyConnectivity();
    console.log('✅ Neo4j connection verified successfully.');

    session = driver.session();

    // 1. Load dataset
    const resolvedPath = datasetPath || path.join(__dirname, 'default_dataset.json');
    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`Dataset file not found at ${resolvedPath}. Run generate_dataset first.`);
    }

    const rawData = fs.readFileSync(resolvedPath, 'utf-8');
    const dataset = JSON.parse(rawData);
    const { accounts, transactions } = dataset;

    console.log(`Loaded dataset with ${accounts.length} accounts and ${transactions.length} transactions.`);

    // 2. Create constraints & indexes
    console.log('Ensuring Neo4j constraints and indexes...');
    const constraintQueries = [
      `CREATE CONSTRAINT account_id_unique IF NOT EXISTS FOR (a:Account) REQUIRE a.id IS UNIQUE`,
      `CREATE CONSTRAINT transaction_id_unique IF NOT EXISTS FOR (t:Transaction) REQUIRE t.id IS UNIQUE`,
      `CREATE INDEX account_risk_idx IF NOT EXISTS FOR (a:Account) ON (a.riskScore)`,
      `CREATE INDEX account_status_idx IF NOT EXISTS FOR (a:Account) ON (a.status)`,
      `CREATE INDEX account_type_idx IF NOT EXISTS FOR (a:Account) ON (a.accountType)`,
      `CREATE INDEX account_name_idx IF NOT EXISTS FOR (a:Account) ON (a.ownerName)`,
      `CREATE INDEX transaction_amount_idx IF NOT EXISTS FOR (t:Transaction) ON (t.amount)`,
      `CREATE INDEX transaction_timestamp_idx IF NOT EXISTS FOR (t:Transaction) ON (t.timestamp)`,
      `CREATE INDEX transaction_status_idx IF NOT EXISTS FOR (t:Transaction) ON (t.status)`,
    ];

    for (const q of constraintQueries) {
      try {
        await session.run(q);
      } catch (err: any) {
        // Continue if constraint already exists or warning
      }
    }

    // 3. Clean previous graph data if needed
    console.log('Clearing existing Account and Transaction nodes...');
    await session.run(`MATCH (a:Account) DETACH DELETE a`);
    await session.run(`MATCH (t:Transaction) DETACH DELETE t`);

    // 4. Batch insert Account nodes
    console.log(`Seeding ${accounts.length} Account nodes in batches...`);
    const accountBatchSize = 250;
    for (let i = 0; i < accounts.length; i += accountBatchSize) {
      const batch = accounts.slice(i, i + accountBatchSize).map((acc: any) => ({
        id: acc.accountId,
        accountType: acc.accountType,
        riskScore: Number(acc.riskScore),
        status: acc.status,
        balance: Number(acc.balance),
        createdAt: acc.createdAt,
        ownerName: acc.ownerName,
        country: acc.country,
        email: acc.email || null,
      }));

      await session.run(
        `
        UNWIND $batch AS acc
        CREATE (a:Account {
          id: acc.id,
          accountId: acc.id,
          accountType: acc.accountType,
          riskScore: acc.riskScore,
          status: acc.status,
          balance: acc.balance,
          createdAt: acc.createdAt,
          ownerName: acc.ownerName,
          country: acc.country,
          email: acc.email
        })
        `,
        { batch }
      );
    }
    console.log(`✅ ${accounts.length} Account nodes created.`);

    // 5. Batch insert TRANSFERRED_TO relationships
    console.log(`Seeding ${transactions.length} TRANSFERRED_TO relationships in batches...`);
    const txnBatchSize = 500;
    for (let i = 0; i < transactions.length; i += txnBatchSize) {
      const batch = transactions.slice(i, i + txnBatchSize).map((tx: any) => ({
        id: tx.transactionId,
        senderAccountId: tx.senderAccountId,
        receiverAccountId: tx.receiverAccountId,
        amount: Number(tx.amount),
        timestamp: tx.timestamp,
        transactionType: tx.transactionType,
        status: tx.status,
      }));

      await session.run(
        `
        UNWIND $batch AS tx
        MATCH (s:Account {id: tx.senderAccountId})
        MATCH (r:Account {id: tx.receiverAccountId})
        CREATE (s)-[rel:TRANSFERRED_TO {
          id: tx.id,
          transactionId: tx.id,
          amount: tx.amount,
          timestamp: tx.timestamp,
          transactionType: tx.transactionType,
          status: tx.status
        }]->(r)
        `,
        { batch }
      );
    }
    console.log(`✅ ${transactions.length} TRANSFERRED_TO relationships created.`);

    // Also create Transaction nodes for graph indexing / queries
    console.log(`Seeding Transaction nodes for direct indexing...`);
    for (let i = 0; i < transactions.length; i += txnBatchSize) {
      const batch = transactions.slice(i, i + txnBatchSize).map((tx: any) => ({
        id: tx.transactionId,
        senderAccountId: tx.senderAccountId,
        receiverAccountId: tx.receiverAccountId,
        amount: Number(tx.amount),
        timestamp: tx.timestamp,
        transactionType: tx.transactionType,
        status: tx.status,
      }));

      await session.run(
        `
        UNWIND $batch AS tx
        CREATE (t:Transaction {
          id: tx.id,
          transactionId: tx.id,
          senderAccountId: tx.senderAccountId,
          receiverAccountId: tx.receiverAccountId,
          amount: tx.amount,
          timestamp: tx.timestamp,
          transactionType: tx.transactionType,
          status: tx.status
        })
        `,
        { batch }
      );
    }

    console.log('✅ Neo4j database seeded successfully.');
    return {
      success: true,
      accountsSeeded: accounts.length,
      relationshipsSeeded: transactions.length,
    };
  } catch (error: any) {
    console.warn(`⚠️ Neo4j seeding notice: Could not connect to Neo4j (${error.message || error}).`);
    console.warn('   The server will operate in high-performance in-memory mode using database/seed/default_dataset.json.');
    return {
      success: false,
      accountsSeeded: 0,
      relationshipsSeeded: 0,
    };
  } finally {
    if (session) await session.close();
    await driver.close();
  }
}

// Direct execution entrypoint
const isMain = Boolean(
  process.argv[1] &&
  (process.argv[1] === __filename || process.argv[1].endsWith('seed_neo4j.ts'))
);

if (isMain) {
  seedNeo4j()
    .then((result) => {
      console.log(`Neo4j seed process exited cleanly (success=${result.success}).`);
    })
    .catch((err) => {
      console.error('Unexpected error in seed_neo4j:', err);
    });
}
