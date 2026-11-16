import neo4j, { Driver } from 'neo4j-driver';
import { env } from './env';

let driver: Driver | null = null;
let isNeo4jConnected = false;

export function isNeo4jAvailable(): boolean {
  return isNeo4jConnected;
}

export function getNeo4jDriver(): Driver {
  if (!driver) {
    driver = neo4j.driver(
      env.NEO4J_URI,
      neo4j.auth.basic(env.NEO4J_USERNAME, env.NEO4J_PASSWORD),
      {
        maxConnectionLifetime: 3 * 60 * 60 * 1000,
        connectionTimeout: 2000,
      }
    );
  }
  return driver;
}

export async function connectNeo4j(): Promise<boolean> {
  try {
    const d = getNeo4jDriver();
    await d.verifyConnectivity();
    isNeo4jConnected = true;
    console.log('✅ Neo4j connected');
    return true;
  } catch (err: any) {
    isNeo4jConnected = false;
    console.warn('⚠️ Neo4j unavailable (' + (err.message || 'connection failed') + '). Falling back to In-Memory Graph Store.');
    return false;
  }
}

export async function closeNeo4j(): Promise<void> {
  if (driver) {
    await driver.close();
    driver = null;
    isNeo4jConnected = false;
  }
}
