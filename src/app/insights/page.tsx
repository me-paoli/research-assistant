"use client"

import { useState, useEffect } from 'react';
import { FileText, Target, Smile, Frown, Meh } from 'lucide-react';

export default function InsightsPage() {
  const [interviews, setInterviews] = useState<any[]>([]);
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // Fetch interviews
  useEffect(() => {
    async function fetchInterviews() {
      setLoading(true);
      const res = await fetch('/api/interviews');
      const data = await res.json();
      setInterviews(data.interviews || []);
      setLoading(false);
    }
    fetchInterviews();
  }, []);

  // Fetch insights (top recommendations, etc.)
  useEffect(() => {
    async function fetchInsights() {
      const res = await fetch('/api/insights');
      const data = await res.json();
      setInsights(data.insights || null);
    }
    fetchInsights();
  }, []);

  // Search logic
  useEffect(() => {
    if (!search) {
      setSearchResults([]);
      return;
    }
    const lower = search.toLowerCase();
    setSearchResults(
      interviews.filter(i =>
        (i.summary && i.summary.toLowerCase().includes(lower)) ||
        (Array.isArray(i.keywords) && i.keywords.some((k: string) => k.toLowerCase().includes(lower)))
      )
    );
  }, [search, interviews]);

  // Metrics
  const totalInterviews = interviews.length;
  const pmfScores = interviews.map(i => typeof i.pmf_score === 'number' ? i.pmf_score : null).filter((x): x is number => x !== null);
  const avgPmfScore = pmfScores.length ? (pmfScores.reduce((a, b) => a + b, 0) / pmfScores.length).toFixed(1) : 'N/A';
  const sentimentValues = interviews.map(i => typeof i.sentiment === 'number' ? i.sentiment : null).filter((x): x is number => x !== null);
  const avgSentiment = sentimentValues.length ? (sentimentValues.reduce((a, b) => a + b, 0) / sentimentValues.length) : null;

  // Sentiment breakdown
  const sentimentCounts = interviews.reduce((acc, i) => {
    if (i.sentiment === 1) acc.positive++;
    else if (i.sentiment === 0) acc.neutral++;
    else if (i.sentiment === -1) acc.negative++;
    return acc;
  }, { positive: 0, neutral: 0, negative: 0 });
  const totalSentiments = sentimentCounts.positive + sentimentCounts.neutral + sentimentCounts.negative;
  const sentimentBreakdown = totalSentiments > 0 ? {
    positive: Math.round((sentimentCounts.positive / totalSentiments) * 100),
    neutral: Math.round((sentimentCounts.neutral / totalSentiments) * 100),
    negative: Math.round((sentimentCounts.negative / totalSentiments) * 100)
  } : { positive: 0, neutral: 0, negative: 0 };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Left Panel */}
      <aside className="w-full md:w-80 bg-white border-r border-gray-200 p-6 flex flex-col space-y-8">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Interview Count</h2>
          <div className="flex items-center space-x-2">
            <FileText className="w-6 h-6 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">{loading ? '...' : totalInterviews}</span>
          </div>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Average PMF Score</h2>
          <div className="flex items-center space-x-2">
            <Target className="w-6 h-6 text-orange-600" />
            <span className="text-2xl font-bold text-gray-900">{avgPmfScore}</span>
          </div>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Overall Sentiment</h2>
          <div className="flex items-center space-x-4">
            <div className="flex flex-col items-center">
              <Smile className="w-5 h-5 text-green-600" />
              <span className="text-green-600 font-bold">{sentimentBreakdown.positive}%</span>
            </div>
            <div className="flex flex-col items-center">
              <Meh className="w-5 h-5 text-yellow-600" />
              <span className="text-yellow-600 font-bold">{sentimentBreakdown.neutral}%</span>
            </div>
            <div className="flex flex-col items-center">
              <Frown className="w-5 h-5 text-red-600" />
              <span className="text-red-600 font-bold">{sentimentBreakdown.negative}%</span>
            </div>
          </div>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Top Recommendations</h2>
          {insights && Array.isArray(insights.recommendations) && insights.recommendations.length > 0 ? (
            <ul className="list-disc pl-5 space-y-2">
              {insights.recommendations.map((rec: string, idx: number) => (
                <li key={idx} className="text-gray-700">{rec}</li>
              ))}
            </ul>
          ) : (
            <div className="text-gray-500">No recommendations yet.</div>
          )}
        </div>
      </aside>
      {/* Main Content */}
      <main className="flex-1 p-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Insights & Search</h1>
          <div className="mb-8">
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Search for keywords or topics..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          {search && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Search Results</h2>
              {searchResults.length === 0 ? (
                <div className="text-gray-500">No results found.</div>
              ) : (
                <div className="space-y-4">
                  {searchResults.map((interview, idx) => (
                    <div key={interview.id || idx} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">{interview.subject_name || interview.title || interview.file_name}</span>
                        <span className="text-xs text-gray-500">{interview.interview_date || interview.created_at}</span>
                      </div>
                      <div className="text-gray-700 mb-2">{interview.summary}</div>
                      <div className="flex flex-wrap gap-2">
                        {(interview.keywords || []).map((k: string) => (
                          <span key={k} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">{k}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 