import type { GraphData, GraphNode, GraphEdge } from '../types/graph.types';
import type { Core, ElementDefinition } from 'cytoscape';

const COMMUNITY_COLORS = [
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#10B981', // Emerald
  '#6366F1', // Indigo
  '#EAB308', // Yellow
  '#14B8A6', // Teal
];

export function getNodeColor(node: GraphNode, colorByCommunity = false): string {
  const commId = node.communityId ?? (node.properties as any)?.communityId;
  if (colorByCommunity && commId !== undefined) {
    const idx = Math.abs(commId) % COMMUNITY_COLORS.length;
    return COMMUNITY_COLORS[idx];
  }

  const rawStatus = String(node.status || (node.properties as any)?.status || (node as any).data?.status || '').toLowerCase();
  const risk = Number(node.riskScore ?? (node.properties as any)?.riskScore ?? (node as any).data?.riskScore ?? 0);
  const isFlagged = Boolean((node as any).isFlagged || (node.properties as any)?.isFlagged || (node as any).data?.isFlagged);

  if (rawStatus === 'flagged' || rawStatus === 'suspicious' || isFlagged || risk >= 75) {
    return '#EF4444'; // Red
  }
  if (rawStatus === 'under_investigation' || rawStatus === 'under_review' || (risk >= 50 && risk < 75)) {
    return '#F59E0B'; // Amber
  }
  if (rawStatus === 'cleared') {
    return '#10B981'; // Green
  }
  return '#3B82F6'; // Blue
}

export function formatCompactCurrency(val: number): string {
  if (!val) return '$0';
  if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
  if (val >= 1000) return `$${(val / 1000).toFixed(0)}k`;
  return `$${val}`;
}

export function toCytoscapeElements(graph: GraphData, colorByCommunity = false): ElementDefinition[] {
  const nodes: ElementDefinition[] = graph.nodes.map(n => {
    const degree = n.degree || 2;
    const size = Math.max(34, Math.min(60, 32 + degree * 4));
    const bgColor = getNodeColor(n, colorByCommunity);

    const rawStatus = String(n.status || (n.properties as any)?.status || '').toLowerCase();
    const risk = Number(n.riskScore ?? (n.properties as any)?.riskScore ?? 0);
    const isFlagged = Boolean((n as any).isFlagged || (n.properties as any)?.isFlagged || risk >= 75 || rawStatus === 'flagged');
    const normalizedStatus = isFlagged
      ? 'flagged'
      : (rawStatus === 'under_investigation' || rawStatus === 'under_review' || risk >= 50)
      ? 'under_investigation'
      : rawStatus === 'cleared'
      ? 'cleared'
      : 'normal';

    return {
      group: 'nodes',
      data: {
        id: n.id,
        label: n.id,
        accountType: n.accountType || (n.properties as any)?.accountType || 'CHECKING',
        balance: n.balance ?? (n.properties as any)?.balance ?? 0,
        riskScore: risk,
        communityId: n.communityId ?? (n.properties as any)?.communityId ?? 0,
        degree,
        size,
        ...n.properties,
        status: normalizedStatus,
        bgColor,
      },
      position: n.x !== undefined ? { x: n.x, y: n.y ?? 0 } : undefined,
    };
  });

  const edges: ElementDefinition[] = graph.edges.map(e => {
    const amount = Number(e.amount) || 0;
    const width = Math.max(2, Math.min(6, 1.5 + Math.log10(Math.max(10, amount)) * 0.8));
    const label = formatCompactCurrency(amount);

    return {
      group: 'edges',
      data: {
        id: e.id,
        source: e.source,
        target: e.target,
        amount,
        label,
        type: e.type || e.transactionType || 'TRANSFER',
        status: e.status || 'COMPLETED',
        riskScore: e.riskScore || 10,
        width,
        ...e.properties,
      },
    };
  });

  return [...nodes, ...edges];
}

export function fromCytoscapeElements(cy: Core): GraphData {
  const nodes: GraphNode[] = cy.nodes().map(n => ({
    id: n.id(),
    status: n.data('status'),
    accountType: n.data('accountType'),
    balance: n.data('balance'),
    riskScore: n.data('riskScore'),
    communityId: n.data('communityId'),
    properties: n.data() as Record<string, unknown>,
  }));

  const edges: GraphEdge[] = cy.edges().map(e => ({
    id: e.id(),
    source: e.source().id(),
    target: e.target().id(),
    amount: e.data('amount'),
    type: e.data('type'),
    status: e.data('status'),
    properties: e.data() as Record<string, unknown>,
  }));

  return { nodes, edges };
}
