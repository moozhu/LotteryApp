import { X, Coffee } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'

interface DonationModalProps {
  open: boolean
  onClose: () => void
}

export function DonationModal({ open, onClose }: DonationModalProps) {
  return (
    <Modal open={open} onClose={onClose}>
      <div className="w-full max-w-sm mx-auto">
        {/* Close button - top right */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-accent transition-colors"
        >
          <X className="w-5 h-5 text-muted-foreground" />
        </button>

        {/* Content - centered, 1:1 aspect ratio feel */}
        <div className="flex flex-col items-center text-center py-4">
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
    </Modal>
  )
}
