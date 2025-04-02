"use client"

import type React from "react"

import { useState } from "react"
import { Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface SearchPanelProps {
  onSearch: (query: string) => void
  onClose: () => void
}

export default function SearchPanel({ onSearch, onClose }: SearchPanelProps) {
  const [query, setQuery] = useState("")

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      onSearch(query)
    }
  }

  return (
    <div className="absolute top-0 left-0 right-0 bg-white z-10 p-3 border-b border-gray-200 shadow-sm">
      <form onSubmit={handleSearch} className="flex items-center gap-2">
        <Search size={18} className="text-gray-500" />
        <Input
          type="text"
          placeholder="Search in document..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1"
          autoFocus
        />
        <Button type="submit" variant="default" size="sm">
          Search
        </Button>
        <Button type="button" variant="ghost" size="icon" onClick={onClose}>
          <X size={18} />
        </Button>
      </form>
    </div>
  )
}

