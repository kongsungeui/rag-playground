// lib/chunk.ts

// 아주 단순하게 "문단 + 길이 제한" 기준으로 쪼개는 예시
export function simpleChunkText(text: string, maxChars = 500): string[] {
  const paragraphs = text
    .split(/\n{2,}/)
    .map(p => p.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  let current = "";

  for (const p of paragraphs) {
    // If paragraph itself is too long, split it further
    if (p.length > maxChars) {
      if (current) {
        chunks.push(current.trim());
        current = "";
      }
      // Split long paragraph by sentences or force split
      const sentences = p.split(/[.!?]\s+/);
      let tempChunk = "";

      for (const sentence of sentences) {
        if ((tempChunk + sentence).length > maxChars) {
          if (tempChunk) chunks.push(tempChunk.trim());
          // Force split if single sentence is too long
          if (sentence.length > maxChars) {
            for (let i = 0; i < sentence.length; i += maxChars) {
              chunks.push(sentence.slice(i, i + maxChars).trim());
            }
            tempChunk = "";
          } else {
            tempChunk = sentence;
          }
        } else {
          tempChunk = tempChunk ? tempChunk + " " + sentence : sentence;
        }
      }
      if (tempChunk) chunks.push(tempChunk.trim());
    } else if ((current + "\n\n" + p).length > maxChars) {
      if (current) chunks.push(current.trim());
      current = p;
    } else {
      current = current ? current + "\n\n" + p : p;
    }
  }
  if (current) chunks.push(current.trim());

  return chunks;
}