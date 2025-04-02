import { X, Home, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

interface HeaderProps {
  pdfName: string | null
  onBackToHome?: () => void
}

export default function Header({ pdfName, onBackToHome }: HeaderProps) {
  return (
    <header className="bg-black text-white p-3 flex items-center justify-between fixed top-0 left-0 right-0 z-30">
      <div className="flex items-center gap-3">
        {pdfName && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-white hover:bg-gray-800 rounded-full"
            onClick={onBackToHome}
            title="Back to home"
          >
            <ArrowLeft size={18} />
          </Button>
        )}
        <h1 className="text-sm font-medium truncate">{pdfName ? pdfName : "PDF Viewer with AI Assistant"}</h1>
      </div>
      <button className="p-1 hover:bg-gray-700 rounded-full">
        <X size={18} />
      </button>
    </header>
  )
}

