import { supabase, STORAGE_BUCKET } from './supabase'

export interface UploadResult {
  success: boolean
  filePath?: string
  error?: string
  fileId?: string
}

export interface FileMetadata {
  id: string
  name: string
  size: number
  type: string
  path: string
  uploadedAt: string
}

export class StorageService {
  /**
   * Upload a file to Supabase storage
   */
  static async uploadFile(buffer: Buffer, fileName: string, contentType: string): Promise<UploadResult> {
    try {
      // Generate unique file path
      const fileId = crypto.randomUUID()
      const fileExtension = fileName.split('.').pop()
      const uniqueFileName = `${fileId}.${fileExtension}`
      const filePath = `uploads/${uniqueFileName}`

      // Upload file to storage
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, buffer, {
          contentType,
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        console.error('Upload error:', error)
        return {
          success: false,
          error: error.message
        }
      }

      return {
        success: true,
        filePath: data.path,
        fileId: fileId
      }
    } catch (error) {
      console.error('Upload failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      }
    }
  }

  /**
   * Get public URL for a file
   */
  static getPublicUrl(filePath: string): string {
    const { data } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(filePath)
    
    return data.publicUrl
  }

  /**
   * Delete a file from storage
   */
  static async deleteFile(filePath: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .remove([filePath])

      if (error) {
        return {
          success: false,
          error: error.message
        }
      }

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Delete failed'
      }
    }
  }

  /**
   * List files in storage
   */
  static async listFiles(folder: string = 'uploads'): Promise<FileMetadata[]> {
    try {
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .list(folder)

      if (error) {
        console.error('List files error:', error)
        return []
      }

      return data.map((file: any) => ({
        id: file.id || '',
        name: file.name,
        size: file.metadata?.size || 0,
        type: file.metadata?.mimetype || '',
        path: `${folder}/${file.name}`,
        uploadedAt: file.updated_at || new Date().toISOString()
      }))
    } catch (error) {
      console.error('List files failed:', error)
      return []
    }
  }

  /**
   * Download a file from storage
   */
  static async downloadFile(filePath: string): Promise<Blob | null> {
    try {
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .download(filePath)

      if (error) {
        console.error('Download error:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Download failed:', error)
      return null
    }
  }
} 