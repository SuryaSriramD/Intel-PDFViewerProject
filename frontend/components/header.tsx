import { X } from "lucide-react"

interface HeaderProps {
  pdfName: string | null
}

export default function Header({ pdfName }: HeaderProps) {
  return (
    <header className="bg-black text-white p-3 flex items-center justify-between">
      <h1 className="text-sm font-medium truncate">{pdfName ? pdfName : "PDF Viewer with AI Assistant"}</h1>
      <button className="p-1 hover:bg-gray-700 rounded-full">
        <X size={18} />
      </button>
    </header>
  )
}

