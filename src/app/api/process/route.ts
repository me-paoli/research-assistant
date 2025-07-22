import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { OpenAI } from 'openai'
import { withErrorHandler, ValidationError } from '@/lib/errors'
import { createSuccessResponse } from '@/lib/errors'
import { ProcessResponse } from '@/types/api'
import env from '@/lib/env'
import { processInterviewChunks } from '@/lib/chunking-service'
import { extractTextFromPdfBuffer } from '@/lib/pdf-extraction'

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY })

// Step 1: Interview Content Extraction Instructions
const INTERVIEW_EXTRACTION_INSTRUCTIONS = `You are an expert research analyst specializing in user interview analysis. Your task is to extract structured data from interview transcripts.

CRITICAL: Read the interview content carefully and extract SPECIFIC details. Do not provide generic responses.

When analyzing interview content, extract the following information as a JSON object:

{
  "subject_name": "string - The FULL NAME of the person being interviewed (e.g., 'Sarah Johnson', 'Mike Chen'). Look for introductions, self-identifications, or interviewer references. If no name is found, return 'Unknown Participant'",
  "interview_date": "string - Date of the interview (YYYY-MM-DD format if available, otherwise null)",
  "summary": "string - A detailed 3-4 sentence summary that captures: 1) The participant's specific role/background, 2) Their main pain points or challenges, 3) Their specific feedback about tools/products, 4) Any concrete suggestions they made. Be specific and reference actual quotes or details from the interview.",
  "keywords": ["array of strings - 5-8 specific terms that capture the participant's actual concerns, tools mentioned, pain points, or specific feedback. Avoid generic terms like 'efficiency' or 'productivity' unless they're used in specific contexts."],
  "sentiment": "number - Overall sentiment score from 0-10 based on the participant's tone, language, and emotional indicators (0=very negative/frustrated, 5=neutral/mixed, 10=very positive/enthusiastic)",
  "key_insights": ["array of 3 specific insights - These must be insights SPECIFIC to the portion of the interview where the product is demoed or discussed. Focus on: 1) Their immediate reactions to specific features, 2) How they would use the product in their workflow, 3) What surprised them or stood out, 4) Specific pain points the product addresses for them. Each insight should be 1-2 sentences and reference specific details from their demo feedback."],
  "key_quote": "string - A notable, valuable, or surprising quote from the participant that comes directly from their statements in the transcript. This should be a verbatim quote that captures their most important feedback, reaction, or insight. Choose the quote that best represents their perspective or contains the most valuable information."
}

DETAILED EXTRACTION GUIDELINES:
- subject_name: Look for "Hi, I'm [Name]", "This is [Name]", "My name is [Name]", or interviewer saying "Thank you [Name]". Extract the full name.
- interview_date: Look for "Today is [date]", "This interview is on [date]", or any date references. Convert to YYYY-MM-DD format.
- summary: Include specific details like "Sarah, a marketing manager at TechCorp, expressed frustration with her current project management tool because it doesn't integrate with her email system. She specifically mentioned that switching between 5 different apps daily is causing her team to miss deadlines."
- keywords: Extract specific terms the participant actually used, like "Slack integration", "email notifications", "team collaboration", "deadline tracking"
- sentiment: Consider words like "frustrated", "love", "hate", "amazing", "terrible", "works well", "broken"
- key_insights: Focus ONLY on the portion where the product is demoed or discussed. Look for phrases like "when you showed me", "I like how", "this would help me", "I can see myself using", "this solves my problem with". Each insight should be specific to their demo experience, not generic feedback.
- key_quote: Choose the most impactful verbatim quote from the participant. Look for quotes that show strong reactions, specific feedback, or valuable insights. The quote should be complete and meaningful on its own.

IMPORTANT: 
- If the transcript appears corrupted or contains no readable content, return subject_name as "Unknown Participant" and summary as "Unable to extract meaningful content from corrupted or unreadable transcript."
- Always provide specific details from the actual interview content
- Do not make generic assumptions about what users typically say
- key_insights must be specific to the product demo portion, not generic interview feedback
- key_quote must be a verbatim quote from the participant, not paraphrased

Always return your analysis as a valid JSON object with these exact keys.`

