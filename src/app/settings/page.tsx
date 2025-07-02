'use client'

import { useState, useEffect } from 'react'
import { Save, Plus, X, ExternalLink, Target, Star } from 'lucide-react'
import { ProductProfile } from '@/types/database'

export default function SettingsPage() {
  const [product, setProduct] = useState<ProductProfile>({
    id: '',
    name: '',
    description: '',
    product_url: '',
    target_audience: '',
    key_features: [],
    created_at: '',
    updated_at: '',
    total_interviews: 0,
    positive_sentiment_count: 0,
    negative_sentiment_count: 0,
    neutral_sentiment_count: 0
  })

  const [newFeature, setNewFeature] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Load existing product profile
  useEffect(() => {
    // In a real app, this would fetch from the database
    const savedProduct = localStorage.getItem('productProfile')
    if (savedProduct) {
      setProduct(JSON.parse(savedProduct))
    }
  }, [])

  const handleSave = async () => {
    setIsLoading(true)
    
    try {
      // In a real app, this would save to the database
      const updatedProduct = {
        ...product,
        updated_at: new Date().toISOString()
      }
      
      localStorage.setItem('productProfile', JSON.stringify(updatedProduct))
      setProduct(updatedProduct)
      setIsEditing(false)
      
      // Show success message
      alert('Product profile saved successfully!')
    } catch (error) {
      console.error('Error saving product profile:', error)
      alert('Error saving product profile. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const addFeature = () => {
    if (newFeature.trim() && !product.key_features.includes(newFeature.trim())) {
      setProduct(prev => ({
        ...prev,
        key_features: [...prev.key_features, newFeature.trim()]
      }))
      setNewFeature('')
    }
  }

  const removeFeature = (feature: string) => {
    setProduct(prev => ({
      ...prev,
      key_features: prev.key_features.filter(f => f !== feature)
    }))
  }

  const calculateFitScore = () => {
    if (product.total_interviews === 0) return 0
    
    const positiveRatio = product.positive_sentiment_count / product.total_interviews
    const negativeRatio = product.negative_sentiment_count / product.total_interviews
    
    // Simple scoring: positive sentiment boosts score, negative reduces it
    let score = 50 // Base score
    score += positiveRatio * 40 // Up to +40 points for positive sentiment
    score -= negativeRatio * 30 // Up to -30 points for negative sentiment
    
    return Math.max(0, Math.min(100, Math.round(score)))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Product Profile Settings</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Add details about your product or prototype to provide context for your research interviews and get product-market fit insights.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Product Overview Card */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Product Information</h2>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>

            {isEditing ? (
              <div className="space-y-6">
                {/* Product Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    value={product.name}
                    onChange={(e) => setProduct(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your product name"
                  />
                </div>

                {/* Product Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={product.description}
                    onChange={(e) => setProduct(prev => ({ ...prev, description: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Describe your product or prototype..."
                  />
                </div>

                {/* Product URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product URL
                  </label>
                  <input
                    type="url"
                    value={product.product_url || ''}
                    onChange={(e) => setProduct(prev => ({ ...prev, product_url: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://your-product.com"
                  />
                </div>

                {/* Target Audience */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Audience
                  </label>
                  <input
                    type="text"
                    value={product.target_audience || ''}
                    onChange={(e) => setProduct(prev => ({ ...prev, target_audience: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Small business owners, 25-40 years old"
                  />
                </div>

                {/* Key Features */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Key Features
                  </label>
                  <div className="space-y-3">
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={newFeature}
                        onChange={(e) => setNewFeature(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addFeature()}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Add a key feature..."
                      />
                      <button
                        onClick={addFeature}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {product.key_features.map((feature) => (
                        <span
                          key={feature}
                          className="flex items-center space-x-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                        >
                          <span>{feature}</span>
                          <button
                            onClick={() => removeFeature(feature)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isLoading || !product.name || !product.description}
                    className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isLoading ? 'Saving...' : 'Save Profile'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Product Info Display */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{product.name || 'No product name set'}</h3>
                    <p className="text-gray-600 mb-4">{product.description || 'No description provided'}</p>
                    
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
                  
                  <div>
                    {product.target_audience && (
                      <div className="mb-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <Target className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-700">Target Audience</span>
                        </div>
                        <p className="text-gray-600 text-sm">{product.target_audience}</p>
                      </div>
                    )}
                    
                    {product.key_features.length > 0 && (
                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <Star className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-700">Key Features</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {product.key_features.map((feature) => (
                            <span
                              key={feature}
                              className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"
                            >
                              {feature}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Product Market Fit Score */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Product-Market Fit Score</h3>
                  <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="text-3xl font-bold text-gray-900">{calculateFitScore()}/100</div>
                        <div className="text-sm text-gray-600">Overall Fit Score</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600">Based on {product.total_interviews} interviews</div>
                        <div className="text-xs text-gray-500">
                          {product.positive_sentiment_count} positive • {product.negative_sentiment_count} negative • {product.neutral_sentiment_count} neutral
                        </div>
                      </div>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${calculateFitScore()}%` }}
                      />
                    </div>
                    
                    <div className="mt-3 text-sm text-gray-600">
                      {calculateFitScore() >= 70 && "🎉 Excellent product-market fit detected!"}
                      {calculateFitScore() >= 50 && calculateFitScore() < 70 && "👍 Good product-market fit, room for improvement"}
                      {calculateFitScore() >= 30 && calculateFitScore() < 50 && "⚠️ Moderate product-market fit, consider pivoting"}
                      {calculateFitScore() < 30 && "🚨 Low product-market fit, significant changes needed"}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Help Section */}
          <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">How Product-Market Fit Scoring Works</h3>
            <div className="text-sm text-blue-800 space-y-2">
              <p>• <strong>Positive sentiment</strong> in interviews boosts your score</p>
              <p>• <strong>Negative feedback</strong> reduces your score</p>
              <p>• Score is calculated based on sentiment analysis of interview content</p>
              <p>• Higher scores indicate better product-market fit</p>
              <p>• Scores update automatically as you add more interviews</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 