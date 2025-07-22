# Research Assistant: Hierarchical Processing Pipeline Upgrade

## Overview
Upgrading the Next.js TypeScript PMF analysis backend to support large interviews with hierarchical chunk processing. The system will automatically choose between simple mode (< 6,000 tokens) and hierarchical mode (≥ 6,000 tokens) based on document size.

## Two Processing Modes

| Mode                  | Trigger                        | Flow                                                               |
| --------------------- | ------------------------------ | ------------------------------------------------------------------ |
| **Simple Mode**       | Estimated raw tokens `< 6,000` | Single Extraction → Scoring (existing)                            |
| **Hierarchical Mode** | Estimated raw tokens `≥ 6,000` | 1) Chunking 2) Per-Chunk Extraction 3) Merge & Compress 4) Scoring |

**Token Estimation**: `Math.round(charCount / 4)` (English heuristic)

## Phase 1: New Core Utilities

### 🔴 Critical Files to Create

#### `/src/lib/token-estimate.ts` ⭐
```typescript
export function approximateTokens(text: string) {
  return Math.round(text.length / 4);
}
```
- Simple English heuristic for token estimation
- Used for mode selection (simple vs hierarchical)
- Future-ready for tiktoken integration

#### `/src/lib/chunking.ts` ⭐
```typescript
interface Turn { speaker: string; text: string; }

function parseTurns(transcript: string): Turn[]
function chunkByTurns(transcript: string, targetTokens = 1400, maxTokens = 1700)
```
- Speaker-aware chunking by conversation turns
- Token-based targeting (1400 target, 1700 max)
- Character position tracking
- Speaker statistics per chunk
- Overflow handling for long turns

#### `/src/lib/extraction-merge.ts` ⭐
```typescript
export function mergeChunkExtractions(
  extractions: ChunkExtraction[],
  originalTokenEstimate: number
): MergedExtraction
```
- Deduplicates by ID (pains/features) or similarity (quotes)
- Merges evidence arrays (max 6 for pains, 5 for features)
- Quality filtering (max 45 words per quote, 120 total)
- Statistics tracking (total chunks, token estimates)

#### `/src/lib/compression.ts` ⭐
```typescript
export interface CompressedForScoring {
  product_context_summary: string;
  pains: any[];
  feature_requests: any[];
  needs: string[];
  representative_quotes: { id: string; text: string; speaker: string }[];
  meta: { originalTokenEstimate: number; compressionRatio: number };
}

export function compressForScoring(
  merged: MergedExtraction,
  productSummary: string,
  maxQuotesPerPain = 2
): CompressedForScoring
```
- Limits evidence (max 2 quotes per pain/feature)
- Selects top 80 representative quotes
- Calculates compression ratio
- Prepares data for scoring

## Phase 2: Updated Core Files

### 🟡 Files to Update

#### `/src/lib/prompt-templates.ts` (UPDATED)
**Add new prompt:**
```typescript
export const chunkExtractionSystem = `
You extract ONLY *new* structured items from a SINGLE interview chunk.

Return JSON:
{
 "pains":[{"id":"kebab-id","description":"...","severity":1-5,"evidence":["verbatim quote <=30 words"]}],
 "feature_requests":[{"id":"kebab-id","description":"...","rationale":"...","evidence":["quote"]}],
 "needs": ["short user need statements"],
 "quotes":[{"id":"q_<chunkIndex>_<n>","speaker":"Name","text":"verbatim <=40 words"}],
 "meta":{"chunk_index": <int>}
}

Rules:
- Use ONLY text in this chunk.
- Avoid duplicates: Provided KNOWN_IDS list contains already used pain and feature IDs globally; do not reuse them unless the *exact same* concept appears (then reuse).
- Prefer concise, specific descriptions.
- severity scale: 1 trivial, 3 moderate friction, 4 acute, 5 mission-critical.
- evidence must be verbatim substring.
- If nothing new, return empty arrays.
- JSON only.
`;
```

**Update existing prompt:**
```typescript
export const interviewScoringSystem = `
You score Product-Market Fit dimensions using ONLY given JSON and product summary.
Input JSON may be:
1) Full extraction with pains, feature_requests, quotes, etc.
OR
2) Compressed form with representative_quotes.

Use the same rules...
(Existing content unchanged below)
...
`;
```

#### `/src/lib/schema.ts` (UPDATED)
**Add new schema:**
```typescript
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
```

**Existing schemas remain unchanged** for simple mode compatibility.

#### `/src/types/interview.ts` (UPDATED)
**Add new types:**
```typescript
export interface Chunk {
  interviewId: string;
  chunkIndex: number;
  text: string;
  charStart: number;
  charEnd: number;
  speakerStats: Record<string, number>; // token counts per speaker (approx)
}

export interface ChunkExtraction {
  chunkIndex: number;
  pains: Array<{ id: string; description: string; severity: number; evidence: string[] }>;
  feature_requests: Array<{ id: string; description: string; rationale: string; evidence: string[] }>;
  quotes: Array<{ id: string; speaker: string; text: string }>;
  needs: string[];
  meta?: Record<string, any>;
}

export interface MergedExtraction {
  pains: Array<{ id: string; description: string; severity: number; evidence: string[] }>;
  feature_requests: Array<{ id: string; description: string; rationale: string; evidence: string[] }>;
  quotes: Array<{ id: string; speaker: string; text: string }>;
  needs: string[];
  stats: {
    totalChunks: number;
    originalTokenEstimate: number;
    compressionRatio?: number;
  };
}
```

