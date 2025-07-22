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
    try {
      return await handler(request)
    } catch (error) {
      console.error('API Error:', error)
      
      if (error instanceof ApiError) {
        return createErrorResponse(error)
      }
      
      return createErrorResponse(
        new InternalServerError(error instanceof Error ? error.message : 'Unknown error')
      )
    }
  }
} 