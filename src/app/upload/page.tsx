'use client'

import { useFileUpload } from '@/hooks/useFileUpload'
import { useInterviews } from '@/hooks/useInterviews'
import { FileUploadZone } from '@/components/ui/FileUploadZone'
import { UploadProgressList } from '@/components/ui/UploadProgressList'
import { RecentInterviewsList } from '@/components/ui/RecentInterviewsList'

export default function UploadPage() {
  const { uploads, isUploading, uploadFiles, removeUpload } = useFileUpload()
  const { interviews, loading, deleting, deleteInterview } = useInterviews()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Add proper spacing from navigation */}
      <div className="pt-8">
        <div className="container mx-auto px-4 py-16">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-display text-gray-900 mb-4">Upload User Interviews</h1>
            <p className="text-body-large text-gray-600">Upload your research interview files in PDF or DOCX format. Files are automatically processed and analyzed.</p>
          </div>

          {/* File Upload Section */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8 mb-8">
            <h2 className="text-heading-2 text-gray-900 mb-6">Upload Files</h2>
            <FileUploadZone onDrop={uploadFiles} isUploading={isUploading} />
          </div>

          {/* Upload Progress */}
          <UploadProgressList uploads={uploads} onRemove={removeUpload} />

          {/* Recent Interviews */}
          {!loading && <RecentInterviewsList 
            interviews={interviews} 
            deleting={deleting} 
            onDelete={deleteInterview} 
          />}
        </div>
      </div>
    </div>
  )
} 