import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { 
  Plus, 
  Copy, 
  Download, 
  Upload, 
  Play, 
  BarChart3, 
  GitBranch, 
  CheckCircle, 
  Clock,
  AlertCircle,
  Settings
} from 'lucide-react'

interface Schema {
  id: string
  name: string
  version: string
  client: string
  documentType: string
  region: string
  owner: string
  status: 'active' | 'draft' | 'archived'
  createdAt: string
  lastModified: string
  accuracy: number
}

const mockSchemas: Schema[] = [
  {
    id: '1',
    name: 'HDG Commercial Invoice',
    version: '2.1.0',
    client: 'ACME Corp',
    documentType: 'Commercial Invoice',
    region: 'North America',
    owner: 'John Doe',
    status: 'active',
    createdAt: '2024-08-15',
    lastModified: '2024-08-20',
    accuracy: 95.2
  },
  {
    id: '2',
    name: 'Customs Declaration EU',
    version: '1.3.2',
    client: 'Global Logistics',
    documentType: 'Customs Declaration',
    region: 'Europe',
    owner: 'Jane Smith',
    status: 'draft',
    createdAt: '2024-08-10',
    lastModified: '2024-08-22',
    accuracy: 87.8
  },
  {
    id: '3',
    name: 'Shipping Manifest Asia',
    version: '3.0.1',
    client: 'Pacific Shipping',
    documentType: 'Shipping Manifest',
    region: 'Asia Pacific',
    owner: 'Mike Johnson',
    status: 'active',
    createdAt: '2024-07-25',
    lastModified: '2024-08-18',
    accuracy: 92.1
  }
]

const mockEvaluationResults = {
  precision: 94.2,
  recall: 91.8,
  f1Score: 93.0,
  fieldAccuracy: {
    'shipper': 96.5,
    'consignee': 94.2,
    'description': 89.7,
    'unNumber': 97.8,
    'hazardClass': 92.3
  }
}

const sampleSchemaJson = `{
  "name": "HDG Commercial Invoice",
  "version": "2.1.0",
  "fields": [
    {
      "name": "shipper",
      "type": "text",
      "required": true,
      "boundingBox": true
    },
    {
      "name": "consignee", 
      "type": "text",
      "required": true,
      "boundingBox": true
    },
    {
      "name": "unNumber",
      "type": "pattern",
      "pattern": "UN[0-9]{4}",
      "required": false,
      "boundingBox": true
    }
  ],
  "hazardDetection": {
    "enabled": true,
    "patterns": ["UN[0-9]{4}", "Class [1-9]"],
    "keywords": ["dangerous", "hazardous", "flammable"]
  }
}`

export function SchemaConfiguration() {
  const [schemaJson, setSchemaJson] = useState(sampleSchemaJson)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'default',
      draft: 'secondary',
      archived: 'outline'
    } as const
    
    return <Badge variant={variants[status as keyof typeof variants]}>{status}</Badge>
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'draft':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'archived':
        return <AlertCircle className="h-4 w-4 text-gray-500" />
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Schema Configuration</h1>
          <p className="text-muted-foreground">Manage extraction schemas and templates</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Schema
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Schema</DialogTitle>
              <DialogDescription>
                Create a new extraction schema from scratch or from a template
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="schema-name">Schema Name</Label>
                  <Input id="schema-name" placeholder="Enter schema name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="schema-version">Version</Label>
                  <Input id="schema-version" placeholder="1.0.0" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="schema-client">Client</Label>
                  <Input id="schema-client" placeholder="Client name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="schema-region">Region</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select region" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="na">North America</SelectItem>
                      <SelectItem value="eu">Europe</SelectItem>
                      <SelectItem value="ap">Asia Pacific</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="schema-type">Document Type</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select document type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="invoice">Commercial Invoice</SelectItem>
                    <SelectItem value="manifest">Shipping Manifest</SelectItem>
                    <SelectItem value="customs">Customs Declaration</SelectItem>
                    <SelectItem value="packing">Packing List</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex gap-2">
                <Button onClick={() => setIsCreateDialogOpen(false)}>
                  Create from Scratch
                </Button>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Use Template
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="schemas" className="space-y-4">
        <TabsList>
          <TabsTrigger value="schemas">Schema Library</TabsTrigger>
          <TabsTrigger value="editor">JSON Editor</TabsTrigger>
          <TabsTrigger value="evaluation">Evaluation</TabsTrigger>
          <TabsTrigger value="versions">Version Control</TabsTrigger>
        </TabsList>

        <TabsContent value="schemas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Schema Library</CardTitle>
              <CardDescription>Manage your extraction schemas and templates</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Document Type</TableHead>
                    <TableHead>Region</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Accuracy</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockSchemas.map((schema) => (
                    <TableRow key={schema.id}>
                      <TableCell className="font-medium">{schema.name}</TableCell>
                      <TableCell className="font-mono text-sm">{schema.version}</TableCell>
                      <TableCell>{schema.client}</TableCell>
                      <TableCell>{schema.documentType}</TableCell>
                      <TableCell>{schema.region}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(schema.status)}
                          {getStatusBadge(schema.status)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{schema.accuracy}%</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Settings className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="editor" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                JSON Schema Editor
              </CardTitle>
              <CardDescription>Edit schema configuration with syntax highlighting and validation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button size="sm">
                  <Play className="h-4 w-4 mr-2" />
                  Validate
                </Button>
              </div>
              
              <Textarea
                value={schemaJson}
                onChange={(e) => setSchemaJson(e.target.value)}
                className="font-mono text-sm min-h-96"
                placeholder="Enter your schema JSON configuration..."
              />
              
              <div className="text-sm text-muted-foreground">
                Schema validation: <span className="text-green-600">✓ Valid JSON</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="evaluation" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Precision</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{mockEvaluationResults.precision}%</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Recall</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{mockEvaluationResults.recall}%</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">F1 Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{mockEvaluationResults.f1Score}%</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Field-Level Accuracy
              </CardTitle>
              <CardDescription>Extraction accuracy breakdown by field</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(mockEvaluationResults.fieldAccuracy).map(([field, accuracy]) => (
                  <div key={field} className="flex items-center justify-between">
                    <span className="font-medium capitalize">{field}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-red-500 h-2 rounded-full" 
                          style={{ width: `${accuracy}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-12">{accuracy}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Batch Testing</CardTitle>
              <CardDescription>Test schema against labeled datasets</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Button>
                  <Play className="h-4 w-4 mr-2" />
                  Run Evaluation
                </Button>
                <Button variant="outline">
                  Upload Test Dataset
                </Button>
                <Button variant="outline">
                  Compare Versions
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="versions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="h-5 w-5" />
                Version History
              </CardTitle>
              <CardDescription>Track schema versions and manage deployments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {['2.1.0', '2.0.3', '2.0.2', '2.0.1', '2.0.0'].map((version, index) => (
                  <div key={version} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <Badge variant={index === 0 ? 'default' : 'outline'}>
                        v{version}
                      </Badge>
                      <div>
                        <p className="font-medium">
                          {index === 0 ? 'Current Active Version' : `Version ${version}`}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {index === 0 ? 'Deployed 2 days ago' : `Released ${index + 1} weeks ago`}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {index !== 0 && (
                        <Button variant="outline" size="sm">
                          Rollback
                        </Button>
                      )}
                      <Button variant="outline" size="sm">
                        Compare
                      </Button>
                      <Button variant="outline" size="sm">
                        Download
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
