import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Upload, FileText, X, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface FileUploadItem {
  id: string
  file: File
  status: 'pending' | 'uploading' | 'success' | 'error'
  progress: number
  documentId?: string
  error?: string
}

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void
  onFileRemove: (fileId: string) => void
  files: FileUploadItem[]
  maxFiles?: number
  maxSize?: number
  acceptedTypes?: string[]
  disabled?: boolean
  className?: string
}

export function FileUpload({
  onFilesSelected,
  onFileRemove,
  files,
  maxFiles = 10,
  maxSize = 10 * 1024 * 1024, // 10MB
  acceptedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/tiff', 'application/pdf'],
  disabled = false,
  className
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    
    if (acceptedFiles.length > 0) {
      onFilesSelected(acceptedFiles)
    }
  }, [onFilesSelected])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    maxSize,
    maxFiles: maxFiles - files.length,
    disabled,
    onDragEnter: () => setDragActive(true),
    onDragLeave: () => setDragActive(false),
    onDropAccepted: () => setDragActive(false),
    onDropRejected: () => setDragActive(false)
  })

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getStatusIcon = (status: FileUploadItem['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'uploading':
        return <Clock className="h-4 w-4 text-blue-500 animate-spin" />
      default:
        return <FileText className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: FileUploadItem['status']) => {
    const variants = {
      pending: 'secondary',
      uploading: 'default',
      success: 'default',
      error: 'destructive'
    } as const
    
    const labels = {
      pending: 'Pending',
      uploading: 'Uploading',
      success: 'Uploaded',
      error: 'Failed'
    }
    
    return <Badge variant={variants[status]}>{labels[status]}</Badge>
  }

  return (
    <div className={cn('space-y-4', className)}>
      <Card>
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={cn(
              'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
              isDragActive || dragActive
                ? 'border-primary bg-primary/5'
                : 'border-gray-300 hover:border-gray-400',
              disabled && 'cursor-not-allowed opacity-50'
            )}
          >
            <input {...getInputProps()} />
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {isDragActive ? 'Drop files here' : 'Drop files here or click to browse'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Supports PDF, PNG, JPG, TIFF files up to {formatFileSize(maxSize)} each
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              Maximum {maxFiles} files • {files.length}/{maxFiles} selected
            </p>
            <Button variant="outline" disabled={disabled || files.length >= maxFiles}>
              Select Files
            </Button>
          </div>
        </CardContent>
      </Card>

      {files.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h4 className="font-medium mb-4">Selected Files ({files.length})</h4>
            <div className="space-y-3">
              {files.map((fileItem) => (
                <div
                  key={fileItem.id}
                  className="flex items-center gap-3 p-3 border rounded-lg"
                >
                  <div className="flex-shrink-0">
                    {getStatusIcon(fileItem.status)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium truncate">
                        {fileItem.file.name}
                      </p>
                      {getStatusBadge(fileItem.status)}
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{formatFileSize(fileItem.file.size)}</span>
                      {fileItem.documentId && (
                        <span className="font-mono">ID: {fileItem.documentId}</span>
                      )}
                    </div>
                    
                    {fileItem.status === 'uploading' && (
                      <div className="mt-2">
                        <Progress value={fileItem.progress} className="h-1" />
                      </div>
                    )}
                    
                    {fileItem.error && (
                      <p className="text-xs text-red-500 mt-1">{fileItem.error}</p>
                    )}
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onFileRemove(fileItem.id)}
                    disabled={fileItem.status === 'uploading'}
                    className="flex-shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
