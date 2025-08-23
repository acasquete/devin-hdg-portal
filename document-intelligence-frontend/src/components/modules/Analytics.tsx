import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  TrendingUp, 
  FileText, 
  AlertTriangle, 
  Users, 
  Clock,
  Download
} from 'lucide-react'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  AreaChart,
  Area
} from 'recharts'

const mockFileAnalytics = [
  { month: 'Jan', processed: 1200, withHazards: 89, avgPages: 3.2 },
  { month: 'Feb', processed: 1450, withHazards: 102, avgPages: 3.1 },
  { month: 'Mar', processed: 1680, withHazards: 125, avgPages: 3.4 },
  { month: 'Apr', processed: 1920, withHazards: 143, avgPages: 3.3 },
  { month: 'May', processed: 1750, withHazards: 131, avgPages: 3.2 },
  { month: 'Jun', processed: 2100, withHazards: 156, avgPages: 3.5 }
]

const mockHazardTrends = [
  { date: '2024-08-15', class1: 12, class3: 25, class8: 18, class9: 15 },
  { date: '2024-08-16', class1: 15, class3: 28, class8: 20, class9: 17 },
  { date: '2024-08-17', class1: 10, class3: 22, class8: 16, class9: 12 },
  { date: '2024-08-18', class1: 18, class3: 32, class8: 24, class9: 19 },
  { date: '2024-08-19', class1: 14, class3: 26, class8: 19, class9: 16 },
  { date: '2024-08-20', class1: 16, class3: 30, class8: 22, class9: 18 },
  { date: '2024-08-21', class1: 13, class3: 24, class8: 17, class9: 14 }
]

const mockTopHazards = [
  { rank: 1, unNumber: 'UN1203', name: 'Gasoline', count: 156, trend: '+12%' },
  { rank: 2, unNumber: 'UN1993', name: 'Flammable liquid, n.o.s.', count: 134, trend: '+8%' },
  { rank: 3, unNumber: 'UN2794', name: 'Batteries, wet, filled with acid', count: 98, trend: '-3%' },
  { rank: 4, unNumber: 'UN1170', name: 'Ethanol', count: 87, trend: '+15%' },
  { rank: 5, unNumber: 'UN1263', name: 'Paint', count: 76, trend: '+5%' },
  { rank: 6, unNumber: 'UN1950', name: 'Aerosols', count: 65, trend: '-8%' },
  { rank: 7, unNumber: 'UN3082', name: 'Environmentally hazardous substance', count: 54, trend: '+22%' },
  { rank: 8, unNumber: 'UN1266', name: 'Perfumery products', count: 43, trend: '+3%' },
  { rank: 9, unNumber: 'UN1133', name: 'Adhesives', count: 38, trend: '-12%' },
  { rank: 10, unNumber: 'UN1760', name: 'Corrosive liquid, n.o.s.', count: 32, trend: '+7%' }
]

const mockUserAnalytics = [
  { user: 'John Doe', role: 'Admin', filesProcessed: 245, lastActive: '2024-08-22' },
  { user: 'Jane Smith', role: 'DG-certified', filesProcessed: 189, lastActive: '2024-08-22' },
  { user: 'Mike Johnson', role: 'Analyst', filesProcessed: 167, lastActive: '2024-08-22' },
  { user: 'Sarah Wilson', role: 'Viewer', filesProcessed: 98, lastActive: '2024-08-21' },
  { user: 'David Brown', role: 'Analyst', filesProcessed: 134, lastActive: '2024-08-20' }
]

const mockOperationalKPIs = [
  { metric: 'Avg Processing Time', value: '2.4s', change: '-8%', trend: 'down' },
  { metric: 'Throughput (docs/hour)', value: '1,247', change: '+12%', trend: 'up' },
  { metric: 'Error Rate', value: '0.3%', change: '-15%', trend: 'down' },
  { metric: 'Kafka Consumer Lag', value: '12ms', change: '+5%', trend: 'up' }
]

const confidenceDistribution = [
  { range: '90-100%', count: 1456, color: '#22c55e' },
  { range: '80-89%', count: 892, color: '#eab308' },
  { range: '70-79%', count: 234, color: '#f97316' },
  { range: '60-69%', count: 67, color: '#ef4444' }
]

