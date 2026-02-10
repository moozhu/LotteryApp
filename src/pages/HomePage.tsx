import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLotteryStore } from '@/store/lottery'
import FireworkEffect from '@/components/ui/FireworkEffect'
import ParticleBackground from '@/components/ui/ParticleBackground'
import { Users, Trophy, Settings, Maximize, RotateCcw, Sparkles, Gift, Coffee } from 'lucide-react'
import { PRIZE_ICONS } from '@/types'
import { WinnerListModal } from '@/components/modals/WinnerListModal'
import { ResetConfirmModal } from '@/components/modals/ResetConfirmModal'
import { FirstTimeGuideModal } from '@/components/modals/FirstTimeGuideModal'
import { DonationModal } from '@/components/modals/DonationModal'

// 奖项图片组件 - 支持本地图片和默认图标
function PrizeImage({ prize, className = '' }: { prize: { prizeImage?: string; order: number }; className?: string }) {
  const [imageError, setImageError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  
  // 如果有本地图片且未加载失败，显示图片
  if (prize.prizeImage && !imageError) {
    return (
      <div className={`relative ${className}`}>
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        )}
        <img
          src={prize.prizeImage}
          alt="奖品图片"
          className={`w-full h-full object-contain transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          onError={() => setImageError(true)}
          onLoad={() => setImageLoaded(true)}
        />
      </div>
    )
  }
  
  // 否则显示默认图标
  const icon = PRIZE_ICONS[prize.order] || PRIZE_ICONS[4]
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <span className="text-5xl sm:text-6xl">{icon}</span>
    </div>
  )
}

export default function HomePage() {
  const navigate = useNavigate()
  const { participants, prizes, winners, settings } = useLotteryStore()
  const getWinnersByPrize = useLotteryStore(s => s.getWinnersByPrize)

  const [showWinners, setShowWinners] = useState(false)
  const [showReset, setShowReset] = useState(false)
  const [showGuide, setShowGuide] = useState(false)
  const [showDonation, setShowDonation] = useState(false)

  const totalWinners = winners.length
  const remainingPrizes = prizes.filter(p => getWinnersByPrize(p.id).length < p.count).length

  useEffect(() => {
    if (participants.length === 0) {
      setShowGuide(true)
    }
  }, [])

  const handlePrizeClick = (prizeId: string) => {
    if (participants.length === 0) {
      setShowGuide(true)
      return
    }
    const remaining = useLotteryStore.getState().getRemainingCount(prizeId)
    if (remaining <= 0) return
    navigate(`/draw/${prizeId}`)
  }

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      document.documentElement.requestFullscreen()
    }
  }

  const PRIZE_BG_STYLES: Record<number, string> = {
    1: 'from-[#FFD700]/20 via-[#FFA500]/10 to-transparent border-[#FFD700]/40',
    2: 'from-[#C0C0C0]/20 via-[#A8A8A8]/10 to-transparent border-[#C0C0C0]/40',
    3: 'from-[#CD7F32]/20 via-[#B87333]/10 to-transparent border-[#CD7F32]/40',
    4: 'from-primary/10 via-primary/5 to-transparent border-primary/20',
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-bg relative overflow-hidden">
      <ParticleBackground />
      <FireworkEffect isActive={true} />
      {/* Radial glow behind title */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full opacity-20 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, var(--primary) 0%, transparent 70%)' }}
      />

      {/* Quick Actions Bar */}
      <header className="relative z-10 flex items-center justify-between px-4 sm:px-8 py-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => navigate('/settings?tab=participants')}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium hover:bg-accent/80 transition-colors text-foreground"
          >
            <Users size={17} />
            <span className="hidden sm:inline">参与者</span>
            <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full text-xs font-bold bg-gradient-primary text-primary-foreground">
              {participants.length}
            </span>
          </button>
          <button
            onClick={() => setShowWinners(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium hover:bg-accent/80 transition-colors text-foreground"
          >
            <Trophy size={17} />
            <span className="hidden sm:inline">已中奖</span>
            <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full text-xs font-bold bg-gradient-gold text-secondary-foreground">
              {totalWinners}
            </span>
          </button>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => navigate('/settings')}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium hover:bg-accent/80 transition-colors text-foreground"
            title="设置"
          >
            <Settings size={17} />
            <span className="hidden sm:inline">设置</span>
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl text-sm font-medium hover:bg-accent/80 transition-colors text-foreground"
            title="全屏"
          >
            <Maximize size={17} />
          </button>
          <button
            onClick={() => setShowReset(true)}
            className="p-2 rounded-xl text-sm font-medium hover:bg-accent/80 transition-colors text-foreground"
            title="重置"
          >
            <RotateCcw size={17} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-8 py-6 sm:py-10">
        {/* Title Section */}
        <div className="text-center mb-10 sm:mb-14 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-4">
            <Sparkles size={12} />
            <span>年度盛典</span>
          </div>
          <h1 className="text-fluid-4xl font-display font-bold text-gradient mb-4 tracking-tight leading-tight drop-shadow-sm">
            {settings.title}
          </h1>
          <p className="text-fluid-base text-muted-foreground font-body tracking-wide">
            共 <span className="font-bold text-foreground">{participants.length}</span> 位参与者
            <span className="mx-2 opacity-40">·</span>
            <span className="font-bold text-foreground">{totalWinners}</span> 人已中奖
            <span className="mx-2 opacity-40">·</span>
            <span className="font-bold text-foreground">{remainingPrizes}</span> 个奖项待抽取
          </p>
        </div>

        {/* Prize Grid */}
        <div className="w-full max-w-6xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-7">
          {prizes
            .sort((a, b) => a.order - b.order)
            .map((prize, index) => {
              const prizeWinners = getWinnersByPrize(prize.id)
              const drawn = prizeWinners.length
              const isCompleted = drawn >= prize.count
              const progress = prize.count > 0 ? (drawn / prize.count) * 100 : 0
              const icon = PRIZE_ICONS[prize.order] || PRIZE_ICONS[4]
              const bgStyle = PRIZE_BG_STYLES[Math.min(prize.order, 4)]

              return (
                <div
                  key={prize.id}
                  className={`relative rounded-2xl border overflow-hidden cursor-pointer group transition-all duration-300
                    ${isCompleted
                      ? 'opacity-50 grayscale-[40%] cursor-not-allowed'
                      : 'hover:-translate-y-3 hover:shadow-card-hover active:scale-[0.97]'
                    }
                  `}
                  onClick={() => handlePrizeClick(prize.id)}
                  style={{
                    animationDelay: `${index * 80}ms`,
                    background: 'var(--card)',
                    boxShadow: 'var(--shadow-card)',
                  }}
                >
                  {/* Gradient top accent */}
                  <div className={`absolute inset-0 bg-gradient-to-b ${bgStyle} pointer-events-none`} />

                  {/* Card Content */}
                  <div className="relative z-10 p-6 sm:p-7 flex flex-col items-center text-center">
                    {/* Prize Icon with glow */}
                    <div className={`relative mb-4 w-24 h-24 sm:w-28 sm:h-28 ${isCompleted ? 'opacity-60 grayscale' : ''}`}>
                      <div className="w-full h-full transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                        <PrizeImage prize={prize} className="w-full h-full" />
                      </div>
                      {!isCompleted && (
                        <div className="absolute inset-0 blur-2xl opacity-30 -z-10" style={{
                          background: prize.order === 1 ? '#FFD700' : 'var(--primary)',
                        }} />
                      )}
                    </div>

                    {/* Prize Name */}
                    <h3 className={`text-xl sm:text-2xl font-display font-bold mb-1.5 ${isCompleted ? 'text-muted-foreground' : 'text-foreground'}`}>
                      {prize.name}
                    </h3>

                    {/* Count badge */}
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold mb-2 ${isCompleted ? 'bg-muted text-muted-foreground' : 'bg-accent/60 text-foreground'}`}>
                      {prize.count} 名
                    </div>

                    {/* Prize Description */}
                    <p className={`text-sm font-semibold mb-5 ${isCompleted ? 'text-muted-foreground' : 'text-primary'}`}>
                      {prize.prizeName}
                    </p>

                    {/* Progress */}
                    <div className="w-full mb-1">
                      <div className="progress-bar mb-1.5">
                        <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {drawn}/{prize.count} 已抽取
                      </p>
                    </div>

                    {/* Draw Button / Completed Button */}
                    <div className="mt-4 w-full">
                      {isCompleted ? (
                        <div className="w-full py-3 rounded-xl text-sm font-bold bg-muted text-muted-foreground text-center border-2 border-border cursor-not-allowed">
                          已抽完
                        </div>
                      ) : (
                        <div className="w-full py-3 rounded-xl text-sm font-bold bg-gradient-primary text-primary-foreground text-center shadow-glow transition-all duration-300 group-hover:shadow-glow-lg group-hover:brightness-110">
                          开始抽奖
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
        </div>
      </main>

      {/* Donation Entry */}
      {settings.showDonation && (
        <footer className="relative z-10 py-6 text-center">
          <div className="flex items-center justify-center gap-3">
            <span className="text-sm text-muted-foreground">请 moozhu 喝一杯咖啡</span>
            <button
              onClick={() => setShowDonation(true)}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <Coffee className="w-3.5 h-3.5" />
              <span>请客</span>
            </button>
          </div>
        </footer>
      )}

      {/* Modals */}
      <WinnerListModal open={showWinners} onClose={() => setShowWinners(false)} />
      <ResetConfirmModal open={showReset} onClose={() => setShowReset(false)} />
      <FirstTimeGuideModal open={showGuide} onClose={() => setShowGuide(false)} />
      <DonationModal open={showDonation} onClose={() => setShowDonation(false)} />
    </div>
  )
}
