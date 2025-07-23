'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, Users, FileText, Target, Activity, Smile, Meh, Frown } from 'lucide-react'
import { Interview } from '@/types/database'

export default function InsightsPage() {
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchInterviews() {
      setLoading(true)
      const res = await fetch('/api/interviews')
      const data = await res.json()
      setInterviews(data.data?.interviews || [])
      setLoading(false)
    }
    fetchInterviews()
  }, [])

  // Compute insights from real data
  const totalInterviews = interviews.length
  const totalParticipants = new Set(interviews.map(i => i.subject_name).filter(Boolean)).size
  
  // Composite PMF Score (average across all interviews, out of 100)
  const pmfScores = interviews.map(i => {
    const val = i.pmf_score;
    return typeof val === 'number' ? val : null;
  }).filter((x): x is number => x !== null);
  const compositeFitScore = pmfScores.length ? Math.round(pmfScores.reduce((a, b) => a + b, 0) / pmfScores.length) : 0
  
  // Sentiment breakdown (count of interviews by sentiment)
  const sentimentCounts = interviews.reduce((acc, i) => {
    const sentiment = typeof i.sentiment === 'number' ? i.sentiment : 5;
    if (sentiment >= 6) acc.positive++
    else if (sentiment <= 4) acc.negative++
    else acc.neutral++
    return acc
  }, { positive: 0, neutral: 0, negative: 0 })

  // Recommendations based on insights
  const recommendations = []
  if (totalInterviews === 0) {
    recommendations.push('Upload interviews to see insights and recommendations.')
  } else {
    if (sentimentCounts.negative > 0) {
      recommendations.push(`Review ${sentimentCounts.negative} interview${sentimentCounts.negative > 1 ? 's' : ''} with negative sentiment for improvement opportunities.`)
    }
    if (compositeFitScore < 60) {
      recommendations.push('Consider ways to improve product-market fit based on user feedback.')
    }
    if (sentimentCounts.positive > sentimentCounts.negative) {
      recommendations.push('Strong positive sentiment indicates good product alignment.')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Add proper spacing from navigation */}
      <div className="pt-8">
        <div className="container mx-auto px-4 py-16">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-display text-gray-900 mb-4">Analytics</h1>
            <p className="text-body-large text-gray-600 max-w-2xl mx-auto">
              Get insights from your research data with product-market fit analysis and sentiment trends.
            </p>
          </div>

          {/* Key Metrics */}
          <div className="max-w-6xl mx-auto mb-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
                <div className="flex items-center">
                  <FileText className="w-8 h-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Interviews</p>
                    <p className="text-2xl font-bold text-gray-900">{loading ? '...' : totalInterviews}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
                <div className="flex items-center">
                  <Users className="w-8 h-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Participants</p>
                    <p className="text-2xl font-bold text-gray-900">{loading ? '...' : totalParticipants}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
                <div className="flex items-center">
                  <Target className="w-8 h-8 text-orange-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Composite Fit Score</p>
                    <p className="text-2xl font-bold text-gray-900">{loading ? '...' : compositeFitScore}/100</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sentiment Analysis */}
          <div className="max-w-6xl mx-auto mb-12">
            <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
              <h2 className="text-heading-2 text-gray-900 mb-8">Sentiment Analysis</h2>
              {totalInterviews === 0 ? (
                <div className="text-center text-gray-500">No data yet. Upload interviews to see sentiment analysis.</div>
              ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Smile className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-heading-3 text-gray-900 mb-3">Positive</h3>
                  <p className="text-3xl font-bold text-green-600">{sentimentCounts.positive}</p>
                  <p className="text-sm text-gray-600">interviews</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Meh className="w-8 h-8 text-yellow-600" />
                  </div>
                  <h3 className="text-heading-3 text-gray-900 mb-3">Neutral</h3>
                  <p className="text-3xl font-bold text-yellow-600">{sentimentCounts.neutral}</p>
                  <p className="text-sm text-gray-600">interviews</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Frown className="w-8 h-8 text-red-600" />
                  </div>
                  <h3 className="text-heading-3 text-gray-900 mb-3">Negative</h3>
                  <p className="text-3xl font-bold text-red-600">{sentimentCounts.negative}</p>
                  <p className="text-sm text-gray-600">interviews</p>
                </div>
              </div>
              )}
            </div>
          </div>

          {/* Recommendations */}
          <div className="max-w-6xl mx-auto">
            <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
              <h2 className="text-heading-2 text-gray-900 mb-8">Recommendations</h2>
              {recommendations.length === 0 ? (
                <div className="text-center text-gray-500">No recommendations yet.</div>
              ) : (
              <div className="space-y-6">
                {recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-blue-600 font-bold text-xs">{index + 1}</span>
                    </div>
                    <p className="text-body text-gray-700 leading-relaxed">{recommendation}</p>
                  </div>
                ))}
              </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 