import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Upload, FileText, CheckCircle, XCircle, Clock, Settings, AlertCircle, RefreshCw } from 'lucide-react'
import { FileUpload, FileUploadItem } from '@/components/ui/file-upload'
import { apiService, DocumentResponse, DocumentDetail } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'


const mockKafkaStatus = {
  brokers: ['kafka-broker-1:9092', 'kafka-broker-2:9092', 'kafka-broker-3:9092'],
  topics: ['hdg-documents', 'customs-documents', 'processed-results'],
  consumerLag: 12,
  lastMessage: '2 minutes ago',
  status: 'healthy'
}

const mockIngestionHistory = [
  { id: 1, timestamp: '2024-08-22 21:25:00', source: 'Kafka Topic: hdg-documents', status: 'success', documents: 15, size: '2.4 MB' },
  { id: 2, timestamp: '2024-08-22 21:20:00', source: 'Manual Upload', status: 'success', documents: 3, size: '1.1 MB' },
  { id: 3, timestamp: '2024-08-22 21:15:00', source: 'Kafka Topic: customs-documents', status: 'processing', documents: 8, size: '3.2 MB' },
  { id: 4, timestamp: '2024-08-22 21:10:00', source: 'Manual Upload', status: 'failed', documents: 1, size: '0.5 MB' },
  { id: 5, timestamp: '2024-08-22 21:05:00', source: 'Kafka Topic: hdg-documents', status: 'success', documents: 22, size: '4.1 MB' }
]

