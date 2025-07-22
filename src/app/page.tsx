"use client"


import { Upload, Search, FileText, BarChart3, ArrowRight, Settings } from 'lucide-react'
import Link from 'next/link'

export default function HomePage() {


  const features = [
    {
      id: 'product',
      title: 'Add Product Details',
      description: 'Add details and documents about your product for contextualized insights and recommendations',
      icon: Settings,
      href: '/account',
      color: 'bg-indigo-500'
    },
    {
      id: 'upload',
      title: 'Upload User Interviews',
      description: 'Upload your research interview files in PDF or DOCX format. Files are automatically processed and analyzed.',
      icon: Upload,
      href: '/upload',
      color: 'bg-blue-500'
    },
    {
      id: 'interviews',
      title: 'Browse & Search',
      description: 'View all your interviews with integrated search functionality. Find specific insights across all your research.',
      icon: FileText,
      href: '/interviews',
      color: 'bg-purple-500'
    },
    {
      id: 'analytics',
      title: 'Insights',
      description: 'Get insights from your research data with product-market fit analysis and sentiment trends.',
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
            Browse your user research to quickly extract insights. Get AI analysis and recommendations to improve your product-market fit.
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
                        <span>Go</span>
                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        {/* Quick Start Section removed */}
      </div>
    </div>
  )
}
