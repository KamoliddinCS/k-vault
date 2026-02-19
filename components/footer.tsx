"use client"

import { Github, MessageSquare, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"

interface FooterProps {
  onFeedbackClick: () => void
}

export default function Footer({ onFeedbackClick }: FooterProps) {
  const version = process.env.NEXT_PUBLIC_APP_VERSION || "0.1.0"

  return (
    <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 mt-auto">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-4 text-xs sm:text-sm text-muted-foreground">
            <span>K-Vault v{version}</span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline">KAIST Resource Platform</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onFeedbackClick}
              className="text-xs sm:text-sm h-8 sm:h-9"
            >
              <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              <span className="hidden sm:inline">Feedback</span>
              <span className="sm:hidden">Feedback</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="text-xs sm:text-sm h-8 sm:h-9"
            >
              <a
                href="https://github.com/KamoliddinCS/k-vault"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 sm:gap-2"
              >
                <Github className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">GitHub</span>
                <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 opacity-50" />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </footer>
  )
}
