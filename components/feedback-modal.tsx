"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X, Send, Github } from "lucide-react"
import { useToast, ToastContainer } from "@/components/ui/toast"

interface FeedbackModalProps {
  onClose: () => void
}

export default function FeedbackModal({ onClose }: FeedbackModalProps) {
  const toast = useToast()
  const [type, setType] = useState<"suggestion" | "bug" | "contribution">("suggestion")
  const [message, setMessage] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) {
      toast.error("Please enter your message")
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type,
          message: message.trim(),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit feedback")
      }

      toast.success("Thank you for your feedback! We'll review it soon.")
      setMessage("")
      setTimeout(() => {
        onClose()
      }, 1500)
    } catch (error: any) {
      toast.error(error.message || "Failed to submit feedback")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <CardTitle className="text-lg sm:text-xl">Share Your Feedback</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Suggestions, bug reports, or contributions welcome
                </CardDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="flex-shrink-0">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="type" className="text-sm">Type</Label>
                <select
                  id="type"
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full px-3 py-2 text-sm border rounded-md bg-background"
                >
                  <option value="suggestion">💡 Suggestion</option>
                  <option value="bug">🐛 Bug Report</option>
                  <option value="contribution">🤝 Contribution</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message" className="text-sm">Message</Label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Share your thoughts, report issues, or propose contributions..."
                  rows={6}
                  className="w-full px-3 py-2 text-sm border rounded-md bg-background resize-none"
                  required
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <Button type="button" variant="outline" onClick={onClose} className="flex-1" disabled={submitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting || !message.trim()} className="flex-1">
                  <Send className="h-4 w-4 mr-2" />
                  {submitting ? "Sending..." : "Send Feedback"}
                </Button>
              </div>

              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground mb-2">Other ways to contribute:</p>
                <div className="flex flex-col gap-2">
                  <a
                    href="https://github.com/KamoliddinCS/k-vault"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs text-primary hover:underline"
                  >
                    <Github className="h-3 w-3" />
                    Open an issue or pull request on GitHub
                  </a>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </>
  )
}
