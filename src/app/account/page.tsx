'use client'

import { useState, useEffect } from 'react'
import { useAuthContext } from '@/context/AuthContext'
import { useUserProfile } from '@/hooks/useUserProfile'
import { ProductContextForm } from '@/components/ui/ProductContextForm'

export default function AccountPage() {
  const { user, logout } = useAuthContext()
  const { profile, loading, saving, error, saveProfile } = useUserProfile()
  const [displayName, setDisplayName] = useState('')
  const [organization, setOrganization] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null)

  // Update form fields when profile loads
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '')
      setOrganization(profile.organization || '')
    }
  }, [profile])

  const handleSave = async () => {
    const result = await saveProfile(displayName, organization)
    if (result?.success) {
      setSaveMessage({ type: 'success', message: 'Profile updated successfully!' })
      setIsEditing(false)
      setTimeout(() => setSaveMessage(null), 3000)
    } else {
      setSaveMessage({ type: 'error', message: result?.error || 'Failed to save profile' })
    }
  }

  const handleCancel = () => {
    if (profile) {
      setDisplayName(profile.display_name || '')
      setOrganization(profile.organization || '')
    }
    setIsEditing(false)
    setSaveMessage(null)
  }

  const handleLogout = async () => {
    await logout()
  }

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
              
              {loading ? (
                <div className="space-y-6">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                    <div className="h-10 bg-gray-200 rounded"></div>
                  </div>
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                    <div className="h-10 bg-gray-200 rounded"></div>
                  </div>
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                    <div className="h-10 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Success/Error Message */}
                  {saveMessage && (
                    <div className={`p-4 rounded-lg mb-6 ${
                      saveMessage.type === 'success' 
                        ? 'bg-green-50 border border-green-200 text-green-800' 
                        : 'bg-red-50 border border-red-200 text-red-800'
                    }`}>
                      {saveMessage.message}
                    </div>
                  )}

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 text-gray-900"
                        value={user?.email || ''}
                        disabled
                      />
                      <p className="text-sm text-gray-500 mt-2">Your email address from your account</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Display Name
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500 transition-colors"
                        placeholder="Your Name"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        disabled={!isEditing}
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
                        value={organization}
                        onChange={(e) => setOrganization(e.target.value)}
                        disabled={!isEditing}
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-3 pt-4">
                      {!isEditing ? (
                        <button
                          onClick={() => setIsEditing(true)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Edit Profile
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={handleSave}
                            disabled={saving}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {saving ? 'Saving...' : 'Save Changes'}
                          </button>
                          <button
                            onClick={handleCancel}
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Account Actions */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8 mb-8">
              <div className="mb-8">
                <h2 className="text-heading-2 text-gray-900 mb-3">Account Actions</h2>
                <p className="text-body text-gray-600">
                  Manage your account and session.
                </p>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 border border-gray-100 rounded-lg bg-gray-50">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Sign Out</h3>
                    <p className="text-sm text-gray-500">Sign out of your current session</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Sign Out
                  </button>
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