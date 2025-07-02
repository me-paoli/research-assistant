'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, Upload, FileText, BarChart3, Settings, ExternalLink, Target, Star, TrendingUp, ArrowRight } from 'lucide-react'
import { ProductProfile } from '@/types/database'
import { useAuth } from '@/contexts/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'

function HomeContent() {
  const [product, setProduct] = useState<ProductProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    // Load product profile from localStorage
    const savedProduct = localStorage.getItem('productProfile')
    if (savedProduct) {
      setProduct(JSON.parse(savedProduct))
    }
    setLoading(false)
  }, [])

  const calculateFitScore = (product: ProductProfile) => {
    if (product.total_interviews === 0) return 0
    
    const positiveRatio = product.positive_sentiment_count / product.total_interviews
    const negativeRatio = product.negative_sentiment_count / product.total_interviews
    
    let score = 50 // Base score
    score += positiveRatio * 40 // Up to +40 points for positive sentiment
    score -= negativeRatio * 30 // Up to -30 points for negative sentiment
    
    return Math.max(0, Math.min(100, Math.round(score)))
  }

  const getFitScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600'
    if (score >= 50) return 'text-blue-600'
    if (score >= 30) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getFitScoreMessage = (score: number) => {
    if (score >= 70) return '🎉 Excellent fit!'
    if (score >= 50) return '👍 Good fit'
    if (score >= 30) return '⚠️ Moderate fit'
    return '🚨 Needs work'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Research Interview Assistant
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Upload, index, and search through your user research interviews with powerful keyword analysis and categorization.
          </p>
          {user && (
            <p className="text-sm text-gray-500 mt-2">
              Welcome back, {user.full_name || user.email}!
            </p>
          )}
        </div>

        {/* Product Profile Section */}
        {!loading && product && product.name && (
          <div className="max-w-6xl mx-auto mb-8">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h2 className="text-2xl font-bold text-gray-900">{product.name}</h2>
                    {product.product_url && (
                      <a
                        href={product.product_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>View Product</span>
                      </a>
                    )}
                  </div>
                  <p className="text-gray-600 mb-4">{product.description}</p>
                  
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    {product.target_audience && (
                      <div className="flex items-center space-x-1">
                        <Target className="w-4 h-4" />
                        <span>{product.target_audience}</span>
                      </div>
                    )}
                    {product.key_features.length > 0 && (
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4" />
                        <span>{product.key_features.length} features</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <Link
                  href="/settings"
                  className="px-4 py-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Edit Profile
                </Link>
              </div>

              {/* Product Market Fit Score */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <TrendingUp className="w-5 h-5 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Product-Market Fit Score</span>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${getFitScoreColor(calculateFitScore(product))}`}>
                      {calculateFitScore(product)}/100
                    </div>
                    <div className="text-sm text-gray-600">{getFitScoreMessage(calculateFitScore(product))}</div>
                  </div>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                  <div 
                    className={`h-2 rounded-full transition-all duration-500 ${
                      calculateFitScore(product) >= 70 ? 'bg-green-500' :
                      calculateFitScore(product) >= 50 ? 'bg-blue-500' :
                      calculateFitScore(product) >= 30 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${calculateFitScore(product)}%` }}
                  />
                </div>
                
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>Based on {product.total_interviews} interviews</span>
                  <span>
                    {product.positive_sentiment_count} positive • {product.negative_sentiment_count} negative • {product.neutral_sentiment_count} neutral
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Link 
            href="/upload" 
            className="group bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 hover:border-blue-300"
          >
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                <Upload className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Upload Interviews</h3>
                <p className="text-sm text-gray-600">Add new research files</p>
              </div>
            </div>
          </Link>

          <Link 
            href="/search" 
            className="group bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 hover:border-green-300"
          >
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                <Search className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Search & Explore</h3>
                <p className="text-sm text-gray-600">Find insights quickly</p>
              </div>
            </div>
          </Link>

          <Link 
            href="/interviews" 
            className="group bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 hover:border-purple-300"
          >
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">All Interviews</h3>
                <p className="text-sm text-gray-600">Browse your collection</p>
              </div>
            </div>
          </Link>

          <Link 
            href="/analytics" 
            className="group bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 hover:border-orange-300"
          >
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors">
                <BarChart3 className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Analytics</h3>
                <p className="text-sm text-gray-600">View insights & trends</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Stats Overview */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Overview</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">0</div>
              <div className="text-sm text-gray-600">Total Interviews</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">0</div>
              <div className="text-sm text-gray-600">Keywords Indexed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">0</div>
              <div className="text-sm text-gray-600">Categories</div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No interviews uploaded yet</p>
            <p className="text-sm">Start by uploading your first research interview</p>
          </div>
        </div>

        {/* Setup Product Profile CTA */}
        {!loading && !product?.name && (
          <div className="max-w-4xl mx-auto mt-8">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Settings className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-blue-900 mb-1">Set up your product profile</h3>
                  <p className="text-blue-800 text-sm">
                    Add details about your product to get product-market fit insights and better context for your research.
                  </p>
                </div>
                <Link
                  href="/settings"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function Home() {
  return (
    <ProtectedRoute>
      <HomeContent />
    </ProtectedRoute>
  )
}
