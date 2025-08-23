const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8000'
const API_KEY = (import.meta as any).env?.VITE_API_KEY || 'dev-api-key-change-in-production'

export interface DocumentMetadata {
  id: string
  shipmentId: string
  filename: string
  contentType: string
  sizeBytes: number
  pageCount: number
  documentType?: string
  status: 'Processing' | 'Processed' | 'Failed'
  isDangerousGoods: boolean
  confidencePercentage?: number
  transportType?: string
  branch: string
  uploadedAt: string
  storage: {
    container: string
    blobPath: string
    etag: string
  }
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
  shipmentId: string
  filename: string
  status: string
  message: string
}

export interface DocumentDownloadResponse {
  downloadUrl: string
  expiresAt: string
}

export interface DocumentFilters {
  shipmentId?: string
  status?: string
  isDangerousGoods?: boolean
  confidenceMin?: number
  confidenceMax?: number
  transportType?: string
  branch?: string
  documentType?: string
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
    shipmentId: string, 
    branch: string = 'SLC'
  ): Promise<DocumentUploadResponse> {
    const formData = new FormData()
    formData.append('file', file)
    
    const params = new URLSearchParams({
      shipmentId: shipmentId,
      branch: branch,
    })

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
    
    if (filters.shipmentId) params.append('shipmentId', filters.shipmentId)
    if (filters.status) params.append('status', filters.status)
    if (filters.isDangerousGoods !== undefined) params.append('isDangerousGoods', filters.isDangerousGoods.toString())
    if (filters.confidenceMin !== undefined) params.append('confidenceMin', filters.confidenceMin.toString())
    if (filters.confidenceMax !== undefined) params.append('confidenceMax', filters.confidenceMax.toString())
    if (filters.transportType) params.append('transportType', filters.transportType)
    if (filters.branch) params.append('branch', filters.branch)
    if (filters.documentType) params.append('documentType', filters.documentType)
    if (filters.from) params.append('from', filters.from)
    if (filters.to) params.append('to', filters.to)
    if (filters.page) params.append('page', filters.page.toString())
    if (filters.pageSize) params.append('pageSize', filters.pageSize.toString())
    if (filters.sortBy) params.append('sortBy', filters.sortBy)
    if (filters.sortDir) params.append('sortDir', filters.sortDir)

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
