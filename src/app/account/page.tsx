'use client'

import { ProductContextForm } from '@/components/ui/ProductContextForm'

export default function AccountPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Add proper spacing from navigation */}
      <div className="pt-8">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-12">
              <h1 className="text-display text-gray-900 mb-4">Account Settings</h1>
              <p className="text-body-large text-gray-600">Manage your research assistant configuration and preferences.</p>
            </div>

            {/* Add Product Details Section */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8 mb-8">
              <div className="mb-8">
                <h2 className="text-heading-2 text-gray-900 mb-3">Add Product Details</h2>
                <p className="text-body text-gray-600">
                  Add details about your product to help Research Assistant better understand and analyze your user feedback.
                </p>
              </div>
              <ProductContextForm />
            </div>

            {/* Account Information Section */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8 mb-8">
              <div className="mb-8">
                <h2 className="text-heading-2 text-gray-900 mb-3">Account Information</h2>
                <p className="text-body text-gray-600">
                  Manage your account details and preferences.
                </p>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500 transition-colors"
                    placeholder="your@email.com"
                    disabled
                  />
                  <p className="text-sm text-gray-500 mt-2">Authentication coming soon</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Display Name
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500 transition-colors"
                    placeholder="Your Name"
                    disabled
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Organization
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500 transition-colors"
                    placeholder="Your Company"
                    disabled
                  />
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-white border border-red-200 rounded-xl shadow-sm p-8">
              <div className="mb-8">
                <h2 className="text-heading-2 text-red-900 mb-3">Danger Zone</h2>
                <p className="text-body text-red-600">
                  Irreversible and destructive actions.
                </p>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 border border-red-100 rounded-lg bg-red-50">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Delete All Data</h3>
                    <p className="text-sm text-gray-500">Permanently delete all interviews and insights</p>
                  </div>
                  <button
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled
                  >
                    Delete All
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 border border-red-100 rounded-lg bg-red-50">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Delete Account</h3>
                    <p className="text-sm text-gray-500">Permanently delete your account and all data</p>
                  </div>
                  <button
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
            
            {/* Bottom buffer */}
            <div className="h-20"></div>
          </div>
        </div>
      </div>
    </div>
  )
} 