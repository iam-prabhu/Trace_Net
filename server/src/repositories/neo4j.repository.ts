// Neo4j repository - stub
import { getNeo4jDriver } from '../config/neo4j';
import { GraphData } from '../types/graph.types';

export class Neo4jRepository {
  async query<T = unknown>(cypher: string, params?: Record<string, unknown>): Promise<T[]> {
    const driver = getNeo4jDriver();
    const session = driver.session();
    try {
      const result = await session.run(cypher, params);
      return result.records.map(r => r.toObject() as T);
    } finally {
      await session.close();
    }
  }

  async getSubgraph(nodeId: string, depth = 2): Promise<GraphData> {
    // TODO: implement full subgraph query
    return { nodes: [], edges: [] };
  }

  async createNode(labels: string[], properties: Record<string, unknown>): Promise<string> {
    const labelStr = labels.join(':');
    const records = await this.query<{ id: string }>(
      `CREATE (n:${labelStr} $props) RETURN elementId(n) AS id`,
      { props: properties }
    );
    return records[0]?.id ?? '';
  }

  async createRelationship(
    startId: string,
    endId: string,
    type: string,
    properties?: Record<string, unknown>
  ): Promise<void> {
    await this.query(
      `MATCH (a), (b) WHERE elementId(a) = $startId AND elementId(b) = $endId
       CREATE (a)-[r:${type} $props]->(b)`,
      { startId, endId, props: properties ?? {} }
    );
  }
}

export const neo4jRepository = new Neo4jRepository();
