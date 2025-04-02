"use client"

import { useState, useRef, useEffect } from "react"
import { Send, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/text-area"
import { useAnnotations } from "@/contexts/annotation-context"

interface AIAssistantProps {
  pdfId: string | null
  pdfName: string | null
  onClose?: () => void
}

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

export default function AIAssistant({ pdfId, pdfName, onClose }: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: `Hello! I'm your AI assistant. I can help you understand the content of ${pdfName || "this PDF"}. What would you like to know?`,
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { annotations } = useAnnotations()

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleSendMessage = async () => {
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    // Get relevant annotations for context
    const relevantAnnotations = annotations.filter((a) => a.type === "highlight" || a.type === "note").slice(0, 5) // Limit to 5 most recent annotations

    // In a real implementation, you would call your backend API here
    // For now, we'll simulate a response based on the input and annotations
    setTimeout(() => {
      let response = `I'm analyzing your question about "${input}".`

      if (relevantAnnotations.length > 0) {
        response += " Based on your highlights, I can see you're interested in key parts of the document. "

        if (input.toLowerCase().includes("summary")) {
          response +=
            "Here's a summary of the highlighted content: The document discusses important concepts related to the main topic. The highlighted sections emphasize key points that support the main argument."
        } else if (input.toLowerCase().includes("explain")) {
          response +=
            "The highlighted sections explain the core concepts in detail. They provide context for understanding the document's main thesis."
        } else {
          response +=
            "I can provide more specific information if you ask about particular highlights or sections of the document."
        }
      } else {
        response += " Try highlighting important parts of the document to help me provide more relevant information."
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
      setIsLoading(false)
    }, 1500)
  }

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full">
      <div className="p-3 border-b border-gray-200 flex justify-between items-center">
        <h2 className="font-medium">AI Assistant</h2>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8"
          onClick={onClose}
        >
          <X size={18} />
        </Button>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        <div className="flex flex-col gap-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-lg p-3 ${
                  message.role === "user" ? "bg-primary text-white" : "bg-gray-100 text-gray-800"
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <p className="text-xs mt-1 opacity-70">
                  {message.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-lg p-3 bg-gray-100">
                <div className="flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  <span className="text-sm">Analyzing document...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="p-3 border-t border-gray-200">
        <div className="flex gap-2">
          <Textarea
            placeholder="Ask a question..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="resize-none min-h-[60px]"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSendMessage()
              }
            }}
          />
          <Button size="icon" onClick={handleSendMessage} disabled={!input.trim() || isLoading}>
            <Send size={18} />
          </Button>
        </div>
      </div>
    </div>
  )
}