export function Ingestion() {
  const [isUploading, setIsUploading] = useState(false)
  const [files, setFiles] = useState<FileUploadItem[]>([])
  const [documents, setDocuments] = useState<DocumentDetail[]>([])
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false)
  const [quotaInfo, setQuotaInfo] = useState<{ current: number; limit: number } | null>(null)
  const { toast } = useToast()

  const handleFilesSelected = async (newFiles: File[]) => {
    const fileItems: FileUploadItem[] = newFiles.map(file => ({
      id: `${Date.now()}-${Math.random()}`,
      file,
      status: 'pending',
      progress: 0
    }))

    setFiles(prev => [...prev, ...fileItems])

    for (const fileItem of fileItems) {
      try {
        setFiles(prev => prev.map(f => 
          f.id === fileItem.id ? { ...f, status: 'uploading', progress: 0 } : f
        ))

        const progressInterval = setInterval(() => {
          setFiles(prev => prev.map(f => 
            f.id === fileItem.id && f.progress < 90 
              ? { ...f, progress: f.progress + 10 } 
              : f
          ))
        }, 200)

        const response: DocumentResponse = await apiService.uploadDocument(fileItem.file)
        
        clearInterval(progressInterval)

        setFiles(prev => prev.map(f => 
          f.id === fileItem.id 
            ? { ...f, status: 'success', progress: 100, documentId: response.documentId }
            : f
        ))

        toast({
          title: "File uploaded successfully",
          description: `${fileItem.file.name} is now being processed`,
        })

        loadDocuments()

      } catch (error) {
        setFiles(prev => prev.map(f => 
          f.id === fileItem.id 
            ? { ...f, status: 'error', error: error instanceof Error ? error.message : 'Upload failed' }
            : f
        ))

        toast({
          title: "Upload failed",
          description: error instanceof Error ? error.message : 'Failed to upload file',
          variant: "destructive"
        })

        if (error instanceof Error && error.message.includes('Quota limit exceeded')) {
          const match = error.message.match(/(\d+)\/(\d+)/)
          if (match) {
            setQuotaInfo({ current: parseInt(match[1]), limit: parseInt(match[2]) })
          }
        }
      }
    }
  }

  const handleFileRemove = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId))
  }

  const loadDocuments = useCallback(async () => {
    try {
      setIsLoadingDocuments(true)
      const response = await apiService.listDocuments({ pageSize: 20 })
      setDocuments(response.documents)
    } catch (error) {
      toast({
        title: "Failed to load documents",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive"
      })
    } finally {
      setIsLoadingDocuments(false)
    }
  }, [toast])

  const pollDocumentStatus = useCallback(async (documentId: string) => {
    try {
      const document = await apiService.getDocument(documentId)
      setDocuments(prev => prev.map(doc => 
        doc.id === documentId ? document : doc
      ))
      
      if (document.status === 'running' || document.status === 'submitted') {
        setTimeout(() => pollDocumentStatus(documentId), 2000)
      }
    } catch (error) {
      console.error('Failed to poll document status:', error)
    }
  }, [])

  useEffect(() => {
    loadDocuments()
  }, [loadDocuments])

  useEffect(() => {
    const processingDocs = documents.filter(doc => 
      doc.status === 'running' || doc.status === 'submitted'
    )
    
    processingDocs.forEach(doc => {
      setTimeout(() => pollDocumentStatus(doc.id), 2000)
    })
  }, [documents, pollDocumentStatus])

  const handleBatchUpload = async () => {
    const pendingFiles = files.filter(f => f.status === 'pending').map(f => f.file)
    
    if (pendingFiles.length === 0) {
      toast({
        title: "No files to upload",
        description: "Please select files first",
        variant: "destructive"
      })
      return
    }

    try {
      setIsUploading(true)
      const response = await apiService.batchUpload(pendingFiles)
      
      toast({
        title: "Batch upload started",
        description: `Processing ${response.fileCount} files`,
      })

      setFiles(prev => prev.filter(f => f.status !== 'pending'))
      
      loadDocuments()
      
    } catch (error) {
      toast({
        title: "Batch upload failed",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive"
      })
    } finally {
      setIsUploading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'processing':
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      success: 'default',
      failed: 'destructive',
      processing: 'secondary',
      healthy: 'default'
    } as const
    
    return <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>{status}</Badge>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Document Ingestion</h1>
        <p className="text-muted-foreground">Manage document uploads and Kafka-based ingestion</p>
      </div>

      <Tabs defaultValue="manual" className="space-y-4">
        <TabsList>
          <TabsTrigger value="manual">Manual Upload</TabsTrigger>
          <TabsTrigger value="kafka">Kafka Configuration</TabsTrigger>
          <TabsTrigger value="history">Ingestion History</TabsTrigger>
        </TabsList>

        <TabsContent value="manual" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Document Upload
              </CardTitle>
              <CardDescription>
                Upload documents for asynchronous processing with Azure AI Content Understanding
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {quotaInfo && (
                <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-800">
                      Processing Limit: {quotaInfo.current}/{quotaInfo.limit} documents
                    </span>
                  </div>
                  <p className="text-xs text-yellow-700 mt-1">
                    Please wait for current documents to complete before uploading more.
                  </p>
                </div>
              )}

              <FileUpload
                onFilesSelected={handleFilesSelected}
                onFileRemove={handleFileRemove}
                files={files}
                maxFiles={10}
                disabled={isUploading}
              />

              {files.filter(f => f.status === 'pending').length > 0 && (
                <div className="flex gap-2">
                  <Button 
                    onClick={handleBatchUpload}
                    disabled={isUploading}
                    className="flex-1"
                  >
                    {isUploading ? 'Processing...' : `Upload ${files.filter(f => f.status === 'pending').length} Files`}
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setFiles(prev => prev.filter(f => f.status !== 'pending'))}
                    disabled={isUploading}
                  >
                    Clear Pending
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Recent Documents</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadDocuments}
                  disabled={isLoadingDocuments}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingDocuments ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </CardTitle>
              <CardDescription>
                Real-time status of uploaded documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              {documents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No documents uploaded yet</p>
                  <p className="text-sm">Upload files above to see them here</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Document ID</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Items</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documents.slice(0, 10).map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell className="font-mono text-sm">
                          {doc.id.substring(0, 12)}...
                        </TableCell>
                        <TableCell className="text-sm">
                          {new Date(doc.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(doc.status)}
                            {getStatusBadge(doc.status)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {doc.extracted.VendorName || '-'}
                        </TableCell>
                        <TableCell>
                          {doc.extracted.Items.length > 0 ? doc.extracted.Items.length : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="kafka" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Kafka Configuration Status
              </CardTitle>
              <CardDescription>Monitor Kafka brokers, topics, and consumer health</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Connection Status</label>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(mockKafkaStatus.status)}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Consumer Lag</label>
                  <div className="text-2xl font-bold">{mockKafkaStatus.consumerLag}</div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Last Message</label>
                  <div className="text-sm text-muted-foreground">{mockKafkaStatus.lastMessage}</div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Active Topics</label>
                  <div className="text-2xl font-bold">{mockKafkaStatus.topics.length}</div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Broker Endpoints</h4>
                <div className="space-y-2">
                  {mockKafkaStatus.brokers.map((broker, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <span className="font-mono text-sm">{broker}</span>
                      <Badge variant="default">Connected</Badge>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Topics</h4>
                <div className="space-y-2">
                  {mockKafkaStatus.topics.map((topic, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <span className="font-mono text-sm">{topic}</span>
                      <Badge variant="default">Active</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ingestion History</CardTitle>
              <CardDescription>Track all document ingestion events and their status</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Documents</TableHead>
                    <TableHead>Size</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockIngestionHistory.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-mono text-sm">{entry.timestamp}</TableCell>
                      <TableCell>{entry.source}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(entry.status)}
                          {getStatusBadge(entry.status)}
                        </div>
                      </TableCell>
                      <TableCell>{entry.documents}</TableCell>
                      <TableCell>{entry.size}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
