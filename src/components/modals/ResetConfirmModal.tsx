import { useState } from 'react'
import { useLotteryStore } from '@/store/lottery'
import { Modal } from '@/components/ui/Modal'
import { AlertTriangle } from 'lucide-react'
import { toast } from '@/components/ui/Toaster'

interface Props {
  open: boolean
  onClose: () => void
}

export function ResetConfirmModal({ open, onClose }: Props) {
  const { participants, winners, prizes, resetAll } = useLotteryStore()
  const [resetWinners, setResetWinners] = useState(true)
  const [resetParticipants, setResetParticipants] = useState(false)
  const [resetPrizes, setResetPrizes] = useState(false)

  const handleReset = () => {
    resetAll({ winners: resetWinners, participants: resetParticipants, prizes: resetPrizes })
    toast('数据已重置')
    onClose()
    setResetWinners(true)
    setResetParticipants(false)
    setResetPrizes(false)
  }

  return (
    <Modal open={open} onClose={onClose} title="重置数据" size="sm">
      <div className="p-6">
        <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 text-destructive mb-6">
          <AlertTriangle size={20} />
          <div>
            <p className="font-bold text-sm">此操作不可恢复</p>
            <p className="text-xs mt-0.5 opacity-80">清除后的数据无法找回，请谨慎操作</p>
          </div>
        </div>

        <p className="text-sm text-foreground font-medium mb-4">请选择要清除的数据：</p>

        <div className="space-y-3">
          <label className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={resetWinners}
              onChange={e => setResetWinners(e.target.checked)}
              className="w-4 h-4 accent-primary rounded"
            />
            <div>
              <p className="text-sm font-medium text-foreground">清除中奖记录</p>
              <p className="text-xs text-muted-foreground">已中奖 {winners.length} 人</p>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={resetParticipants}
              onChange={e => setResetParticipants(e.target.checked)}
              className="w-4 h-4 accent-primary rounded"
            />
            <div>
              <p className="text-sm font-medium text-foreground">清除参与者</p>
              <p className="text-xs text-muted-foreground">当前 {participants.length} 人</p>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={resetPrizes}
              onChange={e => setResetPrizes(e.target.checked)}
              className="w-4 h-4 accent-primary rounded"
            />
            <div>
              <p className="text-sm font-medium text-foreground">清除奖项</p>
              <p className="text-xs text-muted-foreground">当前 {prizes.length} 个奖项，清除后恢复默认</p>
            </div>
          </label>
        </div>

        {resetParticipants && (
          <div className="mt-4 p-3 rounded-xl bg-accent text-sm text-foreground">
            提示：清除参与者后，需要重新设置才能开始抽奖
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-border hover:bg-muted transition-colors text-foreground"
          >
            取消
          </button>
          <button
            onClick={handleReset}
            disabled={!resetWinners && !resetParticipants && !resetPrizes}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-destructive text-destructive-foreground hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            确认重置
          </button>
        </div>
      </div>
    </Modal>
  )
}
