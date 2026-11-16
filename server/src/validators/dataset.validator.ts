import { z } from 'zod';

export const uploadDatasetSchema = z.object({
  query: z.object({
    name: z.string().optional(),
    description: z.string().optional(),
  }),
});
