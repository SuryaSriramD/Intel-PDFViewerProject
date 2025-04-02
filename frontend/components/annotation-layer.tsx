import type { Annotation } from "@/contexts/annotation-context"

interface AnnotationLayerProps {
  annotations: Annotation[]
  scale: number
}

export default function AnnotationLayer({ annotations, scale }: AnnotationLayerProps) {
  return (
    <>
      {annotations.map((annotation) => {
        const { id, type, position, color } = annotation
        const { x, y, width, height } = position

        // Apply scale to position
        const scaledX = x * scale
        const scaledY = y * scale
        const scaledWidth = width * scale
        const scaledHeight = height * scale

        return (
          <div
            key={id}
            className="absolute pointer-events-none"
            style={{
              left: scaledX,
              top: scaledY,
              width: scaledWidth,
              height: scaledHeight,
              backgroundColor: 
                type === "highlight" ? `${color}66` : 
                type === "rectangle" ? `${color}33` : 
                type === "text-highlight" ? `${color}66` : 
                "transparent",
              border: 
                type === "rectangle" ? `2px solid ${color}` : 
                type === "clip" ? `2px dashed ${color}` : 
                "none",
              boxShadow: type === "note" ? `0 0 0 2px ${color}` : "none",
              zIndex: 10
            }}
          >
            {type === "note" && (
              <div
                className="absolute -top-5 -left-1 w-6 h-6 flex items-center justify-center rounded-full text-white text-xs"
                style={{ backgroundColor: color }}
              >
                <span>i</span>
              </div>
            )}
          </div>
        )
      })}
    </>
  )
}

