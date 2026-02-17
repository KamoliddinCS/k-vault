"use client"

import { Moon, Sun, Monitor } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
} from "@/components/ui/card"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = () => setIsOpen(false)
    document.addEventListener("click", handleClickOutside)
    return () => document.removeEventListener("click", handleClickOutside)
  }, [isOpen])

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="w-9 h-9">
        <Sun className="h-4 w-4" />
      </Button>
    )
  }

  const currentTheme = theme === "system" ? "System" : theme === "dark" ? "Dark" : "Light"
  const currentIcon = theme === "light" ? Sun : theme === "dark" ? Moon : Monitor

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="w-9 h-9"
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen(!isOpen)
        }}
        title={`Theme: ${currentTheme} (click to change)`}
      >
        {currentIcon === Sun && <Sun className="h-4 w-4" />}
        {currentIcon === Moon && <Moon className="h-4 w-4" />}
        {currentIcon === Monitor && <Monitor className="h-4 w-4" />}
      </Button>
      
      {/* Dropdown menu */}
      {isOpen && (
        <div
          className="absolute right-0 top-full mt-2 z-50 animate-in fade-in-0 zoom-in-95"
          onClick={(e) => e.stopPropagation()}
        >
          <Card className="w-40 shadow-lg border">
            <CardContent className="p-1">
              <button
                onClick={() => {
                  setTheme("light")
                  setIsOpen(false)
                }}
                className={`w-full text-left px-3 py-2 text-sm rounded-md hover:bg-accent flex items-center gap-2 transition-colors ${
                  theme === "light" ? "bg-accent font-medium" : ""
                }`}
              >
                <Sun className="h-4 w-4" />
                Light
              </button>
              <button
                onClick={() => {
                  setTheme("dark")
                  setIsOpen(false)
                }}
                className={`w-full text-left px-3 py-2 text-sm rounded-md hover:bg-accent flex items-center gap-2 transition-colors ${
                  theme === "dark" ? "bg-accent font-medium" : ""
                }`}
              >
                <Moon className="h-4 w-4" />
                Dark
              </button>
              <button
                onClick={() => {
                  setTheme("system")
                  setIsOpen(false)
                }}
                className={`w-full text-left px-3 py-2 text-sm rounded-md hover:bg-accent flex items-center gap-2 transition-colors ${
                  theme === "system" ? "bg-accent font-medium" : ""
                }`}
              >
                <Monitor className="h-4 w-4" />
                System
              </button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
