import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Upload, FileText, CheckCircle, XCircle, Clock, Settings, AlertCircle } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import type { Module } from '@/App'

interface IngestionProps {
  currentModule: Module
}

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

export function Ingestion({ currentModule }: IngestionProps) {
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)

  const handleFileUpload = () => {
    setIsUploading(true)
    setUploadProgress(0)
    
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsUploading(false)
          return 100
        }
        return prev + 10
      })
    }, 200)
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
                Manual Document Upload
              </CardTitle>
              <CardDescription>Upload documents for testing and immediate processing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Drop files here or click to browse</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Supports PDF, PNG, JPG, TIFF files up to 10MB each
                </p>
                <Button onClick={handleFileUpload} disabled={isUploading}>
                  {isUploading ? 'Uploading...' : 'Select Files'}
                </Button>
              </div>
              
              {isUploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Uploading documents...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="w-full" />
                </div>
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
