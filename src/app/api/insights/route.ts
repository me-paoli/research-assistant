import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { OpenAI } from 'openai'
import { withErrorHandler, ValidationError, InternalServerError } from '@/lib/errors'
import { createSuccessResponse } from '@/lib/errors'
import { InsightsResponse } from '@/types/api'
import env from '@/lib/env'
import mammoth from 'mammoth'
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

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY })

async function getAllRecommendations(): Promise<string[]> {
  const { data, error } = await supabase
    .from('interviews')
    .select('summary, keywords, sentiment, pmf_score')
    .not('summary', 'is', null)

  if (error) {
    console.error('Error fetching interviews for recommendations:', error)
    return []
  }

  const recommendations: string[] = []
  
  data?.forEach((interview) => {
    if (interview.summary) {
      recommendations.push(interview.summary)
    }
    if (interview.keywords && Array.isArray(interview.keywords)) {
      recommendations.push(interview.keywords.join(', '))
    }
  })

  return recommendations
}

async function getAllSummariesAndInsights(): Promise<{ summaries: string[]; keyInsights: string[] }> {
  const { data, error } = await supabase
    .from('interviews')
    .select('summary, key_insights')
    .not('summary', 'is', null)

  if (error) {
    console.error('Error fetching interviews for summaries/insights:', error)
    return { summaries: [], keyInsights: [] }
  }

  const summaries: string[] = []
  const keyInsights: string[] = []

  data?.forEach((interview) => {
    if (interview.summary) {
      summaries.push(interview.summary)
    }
    if (interview.key_insights) {
      try {
        const insights = Array.isArray(interview.key_insights)
          ? interview.key_insights
          : JSON.parse(interview.key_insights)
        if (Array.isArray(insights)) {
          keyInsights.push(...insights)
        }
      } catch (e) {
        // ignore parse errors
      }
    }
  })

  return { summaries, keyInsights }
}

async function getAllChunkKeyPoints(): Promise<string[]> {
  const { data, error } = await supabase
    .from('interview_chunks')
    .select('key_points')
    .not('key_points', 'is', null)

  if (error) {
    console.error('Error fetching chunk key points:', error)
    return []
  }

  const keyPoints: string[] = []
  data?.forEach((chunk) => {
    if (chunk.key_points) {
      try {
        const points = Array.isArray(chunk.key_points)
          ? chunk.key_points
          : JSON.parse(chunk.key_points)
        if (Array.isArray(points)) {
          keyPoints.push(...points)
        }
      } catch (e) {
        // ignore parse errors
      }
    }
  })
  return keyPoints
}

async function getAggregateInsightsWithOpenAI({ summaries, keyInsights, chunkKeyPoints }: { summaries: string[]; keyInsights: string[]; chunkKeyPoints: string[] }, warnings: string[]): Promise<any> {
  // Get product context and documentation
  let productContext = ''
  let productDocumentation = ''
  try {
    const { data: product } = await supabase
      .from('product_context')
      .select('name, description, url, additional_documents')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    if (product) {
      productContext = `PRODUCT: ${product.name || 'Unknown'}\nDESCRIPTION: ${product.description || 'No description'}\nURL: ${product.url || 'No URL'}\n\n`
      if (product.additional_documents && product.additional_documents.length > 0) {
        // List all files in the product-documents bucket
        let allFiles: string[] = []
        try {
          const { data: fileList, error: listError } = await supabase.storage.from('product-documents').list('')
          if (fileList && Array.isArray(fileList)) {
            allFiles = fileList.map(f => f.name)
          } else if (listError) {
            warnings.push('Could not list files in product-documents bucket.')
          }
        } catch (e) {
          warnings.push('Error listing files in product-documents bucket.')
        }
        const docsText = await Promise.all(
          product.additional_documents.map(async (doc: any) => {
            if (!allFiles.includes(doc.file_path)) {
              warnings.push(`Documentation file missing from storage: ${doc.file_name} (${doc.file_path})`)
              return ''
            }
            try {
              // Download file from storage
              const { data: fileData, error: downloadError } = await supabase.storage
                .from('product-documents')
                .download(doc.file_path)
              if (downloadError || !fileData) {
                warnings.push(`Could not download documentation file: ${doc.file_name} (${doc.file_path})`)
                return ''
              }
              // Read file as Buffer
              const buffer = Buffer.from(await fileData.arrayBuffer())
              let text = ''
              try {
                if (doc.file_type === 'application/pdf') {
                  console.log(`[PDFJS] Buffer length: ${buffer.length}`);
                  console.log(`[PDFJS] Buffer preview:`, buffer.slice(0, 32));
                  text = await extractTextFromPdfBuffer(buffer);
                } else if (doc.file_type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                  const result = await mammoth.extractRawText({ buffer })
                  text = result.value
                } else {
                  text = buffer.toString('utf-8')
                }
              } catch (parseError) {
                warnings.push(`Could not extract text from documentation file: ${doc.file_name} (${doc.file_path})`)
                return ''
              }
              return `${doc.name}:\n${text}`
            } catch (error) {
              warnings.push(`Error processing documentation file: ${doc.file_name} (${doc.file_path})`)
              return ''
            }
          })
        )
        const validDocs = docsText.filter(text => text.length > 0)
        if (validDocs.length > 0) {
          productDocumentation = `\n\nPRODUCT DOCUMENTATION:\n${validDocs.join('\n\n')}\n\n`
        }
      }
    }
  } catch (error) {
    warnings.push('Error fetching product context or documentation.')
    console.error('Error fetching product context:', error)
  }

  const prompt = `You are an expert product manager analyzing user research data. Based on the following interview summaries, key insights, and important points from transcripts, generate a JSON object with these keys: trends (recurring points), surprises (unique or unexpected feedback), and recommendations (3-5 actionable suggestions to improve the product).\n\n${productContext}${productDocumentation}INTERVIEW SUMMARIES:\n${summaries.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\nKEY INSIGHTS:\n${keyInsights.map((k, i) => `${i + 1}. ${k}`).join('\n')}\n\nIMPORTANT/UNIQUE POINTS FROM TRANSCRIPTS:\n${chunkKeyPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}\n\nTASK:\n1. Identify the most important and recurring points across all interviews.\n2. Highlight any surprising or unique feedback.\n3. Provide 3–5 actionable recommendations for improving the product.\nReturn your analysis as a JSON object with keys: trends, surprises, recommendations.`

  // Truncate content if it's too long to prevent token limit issues
  const maxPromptLength = 80000; // ~20k tokens
  let finalPrompt = prompt;
  
  if (prompt.length > maxPromptLength) {
    console.log(`[INSIGHTS] Prompt too long (${prompt.length} chars), truncating to ${maxPromptLength} chars`);
    finalPrompt = prompt.substring(0, maxPromptLength) + '\n\n[TRUNCATED - Content was too long for analysis]';
  }
  
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: finalPrompt }],
    temperature: 0.2,
    max_tokens: 800,
  })

  try {
    const content = completion.choices[0].message.content || '{}'
    const cleanedContent = content.trim().replace(/^```json\s*/, '').replace(/\s*```$/, '')
    const json = JSON.parse(cleanedContent)
    return json
  } catch (error) {
    warnings.push('Error parsing OpenAI response for aggregate insights.')
    console.error('Error parsing aggregate insights JSON:', error)
    return {}
  }
}

