import { supabase, INTERVIEWS_BUCKET, PRODUCT_DOCUMENTS_BUCKET } from './supabase'

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
   * Upload an interview file to Supabase storage
   */
  static async uploadInterviewFile(buffer: Buffer, filePath: string, contentType: string): Promise<UploadResult> {
    return this.uploadFile(buffer, filePath, contentType, INTERVIEWS_BUCKET)
  }

  /**
   * Upload a product document file to Supabase storage
   */
  static async uploadProductDocument(buffer: Buffer, filePath: string, contentType: string): Promise<UploadResult> {
    return this.uploadFile(buffer, filePath, contentType, PRODUCT_DOCUMENTS_BUCKET)
  }

  /**
   * Upload a file to Supabase storage (generic method)
   */
  private static async uploadFile(buffer: Buffer, filePath: string, contentType: string, bucket: string): Promise<UploadResult> {
    try {
      // Upload file to storage (filePath may include user folder)
      const { data, error } = await supabase.storage
        .from(bucket)
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
        fileId: undefined // Not generating a fileId here
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
   * Download an interview file from storage
   */
  static async downloadInterviewFile(filePath: string): Promise<Blob | null> {
    return this.downloadFile(filePath, INTERVIEWS_BUCKET)
  }

  /**
   * Download a product document from storage
   */
  static async downloadProductDocument(filePath: string): Promise<Blob | null> {
    return this.downloadFile(filePath, PRODUCT_DOCUMENTS_BUCKET)
  }

  /**
   * Download a file from storage (generic method)
   */
  private static async downloadFile(filePath: string, bucket: string): Promise<Blob | null> {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
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

  /**
   * Get public URL for an interview file
   */
  static getInterviewPublicUrl(filePath: string): string {
    const { data } = supabase.storage
      .from(INTERVIEWS_BUCKET)
      .getPublicUrl(filePath)
    
    return data.publicUrl
  }

  /**
   * Get public URL for a product document
   */
  static getProductDocumentPublicUrl(filePath: string): string {
    const { data } = supabase.storage
      .from(PRODUCT_DOCUMENTS_BUCKET)
      .getPublicUrl(filePath)
    
    return data.publicUrl
  }

  /**
   * Delete an interview file from storage
   */
  static async deleteInterviewFile(filePath: string): Promise<{ success: boolean; error?: string }> {
    return this.deleteFile(filePath, INTERVIEWS_BUCKET)
  }

  /**
   * Delete a product document from storage
   */
  static async deleteProductDocument(filePath: string): Promise<{ success: boolean; error?: string }> {
    return this.deleteFile(filePath, PRODUCT_DOCUMENTS_BUCKET)
  }

  /**
   * Delete a file from storage (generic method)
   */
  private static async deleteFile(filePath: string, bucket: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.storage
        .from(bucket)
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
   * List interview files in storage
   */
  static async listInterviewFiles(): Promise<FileMetadata[]> {
    return this.listFiles(INTERVIEWS_BUCKET)
  }

  /**
   * List product document files in storage
   */
  static async listProductDocuments(): Promise<FileMetadata[]> {
    return this.listFiles(PRODUCT_DOCUMENTS_BUCKET)
  }

  /**
   * List files in storage (generic method)
   */
  private static async listFiles(bucket: string): Promise<FileMetadata[]> {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .list('')

      if (error) {
        console.error('List files error:', error)
        return []
      }

      return data.map((file: { id?: string; name: string; metadata?: { size?: number; mimetype?: string }; updated_at?: string }) => ({
        id: file.id || '',
        name: file.name,
        size: file.metadata?.size || 0,
        type: file.metadata?.mimetype || '',
        path: file.name,
        uploadedAt: file.updated_at || new Date().toISOString()
      }))
    } catch (error) {
      console.error('List files failed:', error)
      return []
    }
  }
} 