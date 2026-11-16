import { GraphData, GraphNode, GraphEdge, TraversalTransactionEdge } from '../types/graph.types';

export interface NormalizedNode {
  id: string;
  labels: string[];
  properties: Record<string, unknown>;
}

export interface NormalizedEdge extends TraversalTransactionEdge {
  id: string;
  source: string;
  target: string;
  amount: number;
  timestamp?: string;
  type?: string;
  properties: Record<string, unknown>;
}

export class AdjacencyGraph {
  public nodes: Map<string, NormalizedNode> = new Map();
  public outgoing: Map<string, NormalizedEdge[]> = new Map();
  public incoming: Map<string, NormalizedEdge[]> = new Map();
  public edges: Map<string, NormalizedEdge> = new Map();

  public addNode(id: string, labels: string[] = ['Account'], properties: Record<string, unknown> = {}): NormalizedNode {
    let node = this.nodes.get(id);
    if (!node) {
      node = { id, labels, properties };
      this.nodes.set(id, node);
      if (!this.outgoing.has(id)) this.outgoing.set(id, []);
      if (!this.incoming.has(id)) this.incoming.set(id, []);
    } else {
      node.properties = { ...node.properties, ...properties };
      if (labels.length > 0) {
        node.labels = Array.from(new Set([...node.labels, ...labels]));
      }
    }
    return node;
  }

  public addEdge(edgeInput: Partial<NormalizedEdge> & { source?: string; target?: string }): NormalizedEdge {
    const source = String(
      edgeInput.source ??
      (edgeInput as Record<string, unknown>).senderAccountId ??
      (edgeInput as Record<string, unknown>).startNodeId ??
      ''
    );
    const target = String(
      edgeInput.target ??
      (edgeInput as Record<string, unknown>).receiverAccountId ??
      (edgeInput as Record<string, unknown>).endNodeId ??
      ''
    );

    if (!source || !target) {
      throw new Error(`Edge must have both source and target. Received: source=${source}, target=${target}`);
    }

    this.addNode(source);
    this.addNode(target);

    const id = String(
      edgeInput.id ??
      (edgeInput as Record<string, unknown>).transactionId ??
      `edge-${source}-${target}-${this.edges.size}`
    );

    const amount = Number(
      edgeInput.amount ??
      (edgeInput.properties?.amount as number) ??
      (edgeInput as Record<string, unknown>).amount ??
      0
    );

    const timestamp = edgeInput.timestamp
      ? String(edgeInput.timestamp)
      : (edgeInput as Record<string, unknown>).timestamp
      ? String((edgeInput as Record<string, unknown>).timestamp)
      : undefined;

    const type = edgeInput.type ?? (edgeInput as Record<string, unknown>).transactionType as string ?? 'TRANSFERRED_TO';
    const properties = edgeInput.properties ?? (edgeInput as Record<string, unknown>) ?? {};

    const edge: NormalizedEdge = {
      id,
      source,
      target,
      amount: isNaN(amount) ? 0 : amount,
      timestamp,
      type,
      properties: properties as Record<string, unknown>,
    };

    this.edges.set(id, edge);

    const outList = this.outgoing.get(source) || [];
    outList.push(edge);
    this.outgoing.set(source, outList);

    const inList = this.incoming.get(target) || [];
    inList.push(edge);
    this.incoming.set(target, inList);

    return edge;
  }

  public getNode(id: string): NormalizedNode | undefined {
    return this.nodes.get(id);
  }

  public getOutgoing(id: string): NormalizedEdge[] {
    return this.outgoing.get(id) || [];
  }

  public getIncoming(id: string): NormalizedEdge[] {
    return this.incoming.get(id) || [];
  }

  public getNeighbors(
    id: string,
    direction: 'INCOMING' | 'OUTGOING' | 'BOTH' = 'OUTGOING'
  ): { neighborId: string; edge: NormalizedEdge }[] {
    const result: { neighborId: string; edge: NormalizedEdge }[] = [];

    if (direction === 'OUTGOING' || direction === 'BOTH') {
      const outEdges = this.getOutgoing(id);
      for (const e of outEdges) {
        result.push({ neighborId: e.target, edge: e });
      }
    }

    if (direction === 'INCOMING' || direction === 'BOTH') {
      const inEdges = this.getIncoming(id);
      for (const e of inEdges) {
        result.push({ neighborId: e.source, edge: e });
      }
    }

    return result;
  }

