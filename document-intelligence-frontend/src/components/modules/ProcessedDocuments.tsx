import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Search, Filter, Eye, AlertTriangle, FileText, ZoomIn, ZoomOut } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import type { Module } from '@/App'

interface ProcessedDocumentsProps {
  currentModule: Module
}

interface Document {
  id: string
  sourceFile: string
  pageNumber: number
  documentType: string
  dangerousGoods: boolean
  confidence: number
  timestamp: string
  hazardCodes?: string[]
}

const mockDocuments: Document[] = [
  {
    id: '1',
    sourceFile: 'invoice_2024_001.pdf',
    pageNumber: 1,
    documentType: 'Commercial Invoice',
    dangerousGoods: true,
    confidence: 95.2,
    timestamp: '2024-08-22 21:25:00',
    hazardCodes: ['UN1203', 'UN1993']
  },
  {
    id: '2',
    sourceFile: 'manifest_2024_045.pdf',
    pageNumber: 2,
    documentType: 'Shipping Manifest',
    dangerousGoods: false,
    confidence: 87.8,
    timestamp: '2024-08-22 21:20:00'
  },
  {
    id: '3',
    sourceFile: 'customs_doc_789.pdf',
    pageNumber: 1,
    documentType: 'Customs Declaration',
    dangerousGoods: true,
    confidence: 92.1,
    timestamp: '2024-08-22 21:15:00',
    hazardCodes: ['UN2794']
  },
  {
    id: '4',
    sourceFile: 'bill_of_lading_456.pdf',
    pageNumber: 3,
    documentType: 'Bill of Lading',
    dangerousGoods: false,
    confidence: 89.5,
    timestamp: '2024-08-22 21:10:00'
  },
  {
    id: '5',
    sourceFile: 'packing_list_123.pdf',
    pageNumber: 1,
    documentType: 'Packing List',
    dangerousGoods: true,
    confidence: 96.7,
    timestamp: '2024-08-22 21:05:00',
    hazardCodes: ['UN1170', 'UN1263']
  }
]

const mockExtractedFields = {
  '1': {
    shipper: 'ACME Chemical Corp',
    consignee: 'Global Logistics Ltd',
    description: 'Gasoline, UN1203, Class 3, PG II',
    quantity: '500 L',
    weight: '375 kg',
    hazardClass: 'Class 3 - Flammable Liquids',
    unNumber: 'UN1203',
    packingGroup: 'II'
  }
}