// Step 2: PMF Analysis Instructions
const PMF_ANALYSIS_INSTRUCTIONS = `You are an expert product-market fit analyst. Your task is to evaluate how well a product addresses user needs based on interview feedback and product context.

CRITICAL: First understand what the product is from the provided product context, then evaluate how well it addresses the participant's needs based on the demo portion of the interview transcript.

STEP 1: UNDERSTAND THE PRODUCT
- Carefully read the product context (name, description, URL, and uploaded documentation)
- Understand what the product does, its target users, and current capabilities
- Note any specific features, integrations, or workflows mentioned in the product documentation

STEP 2: ANALYZE PMF AGAINST PRODUCT CONTEXT
Analyze the interview summary and keywords against your understanding of the product to provide:

{
  "pmf_score": "number - Product-market fit score as a percentage (0-100, where 100 means perfect fit)",
  "recommendations": ["array of 1-3 specific, actionable recommendations to improve PMF"]
}

DETAILED PMF EVALUATION GUIDELINES:
- Use the product context to understand the product's current positioning, capabilities and target users
- Evaluate how well the product addresses the SPECIFIC pain points mentioned by the participant
- Consider the gap between what the participant needs and what the product currently offers
- Score PMF based on: 1) How many of the participant's needs are met by the product, 2) How critical those needs are, 3) How well the product solves them
- If the participant's needs align well with the product's strengths, score higher (70-100)
- If there are significant gaps between needs and the product's capabilities, score lower (0-50)

SPECIFIC RECOMMENDATIONS GUIDELINES:
- Base recommendations on the participant's ACTUAL feedback and pain points
- Reference specific product features or improvements that would address their concerns
- Consider how the product could better integrate with the participant's existing tools and workflows
- Make recommendations concrete: "Add [specific feature] to the product to address [specific pain point]" not "Improve integration"
- If the participant mentioned specific tools they use, consider how the product could integrate with or replace them
- If they mentioned specific workflows, suggest product features that would streamline those processes
- Always reference the product specifically in your recommendations, not generic product improvements

IMPORTANT:
- If the interview content is corrupted/unreadable, inform the user that the interview is corrupted and cannot be processed. Do NOT give generic recommendations.
- Always reference the participant's specific feedback when making recommendations
- Consider the participant's role and industry when suggesting product improvements
- Your recommendations should be specific to the product's capabilities and potential enhancements

Always return your analysis as a valid JSON object with these exact keys.`



