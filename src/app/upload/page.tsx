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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* File Upload Section */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Upload User Interviews</h2>
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
  )
} 