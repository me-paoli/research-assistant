import { z } from 'zod'

// Upload request validation
export const uploadSchema = z.object({
  file: z.instanceof(File, { message: 'File is required' }),
})

// Process request validation
export const processSchema = z.object({
  interviewId: z.string().uuid('Invalid interview ID'),
})

// Search request validation
export const searchSchema = z.object({
  q: z.string().min(1, 'Search query is required'),
})

// Interview request validation
export const interviewSchema = z.object({
  id: z.string().uuid('Invalid interview ID'),
})

// Product context validation
export const productContextSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  description: z.string().min(1, 'Product description is required'),
  url: z.string().url().optional(),
})

// Chunk extraction validation for hierarchical processing
export const ChunkExtractionSchema = z.object({
  pains: z.array(z.object({
    id: z.string(),
    description: z.string(),
    severity: z.number().int().min(1).max(5),
    evidence: z.array(z.string()).min(1)
  })),
  feature_requests: z.array(z.object({
    id: z.string(),
    description: z.string(),
    rationale: z.string(),
    evidence: z.array(z.string()).min(1)
  })),
  needs: z.array(z.string()),
  quotes: z.array(z.object({
    id: z.string(),
    speaker: z.string(),
    text: z.string()
  })),
  meta: z.object({ chunk_index: z.number() })
});

export type ChunkExtraction = z.infer<typeof ChunkExtractionSchema>;

// Type exports
export type UploadRequest = z.infer<typeof uploadSchema>
export type ProcessRequest = z.infer<typeof processSchema>
export type SearchRequest = z.infer<typeof searchSchema>
export type InterviewRequest = z.infer<typeof interviewSchema>
export type ProductContextRequest = z.infer<typeof productContextSchema> 