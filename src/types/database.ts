export interface Interview {
  id: string
  title?: string
  content?: string
  file_path?: string
  file_name?: string
  file_size?: number
  file_type?: string
  created_at: string
  updated_at: string
  tags?: string[]
  participant_name?: string
  interview_date?: string
  duration?: number
  summary?: string
  product_fit_score?: number
  sentiment_score?: number
  // Additional properties used in components
  subject_name?: string
  keywords?: string[]
  sentiment?: number
  pmf_score?: number
  status?: string
  transcript?: string
  recommendations?: string[]
  key_insights?: string[]
  key_quote?: string
}

export interface Keyword {
  id: string
  keyword: string
  category: string
  interview_id: string
  created_at: string
  frequency: number
}

export interface Category {
  id: string
  name: string
  description?: string
  color?: string
  created_at: string
}

export interface ProductProfile {
  id: string
  name: string
  description: string
  product_url?: string
  target_audience?: string
  key_features: string[]
  created_at: string
  updated_at: string
  overall_fit_score?: number
  total_interviews: number
  positive_sentiment_count: number
  negative_sentiment_count: number
  neutral_sentiment_count: number
}

export interface ProductMarketFitMetrics {
  overall_score: number
  interview_count: number
  positive_sentiment_percentage: number
  negative_sentiment_percentage: number
  neutral_sentiment_percentage: number
  top_positive_keywords: string[]
  top_negative_keywords: string[]
  fit_trend: 'improving' | 'declining' | 'stable'
  recommendations: string[]
}

export interface SearchResult {
  interview: Interview
  matched_keywords: string[]
  relevance_score: number
  highlighted_content: string
}

export interface UploadProgress {
  id: string
  file_name: string
  progress: number
  status: 'uploading' | 'processing' | 'completed' | 'error'
  error?: string
  interview?: Interview // AI-extracted interview metadata
}

// Product documentation interface (file metadata)
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

// Updated product context interface
export interface ProductContext {
  id: string
  name: string
  description: string
  url?: string
  additional_documents?: ProductDocumentation[]
  created_at: string
  updated_at: string
} 