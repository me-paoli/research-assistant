import { NextRequest, NextResponse } from 'next/server'
import { ErrorResponse } from '@/types/api'

// Custom error classes
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export class ValidationError extends ApiError {
  constructor(message: string) {
    super(400, message, 'VALIDATION_ERROR')
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string = 'Resource not found') {
    super(404, message, 'NOT_FOUND')
  }
}

export class InternalServerError extends ApiError {
  constructor(message: string = 'Internal server error') {
    super(500, message, 'INTERNAL_SERVER_ERROR')
  }
}

// Error response helper
export function createErrorResponse(error: ApiError): NextResponse<ErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error: error.message,
      code: error.code
    },
    { status: error.statusCode }
  )
}

// Success response helper
export function createSuccessResponse<T>(data: T, status: number = 200) {
  return NextResponse.json(
    {
      success: true,
      data
    },
    { status }
  )
}

// Handle async route errors
export function withErrorHandler<T>(handler: (request: NextRequest) => Promise<NextResponse<T>>) {
  return async (request: NextRequest) => {
    console.log('=== withErrorHandler START ===')
    console.log('Request method:', request.method)
    console.log('Request URL:', request.url)
    
    try {
      console.log('=== CALLING HANDLER ===')
      const result = await handler(request)
      console.log('=== HANDLER SUCCESS ===')
      return result
    } catch (error) {
      console.error('=== withErrorHandler ERROR ===')
      console.error('API Error:', error)
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack')
      
      if (error instanceof ApiError) {
        return createErrorResponse(error)
      }
      
      return createErrorResponse(
        new InternalServerError(error instanceof Error ? error.message : 'Unknown error')
      )
    }
  }
} 