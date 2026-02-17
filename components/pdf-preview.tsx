"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface PDFPreviewProps {
  url: string
  onClose: () => void
}

export default function PDFPreview({ url, onClose }: PDFPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [pageNum, setPageNum] = useState(1)
  const [numPages, setNumPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pdfjsLib, setPdfjsLib] = useState<any>(null)

  useEffect(() => {
    // Dynamically import PDF.js
    import("pdfjs-dist").then((pdfjs) => {
      pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`
      setPdfjsLib(pdfjs)
    })
  }, [])

  useEffect(() => {
    if (!pdfjsLib) return

    let pdfDoc: any = null

    const renderPage = async (doc: any, page: number) => {
      try {
        const pageObj = await doc.getPage(page)
        const viewport = pageObj.getViewport({ scale: 1.5 })

        const canvas = canvasRef.current
        if (!canvas) return

        const context = canvas.getContext("2d")
        if (!context) return

        canvas.height = viewport.height
        canvas.width = viewport.width

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        }

        await pageObj.render(renderContext).promise
      } catch (err) {
        console.error("Error rendering page:", err)
      }
    }

    const loadPDF = async () => {
      try {
        setLoading(true)
        setError(null)

        const loadingTask = pdfjsLib.getDocument(url)
        pdfDoc = await loadingTask.promise
        setNumPages(pdfDoc.numPages)

        await renderPage(pdfDoc, pageNum)
        setLoading(false)
      } catch (err: any) {
        console.error("Error loading PDF:", err)
        setError("Failed to load PDF preview")
        setLoading(false)
      }
    }

    loadPDF()

    return () => {
      // Cleanup if needed
    }
  }, [url, pageNum, pdfjsLib])

  const goToPrevPage = () => {
    if (pageNum > 1) {
      setPageNum(pageNum - 1)
    }
  }

  const goToNextPage = () => {
    if (pageNum < numPages) {
      setPageNum(pageNum + 1)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPrevPage}
              disabled={pageNum <= 1}
            >
              Previous
            </Button>
            <span className="text-sm">
              Page {pageNum} of {numPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextPage}
              disabled={pageNum >= numPages}
            >
              Next
            </Button>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center">
          {loading && <div className="text-muted-foreground">Loading PDF...</div>}
          {error && (
            <div className="text-destructive">Error: {error}</div>
          )}
          {!loading && !error && (
            <canvas ref={canvasRef} className="max-w-full h-auto" />
          )}
        </div>
      </div>
    </div>
  )
}
