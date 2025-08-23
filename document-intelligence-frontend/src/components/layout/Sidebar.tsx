import { 
  LayoutDashboard, 
  Upload, 
  FileText, 
  Settings2, 
  Users, 
  BarChart3, 
  Cog, 
  Shield,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Module, SidebarItem } from '@/App'

interface SidebarProps {
  currentModule: Module
  currentItem: SidebarItem
  onItemChange: (item: SidebarItem) => void
  collapsed: boolean
  onToggleCollapse: () => void
}

const sidebarItems: { key: SidebarItem; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'Dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'Ingestion', label: 'Ingestion', icon: Upload },
  { key: 'Processed Documents', label: 'Processed Documents', icon: FileText },
  { key: 'Schema Configuration', label: 'Schema Configuration', icon: Settings2 },
  { key: 'Users', label: 'Users', icon: Users },
  { key: 'Analytics', label: 'Analytics', icon: BarChart3 },
  { key: 'Configuration', label: 'Configuration', icon: Cog },
  { key: 'Audit', label: 'Audit', icon: Shield },
]

export function Sidebar({ currentModule, currentItem, onItemChange, collapsed, onToggleCollapse }: SidebarProps) {
  return (
    <div className={cn(
      "border-r border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border">
          {!collapsed && (
            <h2 className="text-sm font-semibold text-foreground">
              {currentModule === 'HDG' ? 'Hidden Dangerous Goods' : currentModule}
            </h2>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCollapse}
            className="w-8 h-8 p-0"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        <nav className="flex-1 p-2 space-y-1">
          {sidebarItems.map((item) => {
            const Icon = item.icon
            const isActive = currentItem === item.key
            
            return (
              <Button
                key={item.key}
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start h-9 px-3",
                  collapsed && "px-2",
                  isActive && "bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-950 dark:text-red-300 dark:hover:bg-red-900"
                )}
                onClick={() => onItemChange(item.key)}
              >
                <Icon className={cn("h-4 w-4", !collapsed && "mr-3")} />
                {!collapsed && <span className="text-sm">{item.label}</span>}
              </Button>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
