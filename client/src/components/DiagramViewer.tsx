import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react'

export type HighlightStatus = 'running' | 'ok' | 'error' | 'gateway-taken' | null

export interface DiagramViewerHandle {
  loadXML: (xml: string) => Promise<void>
  highlight: (elementId: string, status: HighlightStatus) => void
  clearHighlights: () => void
}

const STATUS_CLASS: Record<NonNullable<HighlightStatus>, string> = {
  running: 'element-running',
  ok: 'element-ok',
  error: 'element-error',
  'gateway-taken': 'element-gateway-taken',
}

const DiagramViewer = forwardRef<DiagramViewerHandle, { hasXml: boolean }>(
  ({ hasXml }, ref) => {
    const canvasRef = useRef<HTMLDivElement>(null)
    const viewerRef = useRef<any>(null)
    const activeMarkers = useRef<Map<string, string>>(new Map())

    useEffect(() => {
      if (!canvasRef.current) return
      const BpmnJS = (window as any).BpmnJS
      viewerRef.current = new BpmnJS({ container: canvasRef.current })
      return () => {
        viewerRef.current?.destroy()
      }
    }, [])

    useImperativeHandle(ref, () => ({
      async loadXML(xml: string) {
        if (!viewerRef.current) return
        await viewerRef.current.importXML(xml)
        viewerRef.current.get('canvas').zoom('fit-viewport')
        activeMarkers.current.clear()
      },

      highlight(elementId: string, status: HighlightStatus) {
        const canvas = viewerRef.current?.get('canvas')
        if (!canvas) return

        // Remove previous marker for this element
        const prev = activeMarkers.current.get(elementId)
        if (prev) {
          try { canvas.removeMarker(elementId, prev) } catch { /* noop */ }
        }

        if (status === null) {
          activeMarkers.current.delete(elementId)
          return
        }

        const cls = STATUS_CLASS[status]
        try {
          canvas.addMarker(elementId, cls)
          activeMarkers.current.set(elementId, cls)
        } catch { /* element may not exist */ }
      },

      clearHighlights() {
        const canvas = viewerRef.current?.get('canvas')
        if (!canvas) return
        activeMarkers.current.forEach((cls, id) => {
          try { canvas.removeMarker(id, cls) } catch { /* noop */ }
        })
        activeMarkers.current.clear()
      },
    }))

    return (
      <div className="diagram-canvas" ref={canvasRef}>
        {!hasXml && (
          <div className="drop-hint">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
            <span>Drop a .bpmn file or click "Load BPMN"</span>
          </div>
        )}
      </div>
    )
  }
)

DiagramViewer.displayName = 'DiagramViewer'
export default DiagramViewer
