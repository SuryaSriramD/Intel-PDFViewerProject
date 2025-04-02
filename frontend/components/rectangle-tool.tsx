"use client"

import { useState } from "react"
import { Square, PaintBucket, X, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAnnotations } from "@/contexts/annotation-context"
import { ScrollArea } from "@/components/ui/scroll-area"

interface RectangleToolProps {
  position: { x: number; y: number }
  selectedArea: { width: number; height: number }
  onApply: (color: string) => void
  onCancel: () => void
}

// Available highlight colors - expanded list to demonstrate scrolling
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

export default function RectangleTool({ position, selectedArea, onApply, onCancel }: RectangleToolProps) {
  const [colorPickerOpen, setColorPickerOpen] = useState(false)
  const { currentColor, setCurrentColor } = useAnnotations()
  
  const handleColorSelect = (color: string) => {
    setCurrentColor(color)
    onApply(color)
    setColorPickerOpen(false)
  }
  
  return (
    <div 
      className="absolute bg-white rounded-lg shadow-lg z-50 border border-gray-200"
      style={{ 
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -100%) translateY(-10px)'
      }}
    >
      <div className="p-1 flex items-center gap-1">
        <span className="text-xs font-medium px-2 text-gray-500">Area Selection</span>
        
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setColorPickerOpen(!colorPickerOpen)}
          title="Choose highlight color"
        >
          <Square size={16} style={{ color: currentColor }} />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full"
          onClick={() => onApply(currentColor)}
          title="Apply area highlight"
        >
          <Check size={16} className="text-green-600" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full"
          onClick={onCancel}
          title="Cancel"
        >
          <X size={16} className="text-red-600" />
        </Button>
      </div>
      
      {colorPickerOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white rounded shadow-lg border border-gray-200">
          <ScrollArea className="h-[160px] w-[180px] p-2">
            <div className="grid grid-cols-4 gap-2">
              {COLORS.map((color) => (
                <button
                  key={color}
                  className="w-8 h-8 rounded-full border border-gray-300 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  style={{ backgroundColor: color }}
                  onClick={() => handleColorSelect(color)}
                  title={color}
                />
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
      
      {/* Arrow pointer */}
      <div
        className="absolute w-3 h-3 bg-white transform rotate-45 border-t border-l border-gray-200"
        style={{
          bottom: '-6px',
          left: '50%',
          marginLeft: '-6px'
        }}
      />
      
      {/* Display selected area dimensions if needed */}
      {selectedArea && (
        <div className="text-xs text-gray-500 px-2 pb-1">
          {Math.round(selectedArea.width)} x {Math.round(selectedArea.height)}
        </div>
      )}
    </div>
  )
} 