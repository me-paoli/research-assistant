'use client'

import { useProductContext } from '@/hooks/useProductContext'
import { ProductDocumentationUpload } from './ProductDocumentationUpload'

export function ProductContextForm() {
  const {
    productName,
    setProductName,
    productDescription,
    setProductDescription,
    productUrl,
    setProductUrl,
    savedContext,
    isEditing,
    isLoading,
    isSaving,
    saveMessage,
    handleSubmit,
    handleEdit,
    handleCancel
  } = useProductContext()

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-10 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-24 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  // Show saved data in read-only view
  if (savedContext && !isEditing) {
    return (
      <div className="space-y-6">
        {/* Success/Error Message */}
        {saveMessage && (
          <div className={`p-4 rounded-lg ${
            saveMessage.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {saveMessage.message}
          </div>
        )}

        {/* Saved Data Display */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Current Product Context</h3>
            <button
              onClick={handleEdit}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Edit
            </button>
          </div>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
              <p className="text-gray-900">{savedContext.name}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product Description</label>
              <p className="text-gray-900 whitespace-pre-wrap">{savedContext.description}</p>
            </div>
            
            {savedContext.url && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product URL</label>
                <a 
                  href={savedContext.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  {savedContext.url}
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Documentation Upload Section */}
        <div className="border-t border-gray-200 pt-6">
          <ProductDocumentationUpload />
        </div>
      </div>
    )
  }

  // Show edit form
  return (
    <div className="space-y-6">
      {/* Success/Error Message */}
      {saveMessage && (
        <div className={`p-4 rounded-lg ${
          saveMessage.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {saveMessage.message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="product-name" className="block text-sm font-medium text-gray-700 mb-2">
            Product Name
          </label>
          <input
            id="product-name"
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500 text-gray-900"
            value={productName}
            onChange={e => setProductName(e.target.value)}
            placeholder="e.g. MyApp"
            aria-describedby="product-name-help"
          />
          <p id="product-name-help" className="text-sm text-gray-500 mt-1">
            Enter the name of your product or service
          </p>
        </div>
        
        <div>
          <label htmlFor="product-description" className="block text-sm font-medium text-gray-700 mb-2">
            Product Description
          </label>
          <textarea
            id="product-description"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500 text-gray-900 resize-vertical"
            value={productDescription}
            onChange={e => setProductDescription(e.target.value)}
            placeholder="Short description of your product"
            rows={3}
            aria-describedby="product-description-help"
          />
          <p id="product-description-help" className="text-sm text-gray-500 mt-1">
            Provide a brief overview of what your product does
          </p>
        </div>
        
        <div>
          <label htmlFor="product-url" className="block text-sm font-medium text-gray-700 mb-2">
            Product URL
          </label>
          <input
            id="product-url"
            type="url"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500 text-gray-900"
            value={productUrl}
            onChange={e => setProductUrl(e.target.value)}
            placeholder="https://yourproduct.com"
            aria-describedby="product-url-help"
          />
          <p id="product-url-help" className="text-sm text-gray-500 mt-1">
            The website URL for your product (optional)
          </p>
        </div>
        
        <div className="flex space-x-3">
          <button
            type="submit"
            disabled={isSaving}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Save Product Context'}
          </button>
          
          {savedContext && (
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Documentation Upload Section */}
      <div className="border-t border-gray-200 pt-6">
        <ProductDocumentationUpload />
      </div>
    </div>
  )
} 