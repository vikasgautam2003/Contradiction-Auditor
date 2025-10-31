import { z } from 'zod';

export const DiscrepancySchema = z.object({
  claim: z.string().describe(
    "The primary, specific factual claim extracted from the source documents."
  ),

  sourceId: z.enum([
    'doc_A',
    'doc_B',
    'doc_C',
    'doc_D',
    'doc_E',
    'doc_F',
    'doc_G',
    'doc_H',
    'doc_I',
    'doc_J',
  ]).describe(
    "The unique metadata ID of the source document (e.g., 'Speech A', 'Report B')."
  ),

  valueCited: z.string().describe(
    "The exact value or data point cited in the claim."
  ),
}).describe(
  "A structured, auditable fact extracted from a single source document."
);

export type Discrepancy = z.infer<typeof DiscrepancySchema>;

export const DiscrepancyArraySchema = z
  .array(DiscrepancySchema)
  .describe("An array of conflicting or comparable claims found across multiple sources.");
