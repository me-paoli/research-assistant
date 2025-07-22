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
      color: 'bg-indigo-100 text-indigo-600'
    },
    {
      id: 'upload',
      title: 'Upload Interviews',
      description: 'Add your user research and automatically analyze against your product\'s context with AI.',
      icon: Upload,
      href: '/interviews',
      color: 'bg-blue-100 text-blue-600'
    },
    {
      id: 'interviews',
      title: 'Browse & Search',
      description: 'View and search all of your interviews in one place. Get user-specific insights & recommendations.',
      icon: FileText,
      href: '/interviews',
      color: 'bg-purple-100 text-purple-600'
    },
    {
      id: 'analytics',
      title: 'Insights',
      description: 'Get insights from your research data with product-market fit analysis and sentiment trends.',
      icon: BarChart3,
      href: '/insights',
      color: 'bg-orange-100 text-orange-600'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Add proper spacing from navigation */}
      <div className="pt-8">
        <div className="container mx-auto px-4 py-16">
          {/* Header with better spacing */}
          <div className="text-center mb-20">
            <h1 className="text-display text-gray-900 mb-6">
              Research Interview Assistant
            </h1>
            <p className="text-body-large text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Browse your user research to quickly extract insights. Get AI analysis and recommendations to improve your product-market fit.
            </p>
          </div>

          {/* Features Grid with light, accessible cards */}
          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto mb-20">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <Link
                  key={feature.id}
                  href={feature.href}
                  className="group block"
                >
                  <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 p-6 h-full group-hover:border-gray-300">
                    <div className="flex items-start space-x-4">
                      <div className={`${feature.color} p-3 rounded-lg group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-heading-3 text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                          {feature.title}
                        </h3>
                        <p className="text-body text-gray-600 leading-relaxed mb-4">
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
          
          {/* Bottom buffer */}
          <div className="h-20"></div>
        </div>
      </div>
    </div>
  )
}
