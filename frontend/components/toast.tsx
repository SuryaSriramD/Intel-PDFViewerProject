"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

export type ToastProps = {
  title: string
  description?: string
  variant?: "default" | "destructive"
  duration?: number
  onClose?: () => void
}

export function Toast({ title, description, variant = "default", duration = 5000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      onClose?.()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  if (!isVisible) return null

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-50 flex w-full max-w-md items-center rounded-lg border p-4 shadow-lg",
        variant === "destructive"
          ? "border-red-200 bg-red-50 text-red-800"
          : "border-green-200 bg-green-50 text-green-800",
      )}
    >
      <div className="flex-1">
        <h3 className="font-medium">{title}</h3>
        {description && <p className="mt-1 text-sm opacity-90">{description}</p>}
      </div>
      <button
        onClick={() => {
          setIsVisible(false)
          onClose?.()
        }}
        className="ml-4 rounded-full p-1 hover:bg-black/5"
      >
        <X size={16} />
      </button>
    </div>
  )
}

export function useToast() {
  const [toasts, setToasts] = useState<(ToastProps & { id: string })[]>([])

  const toast = (props: ToastProps) => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { ...props, id }])
    return id
  }

  const dismiss = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  return {
    toast,
    dismiss,
    toasts,
    ToastContainer: () => (
      <div className="fixed bottom-0 right-0 z-50 flex flex-col gap-2 p-4">
        {toasts.map((t) => (
          <Toast key={t.id} {...t} onClose={() => dismiss(t.id)} />
        ))}
      </div>
    ),
  }
}

