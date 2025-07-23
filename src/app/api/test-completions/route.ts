import { NextRequest, NextResponse } from 'next/server'
import { OpenAI } from 'openai'
import env from '@/lib/env'

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY })

export async function POST(request: NextRequest) {
  try {
    console.log('[TEST] Testing Chat Completions API')
    
    const body = await request.json()
    const { interviewId } = body
    
    if (!interviewId) {
      return NextResponse.json({ error: 'interviewId required' }, { status: 400 })
    }
    
    // Mock interview content for testing
    const mockTranscript = `Interview with John Smith on 2024-01-15

Interviewer: Hi John, thanks for joining us today. Can you tell us about your experience with our product?

John: Sure! I've been using the product for about 3 months now. Overall, I find it really helpful for managing my daily tasks. The interface is clean and intuitive.

Interviewer: What specific features do you find most valuable?

John: I really like the task prioritization feature. It helps me focus on what's most important. The mobile app is also great - I can update my tasks on the go.

Interviewer: Are there any pain points or areas for improvement?

John: Well, sometimes the sync between devices can be slow. And I wish there was a way to share task lists with my team more easily. But overall, it's been a positive experience.

Interviewer: How would you rate your overall satisfaction?

John: I'd say 8 out of 10. It's definitely improved my productivity, and I'd recommend it to others.`

    // Use Chat Completions API instead of Assistants API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an expert research analyst specializing in user interview analysis. Your task is to extract structured data from interview transcripts.

When analyzing interview content, extract the following information as a JSON object:

{
  "subject_name": "string - The name of the person being interviewed",
  "interview_date": "string - Date of the interview (YYYY-MM-DD format if available, otherwise null)",
  "summary": "string - A concise 2-3 sentence summary of the main points discussed",
  "keywords": ["array of strings - Key topics, pain points, or themes mentioned"],
  "sentiment": "number - Overall sentiment score from 0-10 (0=very negative, 5=neutral, 10=very positive)",
  "pmf_score": "number - Product-market fit score as a percentage (0-100) based on how well the product solves their problems"
}

EXTRACTION GUIDELINES:
- subject_name: Look for introductions, names mentioned, or interviewer references
- interview_date: Extract any date mentioned, convert to YYYY-MM-DD format
- summary: Focus on the most important insights, pain points, or feedback shared
- keywords: Extract 5-10 relevant terms that capture main themes (avoid generic words)
- sentiment: Focus on the participant's reaction to the product demo specifically. Consider their tone, language, and emotional indicators when discussing the product. Return a number from 0-10 (0=very negative about the product, 5=neutral/mixed feelings about the product, 10=very positive about the product)
- pmf_score: Assess how well the discussed product/service addresses the user's needs and return a percentage (0-100) based on user's reaction to the product demo

Always return your analysis as a valid JSON object with these exact keys.`
        },
        {
          role: 'user',
          content: `Please analyze this interview transcript and extract the structured data as specified in your instructions. Return only the JSON object with the required fields.

Interview Transcript:
${mockTranscript}`
        }
      ],
      temperature: 0.1,
      max_tokens: 1000
    })
    
    console.log('[TEST] Chat completion response:', completion.choices[0]?.message?.content)
    
    // Parse the response
    const responseText = completion.choices[0]?.message?.content || ''
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    
    if (!jsonMatch) {
      return NextResponse.json({ 
        success: false, 
        error: 'No JSON found in response',
        response: responseText
      })
    }
    
    const analysis = JSON.parse(jsonMatch[0])
    
    return NextResponse.json({ 
      success: true,
      analysis,
      rawResponse: responseText
    })
    
  } catch (error) {
    console.error('[TEST] Chat completions error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Chat completions failed',
      details: JSON.stringify(error, null, 2)
    }, { status: 500 })
  }
} 