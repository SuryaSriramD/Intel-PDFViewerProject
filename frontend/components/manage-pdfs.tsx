"use client"

import { useState, useEffect } from "react"
import { File, Trash2, X, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/toast-provider"
import { ScrollArea } from "@/components/ui/scroll-area"

interface PDF {
  pdf_id: string
  filename: string
  upload_date: string
  size: number
}

interface ManagePDFsProps {
  onClose: () => void
  onOpenPDF: (pdf: { pdf_id: string; filename: string }) => void
}

export default function ManagePDFs({ onClose, onOpenPDF }: ManagePDFsProps) {
  const [pdfs, setPdfs] = useState<PDF[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedPdfs, setSelectedPdfs] = useState<string[]>([])
  const { toast } = useToast()

  const fetchPDFs = async (showToastOnError = true) => {
    setIsLoading(true)
    try {
      console.log("Fetching PDFs from API...")
      const response = await fetch("http://localhost:8000/pdfs/all/")
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error fetching PDFs (${response.status}):`, errorText);
        throw new Error(`Failed to fetch PDFs: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json()
      console.log("PDFs fetched successfully:", data);
      
      if (data && Array.isArray(data.pdfs)) {
        setPdfs(data.pdfs)
      } else {
        console.error("Unexpected response format:", data)
        setPdfs([])
        if (showToastOnError) {
          toast({
            title: "Warning",
            description: "Received unexpected data format from server",
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      console.error("Error fetching PDFs:", error)
      setPdfs([])
      if (showToastOnError) {
        toast({
          title: "Error",
          description: "Failed to load PDF list. Please try again.",
          variant: "destructive",
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Retry logic for initial load
  useEffect(() => {
    const loadPDFs = async () => {
      await fetchPDFs(false); // First attempt, no toast on error
      
      // If first attempt failed, try again after 2 seconds
      if (pdfs.length === 0) {
        setTimeout(async () => {
          await fetchPDFs(true); // Second attempt, show toast on error
        }, 2000);
      }
    };
    
    loadPDFs();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectPDF = (pdfId: string) => {
    setSelectedPdfs(prev => 
      prev.includes(pdfId) 
        ? prev.filter(id => id !== pdfId) 
        : [...prev, pdfId]
    )
  }

  const handleDeleteSelected = async () => {
    if (selectedPdfs.length === 0) return
    
    const promises = selectedPdfs.map(pdfId => 
      fetch(`http://localhost:8000/pdfs/delete/${pdfId}`, {
        method: "DELETE"
      })
    )
    
    try {
      await Promise.all(promises)
      toast({
        title: "Success",
        description: `Deleted ${selectedPdfs.length} PDF${selectedPdfs.length > 1 ? 's' : ''}`,
      })
      setSelectedPdfs([])
      fetchPDFs() // Refresh the list
    } catch (error) {
      console.error("Error deleting PDFs:", error)
      toast({
        title: "Error",
        description: "Failed to delete one or more PDFs",
        variant: "destructive",
      })
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Manage Uploaded PDFs</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X size={20} />
        </Button>
      </div>

      <div className="mb-4 flex justify-between items-center">
        <div className="text-sm text-gray-500">
          {pdfs.length} PDF{pdfs.length !== 1 ? 's' : ''} uploaded
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => fetchPDFs(true)}
            disabled={isLoading}
            className="flex items-center gap-1"
          >
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
            Refresh
          </Button>
          {selectedPdfs.length > 0 && (
            <Button 
              variant="destructive" 
              size="sm"
              onClick={handleDeleteSelected}
              className="flex items-center gap-1"
            >
              <Trash2 size={16} />
              Delete Selected ({selectedPdfs.length})
            </Button>
          )}
        </div>
      </div>

      <ScrollArea className="h-[400px] border rounded-md">
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : pdfs.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            No PDFs have been uploaded yet
          </div>
        ) : (
          <div className="space-y-1 p-1">
            {pdfs.map((pdf) => (
              <div 
                key={pdf.pdf_id} 
                className="flex items-center p-3 hover:bg-gray-50 rounded-md border-b last:border-0"
              >
                <input
                  type="checkbox"
                  checked={selectedPdfs.includes(pdf.pdf_id)}
                  onChange={() => handleSelectPDF(pdf.pdf_id)}
                  className="mr-3 h-4 w-4"
                />
                <div 
                  className="flex-1 cursor-pointer"
                  onClick={() => onOpenPDF({ pdf_id: pdf.pdf_id, filename: pdf.filename })}
                >
                  <div className="flex items-center gap-3">
                    <File size={20} className="text-primary" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{pdf.filename}</p>
                      <div className="flex text-xs text-gray-500 mt-1 gap-3">
                        <span>Uploaded: {new Date(pdf.upload_date).toLocaleString()}</span>
                        <span>Size: {formatFileSize(pdf.size)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  )
} 