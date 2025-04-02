"use client"

import { Search, Highlighter, Scissors, StickyNote, Square, MessageSquare, X, PaintBucket, List, Type } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useAnnotations, type AnnotationType } from "@/contexts/annotation-context"
import { cn } from "@/lib/utils"
import { useState } from "react"
import ColorPicker from "./color-picker"

interface ToolbarProps {
  toggleAIAssistant: () => void
  toggleHighlights: () => void
  showHighlights: boolean
  showAIAssistant: boolean
}

const COLORS = ["#FFEB3B", "#4CAF50", "#2196F3", "#F44336", "#9C27B0"]

export default function Toolbar({ toggleAIAssistant, toggleHighlights, showHighlights, showAIAssistant }: ToolbarProps) {
  const { currentTool, setCurrentTool, currentColor, setCurrentColor } = useAnnotations()
  const [showColorPicker, setShowColorPicker] = useState(false)

  const handleToolClick = (tool: AnnotationType) => {
    setCurrentTool(currentTool === tool ? "none" : tool)
  }

  return (
    <div className="w-16 bg-white border-r border-gray-200 flex flex-col items-center py-4 gap-2 relative">
      <TooltipProvider>
        {/* Tool Group Label */}
        <div className="w-full px-2 py-1">
          <p className="text-xs text-gray-500 text-center font-medium">Shapes</p>
        </div>
        
        {/* Shape/Area Tools */}
        <div className="flex flex-col gap-1 items-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn("rounded-full", (currentTool === "rectangle" || currentTool === "highlight") && "bg-primary/10 text-primary")}
                onClick={() => handleToolClick("rectangle")}
              >
                <Square size={20} />
                <span className="sr-only">Area Selection Tool</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Area Selection Tool</p>
            </TooltipContent>
          </Tooltip>
        </div>
        
        {/* Separator */}
        <div className="w-full h-px bg-gray-200 my-2"></div>
        
        {/* Text Tools */}
        <div className="w-full px-2 py-1">
          <p className="text-xs text-gray-500 text-center font-medium">Text</p>
        </div>
        
        <div className="flex flex-col gap-1 items-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn("rounded-full", currentTool === "none" && "bg-primary/10 text-primary")}
                onClick={() => setCurrentTool("none")}
              >
                <Type size={20} />
                <span className="sr-only">Text Selection Tool</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Text Selection Tool</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn("rounded-full", currentTool === "note" && "bg-primary/10 text-primary")}
                onClick={() => handleToolClick("note")}
              >
                <StickyNote size={20} />
                <span className="sr-only">Sticky Notes</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Sticky Notes</p>
            </TooltipContent>
          </Tooltip>
        </div>
        
        {/* Separator */}
        <div className="w-full h-px bg-gray-200 my-2"></div>
        
        {/* Other Tools */}
        <div className="w-full px-2 py-1">
          <p className="text-xs text-gray-500 text-center font-medium">Other</p>
        </div>
        
        <div className="flex flex-col gap-1 items-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn("rounded-full", currentTool === "clip" && "bg-primary/10 text-primary")}
                onClick={() => handleToolClick("clip")}
              >
                <Scissors size={20} />
                <span className="sr-only">Clipping Tool</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Clipping Tool</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Search size={20} />
                <span className="sr-only">Find in Document</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Find in Document</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {currentTool !== "none" && (
          <div className="mt-4 flex flex-col gap-2 relative">
            {/* Color button to open color picker */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center"
                  style={{ backgroundColor: currentColor }}
                  onClick={() => setShowColorPicker(!showColorPicker)}
                >
                  <PaintBucket size={18} className="text-white drop-shadow-md" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Select highlight color</p>
              </TooltipContent>
            </Tooltip>

            {/* Color picker popup */}
            {showColorPicker && (
              <div className="absolute left-16 top-0 z-50">
                <ColorPicker 
                  color={currentColor} 
                  onChange={setCurrentColor} 
                  onClose={() => setShowColorPicker(false)}
                />
              </div>
            )}

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full mt-2"
                  onClick={() => setCurrentTool("none")}
                >
                  <X size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Cancel</p>
              </TooltipContent>
            </Tooltip>
          </div>
        )}

        <div className="mt-auto flex flex-col gap-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "rounded-full hover:text-primary hover:bg-primary/10",
                  showHighlights && "bg-primary/10 text-primary"
                )}
                onClick={toggleHighlights}
              >
                <List size={20} />
                <span className="sr-only">Highlights Panel</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Highlights Panel</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "rounded-full hover:text-primary hover:bg-primary/10",
                  showAIAssistant && "bg-primary/10 text-primary"
                )}
                onClick={toggleAIAssistant}
              >
                <MessageSquare size={20} />
                <span className="sr-only">AI Assistant</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>AI Assistant</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    </div>
  )
}