## Phase 3: Service Layer Updates

### 🟡 Service Updates

#### `/src/services/interviewProcess.ts` (UPDATED)
**Add hierarchical processing:**
```typescript
async function extractChunk(
  productSummary: string,
  knownIds: { pains: string[]; features: string[] },
  chunkText: string,
  chunkIndex: number
)

export async function processInterviewHierarchical(
  interviewId: string,
  transcript: string,
  productSummary: string
)
```

**Add unified dispatcher:**
```typescript
export async function processInterview(
  interviewId: string,
  transcript: string,
  productSummary: string
) {
  const tokenEstimate = approximateTokens(transcript);
  if (tokenEstimate < 6000) {
    // ORIGINAL simple path:
    const extraction = await extractInterview(productSummary, transcript);
    const scoring = await scoreInterview(productSummary, extraction);
    return { mode: "simple", extraction, scoring, tokenEstimate };
  } else {
    return await processInterviewHierarchical(interviewId, transcript, productSummary);
  }
}
```

**Update scoring function:**
```typescript
async function scoreInterviewAny(
  productSummary: string,
  payload: InterviewExtraction | CompressedForScoring
)
```

## Phase 4: API Layer Updates

### 🟡 API Updates

#### `/src/app/api/interview/route.ts` (UPDATED)
```typescript
import { processInterview } from "@/services/interviewProcess";

export async function POST(req: Request) {
  try {
    const { rawText } = await req.json();
    if (!rawText) return new Response(JSON.stringify({ error: "rawText required"}), { status: 400 });

    const productSummary = await getProductContextSummary(/* user */); // existing stub
    const result = await processInterview("temp-id", rawText, productSummary.summaryText ?? productSummary);

    return new Response(JSON.stringify(result), { status: 200 });
  } catch (e:any) {
    console.error(e);
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
```

## Phase 5: Logging & Debugging

### 🟡 Logging Structure
```
[interview 123] mode=hierarchical chunks=9
[chunk 3] pains=2 features=1
[merge] pains_total=5 features_total=2 quotes=18 compressionRatio=7.3
[score] pmf=3.82 confidence=0.74
```

## Implementation Guidelines

### Code Organization
- Keep existing simple mode logic intact
- Add new utilities in `/src/lib/`
- Update services to support both modes
- Maintain backward compatibility

### TypeScript Requirements
- All new functions properly typed
- Use existing openai client
- Export necessary types from `/src/types/interview.ts`
- Ensure TypeScript compiles without errors

### Database Strategy
- **NO real database implementation**
- Keep in-memory stubs for now
- Focus on processing pipeline logic
- Database integration can be added later

### Processing Flow
1. **Token Estimation**: `approximateTokens(transcript)`
2. **Mode Selection**: < 6,000 → simple, ≥ 6,000 → hierarchical
3. **Simple Mode**: Single extraction → scoring
4. **Hierarchical Mode**: Chunking → extraction → merge → compression → scoring

## Success Metrics

### Functionality
- [ ] Both processing modes work correctly
- [ ] Automatic mode selection based on token count
- [ ] Hierarchical processing handles large documents
- [ ] Simple mode remains unchanged
- [ ] TypeScript compiles without errors

### Code Quality
- [ ] New utilities are properly typed
- [ ] Existing code remains functional
- [ ] Clear separation between modes
- [ ] Consistent error handling
- [ ] Proper logging structure

### Performance
- [ ] Token estimation is accurate
- [ ] Chunking preserves conversation flow
- [ ] Merging eliminates duplicates effectively
- [ ] Compression reduces token count appropriately

## Timeline

- **Day 1**: Create new utility files (`token-estimate.ts`, `chunking.ts`, `extraction-merge.ts`, `compression.ts`)
- **Day 2**: Update core files (`prompt-templates.ts`, `schema.ts`, `types/interview.ts`)
- **Day 3**: Update service layer (`interviewProcess.ts`)
- **Day 4**: Update API layer (`interview/route.ts`)
- **Day 5**: Testing and debugging

## Dependencies

### Existing Libraries (No New Dependencies)
- `openai` - Existing client for API calls
- `zod` - Existing validation library
- `next` - Existing framework
- `typescript` - Existing type system

### File Structure (Target)
```
src/
├── lib/
│   ├── token-estimate.ts ⭐ (NEW)
│   ├── chunking.ts ⭐ (NEW)
│   ├── extraction-merge.ts ⭐ (NEW)
│   ├── compression.ts ⭐ (NEW)
│   ├── prompt-templates.ts (UPDATED)
│   ├── schema.ts (UPDATED)
│   └── openai.ts (EXISTING)
├── services/
│   └── interviewProcess.ts (UPDATED)
├── app/api/interview/
│   └── route.ts (UPDATED)
└── types/
    └── interview.ts (UPDATED)
```

---

**Note**: This plan focuses on implementing the hierarchical processing pipeline while maintaining backward compatibility with the existing simple mode. All database operations remain as in-memory stubs for rapid prototyping. 