async function getInsightsHandler(request: NextRequest): Promise<NextResponse<InsightsResponse>> {
  if (request.method !== 'GET') {
    throw new ValidationError('Method not allowed')
  }

  // Return the latest insights row
  const { data, error } = await supabase
    .from('insights')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    throw new InternalServerError(error.message)
  }

  return createSuccessResponse({
    insights: data?.insights || null,
    warnings: data?.warnings || []
  })
}

async function postInsightsHandler(request: NextRequest): Promise<NextResponse<InsightsResponse>> {
  if (request.method !== 'POST') {
    throw new ValidationError('Method not allowed')
  }

  try {
    const warnings: string[] = []
    const { summaries, keyInsights } = await getAllSummariesAndInsights()
    const chunkKeyPoints = await getAllChunkKeyPoints()
    const aggregateInsights = await getAggregateInsightsWithOpenAI({ summaries, keyInsights, chunkKeyPoints }, warnings)
    // Store in insights table
    const { data, error } = await supabase
      .from('insights')
      .insert([{ insights: aggregateInsights, warnings, updated_at: new Date().toISOString() }])
      .select()
      .single()

    if (error) {
      throw new InternalServerError(error.message)
    }

    return createSuccessResponse({ insights: data?.insights, warnings: data?.warnings || [] })
  } catch (error) {
    throw new InternalServerError(error instanceof Error ? error.message : 'Unknown error')
  }
}

