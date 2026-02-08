import { useNavigate } from 'react-router-dom'
import { Modal } from '@/components/ui/Modal'
import { Sparkles } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
}

export function FirstTimeGuideModal({ open, onClose }: Props) {
  const navigate = useNavigate()

  const handleGoSettings = () => {
    onClose()
    navigate('/settings?tab=participants')
  }

  return (
    <Modal open={open} onClose={onClose} title="" closable={true} size="sm">
      <div className="p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow">
          <Sparkles size={28} className="text-primary-foreground" />
        </div>

        <h2 className="text-xl font-display font-bold text-foreground mb-2">
          欢迎使用幸运大抽奖
        </h2>

        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
          开始使用前，请先设置参与者名单。<br/>
          您可以手动添加、批量导入 CSV 文件，或自动生成号码区间。
        </p>

        <button
          onClick={handleGoSettings}
          className="w-full py-3 rounded-xl text-sm font-bold bg-gradient-primary text-primary-foreground shadow-glow hover:shadow-glow-lg transition-shadow"
        >
          前往设置参与者
        </button>

        <button
          onClick={onClose}
          className="mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          稍后设置
        </button>
      </div>
    </Modal>
  )
}
