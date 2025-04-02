"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, AlertTriangle, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/toast-provider"
import { useAnnotations } from "@/contexts/annotation-context"
import AnnotationLayer from "@/components/annotation-layer"
import TextHighlighter from "@/components/text-highlighter"
import Script from 'next/script'
import RectangleTool from "@/components/rectangle-tool"

interface PDFViewerProps {
  pdfUrl: string
  pdfId: string | null
  onJumpToPage?: (pageNumber: number) => void
}

// We'll use CDN version of PDF.js for simplicity
const PDFJS_VERSION = 'latest'
const PDF_WORKER_URL = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.js`
const PDF_LIB_URL = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/build/pdf.min.js`

declare global {
  interface Window {
    pdfjsLib: any
  }
}

export default function PDFViewer({ pdfUrl, pdfId, onJumpToPage }: PDFViewerProps) {
  // State
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [pdfDocument, setPdfDocument] = useState<any>(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [numPages, setNumPages] = useState<number>(0)
  const [scale, setScale] = useState(1.5)
  const [selection, setSelection] = useState<{ x: number; y: number; width: number; height: number } | null>(null)
  const [isSelecting, setIsSelecting] = useState<boolean>(false)
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null)
  const [pdfJsLoaded, setPdfJsLoaded] = useState(false)
  const [isRendering, setIsRendering] = useState(false)
  const [currentRenderTask, setCurrentRenderTask] = useState<any>(null)
  
  // Text selection state
  const [textSelection, setTextSelection] = useState<{
    position: { x: number; y: number };
    rect: { x: number; y: number; width: number; height: number };
    text: string;
  } | null>(null)
  
  // Rectangle selection state
  const [rectangleSelection, setRectangleSelection] = useState<{
    position: { x: number; y: number };
    rect: { x: number; y: number; width: number; height: number };
  } | null>(null)
  
  const containerRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const pageCanvasRef = useRef<{ [key: number]: HTMLCanvasElement }>({})
  const textLayerRef = useRef<HTMLDivElement | null>(null)
  const textLayersRef = useRef<{ [key: number]: HTMLDivElement }>({})
  
  // Hooks
  const { toast } = useToast()
  const { 
    currentTool, 
    currentColor, 
    addAnnotation, 
    addTextHighlight,
    annotations, 
    loadAnnotations, 
    saveAnnotations 
  } = useAnnotations()
  
  // External page navigation
  useEffect(() => {
    if (onJumpToPage && pageNumber) {
      onJumpToPage(pageNumber);
    }
  }, [pageNumber, onJumpToPage]);
  
  // Handle PDF.js script loading
  const handlePdfJsLoad = () => {
    setPdfJsLoaded(true)
  }

  // Load PDF.js worker
  useEffect(() => {
    if (pdfJsLoaded && window.pdfjsLib) {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDF_WORKER_URL
      loadPdf()
    }
  }, [pdfJsLoaded, pdfUrl])
  
  // Load PDF document
  const loadPdf = async () => {
    if (!pdfJsLoaded || !window.pdfjsLib) return
    
    setIsLoading(true)
    
    try {
      const loadingTask = window.pdfjsLib.getDocument({
        url: pdfUrl,
        cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@latest/cmaps/',
        cMapPacked: true,
      })
      
      const pdf = await loadingTask.promise
      setPdfDocument(pdf)
      setNumPages(pdf.numPages)
      setPageNumber(1)
      
    toast({
      title: "PDF loaded successfully",
      description: "The document has been loaded",
    })
      
      renderPage(1, pdf)
    } catch (error) {
      console.error("Error loading PDF:", error)
      setLoadError(`Failed to load PDF: ${error instanceof Error ? error.message : String(error)}`)
      setIsLoading(false)
    }
  }
  
  // Cleanup function to cancel rendering
  const cancelRendering = () => {
    if (currentRenderTask) {
      currentRenderTask.cancel();
      setCurrentRenderTask(null);
    }
  };
  
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      cancelRendering()
    }
  }, [cancelRendering])
  
  // Render PDF page
  const renderPage = async (pageNum: number, pdf = pdfDocument) => {
    if (!pdf) return
    
    // Cancel any in-progress rendering
    cancelRendering()
    
    setIsRendering(true)
    
    try {
      const page = await pdf.getPage(pageNum)
      
      // Create a new canvas for this specific page if it doesn't exist
      if (!pageCanvasRef.current[pageNum]) {
        const newCanvas = document.createElement('canvas')
        pageCanvasRef.current[pageNum] = newCanvas
      }
      
      const canvas = pageCanvasRef.current[pageNum]
      
      // Make sure our canvas ref points to the current page's canvas
      if (canvasRef.current?.parentNode) {
        // Replace the current canvas with the new one
        canvasRef.current.parentNode.replaceChild(canvas, canvasRef.current)
        canvasRef.current = canvas
      } else if (canvasRef.current) {
        // If there's no parent yet, we'll handle that when we add it to the DOM
        canvasRef.current = canvas
      }
      
      const viewport = page.getViewport({ scale })
      
      // Only set dimensions if they've changed or it's a new canvas
      if (canvas.width !== viewport.width || canvas.height !== viewport.height) {
        canvas.height = viewport.height
        canvas.width = viewport.width
        canvas.style.width = `${viewport.width}px`
        canvas.style.height = `${viewport.height}px`
      }
      
      const context = canvas.getContext('2d', { alpha: false })
      if (!context) {
        throw new Error("Could not get canvas context")
      }
      
      // Always clear before rendering
      context.fillStyle = 'rgb(255, 255, 255)'
      context.fillRect(0, 0, canvas.width, canvas.height)
      
      const renderContext = {
        canvasContext: context,
        viewport: viewport,
        enableWebGL: false // WebGL can cause issues with some GPUs, disabling for stability
      }
      
      const renderTask = page.render(renderContext)
      setCurrentRenderTask(renderTask)
      
      await renderTask.promise
      
      // Render text layer for selection - using cached text layers
      try {
        // Create or retrieve the text layer for this page
        if (!textLayersRef.current[pageNum]) {
          const newTextLayer = document.createElement('div')
          newTextLayer.className = 'text-layer'
          newTextLayer.style.position = 'absolute'
          newTextLayer.style.top = '0'
          newTextLayer.style.left = '0'
          newTextLayer.style.width = `${viewport.width}px`
          newTextLayer.style.height = `${viewport.height}px`
          newTextLayer.style.zIndex = '2'
          textLayersRef.current[pageNum] = newTextLayer
        }
        
        const textLayerDiv = textLayersRef.current[pageNum]
        
        // Update dimensions if needed
        textLayerDiv.style.width = `${viewport.width}px`
        textLayerDiv.style.height = `${viewport.height}px`
        
        // Only render the text content if it hasn't been rendered before
        if (!textLayerDiv.hasChildNodes()) {
          const textContent = await page.getTextContent()
          
          window.pdfjsLib.renderTextLayer({
            textContent,
            container: textLayerDiv,
            viewport,
            textDivs: [],
          })
        }
        
        // Replace current text layer with the one for this page
        if (textLayerRef.current) {
          // Clear current text layer
          if (textLayerRef.current.firstChild && textLayerRef.current.parentNode) {
            // If the current text layer has a different parent, swap it
            if (textLayerRef.current !== textLayerDiv) {
              textLayerRef.current.parentNode.replaceChild(textLayerDiv, textLayerRef.current)
              textLayerRef.current = textLayerDiv
            }
          } else if (textLayerRef.current.parentNode) {
            // If empty, just append
            textLayerRef.current.parentNode.appendChild(textLayerDiv)
            textLayerRef.current = textLayerDiv
          }
        }
        
        // Ensure the text layer's style makes text selectable but visually transparent
        const style = document.createElement('style')
        style.textContent = `
          .text-layer {
            opacity: 1.0;
            position: absolute;
            left: 0;
            top: 0;
            right: 0;
            bottom: 0;
            overflow: hidden;
            line-height: 1.0;
            pointer-events: auto;
          }
          
          .text-layer > span {
            color: transparent;
            position: absolute;
            white-space: pre;
            cursor: text;
            transform-origin: 0% 0%;
          }
          
          ::selection {
            background: rgba(0, 0, 255, 0.3);
          }
        `
        
        if (!document.head.querySelector('#pdf-textlayer-styles')) {
          style.id = 'pdf-textlayer-styles'
          document.head.appendChild(style)
        }
      } catch (err) {
        console.error('Error rendering text layer:', err)
      }
      
      setIsLoading(false)
      setIsRendering(false)
    } catch (error) {
      // Check if this was a cancelled render operation
      if (error instanceof Error && error.message === 'RenderTask cancelled') {
        console.log('Render task was cancelled')
        return
      }
      
      console.error("Error rendering page:", error)
      
      // Only set error if it's not a cancellation
      if (!(error instanceof Error) || !error.message.includes('cancel')) {
        setLoadError(`Failed to render page: ${error instanceof Error ? error.message : String(error)}`)
      }
      
    setIsLoading(false)
      setIsRendering(false)
    }
  }
  
  // Handle page navigation
  const goToNextPage = () => {
    if (pageNumber < numPages && !isRendering) {
      // Pre-render the next page if it's not already cached
      if (!pageCanvasRef.current[pageNumber + 1] && pdfDocument) {
        const nextPageNum = pageNumber + 1
        console.log(`Pre-rendering page ${nextPageNum}`)
        
        // Asynchronously render the next page in the background
        setTimeout(() => {
          if (pdfDocument && nextPageNum <= numPages) {
            pdfDocument.getPage(nextPageNum).then((page: any) => {
              if (!pageCanvasRef.current[nextPageNum]) {
                const newCanvas = document.createElement('canvas')
                const viewport = page.getViewport({ scale })
                
                newCanvas.height = viewport.height
                newCanvas.width = viewport.width
                
                const context = newCanvas.getContext('2d', { alpha: false })
                if (context) {
                  context.fillStyle = 'rgb(255, 255, 255)'
                  context.fillRect(0, 0, newCanvas.width, newCanvas.height)
                  
                  pageCanvasRef.current[nextPageNum] = newCanvas
                  console.log(`Page ${nextPageNum} pre-rendered and cached`)
                }
              }
            }).catch((err: Error) => console.error(`Error pre-rendering page ${nextPageNum}:`, err))
          }
        }, 100)
      }
      
      setPageNumber(pageNumber + 1)
    }
  }
