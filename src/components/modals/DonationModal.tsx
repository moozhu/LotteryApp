import { X, Coffee, Heart, Gift } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'

interface DonationModalProps {
  open: boolean
  onClose: () => void
}

export function DonationModal({ open, onClose }: DonationModalProps) {
  return (
    <Modal open={open} onClose={onClose}>
      <div className="w-full max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
              <Coffee className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-foreground">请作者喝一杯咖啡</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-accent transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* Thank you message */}
          <div className="text-center space-y-2">
            <p className="text-muted-foreground leading-relaxed">
              感谢您使用幸运大抽奖应用！<br />
              您的支持是我持续开发和维护的动力
            </p>
          </div>

          {/* QR Code Placeholder */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-48 h-48 rounded-2xl bg-muted border-2 border-dashed border-border flex flex-col items-center justify-center gap-3">
                <Gift className="w-12 h-12 text-muted-foreground/50" />
                <span className="text-sm text-muted-foreground">打赏二维码</span>
                <span className="text-xs text-muted-foreground/60">（待添加）</span>
              </div>
              {/* Decorative elements */}
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-primary rounded-full flex items-center justify-center animate-pulse">
                <Heart className="w-3 h-3 text-white" />
              </div>
            </div>
          </div>

          {/* Support info */}
          <div className="bg-accent/30 rounded-xl p-4 space-y-2">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Heart className="w-4 h-4 text-primary" />
              您的支持将用于
            </h3>
            <ul className="text-sm text-muted-foreground space-y-1 ml-6">
              <li>• 持续优化应用功能和体验</li>
              <li>• 开发更多实用的抽奖主题</li>
              <li>• 维护服务器和域名费用</li>
              <li>• 支持开源社区发展</li>
            </ul>
          </div>

          {/* Footer */}
          <div className="text-center pt-2">
            <p className="text-xs text-muted-foreground/60">
              每一份支持都弥足珍贵，感谢您的慷慨！
            </p>
          </div>
        </div>
      </div>
    </Modal>
  )
}