// Full hybrid PDF extraction: pdfjs-dist primary, OCR fallback with pdf2pic + Tesseract.js
export async function extractTextFromPdfBuffer(buffer: Buffer, pdfFileSizeBytes?: number, warnings?: string[]): Promise<string> {
  const start = Date.now();
  let extraction_method = 'pdfjs';
  let ocr_pages: number[] = [];
  let pageTexts: string[] = [];
  let pdfPages = 0;
  let pdfjsChars = 0;
  let raw_pdf_text = '';
  let clean_text = '';
  let quality: any = {};

  console.log(`[PDF] Starting extraction, buffer size: ${buffer.length} bytes`);

  // 1. Try pdfjs-dist
  try {
    const uint8Array = new Uint8Array(buffer);
    const loadingTask = pdfjsLib.getDocument({ data: uint8Array });
    const pdf = await loadingTask.promise;
    pdfPages = pdf.numPages;
    console.log(`[PDF] Successfully loaded PDF with ${pdfPages} pages`);
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items.map((item: any) => item.str).join(' ');
      pageTexts.push(pageText);
      console.log(`[PDF] Page ${i}: extracted ${pageText.length} characters`);
    }
    raw_pdf_text = pageTexts.join('\n\n=== Page ===\n\n');
    pdfjsChars = raw_pdf_text.length;
    console.log(`[PDF] Total extracted text: ${pdfjsChars} characters`);
  } catch (e: any) {
    console.error(`[PDF] Error during pdfjs extraction:`, e.message);
    if (e && e.message && e.message.toLowerCase().includes('password')) {
      warnings?.push('PDF is password-protected or encrypted. Please upload an unencrypted copy.');
      return '';
    }
    
    // Try a simpler fallback approach
    try {
      console.log(`[PDF] Attempting fallback extraction...`);
      const simpleText = buffer.toString('utf-8');
      if (simpleText.length > 100) {
        console.log(`[PDF] Fallback extracted ${simpleText.length} characters`);
        return normalize(simpleText);
      }
    } catch (fallbackError: any) {
      console.error(`[PDF] Fallback extraction also failed:`, fallbackError.message);
    }
    
    warnings?.push(`Error extracting text with pdfjs-dist: ${e.message}`);
  }

  // Heuristic: Should we OCR?
  const totalChars = raw_pdf_text.length;
  const avgCharsPerPage = pdfPages ? totalChars / pdfPages : 0;
  const hasLetters = /[A-Za-z]/.test(raw_pdf_text);
  const textDensity = pdfFileSizeBytes ? totalChars / pdfFileSizeBytes : 0;
  const isLikelyScanned =
    totalChars < 500 ||
    avgCharsPerPage < 50 ||
    !hasLetters;

  console.log(`[PDF] Analysis: totalChars=${totalChars}, avgCharsPerPage=${avgCharsPerPage}, hasLetters=${hasLetters}, isLikelyScanned=${isLikelyScanned}`);

  // If not likely scanned, normalize and return
  if (!isLikelyScanned) {
    clean_text = normalize(raw_pdf_text);
    console.log(`[PDF] Using pdfjs text, final length: ${clean_text.length}`);
    return clean_text;
  }

  // OCR fallback for scanned/image-based PDFs
  console.log(`[PDF] Attempting OCR fallback...`);
  extraction_method = 'ocr';
  let ocrTextArr: string[] = [];
  const limit = pLimit(2); // concurrency limit
  const tempFilePath = `/tmp/pdf-ocr-${Date.now()}-${Math.random().toString(36).slice(2)}.pdf`;
  const fs = await import('fs/promises');
  await fs.writeFile(tempFilePath, buffer);
  try {
    const pdf2pic = pdf2picFromPath(tempFilePath, {
      density: 200,
      saveFilename: 'ocr-page',
      savePath: '/tmp',
      format: 'png',
      width: 1600,
      height: 2200,
      quality: 100,
    });
    const ocrPromises = pageTexts.map((pageText, idx) => limit(async () => {
      if (pageText.trim().length >= 30) {
        // Use pdfjs text for this page
        console.log(`[PDF] Page ${idx + 1}: using existing text (${pageText.trim().length} chars)`);
        return pageText;
      }
      // OCR this page
      ocr_pages.push(idx);
      const pageNum = idx + 1;
      console.log(`[PDF] Page ${pageNum}: attempting OCR...`);
      const imageResult = await pdf2pic(pageNum, { responseType: 'buffer' });
      if (!imageResult || !imageResult.buffer) {
        warnings?.push(`Could not render page ${pageNum} to image buffer for OCR.`);
        console.error(`[PDF] Failed to render page ${pageNum} to image`);
        return '';
      }
      const imageBuffer = imageResult.buffer;
      const hash = crypto.createHash('sha256').update(imageBuffer).digest('hex');
      // (Optional: cache by hash)
      const { data: { text: ocrText } } = await Tesseract.recognize(imageBuffer, 'eng');
      console.log(`[PDF] Page ${pageNum}: OCR extracted ${ocrText.length} characters`);
      return ocrText;
    }));
    ocrTextArr = await Promise.all(ocrPromises);
    raw_pdf_text = ocrTextArr.map((t, i) => `=== Page ${i + 1} ===\n${t}`).join('\n\n');
    clean_text = normalize(raw_pdf_text);
    console.log(`[PDF] OCR completed, final text length: ${clean_text.length}`);
  } catch (e: any) {
    console.error(`[PDF] OCR fallback failed:`, e.message);
    warnings?.push('OCR fallback failed.' + (e?.message ? ` (${e.message})` : ''));
  } finally {
    await fs.unlink(tempFilePath).catch(() => {});
  }
  
  if (clean_text.trim().length === 0) {
    console.warn(`[PDF] No text extracted from PDF`);
    warnings?.push('No text could be extracted from this PDF. It may be image-only or corrupted.');
  }
  
  return clean_text;
}

// Normalization helper
function normalize(text: string) {
  return text
    .replace(/\r/g,'')
    .replace(/\u00A0/g,' ')
    .replace(/[ \t]+/g,' ')
    .replace(/\n{3,}/g,'\n\n')
    .trim();
}

export const GET = withErrorHandler(getInsightsHandler)
export const POST = withErrorHandler(postInsightsHandler) 