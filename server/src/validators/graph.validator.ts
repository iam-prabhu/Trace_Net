import { z } from 'zod';

export const traversalSchema = z.object({
  body: z.object({
    startNodeId: z.string().min(1),
    maxDepth: z.number().int().min(1).max(10).optional().default(3),
    relationshipTypes: z.array(z.string()).optional().default([]),
    nodeLabels: z.array(z.string()).optional().default([]),
  }),
});

export const neighborsSchema = z.object({
  params: z.object({
    nodeId: z.string().min(1),
  }),
  query: z.object({
    depth: z.string().optional(),
  }),
});