export function ProcessedDocuments({ currentModule }: ProcessedDocumentsProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [documentTypeFilter, setDocumentTypeFilter] = useState('all')
  const [dangerousGoodsFilter, setDangerousGoodsFilter] = useState('all')
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [zoomLevel, setZoomLevel] = useState(100)

  const filteredDocuments = mockDocuments.filter(doc => {
    const matchesSearch = doc.sourceFile.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.documentType.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = documentTypeFilter === 'all' || doc.documentType === documentTypeFilter
    const matchesDG = dangerousGoodsFilter === 'all' || 
                     (dangerousGoodsFilter === 'yes' && doc.dangerousGoods) ||
                     (dangerousGoodsFilter === 'no' && !doc.dangerousGoods)
    
    return matchesSearch && matchesType && matchesDG
  })

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-green-600'
    if (confidence >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const documentTypes = [...new Set(mockDocuments.map(doc => doc.documentType))]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Processed Documents</h1>
        <p className="text-muted-foreground">View and analyze extracted document information</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Document Filters</CardTitle>
          <CardDescription>Filter documents by various criteria</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by filename or document type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={documentTypeFilter} onValueChange={setDocumentTypeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Document Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {documentTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={dangerousGoodsFilter} onValueChange={setDangerousGoodsFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Dangerous Goods" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Documents</SelectItem>
                <SelectItem value="yes">With Hazards</SelectItem>
                <SelectItem value="no">No Hazards</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Documents ({filteredDocuments.length})</CardTitle>
          <CardDescription>Click on a document to view details and extracted fields</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Source File</TableHead>
                <TableHead>Page</TableHead>
                <TableHead>Document Type</TableHead>
                <TableHead>Dangerous Goods</TableHead>
                <TableHead>Confidence</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocuments.map((doc) => (
                <TableRow key={doc.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell className="font-medium">{doc.sourceFile}</TableCell>
                  <TableCell>{doc.pageNumber}</TableCell>
                  <TableCell>{doc.documentType}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {doc.dangerousGoods ? (
                        <>
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                          <Badge variant="destructive">Yes</Badge>
                          {doc.hazardCodes && (
                            <div className="flex gap-1">
                              {doc.hazardCodes.map(code => (
                                <Badge key={code} variant="outline" className="text-xs">
                                  {code}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </>
                      ) : (
                        <Badge variant="secondary">No</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className={getConfidenceColor(doc.confidence)}>
                        {doc.confidence.toFixed(1)}%
                      </span>
                      <Progress value={doc.confidence} className="w-16 h-2" />
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{doc.timestamp}</TableCell>
                  <TableCell>
                    <Sheet>
                      <SheetTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedDocument(doc)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                      </SheetTrigger>
                      <SheetContent className="w-[800px] sm:w-[800px]">
                        <SheetHeader>
                          <SheetTitle>Document Preview</SheetTitle>
                          <SheetDescription>
                            {selectedDocument?.sourceFile} - Page {selectedDocument?.pageNumber}
                          </SheetDescription>
                        </SheetHeader>
                        
                        <div className="mt-6 space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-medium">Document Viewer</h3>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setZoomLevel(Math.max(50, zoomLevel - 25))}
                              >
                                <ZoomOut className="h-4 w-4" />
                              </Button>
                              <span className="text-sm">{zoomLevel}%</span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setZoomLevel(Math.min(200, zoomLevel + 25))}
                              >
                                <ZoomIn className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          
                          <div className="border rounded-lg p-4 bg-gray-50 min-h-96 flex items-center justify-center">
                            <div className="text-center text-muted-foreground">
                              <FileText className="h-16 w-16 mx-auto mb-4" />
                              <p>Document preview would appear here</p>
                              <p className="text-sm">PDF/Image viewer with bounding boxes</p>
                            </div>
                          </div>

                          {selectedDocument && mockExtractedFields[selectedDocument.id as keyof typeof mockExtractedFields] && (
                            <div className="space-y-4">
                              <h3 className="text-lg font-medium">Extracted Fields</h3>
                              <div className="grid grid-cols-2 gap-4">
                                {Object.entries(mockExtractedFields[selectedDocument.id as keyof typeof mockExtractedFields]).map(([key, value]) => (
                                  <div key={key} className="space-y-1">
                                    <label className="text-sm font-medium capitalize">
                                      {key.replace(/([A-Z])/g, ' $1').trim()}
                                    </label>
                                    <div className="p-2 border rounded bg-background">
                                      {value}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {selectedDocument?.hazardCodes && (
                            <div className="space-y-4">
                              <h3 className="text-lg font-medium text-red-600">Hazardous Materials Detected</h3>
                              <div className="space-y-2">
                                {selectedDocument.hazardCodes.map(code => (
                                  <div key={code} className="flex items-center gap-2 p-2 border border-red-200 rounded bg-red-50">
                                    <AlertTriangle className="h-4 w-4 text-red-500" />
                                    <span className="font-medium">{code}</span>
                                    <span className="text-sm text-muted-foreground">
                                      - {code === 'UN1203' ? 'Gasoline' : 
                                         code === 'UN1993' ? 'Flammable liquid, n.o.s.' :
                                         code === 'UN2794' ? 'Batteries, wet, filled with acid' :
                                         code === 'UN1170' ? 'Ethanol' :
                                         code === 'UN1263' ? 'Paint' : 'Hazardous material'}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </SheetContent>
                    </Sheet>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
