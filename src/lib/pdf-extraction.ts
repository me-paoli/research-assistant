import { PDFDocument } from 'pdf-lib';
import Tesseract from 'tesseract.js';
import { fromPath as pdf2picFromPath } from 'pdf2pic';
import pLimit from 'p-limit';
import crypto from 'crypto';

// Polyfill DOMMatrix for pdfjs-dist in Node.js
// @ts-ignore
global.DOMMatrix = require('canvas').DOMMatrix;
// @ts-ignore
const pdfjsLib = require('pdfjs-dist');

// Configure pdfjs-dist for Next.js environment
pdfjsLib.GlobalWorkerOptions.workerSrc = '';
pdfjsLib.GlobalWorkerOptions.disableWorker = true;

export async function extractTextFromPdfBuffer(buffer: Buffer, pdfFileSizeBytes?: number, warnings?: string[]): Promise<string> {
  const start = Date.now();
  console.log(`[PDF] Starting extraction for ${buffer.length} bytes`);

  try {
    // Try pdfjs-dist first
    const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
    const numPages = pdf.numPages;
    console.log(`[PDF] PDF has ${numPages} pages`);

    const pageTexts: string[] = [];
    const ocr_pages: number[] = [];
    const limit = pLimit(3); // Limit concurrent page processing

    const pagePromises = Array.from({ length: numPages }, (_, pageIndex) =>
      limit(async () => {
        try {
          const page = await pdf.getPage(pageIndex + 1);
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .map((item: any) => item.str)
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim();

          console.log(`[PDF] Page ${pageIndex + 1}: ${pageText.length} chars`);
          
          if (pageText.length < 30) {
            ocr_pages.push(pageIndex);
            console.log(`[PDF] Page ${pageIndex + 1} has low text content, will use OCR`);
          }
          
          pageTexts[pageIndex] = pageText;
          return { pageIndex, text: pageText, needsOCR: pageText.length < 30 };
        } catch (pageError) {
          console.error(`[PDF] Error processing page ${pageIndex + 1}:`, pageError);
          ocr_pages.push(pageIndex);
          return { pageIndex, text: '', needsOCR: true };
        }
      })
    );

    const pageResults = await Promise.all(pagePromises);
    const totalChars = pageResults.reduce((sum, result) => sum + result.text.length, 0);
    
    console.log(`[PDF] Total extracted text: ${totalChars} chars`);
    console.log(`[PDF] Pages needing OCR: ${ocr_pages.length}`);

    // Determine if we need OCR
    const isLikelyScanned = totalChars < 500 || ocr_pages.length === numPages;
    
    if (!isLikelyScanned && ocr_pages.length === 0) {
      console.log(`[PDF] Using pdfjs extraction only`);
      const result = normalize(pageTexts.join('\n'));
      console.log(`[PDF] Extraction completed in ${Date.now() - start}ms`);
      return result;
    }

    // Need OCR for some or all pages
    console.log(`[PDF] Using mixed extraction (${ocr_pages.length} pages need OCR)`);
    
    // For now, return the pdfjs text as fallback
    // TODO: Implement OCR for pages that need it
    const result = normalize(pageTexts.join('\n'));
    console.log(`[PDF] Mixed extraction completed in ${Date.now() - start}ms`);
    return result;

  } catch (pdfError) {
    console.error('[PDF] Error during pdfjs extraction:', pdfError);
    
    // Fallback to simple text extraction
    try {
      const result = buffer.toString('utf-8');
      console.log(`[PDF] Fallback extraction: ${result.length} chars`);
      return normalize(result);
    } catch (fallbackError: any) {
      console.error('[PDF] Fallback extraction failed:', fallbackError);
      return '';
    }
  }
}

function normalize(text: string) {
  return text
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n')
    .trim();
} 