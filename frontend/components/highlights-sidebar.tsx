"use client"

import { useState, useEffect } from "react"
import { Trash2, X, ChevronLeft, ChevronRight, Highlighter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAnnotations, Annotation } from "@/contexts/annotation-context"
import { useToast } from "@/components/toast-provider"

interface HighlightsSidebarProps {
  pdfId: string | null
  onClose: () => void
  onJumpToPage: (pageNumber: number) => void
  onSplit?: (isSplit: boolean) => void
  isSplit?: boolean
}

export default function HighlightsSidebar({ 
  pdfId, 
  onClose, 
  onJumpToPage, 
  onSplit,
  isSplit = false 
}: HighlightsSidebarProps) {
  const { annotations, removeAnnotation, saveAnnotations } = useAnnotations()
  const { toast } = useToast()
  const [confirmClear, setConfirmClear] = useState(false)
  
  // Group highlights by page
  const highlightsByPage = annotations.reduce((acc, annotation) => {
    // Skip invalid annotations
    if (annotation && typeof annotation.pageNumber === 'number') {
      const pageNumber = annotation.pageNumber;
      if (!acc[pageNumber]) {
        acc[pageNumber] = [];
      }
      acc[pageNumber].push(annotation);
    }
    return acc;
  }, {} as Record<number, Annotation[]>);
  
  // Format annotation content for display
  const getAnnotationContent = (annotation: Annotation) => {
    if (annotation.textContent) {
      return annotation.textContent.length > 50 
        ? annotation.textContent.substring(0, 50) + '...' 
        : annotation.textContent;
    }
    if (annotation.content) {
      return annotation.content;
    }
    return `Highlight on page ${annotation.pageNumber}`;
  }
  
  // Sort pages numerically
  const sortedPages = Object.keys(highlightsByPage)
    .map(key => {
      const num = Number(key);
      return isNaN(num) ? 0 : num; // Convert to number, handle NaN case
    })
    .filter(num => num > 0) // Ensure only valid page numbers
    .sort((a, b) => a - b);
  
  const handleDeleteHighlight = async (id: string) => {
    removeAnnotation(id)
    
    if (pdfId) {
      try {
        await saveAnnotations(pdfId)
        toast({
          title: "Highlight deleted",
          description: "The highlight has been removed",
        })
      } catch (error) {
        console.error("Error saving annotations after delete:", error)
        toast({
          title: "Error",
          description: "Failed to delete highlight",
          variant: "destructive",
        })
      }
    }
  }
  
  const handleClearAllHighlights = async () => {
    if (annotations.length === 0 || !pdfId) return;
    
    try {
      // Remove all annotations
      annotations.forEach(annotation => {
        removeAnnotation(annotation.id)
      })
      
      // Save the empty annotations list
      await saveAnnotations(pdfId)
      
      toast({
        title: "Highlights cleared",
        description: "All highlights have been removed",
      })
      
      setConfirmClear(false)
    } catch (error) {
      console.error("Error clearing highlights:", error)
      toast({
        title: "Error",
        description: "Failed to clear highlights",
        variant: "destructive",
      })
    }
  }
  
  const handleJumpToPage = (pageNumber: number) => {
    onJumpToPage(pageNumber)
  }
  
  return (
    <div className="h-full flex flex-col bg-white border-l border-gray-200 w-80">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Highlighter size={18} className="text-primary" />
          <h2 className="font-medium">Highlights</h2>
        </div>
        
        <div className="flex items-center gap-1">
          {onSplit && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onSplit(!isSplit)}
              title={isSplit ? "Full view" : "Split view with AI Assistant"}
            >
              {isSplit ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onClose}
          >
            <X size={18} />
          </Button>
        </div>
      </div>
      
      {/* Highlights List */}
      <div className="flex-1 overflow-hidden">
        {annotations.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <Highlighter size={32} className="mx-auto mb-2 text-gray-300" />
            <p>No highlights yet</p>
            <p className="text-sm mt-1">Use the highlighter tool to add highlights to the document</p>
          </div>
        ) : (
          <>
            {/* Clear All Action */}
            <div className="p-3 border-b border-gray-100 flex justify-between items-center">
              <span className="text-sm text-gray-500">{annotations.length} highlight{annotations.length !== 1 ? 's' : ''}</span>
              
              {confirmClear ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Are you sure?</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 h-7 px-2"
                    onClick={handleClearAllHighlights}
                  >
                    Yes
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2"
                    onClick={() => setConfirmClear(false)}
                  >
                    No
                  </Button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-600 h-7"
                  onClick={() => setConfirmClear(true)}
                >
                  Clear All
                </Button>
              )}
            </div>
            
            {/* Highlights by Page */}
            <ScrollArea className="h-full">
              {sortedPages.map(pageNumber => (
                <div key={pageNumber} className="mb-4">
                  <div 
                    className="px-3 py-2 bg-gray-50 font-medium text-sm border-y border-gray-100 sticky top-0 z-10"
                    onClick={() => handleJumpToPage(pageNumber)}
                  >
                    Page {pageNumber}
                  </div>
                  <div className="space-y-1 p-2">
                    {highlightsByPage[pageNumber] && highlightsByPage[pageNumber].map(annotation => (
                      <div 
                        key={annotation.id} 
                        className="flex items-start gap-2 p-2 rounded hover:bg-gray-50 group"
                      >
                        <div 
                          className="mt-1 flex-shrink-0 w-4 h-4 rounded"
                          style={{ backgroundColor: annotation.color }}
                        />
                        <div 
                          className="flex-1 text-sm cursor-pointer"
                          onClick={() => handleJumpToPage(annotation.pageNumber)}
                        >
                          {getAnnotationContent(annotation)}
                          <div className="text-xs text-gray-500 mt-1">
                            {new Date(annotation.createdAt).toLocaleString()}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleDeleteHighlight(annotation.id)}
                        >
                          <Trash2 size={14} className="text-gray-500 hover:text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </ScrollArea>
          </>
        )}
      </div>
    </div>
  )
} 