/**
 * Extraction merge utility for combining chunk extractions
 * Deduplicates and merges results from hierarchical processing
 */

import { ChunkExtraction, MergedExtraction } from "@/types/interview";

/**
 * Normalize text for similarity comparison
 */
function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

/**
 * Merge multiple chunk extractions into final result
 * @param extractions - Array of chunk extractions
 * @param originalTokenEstimate - Original token count
 * @returns Merged extraction with deduplication
 */
export function mergeChunkExtractions(
  extractions: ChunkExtraction[],
  originalTokenEstimate: number
): MergedExtraction {
  const painMap = new Map<string, { 
    id: string; 
    description: string; 
    severity: number; 
    evidence: string[] 
  }>();
  
  const featureMap = new Map<string, { 
    id: string; 
    description: string; 
    rationale: string; 
    evidence: string[] 
  }>();
  
  const quotes: { id: string; speaker: string; text: string }[] = [];
  const needsSet = new Set<string>();

  // Process each chunk extraction
  for (const ex of extractions) {
    // Merge pains by ID
    ex.pains.forEach((p: { id: string; description: string; severity: number; evidence: string[] }) => {
      const key = p.id;
      if (!painMap.has(key)) {
        painMap.set(key, { ...p, evidence: [...p.evidence] });
      } else {
        const existing = painMap.get(key)!;
        existing.severity = Math.max(existing.severity, p.severity);
        p.evidence.forEach((ev: string) => {
          if (!existing.evidence.includes(ev) && existing.evidence.length < 6) {
            existing.evidence.push(ev);
          }
        });
      }
    });

    // Merge feature requests by ID
    ex.feature_requests.forEach((f: { id: string; description: string; rationale: string; evidence: string[] }) => {
      const key = f.id;
      if (!featureMap.has(key)) {
        featureMap.set(key, { ...f, evidence: [...f.evidence] });
      } else {
        const existing = featureMap.get(key)!;
        f.evidence.forEach((ev: string) => {
          if (!existing.evidence.includes(ev) && existing.evidence.length < 5) {
            existing.evidence.push(ev);
          }
        });
      }
    });

    // Deduplicate quotes by normalized text
    ex.quotes.forEach((q: { id: string; speaker: string; text: string }) => {
      const n = norm(q.text);
      if (!quotes.some(existing => norm(existing.text) === n)) {
        quotes.push(q);
      }
    });

    // Add needs to set for deduplication
    ex.needs.forEach((n: string) => needsSet.add(n));
  }

  // Apply quality filters to quotes
  const finalQuotes = quotes
    .filter(q => q.text.split(/\s+/).length <= 45)
    .slice(0, 120);

  return {
    pains: Array.from(painMap.values()),
    feature_requests: Array.from(featureMap.values()),
    quotes: finalQuotes,
    needs: Array.from(needsSet),
    stats: {
      totalChunks: extractions.length,
      originalTokenEstimate,
    }
  };
} 