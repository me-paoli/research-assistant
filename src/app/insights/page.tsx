"use client"

import { useState, useEffect } from 'react';
import { FileText, Target, Smile, Frown, Meh } from 'lucide-react';
import { Interview } from '@/types/database';
import { Line } from 'react-chartjs-2';
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
    <div className={`bg-white rounded-lg p-6 shadow-sm flex items-center gap-4 ${large ? 'min-w-[240px] text-3xl' : 'min-w-[180px]'}`}>
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
  // Remove tab state and logic

  useEffect(() => {
    async function fetchInterviews() {
      setLoading(true);
      const res = await fetch('/api/interviews');
      const data = await res.json();
      setInterviews(data.data?.interviews || []);
      setLoading(false);
    }
    fetchInterviews();
  }, []);

  useEffect(() => {
    async function fetchInsights() {
      const res = await fetch('/api/insights');
      const data = await res.json();
      setInsights(data.data?.insights || null);
      setWarnings(data.data?.warnings || []);
    }
    fetchInsights();
  }, []);

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
      <div className="bg-white rounded-lg p-5 shadow-sm flex flex-col gap-2 border border-gray-100">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-900">{title}</span>
          {impact && <span className={`ml-2 px-2 py-0.5 rounded text-xs font-medium ${impactColor}`}>{impact} impact</span>}
        </div>
        <div className="text-gray-700 text-sm">{description}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Stats Bar */}
        <div className="flex flex-wrap gap-6 mb-8 justify-center items-center">
          <StatCard label="Product Market Fit" value={avgPmfScore !== 'N/A' ? `${avgPmfScore}%` : 'N/A'} icon={Target} color="text-blue-600" large />
          <StatCard label="Total Interviews" value={totalInterviews} icon={FileText} color="text-purple-600" />
        </div>
        {/* PMF Score Over Time Chart */}
        {pmfByDate.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-10 max-w-3xl mx-auto border border-gray-100">
            <Line data={chartData} options={chartOptions} height={80} />
          </div>
        )}
        {/* AI Insights Dashboard */}
        <div className="max-w-3xl mx-auto space-y-8">
          {insights ? (
            <>
              {/* Key Trends Section */}
              {insights.trends && insights.trends.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Key Trends</h2>
                  <ul className="list-disc pl-6 space-y-1">
                    {insights.trends.map((trend: string, idx: number) => (
                      <li key={idx} className="text-gray-700 text-base">{trend}</li>
                    ))}
                  </ul>
                </div>
              )}
              {/* Surprises Section */}
              {insights.surprises && insights.surprises.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Surprises</h2>
                  <ul className="list-disc pl-6 space-y-1">
                    {insights.surprises.map((surprise: string, idx: number) => (
                      <li key={idx} className="text-gray-700 text-base">{surprise}</li>
                    ))}
                  </ul>
                </div>
              )}
              {/* Recommendations Section */}
              {insights.recommendations && insights.recommendations.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Recommendations</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {insights.recommendations.map((rec: any, idx: number) => (
                      <div key={idx} className="bg-white rounded-lg p-5 shadow-sm border border-gray-100 flex flex-col gap-2">
                        <div className="font-semibold text-gray-900 text-base mb-1">{typeof rec === 'string' ? rec : rec.action}</div>
                        {typeof rec !== 'string' && rec.rationale && (
                          <div className="text-gray-700 text-sm">{rec.rationale}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {warnings.length > 0 && (
                <div className="mt-2 text-yellow-700 bg-yellow-50 border-l-4 border-yellow-400 p-2 rounded">
                  <div className="font-semibold mb-1">Warnings:</div>
                  <ul className="list-disc pl-5">
                    {warnings.map((w, i) => <li key={i}>{w}</li>)}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <div className="text-gray-600">No insights yet.</div>
          )}
        </div>
      </div>
    </div>
  );
} 