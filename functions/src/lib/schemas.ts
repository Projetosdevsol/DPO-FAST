import { z } from 'zod';

export const Finding = z.object({
  description: z.string().min(1),
  severity: z.enum(['CRITICO', 'ALTO', 'MEDIO', 'BAIXO']),
  legalBasis: z.array(z.string()).min(1),
  sourceDoc: z.string().min(1),
  sourceChunkId: z.string().min(1),
  confidence: z.number().min(0).max(1),
});

export const AgentOutput = z.object({
  findings: z.array(Finding),
  reasoning: z.string().min(1),
});

export type FindingType = z.infer<typeof Finding>;
export type AgentOutputType = z.infer<typeof AgentOutput>;
