"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X, Download } from "lucide-react"

interface DownloadProgressProps {
  fileName: string
  progress: {
    loaded: number
    total: number
    percentage: number
    speed: number // bytes per second
    timeRemaining: number // seconds
  }
  onClose: () => void
}

export default function DownloadProgress({
  fileName,
  progress,
  onClose,
}: DownloadProgressProps) {
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
  }

  const formatTime = (seconds: number) => {
    if (seconds < 60) {
      return `${Math.floor(seconds)}s`
    }
    const minutes = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${minutes}m ${secs}s`
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <CardTitle className="text-lg sm:text-xl">Downloading File</CardTitle>
              <CardDescription className="text-xs sm:text-sm truncate">
                {fileName}
              </CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="flex-shrink-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="font-medium">Progress</span>
              <span className="text-muted-foreground">
                {progress.percentage.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2.5">
              <div
                className="bg-primary h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div>
              <div className="text-muted-foreground">Downloaded</div>
              <div className="font-medium">{formatBytes(progress.loaded)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Total</div>
              <div className="font-medium">{formatBytes(progress.total)}</div>
            </div>
            {progress.speed > 0 && (
              <>
                <div>
                  <div className="text-muted-foreground">Speed</div>
                  <div className="font-medium">{formatBytes(progress.speed)}/s</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Time left</div>
                  <div className="font-medium">{formatTime(progress.timeRemaining)}</div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
