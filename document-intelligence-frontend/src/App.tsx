import { useState } from 'react'
import { ThemeProvider } from 'next-themes'
import { Toaster } from '@/components/ui/toaster'
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'
import { MainContent } from '@/components/layout/MainContent'
import './App.css'

export type UserRole = 'Admin' | 'Analyst' | 'Viewer' | 'DG-certified'
export type Module = 'HDG' | 'Customs Portal'
export type SidebarItem = 'Dashboard' | 'Ingestion' | 'Processed Documents' | 'Schema Configuration' | 'Users' | 'Analytics' | 'Configuration' | 'Audit'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  moduleAccess: Module[]
}

function App() {
  const [currentUser] = useState<User>({
    id: '1',
    name: 'John Doe',
    email: 'john.doe@expeditors.com',
    role: 'Admin',
    moduleAccess: ['HDG', 'Customs Portal']
  })
  
  const [currentModule, setCurrentModule] = useState<Module>('HDG')
  const [currentSidebarItem, setCurrentSidebarItem] = useState<SidebarItem>('Dashboard')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <div className="min-h-screen bg-background">
        <Header 
          currentUser={currentUser}
          currentModule={currentModule}
          onModuleChange={setCurrentModule}
        />
        
        <div className="flex">
          <Sidebar
            currentModule={currentModule}
            currentItem={currentSidebarItem}
            onItemChange={setCurrentSidebarItem}
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
          
          <MainContent
            currentModule={currentModule}
            currentItem={currentSidebarItem}
            sidebarCollapsed={sidebarCollapsed}
          />
        </div>
        
        <Toaster />
      </div>
    </ThemeProvider>
  )
}

export default App
