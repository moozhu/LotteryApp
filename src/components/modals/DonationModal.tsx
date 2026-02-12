import { useEffect, useCallback } from 'react'
import { X, User, Github, Mail, Heart } from 'lucide-react'

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
          {/* Avatar */}
          <div className="w-20 h-20 rounded-full bg-gradient-primary flex items-center justify-center mb-4 shadow-lg">
            <User className="w-10 h-10 text-white" />
          </div>

          {/* Author Name */}
          <h2 className="text-xl font-bold text-foreground mb-2">moozhu</h2>

          {/* Description */}
          <p className="text-sm text-muted-foreground mb-6">
            创作者 · 前端开发者
          </p>

          {/* Info Cards */}
          <div className="w-full space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Github className="w-4 h-4 text-primary" />
              </div>
              <div className="text-left">
                <p className="text-xs text-muted-foreground">GitHub</p>
                <p className="text-sm font-medium text-foreground">@moozhu</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Mail className="w-4 h-4 text-primary" />
              </div>
              <div className="text-left">
                <p className="text-xs text-muted-foreground">邮箱</p>
                <p className="text-sm font-medium text-foreground">moozhu@example.com</p>
              </div>
            </div>
          </div>

          {/* Thank you */}
          <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
            <Heart className="w-4 h-4 text-red-500 fill-red-500" />
            <span>感谢您的使用与支持</span>
          </div>
        </div>
      </div>
    </div>
  )
}
