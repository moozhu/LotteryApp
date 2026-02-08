import { useLotteryStore } from '@/store/lottery'
import { Modal } from '@/components/ui/Modal'
import { PRIZE_ICONS } from '@/types'
import { formatDate, downloadFile } from '@/lib/utils'
import { Download } from 'lucide-react'
import { toast } from '@/components/ui/Toaster'

interface Props {
  open: boolean
  onClose: () => void
}

export function WinnerListModal({ open, onClose }: Props) {
  const { prizes, winners } = useLotteryStore()

  const exportWinnersCsv = () => {
    if (winners.length === 0) {
      toast('暂无中奖记录', 'info')
      return
    }
    const header = '奖项,工号,姓名,部门,中奖时间\n'
    const rows = winners.map(w => {
      const prize = prizes.find(p => p.id === w.prizeId)
      return `${prize?.name || ''},${w.participant.employeeId},${w.participant.name},${w.participant.department || ''},${formatDate(w.wonAt)}`
    }).join('\n')
    downloadFile(header + rows, `中奖名单_${new Date().toLocaleDateString('zh-CN')}.csv`)
    toast('导出成功')
  }

  return (
    <Modal open={open} onClose={onClose} title="中奖名单" size="lg">
      <div className="p-6">
        {/* Stats */}
        <div className="mb-6 p-4 rounded-xl bg-accent/50 text-sm text-foreground">
          共 <span className="font-bold">{winners.length}</span> 人中奖 ·{' '}
          {prizes.filter(p => winners.some(w => w.prizeId === p.id)).length} 个奖项已抽取
        </div>

        {winners.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg mb-2">暂无中奖记录</p>
            <p className="text-sm">开始抽奖后，中奖名单将在此显示</p>
          </div>
        ) : (
          <div className="space-y-6">
            {prizes
              .filter(p => winners.some(w => w.prizeId === p.id))
              .sort((a, b) => a.order - b.order)
              .map(prize => {
                const prizeWinners = winners.filter(w => w.prizeId === prize.id)
                const icon = PRIZE_ICONS[prize.order] || '🎁'
                return (
                  <div key={prize.id}>
                    <h3 className="font-display font-bold text-foreground mb-3 flex items-center gap-2">
                      <span>{icon}</span>
                      {prize.name}
                      <span className="text-sm font-normal text-muted-foreground">
                        ({prizeWinners.length}/{prize.count})
                      </span>
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {prizeWinners.map(w => (
                        <div key={w.id} className="p-3 rounded-xl bg-muted border border-border">
                          <p className="font-bold text-foreground">{w.participant.name}</p>
                          <p className="text-xs text-muted-foreground">{w.participant.employeeId}</p>
                          {w.participant.department && (
                            <p className="text-xs text-muted-foreground">{w.participant.department}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">{formatDate(w.wonAt)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
          </div>
        )}

        {/* Export Button */}
        {winners.length > 0 && (
          <div className="mt-6 pt-4 border-t border-border">
            <button
              onClick={exportWinnersCsv}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-gradient-primary text-primary-foreground hover:opacity-90 transition-opacity"
            >
              <Download size={16} />
              导出中奖名单
            </button>
          </div>
        )}
      </div>
    </Modal>
  )
}
