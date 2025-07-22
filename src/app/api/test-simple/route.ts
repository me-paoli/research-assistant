import { NextRequest, NextResponse } from 'next/server'
import { OpenAI } from 'openai'
import env from '@/lib/env'

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY })

export async function GET(request: NextRequest) {
  try {
    console.log('[TEST] Testing basic OpenAI functionality')
    console.log('[TEST] OpenAI API Key length:', env.OPENAI_API_KEY.length)
    console.log('[TEST] OpenAI API Key starts with:', env.OPENAI_API_KEY.substring(0, 7))
    
    // Test 0: Check if we can make a simple API call
    try {
      const models = await openai.models.list()
      console.log('[TEST] Models API call successful, found', models.data.length, 'models')
    } catch (error) {
      console.error('[TEST] Models API call failed:', error)
      return NextResponse.json({ 
        success: false, 
        error: 'OpenAI API key or configuration issue',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 })
    }
    
    // Test 1: Create an assistant
    const assistant = await openai.beta.assistants.create({
      name: 'Simple Test Assistant',
      instructions: 'You are a helpful assistant.',
      model: 'gpt-4o-mini'
    })
    console.log('[TEST] Created assistant:', assistant.id)
    
    // Test 2: Create a thread
    const thread = await openai.beta.threads.create()
    console.log('[TEST] Thread response:', JSON.stringify(thread, null, 2))
    console.log('[TEST] Created thread:', thread.id)
    
    if (!thread.id) {
      throw new Error('Thread ID is undefined')
    }
    
    // Test 3: Add a message
    const message = await openai.beta.threads.messages.create(thread.id, {
      role: 'user',
      content: 'Hello, can you help me?'
    })
    console.log('[TEST] Added message:', message.id)
    
    // Test 4: Run the assistant
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: assistant.id
    })
    console.log('[TEST] Started run:', run.id)
    
    // Test 5: Wait for completion
    let runStatus = run.status
    let attempts = 0
    while ((runStatus === 'queued' || runStatus === 'in_progress') && attempts < 10) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      const updatedRun = await openai.beta.threads.runs.retrieve(thread.id, run.id as any)
      runStatus = updatedRun.status
      console.log(`[TEST] Run status: ${runStatus} (attempt ${attempts + 1})`)
      attempts++
    }
    
    console.log(`[TEST] Final run status: ${runStatus}`)
    
    // Test 6: Get response
    const messages = await openai.beta.threads.messages.list(thread.id)
    const lastMessage = messages.data[0]
    
    // Clean up
    await openai.beta.assistants.delete(assistant.id)
    
    return NextResponse.json({ 
      success: true,
      assistantId: assistant.id,
      threadId: thread.id,
      runId: run.id,
      runStatus,
      hasResponse: lastMessage && lastMessage.role === 'assistant',
      responseText: lastMessage?.content[0]?.type === 'text' ? lastMessage.content[0].text.value : null
    })
    
  } catch (error) {
    console.error('[TEST] Error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Test failed',
      details: JSON.stringify(error, null, 2)
    }, { status: 500 })
  }
} 