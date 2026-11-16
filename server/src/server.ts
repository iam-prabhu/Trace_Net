import 'dotenv/config';
import { httpServer } from './app';
import { connectPostgres } from './config/postgres';
import { connectNeo4j, closeNeo4j } from './config/neo4j';
import { env } from './config/env';
import { inMemoryStore } from './repositories/in-memory.store';

async function bootstrap(): Promise<void> {
  try {
    console.log('🔍 Initializing Fraud Detection Engine...');

    // Initialize in-memory seed data store first so it is immediately ready
    inMemoryStore.initialize();

    // Check database connections asynchronously
    const [pgOk, neoOk] = await Promise.all([
      connectPostgres(),
      connectNeo4j(),
    ]);

    if (pgOk && neoOk) {
      console.log('✅ Mode: HYBRID (PostgreSQL + Neo4j database backends active)');
    } else {
      console.log(
        '💡 Mode: RESILIENT IN-MEMORY FALLBACK (All endpoints, graph traversals, and algorithms fully operational)'
      );
    }

    // Start server
    httpServer.listen(env.PORT, () => {
      console.log(`🚀 Server running on http://localhost:${env.PORT}`);
      console.log(`📚 API docs at http://localhost:${env.PORT}/api/docs`);
      console.log(`🌍 Environment: ${env.NODE_ENV}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await closeNeo4j();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  await closeNeo4j();
  process.exit(0);
});

bootstrap();
