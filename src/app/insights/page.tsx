"use client"

import { useState, useEffect } from 'react';
import { FileText, Target, Lightbulb } from 'lucide-react';
import { Interview } from '@/types/database';
import { Line } from 'react-chartjs-2';
import { supabase } from '@/lib/supabase';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

function StatCard({ label, value, icon, color, large }: { label: string, value: string | number, icon: any, color: string, large?: boolean }) {
  const Icon = icon;
  return (
    <div className={`bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex items-center gap-4 ${large ? 'min-w-[240px] text-3xl' : 'min-w-[180px]'}`}>
      <div className={`w-12 h-12 flex items-center justify-center rounded-full ${color} bg-opacity-10 ${large ? 'text-3xl' : ''}`}> <Icon className={`w-7 h-7 ${color}`} /> </div>
      <div>
        <div className={`text-xs text-gray-500 font-medium ${large ? 'text-base' : ''}`}>{label}</div>
        <div className={`font-bold text-gray-900 ${large ? 'text-4xl' : 'text-2xl'}`}>{value}</div>
      </div>
    </div>
  );
}

export default function InsightsPage() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [insights, setInsights] = useState<any>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [insightsGenerating, setInsightsGenerating] = useState(false);
  const [generatingInsights, setGeneratingInsights] = useState(false);
  // Remove tab state and logic

  const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token
    const headers: Record<string, string> = {}
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
    return headers
  }

  useEffect(() => {
    async function fetchInterviews() {
      setLoading(true);
      try {
        const headers = await getAuthHeaders()
        const res = await fetch('/api/interviews', { headers });
        if (res.ok) {
          const data = await res.json();
          setInterviews(data.data?.interviews || []);
        } else {
          console.error('Failed to fetch interviews:', res.status);
        }
      } catch (error) {
        console.error('Error fetching interviews:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchInterviews();
  }, []);

  useEffect(() => {
    async function fetchInsights() {
      try {
        const headers = await getAuthHeaders()
        const res = await fetch('/api/insights', { headers });
        if (res.ok) {
          const data = await res.json();
          setInsights(data.data?.insights || null);
          setWarnings(data.data?.warnings || []);
        } else {
          console.error('Failed to fetch insights:', res.status);
        }
      } catch (error) {
        console.error('Error fetching insights:', error);
      }
    }
    fetchInsights();
    
    // Poll for insights updates every 30 seconds
    const interval = setInterval(fetchInsights, 30000);
    return () => clearInterval(interval);
  }, []);

  // Detect when insights are being generated
  useEffect(() => {
    if (interviews.length > 0 && !insights && !loading) {
      setInsightsGenerating(true);
      // Reset after 30 seconds if no insights are generated
      const timeout = setTimeout(() => {
        setInsightsGenerating(false);
      }, 30000);
      return () => clearTimeout(timeout);
    } else {
      setInsightsGenerating(false);
    }
  }, [interviews.length, insights, loading]);

  const generateInsights = async () => {
    if (generatingInsights) return;
    
    setGeneratingInsights(true);
    try {
      const headers = await getAuthHeaders()
      const res = await fetch('/api/insights', { 
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' }
      });
      
      if (res.ok) {
        const data = await res.json();
        setInsights(data.data?.insights || null);
        setWarnings(data.data?.warnings || []);
      } else {
        console.error('Failed to generate insights:', res.status);
      }
    } catch (error) {
      console.error('Error generating insights:', error);
    } finally {
      setGeneratingInsights(false);
    }
  };

  // Metrics
  const totalInterviews = interviews.length;
  const pmfScores = interviews.map(i => typeof i.pmf_score === 'number' ? i.pmf_score : null).filter((x): x is number => x !== null);
  const avgPmfScore = pmfScores.length ? (pmfScores.reduce((a, b) => a + b, 0) / pmfScores.length).toFixed(1) : 'N/A';
  // For demo: This Week and Avg Duration are placeholders
  const thisWeek = interviews.filter(i => {
    const date = new Date(i.created_at);
    const now = new Date();
    const weekAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
    return date > weekAgo;
  }).length;
  const avgDuration = interviews.length ? Math.round(interviews.reduce((a, b) => a + (b.duration || 0), 0) / interviews.length) : 0;

  // PMF Score Over Time Chart Data (group by upload date only)
  const pmfByDateMap: Record<string, number[]> = {};
  interviews.forEach(i => {
    if (typeof i.pmf_score === 'number' && i.created_at) {
      const d = new Date(i.created_at);
      const dateStr = d.toISOString().slice(0, 10); // YYYY-MM-DD
      if (!pmfByDateMap[dateStr]) pmfByDateMap[dateStr] = [];
      pmfByDateMap[dateStr].push(i.pmf_score);
    }
  });
  const pmfByDate = Object.entries(pmfByDateMap)
    .map(([date, scores]) => ({
      date,
      avgScore: scores.reduce((a, b) => a + b, 0) / scores.length
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const chartData = {
    labels: pmfByDate.map(d => new Date(d.date).toLocaleDateString()),
    datasets: [
      {
        label: 'PMF Score',
        data: pmfByDate.map(d => d.avgScore),
        fill: false,
        borderColor: 'rgb(37, 99, 235)',
        backgroundColor: 'rgba(37, 99, 235, 0.2)',
        tension: 0.2,
        pointRadius: 5,
        pointHoverRadius: 7,
      },
    ],
  };
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: 'Product Market Fit Score Over Time',
        font: { size: 18 },
        color: '#1e293b',
      },
      tooltip: {
        callbacks: {
          label: (ctx: any) => `PMF Score: ${ctx.parsed.y}`,
        },
      },
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        title: { display: true, text: 'PMF Score (%)' },
        ticks: { stepSize: 10 },
      },
      x: {
        title: { display: true, text: 'Date' },
      },
    },
  };

  // AI Insights Card Helper
  function InsightCard({ title, description, impact }: { title: string, description: string, impact?: 'high' | 'medium' | 'low' }) {
    const impactColor = impact === 'high' ? 'bg-red-100 text-red-700' : impact === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700';
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-900">{title}</span>
          {impact && <span className={`ml-2 px-3 py-1 rounded-full text-xs font-medium ${impactColor}`}>{impact} impact</span>}
        </div>
        <div className="text-gray-700 text-sm">{description}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Add proper spacing from navigation */}
      <div className="pt-8">
        <div className="container mx-auto px-4 py-16">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-display text-gray-900 mb-4">Insights Dashboard</h1>
            <p className="text-body-large text-gray-600 max-w-2xl mx-auto mb-4">
              Get insights from your research data with product-market fit analysis and sentiment trends.
            </p>
            <button
              onClick={generateInsights}
              disabled={generatingInsights}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2 px-4 rounded-lg shadow-sm transition-colors flex items-center space-x-2 mx-auto"
            >
              {generatingInsights ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Regenerating Insights...</span>
                </>
              ) : (
                <>
                  <Target className="w-4 h-4" />
                  <span>Regenerate Insights</span>
                </>
              )}
            </button>
          </div>

          {/* Dashboard Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Stats Card */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <div className="text-center">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-12 h-12 flex items-center justify-center rounded-full bg-blue-100">
                    <Target className="w-7 h-7 text-blue-600" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {avgPmfScore !== 'N/A' ? `${avgPmfScore}%` : 'N/A'}
                </div>
                <div className="text-sm text-gray-600 mb-4">Current PMF Score</div>
                <div className="flex items-center justify-center space-x-2 text-gray-500">
                  <FileText className="w-4 h-4" />
                  <span className="text-sm">{totalInterviews} interviews</span>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <div className="text-center">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-12 h-12 flex items-center justify-center rounded-full bg-green-100">
                    <FileText className="w-7 h-7 text-green-600" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {thisWeek}
                </div>
                <div className="text-sm text-gray-600 mb-4">This Week</div>
                <div className="text-xs text-gray-500">
                  New interviews added
                </div>
              </div>
            </div>

            {/* Insights Status */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <div className="text-center">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-12 h-12 flex items-center justify-center rounded-full bg-purple-100">
                    <Lightbulb className="w-7 h-7 text-purple-600" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {insights ? '✓' : '—'}
                </div>
                <div className="text-sm text-gray-600 mb-4">Insights Status</div>
                <div className="text-xs text-gray-500">
                  {insights ? 'Generated' : 'Pending'}
                </div>
              </div>
            </div>
          </div>

          {/* AI Insights Dashboard - Prominent Position */}
          <div className="max-w-6xl mx-auto">
            {loading ? (
              <div className="text-center text-gray-600 py-12">
                <div className="mb-4">Loading insights...</div>
              </div>
            ) : insightsGenerating ? (
              <div className="text-center text-gray-600 py-12">
                <div className="mb-4">Generating insights...</div>
                <div className="text-sm">This may take a few moments.</div>
              </div>
            ) : insights ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Key Trends Section */}
                {insights.trends && insights.trends.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                        <FileText className="w-4 h-4 text-blue-600" />
                      </div>
                      Key Trends
                    </h2>
                    <ul className="space-y-3">
                      {insights.trends.map((trend: string, idx: number) => (
                        <li key={idx} className="text-gray-700 text-sm leading-relaxed flex items-start">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                          <span>{trend}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* Surprises Section */}
                {insights.surprises && insights.surprises.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                      <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center mr-3">
                        <Lightbulb className="w-4 h-4 text-yellow-600" />
                      </div>
                      Surprises
                    </h2>
                    <ul className="space-y-3">
                      {insights.surprises.map((surprise: string, idx: number) => (
                        <li key={idx} className="text-gray-700 text-sm leading-relaxed flex items-start">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                          <span>{surprise}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : interviews.length === 0 ? (
              <div className="text-center text-gray-600 py-12">
                <div className="mb-4">No interviews found.</div>
                <div className="text-sm">Upload some interviews to generate insights.</div>
              </div>
            ) : (
              <div className="text-center text-gray-600 py-12">
                <div className="mb-4">No insights generated yet.</div>
                <div className="text-sm">Insights are automatically generated after each interview is processed.</div>
              </div>
            )}

            {/* Recommendations Section - Full Width */}
            {insights?.recommendations && insights.recommendations.length > 0 && (
              <div className="mt-8 bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                    <Target className="w-4 h-4 text-green-600" />
                  </div>
                  Recommendations
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {insights.recommendations.map((rec: any, idx: number) => (
                    <div key={idx} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="font-semibold text-gray-900 text-sm mb-2">{typeof rec === 'string' ? rec : rec.action}</div>
                      {typeof rec !== 'string' && rec.rationale && (
                        <div className="text-gray-600 text-xs leading-relaxed">{rec.rationale}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Warnings Section */}
            {warnings.length > 0 && (
              <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                <div className="font-semibold text-yellow-800 mb-3 flex items-center">
                  <div className="w-6 h-6 bg-yellow-200 rounded-full flex items-center justify-center mr-2">
                    <span className="text-yellow-800 text-sm">!</span>
                  </div>
                  Warnings
                </div>
                <ul className="space-y-1">
                  {warnings.map((w, i) => (
                    <li key={i} className="text-yellow-700 text-sm flex items-start">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <span>{w}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          {/* PMF Score Over Time Chart - Moved to bottom */}
          {pmfByDate.length > 0 && (
            <div className="mt-12 bg-white border border-gray-200 rounded-xl shadow-sm p-8 max-w-4xl mx-auto">
              <Line data={chartData} options={chartOptions} height={80} />
            </div>
          )}
          
          {/* Bottom buffer */}
          <div className="h-20"></div>
        </div>
      </div>
    </div>
  );
} 