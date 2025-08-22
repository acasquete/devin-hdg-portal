import { useState } from 'react'
import { Moon, Sun, User as UserIcon, ChevronDown, Settings, LogOut } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import type { User, Module } from '@/App'

interface HeaderProps {
  currentUser: User
  currentModule: Module
  onModuleChange: (module: Module) => void
}

export function Header({ currentUser, currentModule, onModuleChange }: HeaderProps) {
  const { theme, setTheme } = useTheme()

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  return (
    <header className="h-14 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="flex h-full items-center justify-between px-6">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-red-500 rounded-sm flex items-center justify-center">
              <span className="text-white font-bold text-sm">DI</span>
            </div>
            <h1 className="text-lg font-semibold text-foreground">Document Intelligence Service</h1>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">Module:</span>
            <Select value={currentModule} onValueChange={onModuleChange}>
              <SelectTrigger className="w-48 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {currentUser.moduleAccess.map((module) => (
                  <SelectItem key={module} value={module}>
                    {module === 'HDG' ? 'Hidden Dangerous Goods' : module}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="w-8 h-8 p-0"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-2 h-8 px-2">
                <Avatar className="w-6 h-6">
                  <AvatarFallback className="text-xs bg-red-100 text-red-700">
                    {getInitials(currentUser.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{currentUser.name}</span>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{currentUser.name}</p>
                <p className="text-xs text-muted-foreground">{currentUser.email}</p>
                <p className="text-xs text-muted-foreground">Role: {currentUser.role}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <UserIcon className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
