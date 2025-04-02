"use client"

import { X } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

interface ColorPickerProps {
  color: string
  onChange: (color: string) => void
  onClose: () => void
}

// Expanded color palette
const COLORS = [
  "#FFEB3B", // Yellow
  "#4CAF50", // Green
  "#2196F3", // Blue
  "#F44336", // Red
  "#9C27B0", // Purple
  "#FF9800", // Orange
  "#607D8B", // Blue Grey
  "#795548", // Brown
  "#00BCD4", // Cyan
  "#009688", // Teal
  "#E91E63", // Pink
  "#3F51B5", // Indigo
  "#CDDC39", // Lime
  "#FFC107", // Amber
  "#673AB7", // Deep Purple
  "#8BC34A", // Light Green
]

export default function ColorPicker({ color, onChange, onClose }: ColorPickerProps) {
  return (
    <div className="relative bg-white rounded-lg shadow-lg p-2 border border-gray-200 w-[220px]">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-medium">Choose Color</h3>
        <button
          onClick={onClose}
          className="rounded-full h-6 w-6 flex items-center justify-center hover:bg-gray-100"
        >
          <X size={14} />
        </button>
      </div>
      
      <ScrollArea className="h-[180px]">
        <div className="grid grid-cols-4 gap-2">
          {COLORS.map((colorOption) => (
            <button
              key={colorOption}
              className="relative w-10 h-10 rounded-full border transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary"
              style={{ 
                backgroundColor: colorOption,
                borderColor: colorOption === color ? 'black' : 'rgba(0,0,0,0.1)',
                transform: colorOption === color ? 'scale(1.1)' : 'scale(1)',
                boxShadow: colorOption === color ? '0 0 0 2px white, 0 0 0 4px black' : 'none'
              }}
              onClick={() => onChange(colorOption)}
              title={colorOption}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  )
} 