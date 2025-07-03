'use client'

import { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, Users, FileText, Tag, Calendar, TrendingDown, Minus } from 'lucide-react'
import { ProductProfile, ProductMarketFitMetrics } from '@/types/database'

export default function AnalyticsPage() {
  const [stats, setStats] = useState({
    totalInterviews: 0,
    totalKeywords: 0,
    totalCategories: 0,
    averageDuration: 0
  })

  const [product, setProduct] = useState<ProductProfile | null>(null)
  const [fitMetrics, setFitMetrics] = useState<ProductMarketFitMetrics>({
    overall_score: 0,
    interview_count: 0,
    positive_sentiment_percentage: 0,
    negative_sentiment_percentage: 0,
    neutral_sentiment_percentage: 0,
    top_positive_keywords: [],
    top_negative_keywords: [],
    fit_trend: 'stable',
    recommendations: []
  })

  const [topKeywords, setTopKeywords] = useState<Array<{keyword: string, count: number}>>([])
  const [recentActivity, setRecentActivity] = useState<Array<{date: string, count: number}>>([])

  // Mock data for demonstration
  useEffect(() => {
    setTimeout(() => {
      // Load product profile
      const savedProduct = localStorage.getItem('productProfile')
      if (savedProduct) {
        const productData = JSON.parse(savedProduct)
        setProduct(productData)
        
        // Calculate fit metrics based on product data
        const totalInterviews = productData.total_interviews || 0
        const positiveCount = productData.positive_sentiment_count || 0
        const negativeCount = productData.negative_sentiment_count || 0
        const neutralCount = productData.neutral_sentiment_count || 0
        
        const positivePercentage = totalInterviews > 0 ? (positiveCount / totalInterviews) * 100 : 0
        const negativePercentage = totalInterviews > 0 ? (negativeCount / totalInterviews) * 100 : 0
        const neutralPercentage = totalInterviews > 0 ? (neutralCount / totalInterviews) * 100 : 0
        
        // Calculate overall score
        let overallScore = 50 // Base score
        overallScore += positivePercentage * 0.4 // Up to +40 points
        overallScore -= negativePercentage * 0.3 // Up to -30 points
        
        setFitMetrics({
          overall_score: Math.max(0, Math.min(100, Math.round(overallScore))),
          interview_count: totalInterviews,
          positive_sentiment_percentage: Math.round(positivePercentage),
          negative_sentiment_percentage: Math.round(negativePercentage),
          neutral_sentiment_percentage: Math.round(neutralPercentage),
          top_positive_keywords: ['user experience', 'intuitive', 'easy to use', 'helpful'],
          top_negative_keywords: ['confusing', 'slow', 'buggy', 'expensive'],
          fit_trend: overallScore > 60 ? 'improving' : overallScore < 40 ? 'declining' : 'stable',
          recommendations: [
            'Focus on improving user onboarding based on feedback',
            'Address performance concerns mentioned in interviews',
            'Consider pricing strategy based on user feedback'
          ]
        })
      }

      setStats({
        totalInterviews: 24,
        totalKeywords: 156,
        totalCategories: 8,
        averageDuration: 45
      })

      setTopKeywords([
        { keyword: 'user experience', count: 12 },
        { keyword: 'mobile app', count: 10 },
        { keyword: 'checkout process', count: 8 },
        { keyword: 'navigation', count: 7 },
        { keyword: 'performance', count: 6 }
      ])

      setRecentActivity([
        { date: '2024-01-15', count: 3 },
        { date: '2024-01-14', count: 2 },
        { date: '2024-01-13', count: 1 },
        { date: '2024-01-12', count: 4 },
        { date: '2024-01-11', count: 2 }
      ])
    }, 1000)
  }, [])

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="w-4 h-4 text-green-600" />
      case 'declining':
        return <TrendingDown className="w-4 h-4 text-red-600" />
      default:
        return <Minus className="w-4 h-4 text-gray-600" />
    }
  }

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving':
        return 'text-green-600'
      case 'declining':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Analytics & Insights</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            View insights and trends from your research interviews. Track keywords, categories, and product-market fit over time.
          </p>
        </div>

        {/* Product Market Fit Overview */}
        {product && (
          <div className="max-w-6xl mx-auto mb-8">
            <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-6 border border-blue-200">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Product-Market Fit Analysis</h2>
                  <p className="text-gray-600">Based on {fitMetrics.interview_count} interviews</p>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold text-blue-600">{fitMetrics.overall_score}/100</div>
                  <div className="flex items-center justify-center space-x-1 text-sm">
                    {getTrendIcon(fitMetrics.fit_trend)}
                    <span className={getTrendColor(fitMetrics.fit_trend)}>
                      {fitMetrics.fit_trend.charAt(0).toUpperCase() + fitMetrics.fit_trend.slice(1)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{fitMetrics.positive_sentiment_percentage}%</div>
                  <div className="text-sm text-gray-600">Positive Sentiment</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{fitMetrics.negative_sentiment_percentage}%</div>
                  <div className="text-sm text-gray-600">Negative Sentiment</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-600">{fitMetrics.neutral_sentiment_percentage}%</div>
                  <div className="text-sm text-gray-600">Neutral Sentiment</div>
                </div>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                <div 
                  className={`h-3 rounded-full transition-all duration-500 ${
                    fitMetrics.overall_score >= 70 ? 'bg-green-500' :
                    fitMetrics.overall_score >= 50 ? 'bg-blue-500' :
                    fitMetrics.overall_score >= 30 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${fitMetrics.overall_score}%` }}
                />
              </div>

              <div className="text-sm text-gray-600">
                {fitMetrics.overall_score >= 70 && "🎉 Excellent product-market fit! Your product is resonating well with users."}
                {fitMetrics.overall_score >= 50 && fitMetrics.overall_score < 70 && "👍 Good product-market fit with room for improvement."}
                {fitMetrics.overall_score >= 30 && fitMetrics.overall_score < 50 && "⚠️ Moderate product-market fit. Consider addressing user concerns."}
                {fitMetrics.overall_score < 30 && "🚨 Low product-market fit. Significant changes may be needed."}
              </div>
            </div>
          </div>
        )}

        {/* Stats Overview */}
        <div className="max-w-6xl mx-auto mb-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{stats.totalInterviews}</div>
                  <div className="text-sm text-gray-600">Total Interviews</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Tag className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{stats.totalKeywords}</div>
                  <div className="text-sm text-gray-600">Keywords Indexed</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{stats.totalCategories}</div>
                  <div className="text-sm text-gray-600">Categories</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <Users className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{stats.averageDuration}</div>
                  <div className="text-sm text-gray-600">Avg. Duration (min)</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts and Insights */}
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Top Keywords */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Top Keywords</h2>
              <div className="space-y-4">
                {topKeywords.map((item, index) => (
                  <div key={item.keyword} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <span className="font-medium text-gray-900">{item.keyword}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${(item.count / topKeywords[0].count) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600 w-8 text-right">{item.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
              <div className="space-y-4">
                {recentActivity.map((item) => (
                  <div key={item.date} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-900">
                        {new Date(item.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${(item.count / Math.max(...recentActivity.map(a => a.count))) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600 w-8 text-right">{item.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Product Market Fit Insights */}
        {product && (
          <div className="max-w-6xl mx-auto mt-8">
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Sentiment Analysis */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Sentiment Analysis</h2>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Positive Keywords</span>
                      <span className="text-green-600">{fitMetrics.top_positive_keywords.length}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {fitMetrics.top_positive_keywords.map((keyword) => (
                        <span key={keyword} className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Negative Keywords</span>
                      <span className="text-red-600">{fitMetrics.top_negative_keywords.length}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {fitMetrics.top_negative_keywords.map((keyword) => (
                        <span key={keyword} className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Recommendations</h2>
                <div className="space-y-3">
                  {fitMetrics.recommendations.map((recommendation, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                      <p className="text-sm text-gray-700">{recommendation}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Export Options */}
        <div className="max-w-6xl mx-auto mt-8">
          <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
            <h2 className="text-lg font-semibold text-blue-900 mb-3">Export & Reports</h2>
            <div className="flex flex-wrap gap-3">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                Export All Data
              </button>
              <button className="px-4 py-2 bg-white text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors text-sm">
                Generate Report
              </button>
              <button className="px-4 py-2 bg-white text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors text-sm">
                Share Insights
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 