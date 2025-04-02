"use client"

import type React from "react"

import { useState, useEffect } from "react"
import dynamic from 'next/dynamic'
import Toolbar from "@/components/toolbar"
import Header from "@/components/header"
import RightPanel from "@/components/right-panel"
import { Upload, Clock, File } from "lucide-react"
import { useToast } from "@/components/toast-provider"
import { AnnotationProvider } from "@/contexts/annotation-context"

// Dynamically import PDFViewer with SSR disabled
const PDFViewer = dynamic(() => import("@/components/pdf-viewer"), { 
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full w-full">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  ),
  // Add a longer timeout to ensure the component has time to load
  suspense: true
})

interface RecentPDF {
  pdf_id: string
  filename: string
  last_accessed: string
  access_count: number
}

export default function Home() {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [pdfId, setPdfId] = useState<string | null>(null)
  const [pdfName, setPdfName] = useState<string | null>(null)
  const [showAIAssistant, setShowAIAssistant] = useState(false)
  const [showHighlights, setShowHighlights] = useState(false)
  const [recentPdfs, setRecentPdfs] = useState<RecentPDF[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const { toast } = useToast()

  // Fetch recent PDFs when component mounts
  useEffect(() => {
    fetchRecentPdfs()
  }, [])

  const fetchRecentPdfs = async () => {
    try {
      const response = await fetch("http://localhost:8000/pdfs/recent/default-user")
      if (!response.ok) {
        throw new Error("Failed to fetch recent PDFs")
      }
      const data = await response.json()
      setRecentPdfs(data.recent_pdfs || [])
    } catch (error) {
      console.error("Error fetching recent PDFs:", error)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.type !== "application/pdf") {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF file",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    const formData = new FormData()
    formData.append("file", file)

    try {
      const response = await fetch("http://localhost:8000/pdfs/upload/", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Failed to upload PDF")
      }

      const data = await response.json()
      setPdfId(data.pdf_id)
      setPdfName(data.filename)
      setPdfUrl(`http://localhost:8000/pdfs/pdf/${data.pdf_id}?t=${Date.now()}`)

      toast({
        title: "PDF uploaded successfully",
        description: `Uploaded ${data.filename}`,
      })
      
      // Refresh recent PDFs list
      fetchRecentPdfs()
    } catch (error) {
      console.error("Error uploading PDF:", error)
      toast({
        title: "Upload failed",
        description: "Failed to upload PDF file",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const openRecentPdf = async (pdf: RecentPDF) => {
    try {
      setPdfId(pdf.pdf_id)
      setPdfName(pdf.filename)
      
      // Ensure URL has correct format
      const pdfUrl = `http://localhost:8000/pdfs/pdf/${pdf.pdf_id}?t=${Date.now()}`
      console.log("Loading PDF from URL:", pdfUrl)
      setPdfUrl(pdfUrl)
      
      // The PDF viewer component will handle access recording
      // This avoids duplicate API calls
    } catch (error) {
      console.error("Error opening PDF:", error)
      toast({
        title: "Error opening PDF",
        description: "Failed to open the selected PDF",
        variant: "destructive",
      })
    }
  }

  const toggleAIAssistant = () => {
    setShowAIAssistant(!showAIAssistant)
  }
  
  const toggleHighlights = () => {
    setShowHighlights(!showHighlights)
  }
  
  const handleCloseHighlights = () => {
    setShowHighlights(false)
  }
  
  const handleCloseAIAssistant = () => {
    setShowAIAssistant(false)
  }
  
  const handleJumpToPage = (pageNumber: number) => {
    setCurrentPage(pageNumber)
  }

  return (
    <AnnotationProvider>
      <main className="flex min-h-screen flex-col">
        <Header pdfName={pdfName} />

        <div className="flex flex-1 overflow-hidden">
          <Toolbar 
            toggleAIAssistant={toggleAIAssistant} 
            toggleHighlights={toggleHighlights}
            showHighlights={showHighlights}
            showAIAssistant={showAIAssistant}
          />

          <div className="flex-1 flex items-center justify-center bg-gray-100 overflow-auto">
            {pdfUrl ? (
              <PDFViewer 
                pdfUrl={pdfUrl} 
                pdfId={pdfId}
                onJumpToPage={handleJumpToPage}
              />
            ) : (
              <div className="p-10 bg-white shadow-sm max-w-lg w-full mx-auto my-8 rounded-lg">
                <h2 className="text-2xl font-bold mb-4 text-center">Upload a PDF</h2>
                <p className="text-gray-600 mb-6 text-center">
                  Upload a PDF file to view, highlight, and analyze it with AI assistance
                </p>
                <div className="flex justify-center mb-10">
                  <label htmlFor="pdf-upload" className="cursor-pointer">
                    <div className="flex items-center justify-center gap-2 bg-primary text-white px-6 py-3 rounded-md hover:bg-primary/90 transition-colors">
                      <Upload size={20} />
                      <span>Upload PDF</span>
                    </div>
                    <input
                      id="pdf-upload"
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={handleFileUpload}
                      disabled={isLoading}
                    />
                  </label>
                </div>
                
                {isLoading && (
                  <div className="flex justify-center my-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                )}
                
                {/* Recent PDFs section */}
                {recentPdfs.length > 0 && (
                  <div className="mt-8 pt-8 border-t border-gray-200">
                    <div className="flex items-center gap-2 mb-6">
                      <Clock size={18} className="text-gray-400" />
                      <h3 className="text-lg font-medium">Recently Opened PDFs</h3>
                    </div>
                    <div className="space-y-3">
                      {recentPdfs.map((pdf) => (
                        <button
                          key={pdf.pdf_id}
                          onClick={() => openRecentPdf(pdf)}
                          className="w-full flex items-center gap-3 p-3 text-left rounded hover:bg-gray-50 transition-colors border border-gray-200"
                        >
                          <div className="text-primary">
                            <File size={20} />
                          </div>
                          <div className="flex-1 overflow-hidden">
                            <p className="font-medium text-sm truncate">{pdf.filename}</p>
                            <p className="text-xs text-gray-500">
                              Last opened: {new Date(pdf.last_accessed).toLocaleDateString()} {new Date(pdf.last_accessed).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {(showAIAssistant || showHighlights) && (
            <RightPanel
              pdfId={pdfId}
              pdfName={pdfName}
              showHighlights={showHighlights}
              showAIAssistant={showAIAssistant}
              onCloseHighlights={handleCloseHighlights}
              onCloseAIAssistant={handleCloseAIAssistant}
              onJumpToPage={handleJumpToPage}
            />
          )}
        </div>
      </main>
    </AnnotationProvider>
  )
}

