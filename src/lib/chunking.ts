/**
 * Chunking utility for large interview transcripts
 * Splits documents by speaker turns while respecting token limits
 */

export interface Turn {
  speaker: string;
  text: string;
}

export interface Chunk {
  chunkIndex: number;
  text: string;
  charStart: number;
  charEnd: number;
  speakerStats: Record<string, number>;
}

/**
 * Parse transcript into speaker turns
 * Assumes speaker-labeled lines like "Sofia: " or "Interviewer: "
 */
function parseTurns(transcript: string): Turn[] {
  const lines = transcript.split(/\n+/);
  const turns: Turn[] = [];
  let currentSpeaker = "Unknown";
  let buffer: string[] = [];

  const push = () => {
    if (buffer.length) {
      turns.push({ speaker: currentSpeaker, text: buffer.join(" ").trim() });
      buffer = [];
    }
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    const m = line.match(/^([A-Za-z0-9 _-]{1,40}):\s*(.*)$/);
    if (m) {
      push();
      currentSpeaker = m[1].trim();
      const rest = m[2].trim();
      if (rest) buffer.push(rest);
    } else {
      buffer.push(line);
    }
  }
  push();
  return turns;
}

/**
 * Chunk transcript by speaker turns with token limits
 * @param transcript - The full transcript text
 * @param targetTokens - Target tokens per chunk (default: 1400)
 * @param maxTokens - Maximum tokens per chunk (default: 1700)
 * @returns Array of chunks with metadata
 */
export function chunkByTurns(
  transcript: string,
  targetTokens = 1400,
  maxTokens = 1700
): Chunk[] {
  const turns = parseTurns(transcript);
  const chunks: Chunk[] = [];

  let acc: Turn[] = [];
  let accChars = 0;
  let globalChar = 0;

  const flush = () => {
    if (!acc.length) return;
    
    const text = acc.map(t => `${t.speaker}: ${t.text}`).join("\n");
    const speakerStats: Record<string, number> = {};
    
    acc.forEach(t => {
      speakerStats[t.speaker] = (speakerStats[t.speaker] || 0) + Math.round(t.text.length / 4);
    });

    chunks.push({
      chunkIndex: chunks.length,
      text,
      charStart: globalChar - accChars,
      charEnd: globalChar,
      speakerStats
    });
    
    acc = [];
    accChars = 0;
  };

  for (const turn of turns) {
    const turnTokens = Math.round(turn.text.length / 4);
    
    // If a single turn is huge, split hard
    if (turnTokens > maxTokens) {
      const words = turn.text.split(/\s+/);
      let sub: string[] = [];
      let subChars = 0;
      
      for (const w of words) {
        sub.push(w);
        subChars += w.length + 1;
        
        if (Math.round(subChars / 4) >= targetTokens) {
          acc.push({ speaker: turn.speaker, text: sub.join(" ") + " <CONTINUED>" });
          globalChar += sub.join(" ").length + 1;
          flush();
          sub = [];
          subChars = 0;
        }
      }
      
      if (sub.length) {
        acc.push({ speaker: turn.speaker, text: sub.join(" ") });
        globalChar += sub.join(" ").length + 1;
      }
      continue;
    }

    acc.push(turn);
    accChars += turn.text.length + 1;
    globalChar += turn.text.length + 1;
    
    if (Math.round(accChars / 4) >= targetTokens) {
      flush();
    }
  }
  
  flush();
  return chunks;
} 