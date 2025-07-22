import { Interview } from './database'

// Common API response wrapper
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

// Upload API responses
export interface UploadResponse extends ApiResponse {
  data?: {
    interview: Interview
  }
}

// Process API responses
export interface ProcessResponse extends ApiResponse {
  data?: {
    status: string
  }
}

// Search API responses
export interface SearchResponse extends ApiResponse {
  data?: {
    results: Interview[]
  }
}

// Hybrid Search API responses
export interface HybridSearchResult {
  id: string
  interview_id: string
  chunk_index: number
  content: string
  interview: Interview | null
  relevance_score: number
  search_type?: 'hybrid' | 'full_text' | 'semantic'
  highlighted_content: string
}

export interface HybridSearchResponse extends ApiResponse {
  data?: {
    results: HybridSearchResult[]
    query: string
    totalResults: number
    searchType: string
  }
}

// Interviews API responses
export interface InterviewsResponse extends ApiResponse {
  data?: {
    interviews: Interview[]
  }
}

// Interview API responses
export interface InterviewResponse extends ApiResponse {
  data?: {
    interview: Interview
  }
}

// Product Context API responses
export interface ProductContextResponse extends ApiResponse {
  data?: {
    productContext: {
      id: string
      name: string
      description: string
      url?: string
      additional_documents?: ProductDocumentation[]
      created_at: string
      updated_at: string
    } | null
  }
}

// Product Documentation API responses (file metadata)
export interface ProductDocumentation {
  id: string
  name: string
  description: string
  file_path: string
  file_name: string
  file_size: number
  file_type: string
  created_at: string
  updated_at: string
}

export interface ProductDocumentationResponse extends ApiResponse {
  data?: {
    documentation: ProductDocumentation
  }
}

export interface ProductDocumentationListResponse extends ApiResponse {
  data?: {
    documentation: ProductDocumentation[]
  }
}

// Insights API responses
export interface InsightsResponse extends ApiResponse {
  data?: {
    insights: {
      id: string
      recommendations: string[]
      updated_at: string
    }
  }
}

// Error response
export interface ErrorResponse {
  success: false
  error: string
} 