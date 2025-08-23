import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { 
  Database, 
  Shield, 
  Bell, 
  Plus, 
  Edit, 
  Trash2, 
  Save,
  TestTube
} from 'lucide-react'


const mockKafkaConfig = {
  brokers: ['kafka-broker-1:9092', 'kafka-broker-2:9092'],
  topics: {
    hdg: 'hdg-documents',
    customs: 'customs-documents',
    results: 'processed-results',
    deadLetter: 'failed-documents'
  },
  auth: {
    enabled: true,
    mechanism: 'SASL_SSL',
    username: 'kafka-user'
  },
  retries: 3,
  timeout: 30000
}

const mockModelConfig = {
  hdg: {
    model: 'hdg-extractor-v2.1',
    version: '2.1.0',
    confidenceThreshold: 0.85,
    hazardThreshold: 0.90
  },
  customs: {
    model: 'customs-extractor-v1.3',
    version: '1.3.2',
    confidenceThreshold: 0.80,
    hazardThreshold: 0.85
  }
}

const mockHazardTerms = [
  { id: 1, term: 'UN[0-9]{4}', type: 'regex', client: 'Global', region: 'All' },
  { id: 2, term: 'Class [1-9]', type: 'regex', client: 'ACME Corp', region: 'North America' },
  { id: 3, term: 'dangerous', type: 'keyword', client: 'All', region: 'All' },
  { id: 4, term: 'hazardous', type: 'keyword', client: 'All', region: 'All' },
  { id: 5, term: 'flammable', type: 'keyword', client: 'Pacific Shipping', region: 'Asia Pacific' }
]

const mockAlerts = [
  { id: 1, name: 'High Risk Detection', type: 'webhook', url: 'https://api.example.com/alerts', enabled: true },
  { id: 2, name: 'System Failure', type: 'email', recipients: 'admin@expeditors.com', enabled: true },
  { id: 3, name: 'Processing Delay', type: 'webhook', url: 'https://monitoring.example.com/alerts', enabled: false }
]