  public getNodeIds(): string[] {
    return Array.from(this.nodes.keys());
  }

  public getNodeCount(): number {
    return this.nodes.size;
  }

  public getEdgeCount(): number {
    return this.edges.size;
  }

  public getEdgeBetween(source: string, target: string): NormalizedEdge | undefined {
    const outEdges = this.getOutgoing(source);
    return outEdges.find(e => e.target === target);
  }

  public getAllEdgesBetween(source: string, target: string): NormalizedEdge[] {
    const outEdges = this.getOutgoing(source);
    return outEdges.filter(e => e.target === target);
  }

  public toGraphData(): GraphData {
    const nodes: GraphNode[] = Array.from(this.nodes.values()).map(n => ({
      id: n.id,
      labels: n.labels,
      properties: n.properties,
    }));

    const edges: GraphEdge[] = Array.from(this.edges.values()).map(e => ({
      id: e.id,
      type: e.type || 'TRANSFERRED_TO',
      startNodeId: e.source,
      endNodeId: e.target,
      properties: {
        amount: e.amount,
        timestamp: e.timestamp,
        ...e.properties,
      },
    }));

    return { nodes, edges };
  }

  public subgraph(nodeIds: Set<string> | string[]): AdjacencyGraph {
    const sub = new AdjacencyGraph();
    const idSet = nodeIds instanceof Set ? nodeIds : new Set(nodeIds);

    for (const id of idSet) {
      const node = this.nodes.get(id);
      if (node) {
        sub.addNode(node.id, node.labels, node.properties);
      }
    }

    for (const id of idSet) {
      const outList = this.getOutgoing(id);
      for (const edge of outList) {
        if (idSet.has(edge.target)) {
          sub.addEdge(edge);
        }
      }
    }

    return sub;
  }
}

/**
 * Builds an AdjacencyGraph from various input formats:
 * - AdjacencyGraph instance
 * - GraphData ({ nodes: GraphNode[], edges: GraphEdge[] })
 * - Transactions array ([{ senderAccountId, receiverAccountId, amount, ... }])
 * - Plain objects with accounts and transactions
 */
export function buildAdjacencyGraph(input?: unknown): AdjacencyGraph {
  if (!input) {
    return new AdjacencyGraph();
  }

  if (input instanceof AdjacencyGraph) {
    return input;
  }

  const graph = new AdjacencyGraph();

  // If input has .nodes and .edges (GraphData or similar)
  if (typeof input === 'object' && input !== null) {
    const rawObj = input as Record<string, unknown>;

    // Handle nodes / accounts
    const rawNodes = Array.isArray(rawObj.nodes)
      ? rawObj.nodes
      : Array.isArray(rawObj.accounts)
      ? rawObj.accounts
      : [];

    for (const node of rawNodes) {
      if (typeof node === 'string') {
        graph.addNode(node);
      } else if (typeof node === 'object' && node !== null) {
        const id = String(
          (node as Record<string, unknown>).id ??
          (node as Record<string, unknown>).accountId ??
          ''
        );
        if (id) {
          const labels = Array.isArray((node as Record<string, unknown>).labels)
            ? (node as Record<string, unknown>).labels as string[]
            : ['Account'];
          const properties = (node as Record<string, unknown>).properties ?? node;
          graph.addNode(id, labels, properties as Record<string, unknown>);
        }
      }
    }

    // Handle edges / transactions
    const rawEdges = Array.isArray(rawObj.edges)
      ? rawObj.edges
      : Array.isArray(rawObj.transactions)
      ? rawObj.transactions
      : Array.isArray(input)
      ? input
      : [];

    for (const edge of rawEdges) {
      if (typeof edge === 'object' && edge !== null) {
        try {
          graph.addEdge(edge as Partial<NormalizedEdge>);
        } catch {
          // Ignore invalid edges missing source or target
        }
      }
    }
  }

  return graph;
}
