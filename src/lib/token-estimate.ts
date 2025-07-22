/**
 * Token estimation utility for determining processing mode
 * Uses simple English heuristic: Math.round(charCount / 4)
 * Future-ready for tiktoken integration
 */

export function approximateTokens(text: string): number {
  return Math.round(text.length / 4);
} 