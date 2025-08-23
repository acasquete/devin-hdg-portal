const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8000'
const API_KEY = (import.meta as any).env?.VITE_API_KEY || 'dev-api-key-change-in-production'

export interface DocumentMetadata {
  id: string
  filename: string
  contentType: string
  sizeBytes: number
  storage: {
    container: string
    blobPath: string
    etag: string
  }
  ingestion: {
    uploadedBy: string
    uploadedAt: string
  }
  tags: string[]
  status: 'stored' | 'processing' | 'failed'
}

export interface DocumentListResponse {
  documents: DocumentMetadata[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface DocumentUploadResponse {
  id: string
  filename: string
  status: string
  message: string
}

export interface DocumentDownloadResponse {
  downloadUrl: string
  expiresAt: string
}

export interface DocumentFilters {
  q?: string
  tag?: string
  contentType?: string
  status?: string
  from?: string
  to?: string
  page?: number
  pageSize?: number
  sortBy?: string
  sortDir?: 'asc' | 'desc'
}

class ApiService {
  private getHeaders() {
    return {
      'X-API-Key': API_KEY,
    }
  }

  async uploadDocument(
    file: File, 
    uploadedBy: string, 
    tags?: string[]
  ): Promise<DocumentUploadResponse> {
    const formData = new FormData()
    formData.append('file', file)
    
    const params = new URLSearchParams({
      uploaded_by: uploadedBy,
    })
    
    if (tags && tags.length > 0) {
      params.append('tags', tags.join(','))
    }

    const response = await fetch(`${API_BASE_URL}/api/documents?${params}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Upload failed')
    }

    return response.json()
  }

  async listDocuments(filters: DocumentFilters = {}): Promise<DocumentListResponse> {
    const params = new URLSearchParams()
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString())
      }
    })

    const response = await fetch(`${API_BASE_URL}/api/documents?${params}`, {
      headers: this.getHeaders(),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to fetch documents')
    }

    return response.json()
  }

  async getDocument(id: string): Promise<DocumentMetadata> {
    const response = await fetch(`${API_BASE_URL}/api/documents/${id}`, {
      headers: this.getHeaders(),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Document not found')
    }

    return response.json()
  }

  async getDownloadUrl(id: string): Promise<DocumentDownloadResponse> {
    const response = await fetch(`${API_BASE_URL}/api/documents/${id}/download`, {
      headers: this.getHeaders(),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to get download URL')
    }

    return response.json()
  }

  async deleteDocument(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/documents/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to delete document')
    }
  }
}

export const apiService = new ApiService()
