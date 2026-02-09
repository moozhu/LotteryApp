import { useState, useEffect, useCallback } from 'react'

interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

let addToastFn: ((message: string, type?: Toast['type']) => void) | null = null

export function toast(message: string, type: Toast['type'] = 'success') {
  addToastFn?.(message, type)
}

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((message: string, type: Toast['type'] = 'success') => {
    const id = Math.random().toString(36).substring(2)
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3000)
  }, [])

  useEffect(() => {
    addToastFn = addToast
    return () => { addToastFn = null }
  }, [addToast])

  if (toasts.length === 0) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none">
      <div className="flex flex-col gap-3">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`animate-fade-in-up px-6 py-4 rounded-xl shadow-2xl font-body text-base font-medium max-w-md pointer-events-auto
              ${t.type === 'success' ? 'bg-green-600 text-white' : ''}
              ${t.type === 'error' ? 'bg-red-600 text-white' : ''}
              ${t.type === 'info' ? 'bg-card text-card-foreground border border-border' : ''}
            `}
          >
            {t.message}
          </div>
        ))}
      </div>
    </div>
  )
}
