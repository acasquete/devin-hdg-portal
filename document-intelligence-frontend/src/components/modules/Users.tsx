import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Plus, Search, Edit, Trash2, Shield } from 'lucide-react'
import type { Module, UserRole } from '@/App'

interface UsersProps {
  currentModule: Module
}

interface UserData {
  id: string
  name: string
  email: string
  role: UserRole
  moduleAccess: Module[]
  lastActive: string
  status: 'active' | 'inactive'
  createdAt: string
}

const mockUsers: UserData[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john.doe@expeditors.com',
    role: 'Admin',
    moduleAccess: ['HDG', 'Customs Portal'],
    lastActive: '2024-08-22 21:25:00',
    status: 'active',
    createdAt: '2024-01-15'
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane.smith@expeditors.com',
    role: 'DG-certified',
    moduleAccess: ['HDG'],
    lastActive: '2024-08-22 20:45:00',
    status: 'active',
    createdAt: '2024-02-20'
  },
  {
    id: '3',
    name: 'Mike Johnson',
    email: 'mike.johnson@expeditors.com',
    role: 'Analyst',
    moduleAccess: ['HDG', 'Customs Portal'],
    lastActive: '2024-08-22 19:30:00',
    status: 'active',
    createdAt: '2024-03-10'
  },
  {
    id: '4',
    name: 'Sarah Wilson',
    email: 'sarah.wilson@expeditors.com',
    role: 'Viewer',
    moduleAccess: ['Customs Portal'],
    lastActive: '2024-08-21 16:20:00',
    status: 'active',
    createdAt: '2024-04-05'
  },
  {
    id: '5',
    name: 'David Brown',
    email: 'david.brown@expeditors.com',
    role: 'Analyst',
    moduleAccess: ['HDG'],
    lastActive: '2024-08-20 14:15:00',
    status: 'inactive',
    createdAt: '2024-05-12'
  }
]

const roleDescriptions = {
  'Admin': 'Full system access and user management',
  'Analyst': 'Document processing and analysis',
  'Viewer': 'Read-only access to processed documents',
  'DG-certified': 'Certified for dangerous goods review and HITL'
}

const roleColors = {
  'Admin': 'destructive',
  'DG-certified': 'default',
  'Analyst': 'secondary',
  'Viewer': 'outline'
} as const

export function Users({ currentModule }: UsersProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'Viewer' as UserRole,
    moduleAccess: [] as Module[]
  })

  const filteredUsers = mockUsers.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    const hasModuleAccess = user.moduleAccess.includes(currentModule)
    
    return matchesSearch && matchesRole && hasModuleAccess
  })

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  const getStatusBadge = (status: string) => {
    return (
      <Badge variant={status === 'active' ? 'default' : 'secondary'}>
        {status}
      </Badge>
    )
  }

  const handleModuleAccessChange = (module: Module, checked: boolean) => {
    setNewUser(prev => ({
      ...prev,
      moduleAccess: checked 
        ? [...prev.moduleAccess, module]
        : prev.moduleAccess.filter(m => m !== module)
    }))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">User Management</h1>
          <p className="text-muted-foreground">Manage user access and permissions for {currentModule}</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
              <DialogDescription>
                Create a new user account with appropriate permissions
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="user-name">Full Name</Label>
                <Input 
                  id="user-name"
                  value={newUser.name}
                  onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter full name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="user-email">Email Address</Label>
                <Input 
                  id="user-email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="user@expeditors.com"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="user-role">Role</Label>
                <Select value={newUser.role} onValueChange={(value: UserRole) => setNewUser(prev => ({ ...prev, role: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(roleDescriptions).map(([role, description]) => (
                      <SelectItem key={role} value={role}>
                        <div>
                          <div className="font-medium">{role}</div>
                          <div className="text-sm text-muted-foreground">{description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Module Access</Label>
                <div className="space-y-2">
                  {(['HDG', 'Customs Portal'] as Module[]).map((module) => (
                    <div key={module} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`module-${module}`}
                        checked={newUser.moduleAccess.includes(module)}
                        onCheckedChange={(checked) => handleModuleAccessChange(module, checked as boolean)}
                      />
                      <Label htmlFor={`module-${module}`}>
                        {module === 'HDG' ? 'Hidden Dangerous Goods' : module}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button onClick={() => setIsCreateDialogOpen(false)}>
                  Create User
                </Button>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Filters</CardTitle>
          <CardDescription>Filter users by name, email, or role</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="Admin">Admin</SelectItem>
                <SelectItem value="DG-certified">DG-certified</SelectItem>
                <SelectItem value="Analyst">Analyst</SelectItem>
                <SelectItem value="Viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Users ({filteredUsers.length})</CardTitle>
          <CardDescription>Manage user accounts and permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Module Access</TableHead>
                <TableHead>Last Active</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="text-xs bg-red-100 text-red-700">
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={roleColors[user.role]}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {user.moduleAccess.map(module => (
                        <Badge key={module} variant="outline" className="text-xs">
                          {module === 'HDG' ? 'HDG' : 'Customs'}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{user.lastActive}</TableCell>
                  <TableCell>{getStatusBadge(user.status)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Shield className="h-4 w-4" />
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockUsers.length}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+2</span> this month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockUsers.filter(u => u.status === 'active').length}</div>
            <p className="text-xs text-muted-foreground">
              Last 24 hours
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">DG-Certified</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockUsers.filter(u => u.role === 'DG-certified').length}</div>
            <p className="text-xs text-muted-foreground">
              Certified reviewers
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockUsers.filter(u => u.role === 'Admin').length}</div>
            <p className="text-xs text-muted-foreground">
              System administrators
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
