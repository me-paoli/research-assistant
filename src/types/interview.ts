/**
 * Type definitions for interview processing
 * Supports both simple and hierarchical processing modes
 */

// Chunk-related types for hierarchical processing
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
  meta?: Record<string, unknown>;
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

export interface CompressedForScoring {
  product_context_summary: string;
  pains: Array<{ id: string; description: string; severity: number; evidence: string[] }>;
  feature_requests: Array<{ id: string; description: string; rationale: string; evidence: string[] }>;
  needs: string[];
  representative_quotes: Array<{ id: string; text: string; speaker: string }>;
  meta: { 
    originalTokenEstimate: number; 
    compressionRatio: number 
  };
}

// Processing result types
export interface SimpleProcessingResult {
  mode: 'simple';
  extraction: Record<string, unknown>; // Will be typed properly when we see the existing extraction type
  scoring: Record<string, unknown>; // Will be typed properly when we see the existing scoring type
  tokenEstimate: number;
}

export interface HierarchicalProcessingResult {
  mode: 'hierarchical';
  chunks: number;
  merged: MergedExtraction;
  compressed: CompressedForScoring;
  scoring: Record<string, unknown>; // Will be typed properly when we see the existing scoring type
}

export type ProcessingResult = SimpleProcessingResult | HierarchicalProcessingResult; 