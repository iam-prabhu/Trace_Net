import { z } from 'zod';

export const createInvestigationSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(200),
    description: z.string().optional().default(''),
    assignedTo: z.string().uuid().optional(),
  }),
});

export const updateInvestigationSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().optional(),
    status: z.enum(['open', 'in_progress', 'closed', 'archived']).optional(),
    assignedTo: z.string().uuid().optional(),
  }),
});
