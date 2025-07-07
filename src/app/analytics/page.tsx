'use client'

import { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, Users, FileText, Tag, Target, Activity } from 'lucide-react'

export default function AnalyticsPage() {
  const [interviews, setInterviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTimeframe, setSelectedTimeframe] = useState('30d')

  useEffect(() => {
    async function fetchInterviews() {
      setLoading(true)
      const res = await fetch('/api/interviews')
      const data = await res.json()
      setInterviews(data.interviews || [])
      setLoading(false)
    }
    fetchInterviews()
  }, [])

  // Compute analytics from real data (client-side)
  const totalInterviews = interviews.length
  const totalParticipants = new Set(interviews.map(i => i.subject_name).filter(Boolean)).size
  // Average PMF Score (ignore nulls)
  const pmfScores = interviews.map(i => {
    const val = i.pmf_score;
    return typeof val === 'number' ? val : null;
  }).filter((x): x is number => x !== null);
  const avgFitScore = pmfScores.length ? (pmfScores.reduce((a, b) => a + b, 0) / pmfScores.length).toFixed(1) : 'N/A'
  // Sentiment breakdown (assume sentiment: 1=positive, 0=neutral, -1=negative)
  const sentimentCounts = interviews.reduce((acc, i) => {
    if (i.sentiment === 1) acc.positive++
    else if (i.sentiment === 0) acc.neutral++
    else if (i.sentiment === -1) acc.negative++
    return acc
  }, { positive: 0, neutral: 0, negative: 0 })
  const totalSentiments = sentimentCounts.positive + sentimentCounts.neutral + sentimentCounts.negative
  const sentimentBreakdown = totalSentiments > 0 ? {
    positive: Math.round((sentimentCounts.positive / totalSentiments) * 100),
    neutral: Math.round((sentimentCounts.neutral / totalSentiments) * 100),
    negative: Math.round((sentimentCounts.negative / totalSentiments) * 100)
  } : { positive: 0, neutral: 0, negative: 0 }
  // Average sentiment score across all interviews
  const sentimentValues = interviews.map(i => {
    const val = i.sentiment;
    return typeof val === 'number' ? val : null;
  }).filter((x): x is number => x !== null);
  const avgSentimentScore = sentimentValues.length ? (sentimentValues.reduce((a, b) => a + b, 0) / sentimentValues.length).toFixed(2) : 'N/A';
  // Top keywords (no sentiment connection)
  const allKeywords = interviews.flatMap(i => Array.isArray(i.keywords) ? (i.keywords as unknown[]).filter((k): k is string => typeof k === 'string') : []);
  const keywordCounts = allKeywords.reduce((acc: Record<string, number>, k: string) => {
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});
  const topKeywords = Object.entries(keywordCounts)
    .filter(([keyword, count]) => typeof keyword === 'string' && typeof count === 'number')
    .sort((a, b) => (b[1] as number) - (a[1] as number))
    .slice(0, 5)
    .map(([keyword, count]) => ({ keyword, count: count as number }));
  // Recommendations: extract common recommendations from interviews (if present)
  const allRecommendations = interviews.flatMap(i => Array.isArray(i.recommendations)
    ? (i.recommendations as unknown[]).filter((r): r is string => typeof r === 'string')
    : (typeof i.recommendations === 'string' ? [i.recommendations] : []));
  const recommendationCounts = allRecommendations.reduce((acc: Record<string, number>, rec: string) => {
    acc[rec] = (acc[rec] || 0) + 1;
    return acc;
  }, {});
  const commonRecommendations = Object.entries(recommendationCounts)
    .filter(([rec, count]) => typeof rec === 'string' && typeof count === 'number')
    .sort((a, b) => (b[1] as number) - (a[1] as number))
    .slice(0, 5)
    .map(([rec]) => rec);
  // Monthly trend: show avgPmfScore and avgSentiment for each month
  const monthlyTrendMap: Record<string, { interviews: number, pmfScores: number[], sentiments: number[] }> = {};
  interviews.forEach(i => {
    const date = i.created_at ? new Date(i.created_at) : null;
    if (!date) return;
    const month = date.toLocaleString('default', { month: 'short', year: '2-digit' });
    if (!monthlyTrendMap[month]) monthlyTrendMap[month] = { interviews: 0, pmfScores: [], sentiments: [] };
    monthlyTrendMap[month].interviews++;
    if (typeof i.pmf_score === 'number') monthlyTrendMap[month].pmfScores.push(i.pmf_score);
    if (typeof i.sentiment === 'number') monthlyTrendMap[month].sentiments.push(i.sentiment);
  });
  const monthlyTrend = Object.entries(monthlyTrendMap).map(([month, info]) => ({
    month,
    interviews: info.interviews,
    avgPmfScore: info.pmfScores.length ? (info.pmfScores.reduce((a, b) => a + b, 0) / info.pmfScores.length).toFixed(1) : null,
    avgSentiment: info.sentiments.length ? (info.sentiments.reduce((a, b) => a + b, 0) / info.sentiments.length).toFixed(2) : null
  }));

  // Recommendations (simple demo)
  const recommendations = []
  if (totalInterviews === 0) {
    recommendations.push('Upload interviews to see analytics and recommendations.')
  } else {
    if (sentimentBreakdown.negative > 30) recommendations.push('Review interviews with negative sentiment for product improvement opportunities.')
    if (avgFitScore !== 'N/A' && Number(avgFitScore) < 7) recommendations.push('Consider ways to improve product-market fit based on user feedback.')
    if (topKeywords.length) recommendations.push('Focus on top user topics: ' + topKeywords.map(k => k.keyword).join(', '))
  }

  const timeframes = [
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '90d', label: '90 Days' },
    { value: '1y', label: '1 Year' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Analytics & Insights</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Get insights from your research data with analytics, keyword analysis, and product-market fit metrics.
          </p>
        </div>

        {/* Timeframe Selector */}
        <div className="max-w-6xl mx-auto mb-8">
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Time Period</h2>
              <div className="flex space-x-2">
                {timeframes.map((timeframe) => (
                  <button
                    key={timeframe.value}
                    onClick={() => setSelectedTimeframe(timeframe.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedTimeframe === timeframe.value
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {timeframe.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="max-w-6xl mx-auto mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="flex items-center">
                <FileText className="w-8 h-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Interviews</p>
                  <p className="text-2xl font-bold text-gray-900">{loading ? '...' : totalInterviews}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="flex items-center">
                <Users className="w-8 h-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Participants</p>
                  <p className="text-2xl font-bold text-gray-900">{loading ? '...' : totalParticipants}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="flex items-center">
                <Tag className="w-8 h-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Keywords</p>
                  <p className="text-2xl font-bold text-gray-900">{loading ? '...' : topKeywords.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="flex items-center">
                <Target className="w-8 h-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Product Fit Score</p>
                  <p className="text-2xl font-bold text-gray-900">{loading ? '...' : avgFitScore}/10</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sentiment Analysis */}
        <div className="max-w-6xl mx-auto mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Sentiment Analysis</h2>
            {totalInterviews === 0 ? (
              <div className="text-center text-gray-500">No data yet. Upload interviews to see sentiment analysis.</div>
            ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Positive</h3>
                <p className="text-3xl font-bold text-green-600">{sentimentBreakdown.positive}%</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Activity className="w-8 h-8 text-yellow-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Neutral</h3>
                <p className="text-3xl font-bold text-yellow-600">{sentimentBreakdown.neutral}%</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-red-600 transform rotate-180" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Negative</h3>
                <p className="text-3xl font-bold text-red-600">{sentimentBreakdown.negative}%</p>
              </div>
            </div>
            )}
          </div>
        </div>

        {/* Top Keywords and Recommendations */}
        <div className="max-w-6xl mx-auto mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Top Keywords */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Top Keywords</h2>
              {totalInterviews === 0 ? (
                <div className="text-center text-gray-500">No data yet.</div>
              ) : (
              <div className="space-y-4">
                {topKeywords.map((keyword, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-bold text-sm">{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{keyword.keyword}</p>
                        <p className="text-sm text-gray-600">{keyword.count} mentions</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              )}
            </div>

            {/* Recommendations */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Recommendations</h2>
              {recommendations.length === 0 ? (
                <div className="text-center text-gray-500">No recommendations yet.</div>
              ) : (
              <div className="space-y-4">
                {recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-blue-600 font-bold text-xs">{index + 1}</span>
                    </div>
                    <p className="text-gray-700 leading-relaxed">{recommendation}</p>
                  </div>
                ))}
              </div>
              )}
            </div>
          </div>
        </div>

        {/* Monthly Trend */}
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Monthly Trend</h2>
            {monthlyTrend.length === 0 ? (
              <div className="text-center text-gray-500">No data yet.</div>
            ) : (
            <div className="grid grid-cols-3 gap-4">
              {monthlyTrend.map((month, index) => (
                <div key={index} className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BarChart3 className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{month.month}</h3>
                  <p className="text-2xl font-bold text-blue-600 mb-1">{month.interviews}</p>
                  <p className="text-sm text-gray-600">interviews</p>
                  <p className="text-sm text-gray-500">Avg Sentiment: {month.avgSentiment ?? 'N/A'}</p>
                </div>
              ))}
            </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 