"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface PDFPreviewProps {
  url: string
  onClose: () => void
}

export default function PDFPreview({ url, onClose }: PDFPreviewProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-background rounded-lg w-full h-full max-w-[95vw] max-h-[95vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">PDF Preview</span>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 overflow-hidden relative min-h-0">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
              <div className="text-muted-foreground">Loading PDF...</div>
            </div>
          )}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
              <div className="text-destructive">Error: {error}</div>
            </div>
          )}
          <iframe
            src={`${url}#toolbar=1&navpanes=1&scrollbar=1`}
            className="w-full h-full border-0"
            onLoad={() => setLoading(false)}
            onError={() => {
              setError("Failed to load PDF")
              setLoading(false)
            }}
            title="PDF Preview"
          />
        </div>
      </div>
    </div>
  )
}
