// lib/chunk.ts

// 아주 단순하게 "문단 + 길이 제한" 기준으로 쪼개는 예시
export function simpleChunkText(text: string, maxChars = 1000): string[] {
  const paragraphs = text
    .split(/\n{2,}/)
    .map(p => p.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  let current = "";

  for (const p of paragraphs) {
    if ((current + "\n\n" + p).length > maxChars) {
      if (current) chunks.push(current.trim());
      current = p;
    } else {
      current = current ? current + "\n\n" + p : p;
    }
  }
  if (current) chunks.push(current.trim());

  return chunks;
}