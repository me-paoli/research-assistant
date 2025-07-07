"use client"

import { useState } from 'react'
import { Upload, Search, FileText, BarChart3, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function HomePage() {
  const [activeFeature, setActiveFeature] = useState<string | null>(null)

  const features = [
    {
      id: 'upload',
      title: 'Upload Interviews',
      description: 'Upload your research interview files in PDF or DOCX format. Files are automatically processed and indexed for search.',
      icon: Upload,
      href: '/upload',
      color: 'bg-blue-500'
    },
    {
      id: 'search',
      title: 'Search & Discover',
      description: 'Search through your interviews using keywords to find relevant insights quickly. Powerful search with keyword highlighting.',
      icon: Search,
      href: '/search',
      color: 'bg-green-500'
    },
    {
      id: 'interviews',
      title: 'Browse Interviews',
      description: 'View all your uploaded interviews in an organized list with metadata and tags.',
      icon: FileText,
      href: '/interviews',
      color: 'bg-purple-500'
    },
    {
      id: 'analytics',
      title: 'Analytics & Insights',
      description: 'Get insights from your research data with analytics and keyword analysis.',
      icon: BarChart3,
      href: '/analytics',
      color: 'bg-orange-500'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Research Interview Assistant
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Upload, index, and search through your user research interviews with powerful keyword analysis and categorization.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto mb-16">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <Link
                key={feature.id}
                href={feature.href}
                className="group"
                onMouseEnter={() => setActiveFeature(feature.id)}
                onMouseLeave={() => setActiveFeature(null)}
              >
                <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300 h-full">
                  <div className="flex items-start space-x-4">
                    <div className={`${feature.color} p-3 rounded-lg group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                        {feature.title}
                      </h3>
                      <p className="text-gray-600 leading-relaxed mb-4">
                        {feature.description}
                      </p>
                      <div className="flex items-center text-blue-600 font-medium group-hover:text-blue-700 transition-colors">
                        <span>Get Started</span>
                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        {/* Quick Start Section */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Quick Start</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-blue-600 font-bold text-lg">1</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Upload Files</h3>
                <p className="text-sm text-gray-600">Upload your interview files in supported formats</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-green-600 font-bold text-lg">2</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Automatic Processing</h3>
                <p className="text-sm text-gray-600">Files are processed and indexed automatically</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-purple-600 font-bold text-lg">3</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Search & Analyze</h3>
                <p className="text-sm text-gray-600">Search through your interviews and get insights</p>
              </div>
            </div>
            <div className="text-center mt-8">
              <Link
                href="/upload"
                className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium inline-flex items-center"
              >
                Start Uploading
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