export function Analytics() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Comprehensive insights and performance metrics</p>
        </div>
        
        <div className="flex gap-2">
          <Select defaultValue="30d">
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {mockOperationalKPIs.map((kpi, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{kpi.metric}</CardTitle>
              <TrendingUp className={`h-4 w-4 ${kpi.trend === 'up' ? 'text-green-500' : 'text-red-500'}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
              <p className="text-xs text-muted-foreground">
                <span className={kpi.trend === 'up' ? 'text-green-600' : 'text-red-600'}>
                  {kpi.change}
                </span> from last period
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="files" className="space-y-4">
        <TabsList>
          <TabsTrigger value="files">File Analytics</TabsTrigger>
          <TabsTrigger value="hazards">Hazard Analytics</TabsTrigger>
          <TabsTrigger value="users">User Analytics</TabsTrigger>
          <TabsTrigger value="operational">Operational KPIs</TabsTrigger>
        </TabsList>

        <TabsContent value="files" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Document Processing Volume
                </CardTitle>
                <CardDescription>Monthly processing trends and hazard detection</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={mockFileAnalytics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="processed" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} />
                    <Area type="monotone" dataKey="withHazards" stackId="2" stroke="#dc2626" fill="#dc2626" fillOpacity={0.8} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Confidence Score Distribution</CardTitle>
                <CardDescription>Extraction confidence levels across all documents</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={confidenceDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                      label={({ range, percent }) => `${range}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {confidenceDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Average Pages per Document</CardTitle>
              <CardDescription>Document complexity trends over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={mockFileAnalytics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="avgPages" stroke="#ef4444" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hazards" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Hazard Detection Trends
              </CardTitle>
              <CardDescription>Daily hazard detection by classification</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={mockHazardTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="class1" stackId="1" stroke="#ef4444" fill="#ef4444" />
                  <Area type="monotone" dataKey="class3" stackId="1" stroke="#f97316" fill="#f97316" />
                  <Area type="monotone" dataKey="class8" stackId="1" stroke="#eab308" fill="#eab308" />
                  <Area type="monotone" dataKey="class9" stackId="1" stroke="#22c55e" fill="#22c55e" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top 10 Hazardous Materials</CardTitle>
              <CardDescription>Most frequently detected dangerous goods</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rank</TableHead>
                    <TableHead>UN Number</TableHead>
                    <TableHead>Material Name</TableHead>
                    <TableHead>Count</TableHead>
                    <TableHead>Trend</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockTopHazards.map((hazard) => (
                    <TableRow key={hazard.rank}>
                      <TableCell className="font-medium">#{hazard.rank}</TableCell>
                      <TableCell className="font-mono">{hazard.unNumber}</TableCell>
                      <TableCell>{hazard.name}</TableCell>
                      <TableCell className="font-medium">{hazard.count}</TableCell>
                      <TableCell>
                        <Badge variant={hazard.trend.startsWith('+') ? 'default' : 'destructive'}>
                          {hazard.trend}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Activity Overview
              </CardTitle>
              <CardDescription>Document processing activity by user and role</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Files Processed</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead>Activity Level</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockUserAnalytics.map((user, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{user.user}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{user.role}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">{user.filesProcessed}</TableCell>
                      <TableCell className="font-mono text-sm">{user.lastActive}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-red-500 h-2 rounded-full" 
                              style={{ width: `${Math.min(100, (user.filesProcessed / 250) * 100)}%` }}
                            />
                          </div>
                          <span className="text-sm">
                            {user.filesProcessed > 200 ? 'High' : user.filesProcessed > 100 ? 'Medium' : 'Low'}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Daily Active Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">24</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">+8%</span> from yesterday
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Avg Session Duration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2h 34m</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">+12%</span> from last week
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">User Adoption Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">87%</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">+5%</span> this month
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="operational" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Processing Performance
                </CardTitle>
                <CardDescription>System throughput and latency metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={mockFileAnalytics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="processed" stroke="#ef4444" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Health Metrics</CardTitle>
                <CardDescription>Real-time operational indicators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {mockOperationalKPIs.map((kpi, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <div className="font-medium">{kpi.metric}</div>
                      <div className="text-sm text-muted-foreground">
                        <span className={kpi.trend === 'up' ? 'text-green-600' : 'text-red-600'}>
                          {kpi.change}
                        </span> from last period
                      </div>
                    </div>
                    <div className="text-2xl font-bold">{kpi.value}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Export Options</CardTitle>
              <CardDescription>Download analytics data in various formats</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export to CSV
                </Button>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export to PDF
                </Button>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export to JSON
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
