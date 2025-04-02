"use client"

import { createContext, useContext, useState, type ReactNode, useCallback, useRef } from "react"

export type AnnotationType = "highlight" | "rectangle" | "note" | "clip" | "text-highlight" | "none"

export interface Annotation {
  id: string
  type: AnnotationType
  pageNumber: number
  position: {
    x: number
    y: number
    width: number
    height: number
  }
  content?: string
  textContent?: string
  color: string
  createdAt: Date
}

interface AnnotationContextType {
  annotations: Annotation[]
  currentTool: AnnotationType
  currentColor: string
  setCurrentTool: (tool: AnnotationType) => void
  setCurrentColor: (color: string) => void
  addAnnotation: (annotation: Omit<Annotation, "id" | "createdAt">) => void
  addTextHighlight: (pageNumber: number, position: { x: number; y: number; width: number; height: number }, textContent: string, color: string) => void
  removeAnnotation: (id: string) => void
  updateAnnotation: (id: string, data: Partial<Annotation>) => void
  clearAllAnnotations: () => void
  saveAnnotations: (pdfId: string) => Promise<void>
  loadAnnotations: (pdfId: string) => Promise<void>
}

const AnnotationContext = createContext<AnnotationContextType | undefined>(undefined)

export function AnnotationProvider({ children }: { children: ReactNode }) {
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [currentTool, setCurrentTool] = useState<AnnotationType>("none")
  const [currentColor, setCurrentColor] = useState<string>("#FFEB3B") // Yellow default
  const lastLoadedPdfId = useRef<string | null>(null)

  const addAnnotation = (annotation: Omit<Annotation, "id" | "createdAt">) => {
    const newAnnotation: Annotation = {
      ...annotation,
      id: Date.now().toString(),
      createdAt: new Date(),
    }
    setAnnotations((prev) => [...prev, newAnnotation])
  }

  const addTextHighlight = (
    pageNumber: number, 
    position: { x: number; y: number; width: number; height: number }, 
    textContent: string,
    color: string
  ) => {
    const newAnnotation: Annotation = {
      type: "text-highlight",
      pageNumber,
      position,
      textContent,
      color,
      id: Date.now().toString(),
      createdAt: new Date(),
    }
    setAnnotations((prev) => [...prev, newAnnotation])
  }

  const removeAnnotation = (id: string) => {
    setAnnotations((prev) => prev.filter((a) => a.id !== id))
  }

  const updateAnnotation = (id: string, data: Partial<Annotation>) => {
    setAnnotations((prev) => prev.map((a) => (a.id === id ? { ...a, ...data } : a)))
  }

  const clearAllAnnotations = () => {
    setAnnotations([])
  }

  const saveAnnotations = async (pdfId: string) => {
    try {
      await fetch("http://localhost:8000/highlights/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pdf_id: pdfId,
          user_id: "default-user",
          highlights: annotations,
        }),
      })
    } catch (error) {
      console.error("Error saving annotations:", error)
    }
  }

  const loadAnnotations = useCallback(async (pdfId: string) => {
    try {
      // Add debounce protection - don't load the same PDF annotations repeatedly
      if (pdfId === lastLoadedPdfId.current) {
        console.log("Skipping duplicate annotation load request");
        return;
      }
      
      lastLoadedPdfId.current = pdfId;
      
      const response = await fetch(`http://localhost:8000/highlights/${pdfId}`);
      
      if (!response.ok) {
        console.error("Failed to load annotations", response.statusText);
        return; // Fail silently instead of throwing
      }
      
      const data = await response.json();
      
      // Find all highlights from all documents
      let allAnnotations: Annotation[] = [];
      
      if (data.highlights && Array.isArray(data.highlights)) {
        data.highlights.forEach((doc: any) => {
          if (doc.highlights && Array.isArray(doc.highlights)) {
            // Map the highlights to our Annotation format
            const mappedHighlights = doc.highlights.map((h: any) => ({
              ...h,
              id: h.id || `highlight-${Math.random().toString(36).substr(2, 9)}`,
              createdAt: new Date(h.createdAt || Date.now()),
            }));
            allAnnotations = [...allAnnotations, ...mappedHighlights];
          }
        });
      }
      
      setAnnotations(allAnnotations);
    } catch (error) {
      console.error("Error loading annotations:", error);
      // Do not throw - just log the error
    }
  }, []);

  return (
    <AnnotationContext.Provider
      value={{
        annotations,
        currentTool,
        currentColor,
        setCurrentTool,
        setCurrentColor,
        addAnnotation,
        addTextHighlight,
        removeAnnotation,
        updateAnnotation,
        clearAllAnnotations,
        saveAnnotations,
        loadAnnotations,
      }}
    >
      {children}
    </AnnotationContext.Provider>
  )
}

export function useAnnotations() {
  const context = useContext(AnnotationContext)
  if (!context) {
    throw new Error("useAnnotations must be used within an AnnotationProvider")
  }
  return context
}

