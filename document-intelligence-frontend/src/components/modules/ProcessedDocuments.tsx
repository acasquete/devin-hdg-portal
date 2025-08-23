import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Search, Eye, Download, Trash2, FileText, RefreshCw } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { apiService, type DocumentMetadata, type DocumentFilters } from '@/services/api'
import type { Module } from '@/App'

interface ProcessedDocumentsProps {
  currentModule: Module
}

export function ProcessedDocuments({ }: ProcessedDocumentsProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [documentTypeFilter, setDocumentTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [tagFilter, setTagFilter] = useState('')
  const [selectedDocument, setSelectedDocument] = useState<DocumentMetadata | null>(null)
  const [documents, setDocuments] = useState<DocumentMetadata[]>([])
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [total, setTotal] = useState(0)
  const [pageSize, setPageSize] = useState(25)
  const [sortBy, setSortBy] = useState('uploadedAt')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const { toast } = useToast()

  const loadDocuments = async () => {
    setLoading(true)
    try {
      const filters: DocumentFilters = {
        q: searchQuery || undefined,
        contentType: documentTypeFilter !== 'all' ? documentTypeFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        tag: tagFilter || undefined,
        page: currentPage,
        pageSize,
        sortBy,
        sortDir
      }
      
      const response = await apiService.listDocuments(filters)
      setDocuments(response.documents)
      setTotal(response.total)
      setTotalPages(response.totalPages)
    } catch (error) {
      toast({
        title: "Failed to load documents",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDocuments()
  }, [searchQuery, documentTypeFilter, statusFilter, tagFilter, currentPage, pageSize, sortBy, sortDir])

  const handleDownload = async (documentId: string) => {
    try {
      const response = await apiService.getDownloadUrl(documentId)
      window.open(response.downloadUrl, '_blank')
    } catch (error) {
      toast({
        title: "Download failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      })
    }
  }

  const handleDelete = async (documentId: string) => {
    try {
      await apiService.deleteDocument(documentId)
      toast({
        title: "Document deleted",
        description: "Document has been successfully deleted",
      })
      loadDocuments()
    } catch (error) {
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      })
    }
  }

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024)
    return `${mb.toFixed(2)} MB`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Processed Documents</h1>
        <p className="text-muted-foreground">View and manage uploaded documents</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Document Filters</CardTitle>
          <CardDescription>Filter documents by various criteria</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Input
              placeholder="Filter by tag..."
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              className="w-48"
            />
            
            <Select value={documentTypeFilter} onValueChange={setDocumentTypeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Content Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="application/pdf">PDF</SelectItem>
                <SelectItem value="image/png">PNG</SelectItem>
                <SelectItem value="image/jpeg">JPEG</SelectItem>
                <SelectItem value="image/tiff">TIFF</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="stored">Stored</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={loadDocuments} disabled={loading} variant="outline">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Document List</CardTitle>
          <CardDescription>
            Found {total} documents {loading && '(loading...)'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document</TableHead>
                <TableHead>Content Type</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-500" />
                      <span className="font-medium">{doc.filename}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{doc.contentType}</Badge>
                  </TableCell>
                  <TableCell>{formatFileSize(doc.sizeBytes)}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{formatDate(doc.ingestion.uploadedAt)}</div>
                      <div className="text-muted-foreground">{doc.ingestion.uploadedBy}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={doc.status === 'stored' ? 'default' : doc.status === 'failed' ? 'destructive' : 'secondary'}>
                      {doc.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {doc.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Sheet>
                        <SheetTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedDocument(doc)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </SheetTrigger>
                        <SheetContent className="w-[600px] sm:w-[800px]">
                          <SheetHeader>
                            <SheetTitle>Document Details</SheetTitle>
                            <SheetDescription>
                              {selectedDocument?.filename}
                            </SheetDescription>
                          </SheetHeader>
                          <div className="mt-6 space-y-4">
                            {selectedDocument && (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm font-medium">ID</label>
                                    <p className="text-sm text-muted-foreground">{selectedDocument.id}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Content Type</label>
                                    <p className="text-sm text-muted-foreground">{selectedDocument.contentType}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Size</label>
                                    <p className="text-sm text-muted-foreground">{formatFileSize(selectedDocument.sizeBytes)}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Status</label>
                                    <p className="text-sm text-muted-foreground">{selectedDocument.status}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Uploaded By</label>
                                    <p className="text-sm text-muted-foreground">{selectedDocument.ingestion.uploadedBy}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Uploaded At</label>
                                    <p className="text-sm text-muted-foreground">{formatDate(selectedDocument.ingestion.uploadedAt)}</p>
                                  </div>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Storage Path</label>
                                  <p className="text-sm text-muted-foreground">{selectedDocument.storage.blobPath}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Tags</label>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {selectedDocument.tags.map((tag, index) => (
                                      <Badge key={index} variant="outline" className="text-xs">
                                        {tag}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </SheetContent>
                      </Sheet>
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDownload(doc.id)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDelete(doc.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, total)} of {total} documents
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
