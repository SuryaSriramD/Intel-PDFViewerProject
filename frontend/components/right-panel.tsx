"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/components/toast-provider"
import HighlightsSidebar from "@/components/highlights-sidebar"
import AIAssistant from "@/components/ai-assistant"

interface RightPanelProps {
  pdfId: string | null
  pdfName: string | null
  showHighlights: boolean
  showAIAssistant: boolean
  onCloseHighlights: () => void
  onCloseAIAssistant: () => void
  onJumpToPage: (pageNumber: number) => void
}

export default function RightPanel({
  pdfId,
  pdfName,
  showHighlights,
  showAIAssistant,
  onCloseHighlights,
  onCloseAIAssistant,
  onJumpToPage
}: RightPanelProps) {
  const [isSplit, setIsSplit] = useState(false)
  const { toast } = useToast()
  
  // Set split mode when both panels are to be shown
  useEffect(() => {
    if (showHighlights && showAIAssistant) {
      setIsSplit(true)
    } else {
      setIsSplit(false)
    }
  }, [showHighlights, showAIAssistant])
  
  // Handle split toggling
  const handleSplitToggle = (split: boolean) => {
    setIsSplit(split)
    
    if (!split) {
      // If un-splitting, we need to close one of the panels
      if (showHighlights && showAIAssistant) {
        // Default to keeping highlights open
        onCloseAIAssistant()
      }
    }
  }
  
  return (
    <div className="h-full flex flex-col pt-24 fixed right-0 top-0 bottom-0 z-20">
      {showHighlights && showAIAssistant && isSplit ? (
        // Split view with both highlights and AI assistant
        <div className="h-full flex flex-col">
          <div className="flex-1 h-1/2 overflow-hidden border-b border-gray-200">
            <HighlightsSidebar 
              pdfId={pdfId}
              onClose={onCloseHighlights}
              onJumpToPage={onJumpToPage}
              onSplit={handleSplitToggle}
              isSplit={true}
            />
          </div>
          <div className="flex-1 h-1/2 overflow-hidden">
            <AIAssistant 
              pdfId={pdfId} 
              pdfName={pdfName} 
              onClose={onCloseAIAssistant}
            />
          </div>
        </div>
      ) : (
        // Single panel view
        <>
          {showHighlights && (
            <HighlightsSidebar 
              pdfId={pdfId}
              onClose={onCloseHighlights}
              onJumpToPage={onJumpToPage}
              onSplit={showAIAssistant ? undefined : handleSplitToggle}
              isSplit={false}
            />
          )}
          
          {showAIAssistant && (
            <AIAssistant 
              pdfId={pdfId} 
              pdfName={pdfName} 
              onClose={onCloseAIAssistant}
            />
          )}
        </>
      )}
    </div>
  )
} 