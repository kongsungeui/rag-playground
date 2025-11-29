// scripts/ingest.ts
import "dotenv/config"; // .env.local 불러오게 하려면
import fs from "fs";
import { PDFParse } from "pdf-parse";
import { supabaseServer } from "../lib/supabase.ts";
import { openai } from "../lib/openai.ts";
import { simpleChunkText } from "../lib/chunk.ts";

async function main() {
  const pdfPath = "./data/sample.pdf"; // 네가 넣은 PDF 경로
  const buffer = fs.readFileSync(pdfPath);
  // pdf-parse v2+ exposes a PDFParse class. Create an instance and use getText().
  const parser = new PDFParse({ data: buffer });
  const pdf = await parser.getText();
  const text = pdf.text;

  const chunks = simpleChunkText(text, 1000);
  console.log(`총 청크 수: ${chunks.length}`);

  for (let i = 0; i < chunks.length; i++) {
    const content = chunks[i];

    const embRes = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: content,
    });

    const embedding = embRes.data[0].embedding;

    const { error } = await supabaseServer.from("documents").insert({
      content,
      metadata: { source: "sample.pdf", chunk_index: i },
      embedding,
    });

    if (error) {
      console.error(`청크 ${i} insert 에러:`, error);
    } else {
      console.log(`청크 ${i} 저장 완료`);
    }
  }

  console.log("Ingest 완료");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});