// File parsers for PDF and Markdown

import PDFParse from 'pdf-parse';
import { remark } from 'remark';
import remarkHtml from 'remark-html';

/**
 * Extract text from PDF file
 */
export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    const data = await PDFParse(buffer);
    return data.text;
  } catch (error) {
    throw new Error(`Failed to parse PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extract text from Markdown file
 */
export async function extractTextFromMarkdown(content: string): Promise<string> {
  try {
    // For RAG, we want plain text, not HTML
    // So we'll just return the markdown content as-is
    // (removing only the markdown formatting would require additional processing)
    return content;
  } catch (error) {
    throw new Error(`Failed to parse Markdown: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extract text from file based on type
 */
export async function extractText(buffer: Buffer, fileType: 'pdf' | 'md'): Promise<string> {
  if (fileType === 'pdf') {
    return extractTextFromPDF(buffer);
  } else if (fileType === 'md') {
    const content = buffer.toString('utf-8');
    return extractTextFromMarkdown(content);
  } else {
    throw new Error(`Unsupported file type: ${fileType}`);
  }
}

/**
 * Detect file type from filename
 */
export function detectFileType(filename: string): 'pdf' | 'md' | null {
  const ext = filename.toLowerCase().split('.').pop();
  if (ext === 'pdf') return 'pdf';
  if (ext === 'md' || ext === 'markdown') return 'md';
  return null;
}

/**
 * Validate file size (max 10MB)
 */
export function validateFileSize(size: number, maxSizeMB: number = 10): boolean {
  const maxBytes = maxSizeMB * 1024 * 1024;
  return size <= maxBytes;
}