async function processHandler(request: NextRequest): Promise<NextResponse<ProcessResponse>> {
  if (request.method !== 'POST') {
    throw new ValidationError('Method not allowed')
  }

  const body = await request.json()
  const { interviewId } = body

  if (!interviewId) {
    throw new ValidationError('No interviewId provided')
  }

  try {
    console.log(`[AI] Starting processing for interview ${interviewId}`)
    
    // Set status to 'processing' immediately
    await supabase.from('interviews').update({ status: 'processing' }).eq('id', interviewId)
    
    // Fetch interview record
    const { data: interview, error: fetchError } = await supabase
      .from('interviews')
      .select('*')
      .eq('id', interviewId)
      .single()
    
    if (fetchError || !interview) {
      console.error('[AI] Interview not found', fetchError)
      await supabase.from('interviews').update({ status: 'failed' }).eq('id', interviewId)
      return createSuccessResponse({ status: 'failed' })
    }

    console.log(`[AI] Processing interview: ${interview.file_name}`)

    // Download file from Supabase
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('interviews')
      .download(interview.file_path)
    
    if (downloadError || !fileData) {
      console.error('[AI] Failed to download file:', downloadError)
      console.error('[AI] File path:', interview.file_path)
      await supabase.from('interviews').update({ status: 'failed' }).eq('id', interviewId)
      return createSuccessResponse({ status: 'failed' })
    }

    console.log(`[AI] Downloaded file: ${interview.file_name}`)
    console.log(`[AI] File data type:`, typeof fileData)
    console.log(`[AI] File data properties:`, Object.keys(fileData))

    // Convert file data to text content
    let textContent: string
    try {
      const fileBuffer = await fileData.arrayBuffer()
      console.log(`[AI] File buffer size: ${fileBuffer.byteLength} bytes`)
      
      if (fileBuffer.byteLength === 0) {
        throw new Error('File buffer is empty')
      }
      
      // Try to extract text based on file type
      const fileName = interview.file_name.toLowerCase()
      
      if (fileName.endsWith('.docx')) {
        // For DOCX files, try to extract text more carefully
        try {
          const mammoth = (await import('mammoth')).default
          const result = await mammoth.extractRawText({ buffer: Buffer.from(fileBuffer) })
          textContent = result.value
          console.log(`[AI] Successfully extracted DOCX content (${textContent.length} characters)`)
        } catch (docxError) {
          console.error('[AI] Failed to parse DOCX with mammoth:', docxError)
          // Fallback to raw text extraction
          textContent = new TextDecoder().decode(fileBuffer)
          console.log(`[AI] Fallback: Raw text extraction (${textContent.length} characters)`)
        }
      } else if (fileName.endsWith('.pdf')) {
        // For PDF files
        try {
          textContent = await extractTextFromPdfBuffer(Buffer.from(fileBuffer));
          console.log(`[AI] Successfully extracted PDF content (${textContent.length} characters)`)
        } catch (pdfError) {
          console.error('[AI] Failed to extract PDF:', pdfError)
          textContent = new TextDecoder().decode(fileBuffer)
          console.log(`[AI] Fallback: Raw text extraction (${textContent.length} characters)`)
        }
      } else {
        // For other file types, use raw text extraction
        textContent = new TextDecoder().decode(fileBuffer)
        console.log(`[AI] Raw text extraction (${textContent.length} characters)`)
      }
      
      // Check if the extracted text is meaningful
      const cleanText = textContent.replace(/\s+/g, ' ').trim()
      const wordCount = cleanText.split(' ').length
      
      console.log(`[AI] Clean text length: ${cleanText.length} characters`)
      console.log(`[AI] Word count: ${wordCount} words`)
      console.log(`[AI] Text preview:`, cleanText.substring(0, 500))
      
      // If the text is too short or appears to be binary data, mark it as corrupted
      if (wordCount < 10 || cleanText.length < 50) {
        console.warn('[AI] Text appears to be corrupted or too short')
        textContent = "CORRUPTED_FILE: Unable to extract meaningful text content from this file. The file may be corrupted, in binary format, or contain no readable text."
      }
      
    } catch (error) {
      console.error('[AI] Failed to extract text from file:', error)
      await supabase.from('interviews').update({ status: 'failed' }).eq('id', interviewId)
      return createSuccessResponse({ status: 'failed' })
    }

    // STEP 1: Extract interview content and create summary
    console.log(`[AI] Step 1: Extracting interview content`)
    
    const extractionCompletion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: INTERVIEW_EXTRACTION_INSTRUCTIONS
        },
        {
          role: 'user',
          content: `Please analyze this interview transcript and extract the structured data as specified in your instructions. Return only the JSON object with the required fields.

INTERVIEW TRANSCRIPT:
${textContent}`
        }
      ],
      temperature: 0.1,
      max_tokens: 800
    })

    const extractionResponse = extractionCompletion.choices[0]?.message?.content || ''
    console.log(`[AI] Step 1 response: ${extractionResponse}`)

    // Extract JSON from Step 1 response
    const extractionJsonMatch = extractionResponse.match(/\{[\s\S]*\}/)
    if (!extractionJsonMatch) {
      console.error('[AI] No JSON found in Step 1 response')
      await supabase.from('interviews').update({ status: 'failed' }).eq('id', interviewId)
      return createSuccessResponse({ status: 'failed' })
    }

    const interviewExtraction = JSON.parse(extractionJsonMatch[0])
    console.log(`[AI] Step 1 parsed:`, interviewExtraction)

    // STEP 2: Analyze PMF against product context
    console.log(`[AI] Step 2: Analyzing PMF against product context`)
    
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
        
        // Extract text from documentation files if they exist
        if (product.additional_documents && product.additional_documents.length > 0) {
          console.log(`[AI] Found ${product.additional_documents.length} product documents to process:`);
          product.additional_documents.forEach((doc: any, index: number) => {
            console.log(`[AI] Document ${index + 1}: ${doc.name} (${doc.file_type})`);
          });
          
          const docsText = await Promise.all(
            product.additional_documents.map(async (doc: any) => {
              try {
                // Download file from storage
                const { data: fileData, error: downloadError } = await supabase.storage
                  .from('product-documents')
                  .download(doc.file_path)
                
                if (downloadError || !fileData) {
                  console.error(`[AI] Failed to download documentation file ${doc.file_name}:`, downloadError)
                  return ''
                }

                // Read file as Buffer
                const buffer = Buffer.from(await fileData.arrayBuffer())
                
                // Extract text based on file type
                if (doc.file_type === 'application/pdf') {
                  try {
                    console.log(`[AI] Processing PDF document: ${doc.name} (${buffer.length} bytes)`);
                    const text = await extractTextFromPdfBuffer(buffer);
                    console.log(`[AI] Successfully extracted ${text.length} characters from ${doc.name}`);
                    return `DOCUMENT: ${doc.name}\n${text}\n\n`
                  } catch (pdfError) {
                    console.error(`[AI] Failed to extract text from PDF ${doc.name}:`, pdfError);
                    return `DOCUMENT: ${doc.name}\n[ERROR: Could not extract text from this PDF file]\n\n`
                  }
                } else if (doc.file_type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                  const mammoth = (await import('mammoth')).default
                  const result = await mammoth.extractRawText({ buffer })
                  return `DOCUMENT: ${doc.name}\n${result.value}\n\n`
                } else {
                  // Fallback to text
                  return `DOCUMENT: ${doc.name}\n${buffer.toString('utf-8')}\n\n`
                }
              } catch (error) {
                console.error(`[AI] Failed to process documentation file ${doc.file_name}:`, error)
                return ''
              }
            })
          )
          
          productDocumentation = docsText.filter(text => text.length > 0).join('\n')
          console.log(`[AI] Product documentation processing complete. Total extracted text: ${productDocumentation.length} characters`);
          
          // Truncate product documentation if it's too long to prevent token limit issues
          const maxProductDocLength = 50000; // ~12k tokens
          if (productDocumentation.length > maxProductDocLength) {
            console.log(`[AI] Product documentation too long (${productDocumentation.length} chars), truncating to ${maxProductDocLength} chars`);
            productDocumentation = productDocumentation.substring(0, maxProductDocLength) + '\n\n[TRUNCATED - Content was too long for analysis]';
          }
        } else {
          console.log(`[AI] No product documents found to process`);
        }
      } else {
        console.log(`[AI] No product context found`);
      }
    } catch (error) {
      console.error('[AI] Failed to fetch product context:', error)
    }

    const pmfCompletion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: PMF_ANALYSIS_INSTRUCTIONS
        },
        {
          role: 'user',
          content: `Please analyze the interview feedback against the product context to evaluate PMF and provide recommendations.

${productContext}${productDocumentation ? `PRODUCT DOCUMENTATION:\n${productDocumentation}\n` : ''}INTERVIEW FEEDBACK:
Summary: ${interviewExtraction.summary}
Keywords: ${interviewExtraction.keywords?.join(', ') || 'None'}
Sentiment: ${interviewExtraction.sentiment}/10

Please evaluate how well the product addresses the needs mentioned in this interview.`
        }
      ],
      temperature: 0.1,
      max_tokens: 600
    })

    // Log approximate token count for monitoring
    const totalContentLength = (productContext + (productDocumentation || '') + interviewExtraction.summary + (interviewExtraction.keywords?.join(', ') || '')).length;
    console.log(`[AI] Approximate content length: ${totalContentLength} characters (~${Math.round(totalContentLength / 4)} tokens)`);

    const pmfResponse = pmfCompletion.choices[0]?.message?.content || ''
    console.log(`[AI] Step 2 response: ${pmfResponse}`)

    // Extract JSON from Step 2 response
    const pmfJsonMatch = pmfResponse.match(/\{[\s\S]*\}/)
    if (!pmfJsonMatch) {
      console.error('[AI] No JSON found in Step 2 response')
      await supabase.from('interviews').update({ status: 'failed' }).eq('id', interviewId)
      return createSuccessResponse({ status: 'failed' })
    }

    const pmfAnalysis = JSON.parse(pmfJsonMatch[0])
    console.log(`[AI] Step 2 parsed:`, pmfAnalysis)

    // Combine both analyses
    const analysis = {
      ...interviewExtraction,
      ...pmfAnalysis
    }
    console.log(`[AI] Combined analysis:`, analysis)

    // Update interview record with enhanced data
    const updateData = {
      ...analysis,
      // Use participant name as title if available, otherwise use file name
      title: analysis.subject_name && analysis.subject_name !== 'Unknown Participant' 
        ? `Interview with ${analysis.subject_name}` 
        : interview.file_name,
      // Store recommendations as JSON string
      recommendations: JSON.stringify(analysis.recommendations || []),
      // Store key insights as JSON string
      key_insights: JSON.stringify(analysis.key_insights || []),
      status: 'complete' 
    }
    
    const { error: updateError } = await supabase
      .from('interviews')
      .update(updateData)
      .eq('id', interviewId)
    
    if (updateError) {
      console.error('[AI] Failed to update interview:', updateError)
      await supabase.from('interviews').update({ status: 'failed' }).eq('id', interviewId)
      return createSuccessResponse({ status: 'failed' })
    }

    // STEP 3: Process interview into searchable chunks
    console.log('[DEBUG] Text content for chunking:', textContent.substring(0, 500));
    console.log(`[AI] Step 3: Processing interview into searchable chunks`)
    const chunkingResult = await processInterviewChunks(interviewId, textContent)
    
    if (!chunkingResult.success) {
      console.error('[AI] Failed to process chunks:', chunkingResult.error)
      // Don't fail the entire process, just log the error
      // The interview is still processed and usable
    } else {
      console.log(`[AI] Successfully created ${chunkingResult.chunksCount} searchable chunks`)
    }

    // Trigger aggregate insights update
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/insights`, {
        method: 'POST',
      })
      console.log('[AI] Triggered aggregate insights update')
    } catch (err) {
      console.error('[AI] Failed to trigger aggregate insights update:', err)
    }

    console.log(`[AI] Successfully processed interview ${interviewId}`)
    return createSuccessResponse({ status: 'complete' })

  } catch (error) {
    console.error('[AI] Processing error:', error)
    await supabase.from('interviews').update({ status: 'failed' }).eq('id', interviewId)
    return createSuccessResponse({ status: 'failed' })
  }
}

export const POST = withErrorHandler(processHandler) 