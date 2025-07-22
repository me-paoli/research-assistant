/**
 * Prompt templates for interview processing
 * Supports both simple and hierarchical processing modes
 */

// Chunk extraction system prompt for hierarchical processing
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

// Updated scoring system prompt to handle both full extraction and compressed form
export const interviewScoringSystem = `
You score Product-Market Fit dimensions using ONLY given JSON and product summary.
Input JSON may be:
1) Full extraction with pains, feature_requests, quotes, etc.
OR
2) Compressed form with representative_quotes.

Use the same rules for scoring regardless of input format.
Focus on user pain points, feature requests, and overall sentiment.
Return a JSON object with PMF score and confidence level.
`; 