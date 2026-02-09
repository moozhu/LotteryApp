import { useEffect, useCallback } from 'react'
import { X, Coffee } from 'lucide-react'

interface DonationModalProps {
  open: boolean
  onClose: () => void
}

export function DonationModal({ open, onClose }: DonationModalProps) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
  }, [onClose])

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, handleKeyDown])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div className="relative w-full max-w-sm bg-card text-card-foreground rounded-2xl shadow-2xl animate-scale-in p-6">
        {/* Close button - top right only */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        >
          <X size={18} />
        </button>

        {/* Content - centered */}
        <div className="flex flex-col items-center text-center pt-2">
          {/* Title with icon */}
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
              <Coffee className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-lg font-bold text-foreground">请 moozhu 喝一杯咖啡</h2>
          </div>

          {/* Thank you message */}
          <p className="text-sm text-muted-foreground mb-6">
            感谢您的使用，谢谢支持
          </p>

          {/* QR Code Placeholder */}
          <div className="w-48 h-48 rounded-2xl bg-muted border-2 border-dashed border-border flex flex-col items-center justify-center gap-2">
            <span className="text-4xl text-muted-foreground/50">📱</span>
            <span className="text-sm text-muted-foreground">打赏二维码</span>
          </div>
        </div>
      </div>
    </div>
  )
}
