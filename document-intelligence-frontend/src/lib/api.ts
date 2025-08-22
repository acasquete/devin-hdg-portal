const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://apim-docint-dev.azure-api.net/api'
const TENANT_ID = 'tenant_123' // This would come from user context in real app
const USER_ID = 'user_456' // This would come from user context in real app

export interface DocumentResponse {
  documentId: string
  resultId?: string
  status: 'submitted' | 'running' | 'succeeded' | 'failed' | 'canceled' | 'timeout'
}

export interface DocumentDetail {
  id: string
  tenantId: string
  userId: string
  createdAt: string
  blobUrl: string
  blobSha256: string
  analyzerId: string
  resultId?: string
  status: 'submitted' | 'running' | 'succeeded' | 'failed' | 'canceled' | 'timeout'
  warnings: string[]
  error?: string
  result?: any
  extracted: {
    VendorName?: string
    Items: Array<{
      Description?: string
      Quantity?: number
      UnitPrice?: number
      TotalPrice?: number
    }>
  }
  ttl?: number
}

export interface DocumentListResponse {
  documents: DocumentDetail[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface BatchResponse {
  batchId: string
  status: 'processing' | 'completed' | 'failed'
  fileCount: number
}

export interface QuotaError {
  error: string
  current: number
  limit: number
  requested: number
}

class ApiService {
  private getHeaders(): HeadersInit {
    return {
      'x-tenant-id': TENANT_ID,
      'x-user-id': USER_ID,
      'Ocp-Apim-Subscription-Key': import.meta.env.VITE_APIM_SUBSCRIPTION_KEY || 'your-subscription-key'
    }
  }

  async uploadDocument(file: File): Promise<DocumentResponse> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(`${API_BASE_URL}/documents`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: formData
    })

    if (!response.ok) {
      if (response.status === 429) {
        const quotaError: QuotaError = await response.json()
        throw new Error(`Quota limit exceeded: ${quotaError.current}/${quotaError.limit} documents processing`)
      }
      throw new Error(`Upload failed: ${response.statusText}`)
    }

    return response.json()
  }

  async uploadDocumentFromUrl(fileUrl: string, fileName?: string): Promise<DocumentResponse> {
    const response = await fetch(`${API_BASE_URL}/documents`, {
      method: 'POST',
      headers: {
        ...this.getHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ fileUrl, fileName })
    })

    if (!response.ok) {
      if (response.status === 429) {
        const quotaError: QuotaError = await response.json()
        throw new Error(`Quota limit exceeded: ${quotaError.current}/${quotaError.limit} documents processing`)
      }
      throw new Error(`Upload failed: ${response.statusText}`)
    }

    return response.json()
  }

  async getDocument(documentId: string): Promise<DocumentDetail> {
    const response = await fetch(`${API_BASE_URL}/documents/${documentId}`, {
      headers: this.getHeaders()
    })

    if (!response.ok) {
      throw new Error(`Failed to get document: ${response.statusText}`)
    }

    return response.json()
  }

  async listDocuments(params?: {
    status?: string
    page?: number
    pageSize?: number
  }): Promise<DocumentListResponse> {
    const searchParams = new URLSearchParams()
    if (params?.status) searchParams.append('status', params.status)
    if (params?.page) searchParams.append('page', params.page.toString())
    if (params?.pageSize) searchParams.append('pageSize', params.pageSize.toString())

    const url = `${API_BASE_URL}/documents${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
    
    const response = await fetch(url, {
      headers: this.getHeaders()
    })

    if (!response.ok) {
      throw new Error(`Failed to list documents: ${response.statusText}`)
    }

    return response.json()
  }

  async batchUpload(files: File[]): Promise<BatchResponse> {
    const formData = new FormData()
    files.forEach((file, index) => {
      formData.append(`file_${index}`, file)
    })

    const response = await fetch(`${API_BASE_URL}/documents/batch`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: formData
    })

    if (!response.ok) {
      if (response.status === 429) {
        const quotaError: QuotaError = await response.json()
        throw new Error(`Quota limit exceeded: ${quotaError.current}/${quotaError.limit} documents processing`)
      }
      throw new Error(`Batch upload failed: ${response.statusText}`)
    }

    return response.json()
  }

  async healthCheck(): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/health`)
    
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.statusText}`)
    }

    return response.json()
  }
}

export const apiService = new ApiService()
