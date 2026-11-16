import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exportDatasetFiles } from './generate_dataset.ts';
import { seedPostgres } from './seed_postgres.ts';
import { seedNeo4j } from './seed_neo4j.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function seedAll(): Promise<void> {
  console.log('================================================================');
  console.log('   COLLABORATIVE GRAPH-BASED FRAUD DETECTION CONSOLE - SEEDER   ');
  console.log('================================================================\n');

  const defaultDatasetFile = path.join(__dirname, 'default_dataset.json');
  const needsGeneration = !fs.existsSync(defaultDatasetFile);

  if (needsGeneration) {
    console.log('📦 Step 1: Generating synthetic banking graph dataset...');
    exportDatasetFiles(__dirname);
  } else {
    console.log('📦 Step 1: Default dataset already generated at:');
    console.log(`   ${defaultDatasetFile}`);
  }

  console.log('\n🐘 Step 2: Seeding PostgreSQL Database...');
  const pgResult = await seedPostgres();

  console.log('\n🕸️ Step 3: Seeding Neo4j Graph Database...');
  const neoResult = await seedNeo4j(defaultDatasetFile);

  console.log('\n================================================================');
  console.log('                       SEEDING SUMMARY                          ');
  console.log('================================================================');
  console.log(`- Dataset Status:        Generated & Ready (700 Accounts, 3,200 Transactions)`);
  console.log(`- PostgreSQL Seed:       ${pgResult.success ? '✅ Populated Tables' : '⚠️ Offline (In-Memory Fallback Active)'}`);
  console.log(`- Neo4j Seed:            ${neoResult.success ? '✅ Populated Graph' : '⚠️ Offline (In-Memory Fallback Active)'}`);
  console.log('\nDefault Test User Accounts:');
  console.log('  1. ADMIN:        admin@fraudconsole.internal        (Password: Admin@123)');
  console.log('  2. INVESTIGATOR: investigator@fraudconsole.internal (Password: Investigator@123)');
  console.log('  3. INVESTIGATOR: elena@fraudconsole.internal        (Password: Investigator@123)');
  console.log('  4. VIEWER:       viewer@fraudconsole.internal       (Password: Viewer@123)');
  console.log('\nPlanted Fraud Patterns in Ground Truth:');
  console.log('  - 3 Circular Routing Cycles (3-hop, 4-hop, 5-hop loops)');
  console.log('  - 1 Fan-In Smurfing Network (10 mules -> 1 aggregator under $10k)');
  console.log('  - 1 Fan-Out Dispersion Network (1 hub -> 15 recipients)');
  console.log('  - 2 Dense Coordinated Communities (10-node & 12-node high-density meshes)');
  console.log('  - 1 Linear 5-Hop Layering Chain (peeling fees per intermediary hop)');
  console.log('================================================================\n');
}

// Direct execution entrypoint
const isMain = Boolean(
  process.argv[1] &&
  (process.argv[1] === __filename || process.argv[1].endsWith('seed_all.ts'))
);

if (isMain) {
  seedAll()
    .then(() => {
      console.log('Master seed execution completed successfully.');
    })
    .catch((err) => {
      console.error('Master seed encountered an error:', err);
      process.exit(1);
    });
}
