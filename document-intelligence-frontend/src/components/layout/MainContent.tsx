import { cn } from '@/lib/utils'
import { Dashboard } from '@/components/modules/Dashboard'
import { Ingestion } from '@/components/modules/Ingestion'
import { ProcessedDocuments } from '@/components/modules/ProcessedDocuments'
import { SchemaConfiguration } from '@/components/modules/SchemaConfiguration'
import { Users } from '@/components/modules/Users'
import { Analytics } from '@/components/modules/Analytics'
import { Configuration } from '@/components/modules/Configuration'
import { Audit } from '@/components/modules/Audit'
import type { Module, SidebarItem } from '@/App'

interface MainContentProps {
  currentModule: Module
  currentItem: SidebarItem
  sidebarCollapsed: boolean
}

export function MainContent({ currentModule, currentItem }: MainContentProps) {
  const renderContent = () => {
    switch (currentItem) {
      case 'Dashboard':
        return <Dashboard currentModule={currentModule} />
      case 'Ingestion':
        return <Ingestion />
      case 'Processed Documents':
        return <ProcessedDocuments />
      case 'Schema Configuration':
        return <SchemaConfiguration />
      case 'Users':
        return <Users currentModule={currentModule} />
      case 'Analytics':
        return <Analytics />
      case 'Configuration':
        return <Configuration />
      case 'Audit':
        return <Audit currentModule={currentModule} />
      default:
        return <Dashboard currentModule={currentModule} />
    }
  }

  return (
    <main className={cn(
      "flex-1 overflow-auto bg-background",
      "transition-all duration-300"
    )}>
      <div className="p-6">
        {renderContent()}
      </div>
    </main>
  )
}