/*
  const goToPrevPage = () => {
    if (pageNumber > 1 && !isRendering) {
      // Pre-render the next page if it's not already cached
      if (!pageCanvasRef.current[pageNumber - 1] && pdfDocument) {
        const nextPageNum = pageNumber - 1
        console.log(`Pre-rendering page ${nextPageNum}`)
        
        // Asynchronously render the next page in the background
        setTimeout(() => {
          if (pdfDocument && nextPageNum <= numPages) {
            pdfDocument.getPage(nextPageNum).then((page: any) => {
              if (!pageCanvasRef.current[nextPageNum]) {
                const newCanvas = document.createElement('canvas')
                const viewport = page.getViewport({ scale })
                
                newCanvas.height = viewport.height
                newCanvas.width = viewport.width
                
                const context = newCanvas.getContext('2d', { alpha: false })
                if (context) {
                  context.fillStyle = 'rgb(255, 255, 255)'
                  context.fillRect(0, 0, newCanvas.width, newCanvas.height)
                  
                  pageCanvasRef.current[nextPageNum] = newCanvas
                  console.log(`Page ${nextPageNum} pre-rendered and cached`)
                }
              }
            }).catch((err: Error) => console.error(`Error pre-rendering page ${nextPageNum}:`, err))
          }
        }, 100)
      }
      
      setPageNumber(pageNumber - 1)
    }
  }
    */

  
  const goToPrevPage = () => {
    if (pageNumber > 1 && !isRendering) {
      setPageNumber(pageNumber - 1)
    }
  }
    
  // Cache management - limit the number of cached pages to avoid memory issues
  useEffect(() => {
    const maxCachedPages = 5  // Keep 5 pages in memory
    const pageKeys = Object.keys(pageCanvasRef.current).map(Number)
    
    if (pageKeys.length > maxCachedPages) {
      // Keep current page and pages nearby
      const pagesToKeep = new Set([
        pageNumber,
        pageNumber - 1,
        pageNumber - 2,
        pageNumber + 1,
        pageNumber + 2
      ].filter(p => p >= 1 && p <= numPages))
      
      // Remove pages that are far from current
      const canvasesToRemove = pageKeys.filter(page => !pagesToKeep.has(page))
      
      // Keep the most recent pages if we need to remove more
      canvasesToRemove.sort((a, b) => Math.abs(pageNumber - a) - Math.abs(pageNumber - b))
      
      // Remove the furthest pages until we're at max capacity
      while (pageKeys.length - canvasesToRemove.length > maxCachedPages) {
        const pageToRemove = canvasesToRemove.pop()
        if (pageToRemove !== undefined) {
          delete pageCanvasRef.current[pageToRemove]
          
          // Also remove the corresponding text layer
          if (textLayersRef.current[pageToRemove]) {
            delete textLayersRef.current[pageToRemove]
          }
          
          console.log(`Removed cached page ${pageToRemove} from memory`)
        }
      }
    }
  }, [pageNumber, numPages])
  
  // Update rendering when page number or scale changes
  useEffect(() => {
    if (pdfDocument) {
      renderPage(pageNumber)
      
      // Reset text selection when page changes
      setTextSelection(null)
      
      // Log debug info for text layers
      console.log(`Text layers available: ${Object.keys(textLayersRef.current).join(', ')}`)
    }
  }, [pageNumber, scale, pdfDocument])
  
  // Ensure proper text layer initialization
  useEffect(() => {
    // Add default text-layer styles to ensure consistent rendering
    if (!document.head.querySelector('#pdf-textlayer-styles')) {
      const style = document.createElement('style')
      style.id = 'pdf-textlayer-styles'
      style.textContent = `
        .text-layer {
          opacity: 1.0;
          position: absolute;
          left: 0;
          top: 0;
          right: 0;
          bottom: 0;
          overflow: hidden;
          line-height: 1.0;
          pointer-events: auto;
        }
        
        .text-layer > span {
          color: transparent;
          position: absolute;
          white-space: pre;
          cursor: text;
          transform-origin: 0% 0%;
        }
        
        ::selection {
          background: rgba(0, 0, 255, 0.3);
        }
      `
      document.head.appendChild(style)
    }
  }, [])
  
  // Load annotations
  useEffect(() => {
    if (!pdfId) return
    
    try {
      loadAnnotations(pdfId)
    } catch (error) {
      console.error("Failed to load annotations:", error)
      toast({
        title: "Error",
        description: "Failed to load annotations",
        variant: "destructive",
      })
    }
  }, [pdfId, loadAnnotations, toast])
  
  // Zoom controls
  const zoomIn = () => {
    if (!isRendering) {
      setScale(prevScale => Math.min(prevScale + 0.2, 3.0))
    }
  }
  
  const zoomOut = () => {
    if (!isRendering) {
      setScale(prevScale => Math.max(prevScale - 0.2, 0.5))
    }
  }
  
  // Selection and highlighting handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (currentTool === 'none' || !containerRef.current) return
    
    // Only handle mouse down for drawing tools (area selection, note, clip)
    // Text selection is handled separately via the text layer
    if (currentTool === 'rectangle' || currentTool === 'highlight' || currentTool === 'clip' || currentTool === 'note') {
      const rect = containerRef.current.getBoundingClientRect()
      
      const x = (e.clientX - rect.left) / scale
      const y = (e.clientY - rect.top) / scale
      
      setStartPoint({ x, y })
      setIsSelecting(true)
      setSelection(null)
    }
  }, [currentTool, scale])
  
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isSelecting || !startPoint || !containerRef.current) return
    
    const rect = containerRef.current.getBoundingClientRect()
    
    const currentX = (e.clientX - rect.left) / scale
    const currentY = (e.clientY - rect.top) / scale
    
    const width = Math.abs(currentX - startPoint.x)
    const height = Math.abs(currentY - startPoint.y)
    const x = Math.min(currentX, startPoint.x)
    const y = Math.min(currentY, startPoint.y)
    
    setSelection({ x, y, width, height })
  }, [isSelecting, startPoint, scale])
  
  const handleMouseUp = useCallback(() => {
    if (!isSelecting || !selection || !startPoint || !containerRef.current) return
    
    // Only add annotation if it has some size
    if (selection.width > 5 && selection.height > 5) {
      // Only handle mouse-drawn tools here (area selection, note, clip)
      // Text highlighting is handled separately
      if (currentTool === 'rectangle' || currentTool === 'highlight' || currentTool === 'note' || currentTool === 'clip') {
        // For area selection tools, show the rectangle tool component
        if (currentTool === 'rectangle' || currentTool === 'highlight') {
          // Calculate position for the tooltip (centered above the selection)
          const rect = containerRef.current.getBoundingClientRect()
          const centerX = (selection.x + selection.width/2) * scale
          const topY = selection.y * scale
          
          setRectangleSelection({
            position: { x: centerX, y: topY },
            rect: { ...selection }
          })
          
          // We'll add the annotation when the user confirms via the RectangleTool
          return
        }
        
        // For other tools, add the annotation right away
        addAnnotation({
          type: currentTool,
          pageNumber,
          position: selection,
          color: currentColor,
        })
        
        if (pdfId) {
          saveAnnotations(pdfId)
        }
        
        // Toast feedback for different annotation types
        const feedbackMessages = {
          note: "Note added",
          clip: "Clipping area created"
        };
        
        toast({
          title: feedbackMessages[currentTool] || "Annotation added",
          description: `The selected area has been marked`,
        })
      }
    }
    
    setIsSelecting(false)
    setStartPoint(null)
    setSelection(null)
  }, [isSelecting, selection, startPoint, addAnnotation, currentTool, pageNumber, currentColor, pdfId, saveAnnotations, toast, scale]);
  
  // Filter annotations for the current page
  const currentPageAnnotations = annotations.filter(
    annotation => annotation.pageNumber === pageNumber
  )

  // Render PDF annotations
  const renderAnnotations = () => {
    if (currentPageAnnotations.length === 0) return null
    
    return (
      <div 
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
        style={{ zIndex: 10 }}
      >
        <AnnotationLayer 
          annotations={currentPageAnnotations} 
          scale={scale} 
        />
      </div>
    )
  }

  // Handle direct download
  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = pdfUrl
    link.download = pdfId ? `document-${pdfId}.pdf` : 'document.pdf'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Debug function to help diagnose the black page issue
  const debugCanvasState = useCallback(() => {
    console.log('Canvas debug info:')
    console.log('Current page:', pageNumber)
    console.log('Canvas references:', Object.keys(pageCanvasRef.current).length)
    
    // Check if all canvases have contexts
    Object.entries(pageCanvasRef.current).forEach(([page, canvas]) => {
      const context = canvas.getContext('2d')
      console.log(`Page ${page} canvas:`, {
        hasContext: !!context,
        width: canvas.width,
        height: canvas.height,
        isVisible: canvas === canvasRef.current
      })
    })
  }, [pageNumber, pageCanvasRef, canvasRef])
  
  // Debug page navigation issues
  useEffect(() => {
    if (pdfDocument) {
      console.log(`Navigating to page ${pageNumber}`)
      debugCanvasState()
    }
  }, [pageNumber, pdfDocument, debugCanvasState])

  // Handle text selection
  const handleTextSelection = useCallback(() => {
    // Only allow text selection when not in drawing mode
    if (currentTool !== 'none') return;
    
    if (!containerRef.current) return
    
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
      return;
    }
    
    const range = selection.getRangeAt(0);
    if (!range) return;
    
    // Find which text layer contains the selection (for current page)
    const currentTextLayer = textLayersRef.current[pageNumber];
    if (!currentTextLayer) return;
    
    // Check if selection is within text layer
    const isWithinTextLayer = currentTextLayer.contains(range.commonAncestorContainer);
    if (!isWithinTextLayer) return;
    
    // Get selected text
    const selectedText = selection.toString().trim();
    if (!selectedText) return;
    
    // Get selection bounding rect
    const rects = range.getClientRects();
    if (!rects.length) return;
    
    // Calculate container-relative coordinates 
    const containerRect = containerRef.current.getBoundingClientRect();
    
    // Calculate the bounding box of all selected text
    let minX = Infinity, minY = Infinity, maxX = 0, maxY = 0;
    
    for (let i = 0; i < rects.length; i++) {
      const rect = rects[i];
      minX = Math.min(minX, rect.left);
      minY = Math.min(minY, rect.top);
      maxX = Math.max(maxX, rect.right);
      maxY = Math.max(maxY, rect.bottom);
    }
    
    // Convert to container coordinates and scale
    const relX = (minX - containerRect.left) / scale;
    const relY = (minY - containerRect.top) / scale;
    const relWidth = (maxX - minX) / scale;
    const relHeight = (maxY - minY) / scale;
    
    // Calculate position for the tooltip (centered above the selection)
    const tooltipX = (minX + maxX) / 2 - containerRect.left;
    const tooltipY = minY - containerRect.top;
    
    setTextSelection({
      position: { x: tooltipX, y: tooltipY },
      rect: { x: relX, y: relY, width: relWidth, height: relHeight },
      text: selectedText
    });
    
  }, [scale, pageNumber, textLayersRef]);
  
  useEffect(() => {
    document.addEventListener('selectionchange', handleTextSelection);
    return () => {
      document.removeEventListener('selectionchange', handleTextSelection);
    };
  }, [handleTextSelection]);
  
  // Handle highlight text
  const handleHighlightText = (color: string) => {
    if (!textSelection || !pdfId) return;
    
    // Add the text highlight annotation
    addTextHighlight(
      pageNumber, 
      textSelection.rect, 
      textSelection.text,
      color
    );
    
    // Save the annotations
    saveAnnotations(pdfId);
    
    // Show a confirmation toast
    toast({
      title: "Text highlighted",
      description: "The selected text has been highlighted",
    });
    
    // Clear the selection
    window.getSelection()?.removeAllRanges();
    setTextSelection(null);
  };
  
  const handleCancelTextHighlight = () => {
    setTextSelection(null);
  };

  // Handle apply area selection (rectangle or highlight)
  const handleApplyRectangle = (color: string) => {
    if (!rectangleSelection || !pdfId) return;
    
    // Add the area selection annotation with the tool type (rectangle or highlight)
    addAnnotation({
      type: currentTool, // Keep the current tool type (rectangle or highlight)
      pageNumber,
      position: rectangleSelection.rect,
      color: color,
    });
    
    // Save the annotations
    saveAnnotations(pdfId);
    
    // Show a confirmation toast
    toast({
      title: "Area selection applied",
      description: "The selected area has been highlighted",
    });
    
    // Clear the selection
    setRectangleSelection(null);
  };
  
  const handleCancelRectangle = () => {
    setRectangleSelection(null);
  };

  return (
    <>
      <Script src={PDF_LIB_URL} onLoad={handlePdfJsLoad} />
      
    <div 
      className="flex flex-col h-full w-full overflow-hidden" 
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Error display */}
      {loadError && (
        <div className="flex flex-col items-center justify-center h-full w-full">
          <div className="bg-white p-6 rounded-lg shadow-md max-w-md text-center">
            <AlertTriangle size={48} className="text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Error Loading PDF</h3>
            <p className="text-gray-600 mb-4">{loadError}</p>
            <p className="text-sm text-gray-500 mb-4">
              Please try again. If the problem persists, check that the PDF is accessible and not corrupted.
            </p>
            <div className="flex gap-2 justify-center">
                <Button onClick={() => {
                  setLoadError(null)
                  cancelRendering()
                  loadPdf()
                }} className="mx-auto">
                Retry
              </Button>
                <Button onClick={handleDownload} variant="outline">
                  Download
                </Button>
              </div>
          </div>
        </div>
      )}
      
      {/* PDF Viewer */}
      {!loadError && (
          <>
            {/* Controls */}
            <div className="bg-gray-100 p-2 flex items-center justify-between border-b">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={goToPrevPage}
                  disabled={pageNumber <= 1 || isRendering}
                >
                  <ChevronLeft size={20} />
                </Button>
                <span className="text-sm">
                  Page {pageNumber} of {numPages}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={goToNextPage}
                  disabled={pageNumber >= numPages || isRendering}
                >
                  <ChevronRight size={20} />
                </Button>
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={zoomOut} disabled={scale <= 0.5 || isRendering}>
                  <ZoomOut size={20} />
                </Button>
                <span className="text-sm">{Math.round(scale * 100)}%</span>
                <Button variant="ghost" size="icon" onClick={zoomIn} disabled={scale >= 3 || isRendering}>
                  <ZoomIn size={20} />
                </Button>
                <Button variant="ghost" size="icon" onClick={handleDownload}>
                  <Download size={20} />
                </Button>
              </div>
            </div>
            
            {/* Canvas container */}
            <div className="flex-1 overflow-auto relative flex justify-center bg-gray-800">
              <div className="relative bg-white shadow-md my-4">
                <canvas ref={canvasRef} className="block" />
                
                {/* Text layer for selection */}
                <div 
                  ref={textLayerRef} 
                  className="text-layer absolute top-0 left-0"
                  data-page-number={pageNumber}
                  style={{ 
                    // Only enable text selection when we're in text selection mode (currentTool === 'none')
                    // Disable text selection when using drawing tools
                    pointerEvents: currentTool === 'none' ? 'auto' : 'none',
                    zIndex: 2,
                    opacity: 1, // Make sure text layer is visible
                    userSelect: currentTool === 'none' ? 'text' : 'none'
                  }}
                />
                
                {/* Text selection tooltip */}
                {textSelection && currentTool === 'none' && (
                  <TextHighlighter 
                    position={textSelection.position}
                    onHighlight={handleHighlightText}
                    onCancel={handleCancelTextHighlight}
                  />
                )}
                
                {/* Rectangle tool tooltip */}
                {rectangleSelection && (
                  <RectangleTool 
                    position={rectangleSelection.position}
                    selectedArea={{
                      width: rectangleSelection.rect.width,
                      height: rectangleSelection.rect.height
                    }}
                    onApply={handleApplyRectangle}
                    onCancel={handleCancelRectangle}
                  />
                )}
                
                {/* Selection overlay for rectangle/shape tools */}
          {selection && isSelecting && (
            <div
              className="absolute border-2 border-dashed pointer-events-none"
              style={{
                left: selection.x * scale,
                top: selection.y * scale,
                width: selection.width * scale,
                height: selection.height * scale,
                borderColor: currentColor,
                backgroundColor: `${currentColor}33`,
                zIndex: 20,
              }}
            />
          )}
          
          {/* Annotations overlay */}
          {renderAnnotations()}
        </div>
            </div>
          </>
      )}
      
      {/* Loading indicator */}
        {(isLoading || (isRendering && !isLoading)) && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      )}
    </div>
    </>
  )
}

