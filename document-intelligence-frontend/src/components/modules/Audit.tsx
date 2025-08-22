import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Search, 
  Filter, 
  Download, 
  FileText, 
  Settings, 
  Shield, 
  User,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react'
import type { Module } from '@/App'

interface AuditProps {
  currentModule: Module
}

interface AuditEntry {
  id: string
  timestamp: string
  user: string
  module: Module
  actionType: 'ingestion' | 'schema' | 'review' | 'configuration' | 'user' | 'system'
  action: string
  details: string
  severity: 'info' | 'warning' | 'error' | 'success'
  ipAddress: string
}

const mockAuditEntries: AuditEntry[] = [
  {
    id: '1',
    timestamp: '2024-08-22 21:25:00',
    user: 'John Doe',
    module: 'HDG',
    actionType: 'ingestion',
    action: 'Document uploaded',
    details: 'Uploaded invoice_2024_001.pdf via manual upload',
    severity: 'success',
    ipAddress: '192.168.1.100'
  },
  {
    id: '2',
    timestamp: '2024-08-22 21:20:00',
    user: 'Jane Smith',
    module: 'HDG',
    actionType: 'review',
    action: 'HITL review completed',
    details: 'Confirmed dangerous goods: UN1203, triggered ETMS lock',
    severity: 'warning',
    ipAddress: '192.168.1.101'
  },
  {
    id: '3',
    timestamp: '2024-08-22 21:15:00',
    user: 'Mike Johnson',
    module: 'HDG',
    actionType: 'schema',
    action: 'Schema version updated',
    details: 'Updated HDG schema from v2.0.3 to v2.1.0',
    severity: 'info',
    ipAddress: '192.168.1.102'
  },
  {
    id: '4',
    timestamp: '2024-08-22 21:10:00',
    user: 'System',
    module: 'Customs Portal',
    actionType: 'system',
    action: 'Kafka connection failure',
    details: 'Failed to connect to kafka-broker-2:9092, retrying...',
    severity: 'error',
    ipAddress: 'N/A'
  },
  {
    id: '5',
    timestamp: '2024-08-22 21:05:00',
    user: 'John Doe',
    module: 'HDG',
    actionType: 'user',
    action: 'User created',
    details: 'Created new user account for Sarah Wilson (Viewer role)',
    severity: 'info',
    ipAddress: '192.168.1.100'
  },
  {
    id: '6',
    timestamp: '2024-08-22 21:00:00',
    user: 'Jane Smith',
    module: 'HDG',
    actionType: 'configuration',
    action: 'Alert rule modified',
    details: 'Updated high-risk detection threshold to 95%',
    severity: 'info',
    ipAddress: '192.168.1.101'
  }
]

export function Audit({ currentModule }: AuditProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [userFilter, setUserFilter] = useState('all')
  const [actionTypeFilter, setActionTypeFilter] = useState('all')
  const [severityFilter, setSeverityFilter] = useState('all')
  const [dateRange, setDateRange] = useState('7d')

  const filteredEntries = mockAuditEntries.filter(entry => {
    const matchesSearch = entry.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.user.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesUser = userFilter === 'all' || entry.user === userFilter
    const matchesActionType = actionTypeFilter === 'all' || entry.actionType === actionTypeFilter
    const matchesSeverity = severityFilter === 'all' || entry.severity === severityFilter
    const matchesModule = entry.module === currentModule
    
    return matchesSearch && matchesUser && matchesActionType && matchesSeverity && matchesModule
  })

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'info':
        return <Clock className="h-4 w-4 text-blue-500" />
      default:
        return null
    }
  }

  const getSeverityBadge = (severity: string) => {
    const variants = {
      success: 'default',
      error: 'destructive',
      warning: 'secondary',
      info: 'outline'
    } as const
    
    return <Badge variant={variants[severity as keyof typeof variants]}>{severity}</Badge>
  }

  const getActionTypeIcon = (actionType: string) => {
    switch (actionType) {
      case 'ingestion':
        return <FileText className="h-4 w-4" />
      case 'schema':
        return <Settings className="h-4 w-4" />
      case 'review':
        return <Shield className="h-4 w-4" />
      case 'configuration':
        return <Settings className="h-4 w-4" />
      case 'user':
        return <User className="h-4 w-4" />
      case 'system':
        return <Settings className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const exportLogs = (format: string) => {
    console.log(`Exporting audit logs to ${format}...`)
  }

  const uniqueUsers = [...new Set(mockAuditEntries.map(entry => entry.user))]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Audit Trail</h1>
          <p className="text-muted-foreground">Track all system activities and user actions for {currentModule}</p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => exportLogs('excel')}>
            <Download className="h-4 w-4 mr-2" />
            Export Excel
          </Button>
          <Button variant="outline" onClick={() => exportLogs('pdf')}>
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <Button variant="outline" onClick={() => exportLogs('json')}>
            <Download className="h-4 w-4 mr-2" />
            Export JSON
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Audit Filters
          </CardTitle>
          <CardDescription>Filter audit logs by various criteria</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search actions, details, or users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={userFilter} onValueChange={setUserFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by user" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                {uniqueUsers.map(user => (
                  <SelectItem key={user} value={user}>{user}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={actionTypeFilter} onValueChange={setActionTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Action type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="ingestion">Ingestion</SelectItem>
                <SelectItem value="schema">Schema</SelectItem>
                <SelectItem value="review">Review</SelectItem>
                <SelectItem value="configuration">Configuration</SelectItem>
                <SelectItem value="user">User Management</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>

            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger>
                <SelectValue placeholder="Date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1d">Last 24 hours</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Audit Log ({filteredEntries.length} entries)</CardTitle>
          <CardDescription>Detailed activity log for compliance and security monitoring</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action Type</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>IP Address</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEntries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-mono text-sm">{entry.timestamp}</TableCell>
                  <TableCell className="font-medium">{entry.user}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getActionTypeIcon(entry.actionType)}
                      <span className="capitalize">{entry.actionType}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{entry.action}</TableCell>
                  <TableCell className="max-w-xs truncate" title={entry.details}>
                    {entry.details}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getSeverityIcon(entry.severity)}
                      {getSeverityBadge(entry.severity)}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{entry.ipAddress}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockAuditEntries.length}</div>
            <p className="text-xs text-muted-foreground">
              Last 24 hours
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Errors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {mockAuditEntries.filter(e => e.severity === 'error').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Requires attention
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Warnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {mockAuditEntries.filter(e => e.severity === 'warning').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Monitor closely
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueUsers.length - 1}</div>
            <p className="text-xs text-muted-foreground">
              Excluding system
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
