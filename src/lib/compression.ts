/**
 * Compression utility for preparing merged extractions for scoring
 * Reduces token count while preserving key information
 */

import { MergedExtraction } from "@/types/interview";

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

/**
 * Compress merged extraction for scoring
 * @param merged - The merged extraction result
 * @param productSummary - Product context summary
 * @param maxQuotesPerPain - Maximum quotes per pain/feature (default: 2)
 * @returns Compressed data ready for scoring
 */
export function compressForScoring(
  merged: MergedExtraction,
  productSummary: string,
  maxQuotesPerPain = 2
): CompressedForScoring {
  // Limit evidence for pains
  const pains = merged.pains.map(p => ({
    id: p.id,
    description: p.description,
    severity: p.severity,
    evidence: p.evidence.slice(0, maxQuotesPerPain)
  }));

  // Limit evidence for features
  const features = merged.feature_requests.map(f => ({
    id: f.id,
    description: f.description,
    rationale: f.rationale,
    evidence: f.evidence.slice(0, 2)
  }));

  // Select representative quotes (already truncated)
  const repQuotes = merged.quotes.slice(0, 80);

  // Estimate compressed tokens
  const compressedText = JSON.stringify({ pains, features, repQuotes, needs: merged.needs });
  const compressedTokens = Math.round(compressedText.length / 4);
  const compressionRatio = merged.stats.originalTokenEstimate / Math.max(1, compressedTokens);

  return {
    product_context_summary: productSummary,
    pains,
    feature_requests: features,
    needs: merged.needs,
    representative_quotes: repQuotes,
    meta: {
      originalTokenEstimate: merged.stats.originalTokenEstimate,
      compressionRatio
    }
  };
} 