/**
 * Interview processing service
 * Supports both simple and hierarchical processing modes
 */

import { OpenAI } from 'openai'
import { approximateTokens } from '@/lib/token-estimate'
import { chunkByTurns } from '@/lib/chunking'
import { mergeChunkExtractions } from '@/lib/extraction-merge'
import { compressForScoring } from '@/lib/compression'
import { chunkExtractionSystem, interviewScoringSystem } from '@/lib/prompt-templates'
import { ChunkExtractionSchema } from '@/lib/validation'
import { analyzeTranscript, logDebugInfo } from '@/lib/debug'
import { 
  ChunkExtraction, 
  CompressedForScoring,
  ProcessingResult,
  SimpleProcessingResult,
  HierarchicalProcessingResult
} from '@/types/interview'
import env from '@/lib/env'

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY })

/**
 * Simple JSON validation wrapper
 */
async function validateJsonResponse<T>(fn: () => Promise<string>, schema: unknown): Promise<T> {
  try {
    const response = await fn();
    const parsed = JSON.parse(response);
    return (schema as any).parse(parsed);
  } catch (error) {
    throw new Error(`Validation failed: ${error}`);
  }
}

/**
 * Extract interview data using simple mode (single extraction)
 * @param _productSummary - Product context summary (unused placeholder)
 * @param _transcript - Full interview transcript (unused placeholder)
 * @returns Extraction result
 */
async function extractInterview(_productSummary: string, _transcript: string): Promise<Record<string, unknown>> {
  // This is a placeholder - we'll implement the actual simple extraction
  // For now, return a mock result to maintain compatibility
  return {
    pains: [],
    feature_requests: [],
    quotes: [],
    needs: []
  }
}

/**
 * Score interview data (works with both simple and hierarchical modes)
 * @param productSummary - Product context summary
 * @param payload - Either InterviewExtraction or CompressedForScoring
 * @returns Scoring result
 */
async function scoreInterviewAny(
  productSummary: string,
  payload: Record<string, unknown> | CompressedForScoring
): Promise<Record<string, unknown>> {
  const jsonPayload = JSON.stringify(payload);
  
  const resp = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.1,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: interviewScoringSystem },
      { role: "user", content: `Product Context: ${productSummary}\n\nData: ${jsonPayload}` }
    ]
  });

  const content = resp.choices[0].message.content;
  if (!content) {
    throw new Error('No response from OpenAI');
  }

  try {
    return JSON.parse(content);
  } catch (error) {
    throw new Error(`Failed to parse scoring response: ${error}`);
  }
}

/**
 * Extract data from a single chunk
 * @param productSummary - Product context summary
 * @param knownIds - Already extracted pain and feature IDs
 * @param chunkText - The chunk text to process
 * @param chunkIndex - Index of the chunk
 * @returns Chunk extraction result
 */
async function extractChunk(
  productSummary: string,
  knownIds: { pains: string[]; features: string[] },
  chunkText: string,
  chunkIndex: number
): Promise<ChunkExtraction> {
  const userMsg = `
PRODUCT_CONTEXT:
${productSummary}

KNOWN_IDS:
${knownIds.pains.map(i => "pain:" + i).join(",")}
${knownIds.features.map(i => "feature:" + i).join(",")}

CHUNK_TEXT (index=${chunkIndex}):
${chunkText}
`;

  return validateJsonResponse(async () => {
    const resp = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: chunkExtractionSystem },
        { role: "user", content: userMsg }
      ]
    });
    return resp.choices[0].message.content!;
  }, ChunkExtractionSchema);
}

/**
 * Process interview using hierarchical mode (chunking + extraction + merge + compression)
 * @param interviewId - Interview ID
 * @param transcript - Full interview transcript
 * @param productSummary - Product context summary
 * @returns Hierarchical processing result
 */
export async function processInterviewHierarchical(
  interviewId: string,
  transcript: string,
  productSummary: string
): Promise<HierarchicalProcessingResult> {
  console.log(`[interview ${interviewId}] mode=hierarchical`);
  
  // Initial debug analysis
  const initialDebug = analyzeTranscript(transcript);
  logDebugInfo(initialDebug, interviewId);
  
  const chunks = chunkByTurns(transcript);
  const originalTokenEstimate = approximateTokens(transcript);
  
  console.log(`[interview ${interviewId}] chunks=${chunks.length}`);

  const extractions: ChunkExtraction[] = [];
  const known = { pains: [] as string[], features: [] as string[] };

  // Process each chunk sequentially
  for (const c of chunks) {
    console.log(`[chunk ${c.chunkIndex}] processing...`);
    
    const extraction = await extractChunk(productSummary, known, c.text, c.chunkIndex);
    
    // Update known IDs to prevent duplicates
    extraction.pains.forEach(p => {
      if (!known.pains.includes(p.id)) known.pains.push(p.id);
    });
    extraction.feature_requests.forEach(f => {
      if (!known.features.includes(f.id)) known.features.push(f.id);
    });
    
    extractions.push({ ...extraction, chunkIndex: c.chunkIndex });
    
    console.log(`[chunk ${c.chunkIndex}] pains=${extraction.pains.length} features=${extraction.feature_requests.length}`);
  }

  // Merge all chunk extractions
  const merged = mergeChunkExtractions(extractions, originalTokenEstimate);
  console.log(`[merge] pains_total=${merged.pains.length} features_total=${merged.feature_requests.length} quotes=${merged.quotes.length} compressionRatio=${merged.stats.compressionRatio || 'N/A'}`);

  // Enhanced debug analysis with extractions and merged data
  const enhancedDebug = analyzeTranscript(transcript, extractions, merged);
  logDebugInfo(enhancedDebug, interviewId);

  // Compress for scoring
  const compressed = compressForScoring(merged, productSummary);

  // Score the compressed data
  const scoring = await scoreInterviewAny(productSummary, compressed as Record<string, unknown>);
  console.log(`[score] pmf=${scoring.pmf_score || 'N/A'} confidence=${scoring.confidence || 'N/A'}`);

  return {
    mode: "hierarchical",
    chunks: chunks.length,
    merged,
    compressed,
    scoring
  };
}

/**
 * Unified interview processing dispatcher
 * Automatically chooses between simple and hierarchical modes based on token count
 * @param interviewId - Interview ID
 * @param transcript - Full interview transcript
 * @param productSummary - Product context summary
 * @returns Processing result (simple or hierarchical)
 */
export async function processInterview(
  interviewId: string,
  transcript: string,
  productSummary: string
): Promise<ProcessingResult> {
  const tokenEstimate = approximateTokens(transcript);
  
  if (tokenEstimate < 6000) {
    // Simple mode: single extraction → scoring
    console.log(`[interview ${interviewId}] mode=simple tokens=${tokenEstimate}`);
    
    const extraction = await extractInterview(productSummary, transcript);
    const scoring = await scoreInterviewAny(productSummary, extraction);
    
    return {
      mode: "simple",
      extraction,
      scoring,
      tokenEstimate
    } as SimpleProcessingResult;
  } else {
    // Hierarchical mode: chunking → extraction → merge → compression → scoring
    return await processInterviewHierarchical(interviewId, transcript, productSummary);
  }
} 