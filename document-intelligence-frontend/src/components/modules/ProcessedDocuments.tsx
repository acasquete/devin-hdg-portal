import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Eye, Download, Trash2, FileText, RefreshCw } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { apiService, type DocumentMetadata, type DocumentFilters } from '@/services/api'
import type { Module } from '@/App'

interface ProcessedDocumentsProps {
  currentModule: Module
}

export function ProcessedDocuments({ }: ProcessedDocumentsProps) {
  const [shipmentIdFilter, setShipmentIdFilter] = useState('')
  const [documentTypeFilter, setDocumentTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dangerousGoodsFilter, setDangerousGoodsFilter] = useState('all')
  const [confidenceMin, setConfidenceMin] = useState<number>(0)
  const [confidenceMax, setConfidenceMax] = useState<number>(100)
  const [transportTypeFilter, setTransportTypeFilter] = useState('all')
  const [branchFilter, setBranchFilter] = useState('all')
  const [selectedDocument, setSelectedDocument] = useState<DocumentMetadata | null>(null)
  const [documents, setDocuments] = useState<DocumentMetadata[]>([])
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [total, setTotal] = useState(0)
  const [pageSize] = useState(25)
  const [sortBy] = useState('uploadedAt')
  const [sortDir] = useState<'asc' | 'desc'>('desc')
  const { toast } = useToast()

  const loadDocuments = async () => {
    setLoading(true)
    try {
      const filters: DocumentFilters = {
        shipmentId: shipmentIdFilter || undefined,
        documentType: documentTypeFilter !== 'all' ? documentTypeFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        isDangerousGoods: dangerousGoodsFilter !== 'all' ? dangerousGoodsFilter === 'yes' : undefined,
        confidenceMin: confidenceMin > 0 ? confidenceMin : undefined,
        confidenceMax: confidenceMax < 100 ? confidenceMax : undefined,
        transportType: transportTypeFilter !== 'all' ? transportTypeFilter : undefined,
        branch: branchFilter !== 'all' ? branchFilter : undefined,
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
  }, [shipmentIdFilter, documentTypeFilter, statusFilter, dangerousGoodsFilter, confidenceMin, confidenceMax, transportTypeFilter, branchFilter, currentPage, pageSize, sortBy, sortDir])

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="shipmentId">Shipment ID</Label>
              <Input
                id="shipmentId"
                placeholder="Filter by shipment ID..."
                value={shipmentIdFilter}
                onChange={(e) => setShipmentIdFilter(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Processing">Processing</SelectItem>
                  <SelectItem value="Processed">Processed</SelectItem>
                  <SelectItem value="Failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="dangerousGoods">IDG (Dangerous Goods)</Label>
              <Select value={dangerousGoodsFilter} onValueChange={setDangerousGoodsFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="transportType">Transport Type</Label>
              <Select value={transportTypeFilter} onValueChange={setTransportTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Transport" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Transport</SelectItem>
                  <SelectItem value="Air">Air</SelectItem>
                  <SelectItem value="Ocean">Ocean</SelectItem>
                  <SelectItem value="Transcon">Transcon</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="branch">Branch</Label>
              <Select value={branchFilter} onValueChange={setBranchFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Branches" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Branches</SelectItem>
                  <SelectItem value="SLC">SLC</SelectItem>
                  <SelectItem value="LA">LA</SelectItem>
                  <SelectItem value="MAD">MAD</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="documentType">Document Type</Label>
              <Select value={documentTypeFilter} onValueChange={setDocumentTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="invoice">Invoice</SelectItem>
                  <SelectItem value="packing list">Packing List</SelectItem>
                  <SelectItem value="dangerous goods declaration">Dangerous Goods Declaration</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2">
              <Label>Confidence Range: {confidenceMin}% - {confidenceMax}%</Label>
              <div className="mt-2 space-y-2">
                <div>
                  <Label className="text-sm text-muted-foreground">Min: {confidenceMin}%</Label>
                  <Slider
                    value={[confidenceMin]}
                    onValueChange={(value) => setConfidenceMin(value[0])}
                    max={100}
                    min={0}
                    step={1}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Max: {confidenceMax}%</Label>
                  <Slider
                    value={[confidenceMax]}
                    onValueChange={(value) => setConfidenceMax(value[0])}
                    max={100}
                    min={0}
                    step={1}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-end">
              <Button onClick={loadDocuments} disabled={loading} variant="outline" className="w-full">
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
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
                <TableHead>Shipment ID</TableHead>
                <TableHead>Page Count</TableHead>
                <TableHead>Document Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>IDG</TableHead>
                <TableHead>% Confidence</TableHead>
                <TableHead>Transport Type</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-500" />
                      <span className="font-medium">{doc.shipmentId}</span>
                    </div>
                  </TableCell>
                  <TableCell>{doc.pageCount}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{doc.documentType || 'N/A'}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={doc.status === 'Processed' ? 'default' : doc.status === 'Failed' ? 'destructive' : 'secondary'}>
                      {doc.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={doc.isDangerousGoods ? 'destructive' : 'outline'}>
                      {doc.isDangerousGoods ? 'Yes' : 'No'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {doc.confidencePercentage !== null && doc.confidencePercentage !== undefined 
                      ? `${doc.confidencePercentage.toFixed(1)}%` 
                      : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{doc.transportType || 'N/A'}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{doc.branch}</Badge>
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
                                    <label className="text-sm font-medium">Shipment ID</label>
                                    <p className="text-sm text-muted-foreground">{selectedDocument.shipmentId}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Filename</label>
                                    <p className="text-sm text-muted-foreground">{selectedDocument.filename}</p>
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
                                    <label className="text-sm font-medium">Page Count</label>
                                    <p className="text-sm text-muted-foreground">{selectedDocument.pageCount}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Document Type</label>
                                    <p className="text-sm text-muted-foreground">{selectedDocument.documentType || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Status</label>
                                    <p className="text-sm text-muted-foreground">{selectedDocument.status}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Dangerous Goods</label>
                                    <p className="text-sm text-muted-foreground">{selectedDocument.isDangerousGoods ? 'Yes' : 'No'}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Confidence</label>
                                    <p className="text-sm text-muted-foreground">
                                      {selectedDocument.confidencePercentage !== null && selectedDocument.confidencePercentage !== undefined 
                                        ? `${selectedDocument.confidencePercentage.toFixed(1)}%` 
                                        : 'N/A'}
                                    </p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Transport Type</label>
                                    <p className="text-sm text-muted-foreground">{selectedDocument.transportType || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Branch</label>
                                    <p className="text-sm text-muted-foreground">{selectedDocument.branch}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Uploaded At</label>
                                    <p className="text-sm text-muted-foreground">{formatDate(selectedDocument.uploadedAt)}</p>
                                  </div>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Storage Path</label>
                                  <p className="text-sm text-muted-foreground">{selectedDocument.storage.blobPath}</p>
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