export function Configuration() {
  const [kafkaConfig, setKafkaConfig] = useState(mockKafkaConfig)
  const [modelConfig, setModelConfig] = useState(mockModelConfig)
  const [piiRedactionEnabled, setPiiRedactionEnabled] = useState(true)
  const [newHazardTerm, setNewHazardTerm] = useState({ term: '', type: 'keyword', client: '', region: '' })

  const handleKafkaConfigChange = (field: string, value: string | number | string[] | Record<string, string>) => {
    setKafkaConfig(prev => ({ ...prev, [field]: value }))
  }

  const handleModelConfigChange = (module: string, field: string, value: string | number | boolean) => {
    setModelConfig(prev => ({
      ...prev,
      [module]: { ...prev[module as keyof typeof prev], [field]: value }
    }))
  }

  const testKafkaConnection = () => {
    console.log('Testing Kafka connection...')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">System Configuration</h1>
        <p className="text-muted-foreground">Manage system settings, integrations, and security policies</p>
      </div>

      <Tabs defaultValue="kafka" className="space-y-4">
        <TabsList>
          <TabsTrigger value="kafka">Kafka Settings</TabsTrigger>
          <TabsTrigger value="models">Model Settings</TabsTrigger>
          <TabsTrigger value="dictionary">Dictionary & Rules</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="kafka" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Kafka Configuration
              </CardTitle>
              <CardDescription>Configure Kafka brokers, topics, and connection settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="kafka-brokers">Broker Endpoints</Label>
                  <Textarea
                    id="kafka-brokers"
                    value={kafkaConfig.brokers.join('\n')}
                    onChange={(e) => handleKafkaConfigChange('brokers', e.target.value.split('\n'))}
                    placeholder="kafka-broker-1:9092"
                    className="font-mono text-sm"
                  />
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="hdg-topic">HDG Topic</Label>
                    <Input
                      id="hdg-topic"
                      value={kafkaConfig.topics.hdg}
                      onChange={(e) => handleKafkaConfigChange('topics', { ...kafkaConfig.topics, hdg: e.target.value })}
                      className="font-mono"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="customs-topic">Customs Topic</Label>
                    <Input
                      id="customs-topic"
                      value={kafkaConfig.topics.customs}
                      onChange={(e) => handleKafkaConfigChange('topics', { ...kafkaConfig.topics, customs: e.target.value })}
                      className="font-mono"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="results-topic">Results Topic</Label>
                    <Input
                      id="results-topic"
                      value={kafkaConfig.topics.results}
                      onChange={(e) => handleKafkaConfigChange('topics', { ...kafkaConfig.topics, results: e.target.value })}
                      className="font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="auth-mechanism">Auth Mechanism</Label>
                  <Select value={kafkaConfig.auth.mechanism}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SASL_SSL">SASL_SSL</SelectItem>
                      <SelectItem value="SASL_PLAINTEXT">SASL_PLAINTEXT</SelectItem>
                      <SelectItem value="SSL">SSL</SelectItem>
                      <SelectItem value="PLAINTEXT">PLAINTEXT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="retries">Retry Count</Label>
                  <Input
                    id="retries"
                    type="number"
                    value={kafkaConfig.retries}
                    onChange={(e) => handleKafkaConfigChange('retries', parseInt(e.target.value))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="timeout">Timeout (ms)</Label>
                  <Input
                    id="timeout"
                    type="number"
                    value={kafkaConfig.timeout}
                    onChange={(e) => handleKafkaConfigChange('timeout', parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <Button onClick={testKafkaConnection}>
                  <TestTube className="h-4 w-4 mr-2" />
                  Test Connection
                </Button>
                <Button variant="outline">
                  <Save className="h-4 w-4 mr-2" />
                  Save Configuration
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="models" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>HDG Model Configuration</CardTitle>
                <CardDescription>Hidden Dangerous Goods extraction model settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="hdg-model">Model Version</Label>
                  <Select value={modelConfig.hdg.model}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hdg-extractor-v2.1">HDG Extractor v2.1 (Latest)</SelectItem>
                      <SelectItem value="hdg-extractor-v2.0">HDG Extractor v2.0</SelectItem>
                      <SelectItem value="hdg-extractor-v1.9">HDG Extractor v1.9</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="hdg-confidence">Confidence Threshold</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="hdg-confidence"
                      type="number"
                      min="0"
                      max="1"
                      step="0.01"
                      value={modelConfig.hdg.confidenceThreshold}
                      onChange={(e) => handleModelConfigChange('hdg', 'confidenceThreshold', parseFloat(e.target.value))}
                    />
                    <span className="text-sm text-muted-foreground">
                      {(modelConfig.hdg.confidenceThreshold * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="hdg-hazard">Hazard Detection Threshold</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="hdg-hazard"
                      type="number"
                      min="0"
                      max="1"
                      step="0.01"
                      value={modelConfig.hdg.hazardThreshold}
                      onChange={(e) => handleModelConfigChange('hdg', 'hazardThreshold', parseFloat(e.target.value))}
                    />
                    <span className="text-sm text-muted-foreground">
                      {(modelConfig.hdg.hazardThreshold * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Customs Portal Model Configuration</CardTitle>
                <CardDescription>Customs document extraction model settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="customs-model">Model Version</Label>
                  <Select value={modelConfig.customs.model}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="customs-extractor-v1.3">Customs Extractor v1.3 (Latest)</SelectItem>
                      <SelectItem value="customs-extractor-v1.2">Customs Extractor v1.2</SelectItem>
                      <SelectItem value="customs-extractor-v1.1">Customs Extractor v1.1</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="customs-confidence">Confidence Threshold</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="customs-confidence"
                      type="number"
                      min="0"
                      max="1"
                      step="0.01"
                      value={modelConfig.customs.confidenceThreshold}
                      onChange={(e) => handleModelConfigChange('customs', 'confidenceThreshold', parseFloat(e.target.value))}
                    />
                    <span className="text-sm text-muted-foreground">
                      {(modelConfig.customs.confidenceThreshold * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="customs-hazard">Hazard Detection Threshold</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="customs-hazard"
                      type="number"
                      min="0"
                      max="1"
                      step="0.01"
                      value={modelConfig.customs.hazardThreshold}
                      onChange={(e) => handleModelConfigChange('customs', 'hazardThreshold', parseFloat(e.target.value))}
                    />
                    <span className="text-sm text-muted-foreground">
                      {(modelConfig.customs.hazardThreshold * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="dictionary" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Hazardous Terms Dictionary</CardTitle>
              <CardDescription>Manage keywords and regex patterns for hazard detection</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg">
                <Input
                  placeholder="Term or pattern"
                  value={newHazardTerm.term}
                  onChange={(e) => setNewHazardTerm(prev => ({ ...prev, term: e.target.value }))}
                />
                <Select value={newHazardTerm.type} onValueChange={(value) => setNewHazardTerm(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="keyword">Keyword</SelectItem>
                    <SelectItem value="regex">Regex Pattern</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Client (optional)"
                  value={newHazardTerm.client}
                  onChange={(e) => setNewHazardTerm(prev => ({ ...prev, client: e.target.value }))}
                />
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Term
                </Button>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Term/Pattern</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Region</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockHazardTerms.map((term) => (
                    <TableRow key={term.id}>
                      <TableCell className="font-mono">{term.term}</TableCell>
                      <TableCell>
                        <Badge variant={term.type === 'regex' ? 'default' : 'secondary'}>
                          {term.type}
                        </Badge>
                      </TableCell>
                      <TableCell>{term.client}</TableCell>
                      <TableCell>{term.region}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4" />
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

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security & Privacy Settings
              </CardTitle>
              <CardDescription>Configure data protection and access policies</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="pii-redaction">PII Redaction</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically redact personally identifiable information from documents
                  </p>
                </div>
                <Switch
                  id="pii-redaction"
                  checked={piiRedactionEnabled}
                  onCheckedChange={setPiiRedactionEnabled}
                />
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Role-Based Access Policies</h4>
                <div className="space-y-3">
                  {[
                    { role: 'Admin', permissions: 'Full system access, user management, configuration' },
                    { role: 'DG-certified', permissions: 'HITL review, hazard confirmation, document processing' },
                    { role: 'Analyst', permissions: 'Document processing, analytics, schema configuration' },
                    { role: 'Viewer', permissions: 'Read-only access to processed documents and analytics' }
                  ].map((policy, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <div className="font-medium">{policy.role}</div>
                        <div className="text-sm text-muted-foreground">{policy.permissions}</div>
                      </div>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Data Retention</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="document-retention">Document Retention (days)</Label>
                    <Input id="document-retention" type="number" defaultValue="365" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="audit-retention">Audit Log Retention (days)</Label>
                    <Input id="audit-retention" type="number" defaultValue="2555" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Alert Configuration
              </CardTitle>
              <CardDescription>Configure notifications for system events and high-risk detections</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">Alert Rules</h4>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Alert
                </Button>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Alert Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockAlerts.map((alert) => (
                    <TableRow key={alert.id}>
                      <TableCell className="font-medium">{alert.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{alert.type}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {'url' in alert ? alert.url : alert.recipients}
                      </TableCell>
                      <TableCell>
                        <Badge variant={alert.enabled ? 'default' : 'secondary'}>
                          {alert.enabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <TestTube className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="space-y-4">
                <h4 className="font-medium">Alert Conditions</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="error-threshold">Error Rate Threshold (%)</Label>
                    <Input id="error-threshold" type="number" defaultValue="5" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="processing-delay">Processing Delay Threshold (minutes)</Label>
                    <Input id="processing-delay" type="number" defaultValue="10" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
