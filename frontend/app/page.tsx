"use client"

import type React from "react"

import { useState, useEffect } from "react"
import dynamic from 'next/dynamic'
import Toolbar from "@/components/toolbar"
import Header from "@/components/header"
import RightPanel from "@/components/right-panel"
import { Upload, Clock, File, FolderOpen } from "lucide-react"
import { useToast } from "@/components/toast-provider"
import { AnnotationProvider } from "@/contexts/annotation-context"
import { Button } from "@/components/ui/button"
import ManagePDFs from "@/components/manage-pdfs"

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
  const [showManagePDFs, setShowManagePDFs] = useState(false)
  const { toast } = useToast()

  // Fetch recent PDFs when component mounts
  useEffect(() => {
    fetchRecentPdfs()
  }, [])

  const fetchRecentPdfs = async () => {
    try {
      console.log("Fetching recent PDFs...")
      const response = await fetch("http://localhost:8000/pdfs/recent/default-user")
      if (!response.ok) {
        throw new Error("Failed to fetch recent PDFs")
      }
      const data = await response.json()
      console.log("Recent PDFs response:", data)
      
      if (data && Array.isArray(data.recent_pdfs)) {
        setRecentPdfs(data.recent_pdfs)
      } else {
        console.error("Unexpected response format:", data)
        setRecentPdfs([])
      }
    } catch (error) {
      console.error("Error fetching recent PDFs:", error)
      setRecentPdfs([])
    }
  }

  // Function to manually record PDF access
  const recordPdfAccess = async (pdfId: string) => {
    if (!pdfId) return;
    
    try {
      console.log("Recording PDF access for:", pdfId)
      const response = await fetch(`http://localhost:8000/pdfs/access/${pdfId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_id: "default-user" }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to record PDF access");
      }
      
      console.log("PDF access recorded successfully")
    } catch (error) {
      console.error("Error recording PDF access:", error);
    }
  };

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

      // Manually record the access for the newly uploaded PDF
      await recordPdfAccess(data.pdf_id);

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
      const pdfId = pdf.pdf_id;
      setPdfId(pdfId)
      setPdfName(pdf.filename)
      
      // Ensure URL has correct format
      const pdfUrl = `http://localhost:8000/pdfs/pdf/${pdfId}?t=${Date.now()}`
      console.log("Loading PDF from URL:", pdfUrl)
      setPdfUrl(pdfUrl)
      
      // Manually record this access
      await recordPdfAccess(pdfId);
      
    } catch (error) {
      console.error("Error opening PDF:", error)
      toast({
        title: "Error opening PDF",
        description: "Failed to open the selected PDF",
        variant: "destructive",
      })
    }
  }

  // Add function to handle clearing recent history
  const handleClearHistory = async () => {
    try {
      const response = await fetch("http://localhost:8000/pdfs/recent/clear/default-user", {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to clear history");
      }
      setRecentPdfs([]); // Clear the list in the UI
      toast({
        title: "History Cleared",
        description: "Your recently opened PDFs list has been cleared.",
      });
    } catch (error) {
      console.error("Error clearing history:", error);
      toast({
        title: "Error",
        description: "Failed to clear recent history.",
        variant: "destructive",
      });
    }
  };

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

  // Add a function to return to the homepage
  const handleBackToHome = () => {
    // Record access before navigating away if we were viewing a PDF
    if (pdfId) {
      recordPdfAccess(pdfId);
    }
    
    // Reset PDF viewer states
    setPdfUrl(null);
    setPdfId(null);
    setPdfName(null);
    setShowAIAssistant(false);
    setShowHighlights(false);
    
    // After returning to home, refresh the recent PDFs list
    fetchRecentPdfs();
  };

  // Function to handle opening a PDF from the manage PDFs modal
  const handleOpenPDFFromManager = ({ pdf_id, filename }: { pdf_id: string; filename: string }) => {
    setPdfId(pdf_id);
    setPdfName(filename);
    setPdfUrl(`http://localhost:8000/pdfs/pdf/${pdf_id}?t=${Date.now()}`);
    setShowManagePDFs(false);
    
    // Record this access
    recordPdfAccess(pdf_id);
  };

  return (
    <AnnotationProvider>
      <main className="flex min-h-screen flex-col">
        <Header pdfName={pdfName} onBackToHome={handleBackToHome} />

        {/* Main content with proper spacing for fixed header and toolbar */}
        <div className="flex flex-1 overflow-hidden mt-12"> {/* Add margin-top for header height */}
          <Toolbar 
            toggleAIAssistant={toggleAIAssistant} 
            toggleHighlights={toggleHighlights}
            showHighlights={showHighlights}
            showAIAssistant={showAIAssistant}
          />

          <div className="flex-1 flex items-center justify-center bg-gray-100 overflow-auto pl-16">{/* Main content area with left padding for the fixed toolbar */}
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
                
                <div className="flex justify-center mb-10 gap-4">
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
                  
                  <Button 
                    onClick={() => setShowManagePDFs(true)}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <FolderOpen size={20} />
                    Manage PDFs
                  </Button>
                </div>
                
                {isLoading && (
                  <div className="flex justify-center my-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                )}
                
                {/* Recent PDFs section - always visible */}
                <div className="mt-8 pt-8 border-t border-gray-200">
                  <div className="flex items-center justify-between gap-2 mb-6">
                    <div className="flex items-center gap-2">
                      <Clock size={18} className="text-gray-400" />
                      <h3 className="text-lg font-medium">Recently Opened PDFs</h3>
                    </div>
                    {recentPdfs.length > 0 && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-xs text-gray-500 hover:text-red-600"
                        onClick={handleClearHistory}
                      >
                        Clear History
                      </Button>
                    )}
                  </div>
                  
                  {recentPdfs.length > 0 ? (
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
                  ) : (
                    <div className="text-center p-4 border border-gray-200 rounded-md">
                      <p className="text-gray-500">No recently opened PDFs</p>
                    </div>
                  )}
                </div>
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
        
        {showManagePDFs && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <ManagePDFs 
              onClose={() => setShowManagePDFs(false)} 
              onOpenPDF={handleOpenPDFFromManager}
            />
          </div>
        )}
      </main>
    </AnnotationProvider>
  )
}

