/**
 * Debug utilities for hierarchical processing pipeline
 * Provides additional logging and debugging capabilities
 */

import { approximateTokens } from './token-estimate'
import { chunkByTurns } from './chunking'
import { ChunkExtraction, MergedExtraction } from '@/types/interview'

/**
 * Debug information for a transcript
 */
export interface DebugInfo {
  originalLength: number;
  tokenEstimate: number;
  processingMode: 'simple' | 'hierarchical';
  chunks?: {
    count: number;
    sizes: number[];
    speakerStats: Record<string, number>;
  };
  extractions?: {
    totalPains: number;
    totalFeatures: number;
    totalQuotes: number;
    totalNeeds: number;
  };
  compression?: {
    originalTokens: number;
    compressedTokens: number;
    compressionRatio: number;
  };
}

/**
 * Analyze transcript for debugging purposes
 * @param transcript - The transcript to analyze
 * @param extractions - Optional chunk extractions for detailed analysis
 * @param merged - Optional merged extraction for compression analysis
 * @returns Debug information
 */
export function analyzeTranscript(
  transcript: string,
  extractions?: ChunkExtraction[],
  merged?: MergedExtraction
): DebugInfo {
  const originalLength = transcript.length;
  const tokenEstimate = approximateTokens(transcript);
  const processingMode = tokenEstimate < 6000 ? 'simple' : 'hierarchical';

  const debugInfo: DebugInfo = {
    originalLength,
    tokenEstimate,
    processingMode
  };

  // Add chunk analysis if in hierarchical mode
  if (processingMode === 'hierarchical') {
    const chunks = chunkByTurns(transcript);
    const sizes = chunks.map(c => c.text.length);
    const speakerStats: Record<string, number> = {};
    
    chunks.forEach(chunk => {
      Object.entries(chunk.speakerStats).forEach(([speaker, tokens]) => {
        speakerStats[speaker] = (speakerStats[speaker] || 0) + tokens;
      });
    });

    debugInfo.chunks = {
      count: chunks.length,
      sizes,
      speakerStats
    };
  }

  // Add extraction analysis if provided
  if (extractions) {
    const totalPains = extractions.reduce((sum, ex) => sum + ex.pains.length, 0);
    const totalFeatures = extractions.reduce((sum, ex) => sum + ex.feature_requests.length, 0);
    const totalQuotes = extractions.reduce((sum, ex) => sum + ex.quotes.length, 0);
    const totalNeeds = extractions.reduce((sum, ex) => sum + ex.needs.length, 0);

    debugInfo.extractions = {
      totalPains,
      totalFeatures,
      totalQuotes,
      totalNeeds
    };
  }

  // Add compression analysis if provided
  if (merged) {
    const compressedText = JSON.stringify({
      pains: merged.pains,
      feature_requests: merged.feature_requests,
      quotes: merged.quotes.slice(0, 80),
      needs: merged.needs
    });
    const compressedTokens = Math.round(compressedText.length / 4);
    const compressionRatio = merged.stats.originalTokenEstimate / Math.max(1, compressedTokens);

    debugInfo.compression = {
      originalTokens: merged.stats.originalTokenEstimate,
      compressedTokens,
      compressionRatio
    };
  }

  return debugInfo;
}

/**
 * Log debug information in a structured format
 * @param debugInfo - Debug information to log
 * @param interviewId - Interview ID for context
 */
export function logDebugInfo(debugInfo: DebugInfo, interviewId: string): void {
  console.log(`=== DEBUG INFO: Interview ${interviewId} ===`);
  console.log(`📊 Basic Info:`);
  console.log(`  - Original length: ${debugInfo.originalLength.toLocaleString()} chars`);
  console.log(`  - Token estimate: ${debugInfo.tokenEstimate.toLocaleString()}`);
  console.log(`  - Processing mode: ${debugInfo.processingMode}`);
  
  if (debugInfo.chunks) {
    console.log(`📦 Chunk Analysis:`);
    console.log(`  - Total chunks: ${debugInfo.chunks.count}`);
    console.log(`  - Average chunk size: ${Math.round(debugInfo.chunks.sizes.reduce((a, b) => a + b, 0) / debugInfo.chunks.sizes.length).toLocaleString()} chars`);
    console.log(`  - Speaker distribution:`, debugInfo.chunks.speakerStats);
  }
  
  if (debugInfo.extractions) {
    console.log(`🔍 Extraction Analysis:`);
    console.log(`  - Total pains: ${debugInfo.extractions.totalPains}`);
    console.log(`  - Total features: ${debugInfo.extractions.totalFeatures}`);
    console.log(`  - Total quotes: ${debugInfo.extractions.totalQuotes}`);
    console.log(`  - Total needs: ${debugInfo.extractions.totalNeeds}`);
  }
  
  if (debugInfo.compression) {
    console.log(`🗜️ Compression Analysis:`);
    console.log(`  - Original tokens: ${debugInfo.compression.originalTokens.toLocaleString()}`);
    console.log(`  - Compressed tokens: ${debugInfo.compression.compressedTokens.toLocaleString()}`);
    console.log(`  - Compression ratio: ${debugInfo.compression.compressionRatio.toFixed(2)}x`);
  }
  
  console.log(`=== END DEBUG INFO ===`);
} 