import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useLotteryStore } from '@/store/lottery'
import { PRIZE_ICONS } from '@/types'
import type { Participant, DrawStatus } from '@/types'
import { ArrowLeft } from 'lucide-react'
import confetti from 'canvas-confetti'
import ParticleBackground from '@/components/ui/ParticleBackground'
import FireworkEffect from '@/components/ui/FireworkEffect'
import { soundManager } from '@/lib/sound'

export default function DrawPage() {
  const { prizeId } = useParams<{ prizeId: string }>()
  const navigate = useNavigate()
  const store = useLotteryStore()
  const { settings } = store

  const prize = store.prizes.find(p => p.id === prizeId)
  const prizeWinners = store.winners.filter(w => w.prizeId === prizeId)
  const drawn = prizeWinners.length
  const remaining = prize ? prize.count - drawn : 0

  const [status, setStatus] = useState<DrawStatus>('idle')
  const [currentWinners, setCurrentWinners] = useState<Participant[]>([])
  const [rotation, setRotation] = useState(0)
  const [speed, setSpeed] = useState(0.5)
  const animRef = useRef<number>(0)
  const containerRef = useRef<HTMLDivElement>(null)

  // Slot machine state


  const availableParticipants = store.getAvailableParticipants()
  const drawCount = store.settings.drawMode === 'single' ? 1 : remaining
  const icon = prize ? (PRIZE_ICONS[prize.order] || '🎁') : '🎁'

  // 检查是否参与人数不足
  const showWarning = availableParticipants.length < remaining && status === 'idle'

  // 3D Cloud Animation with sound
  useEffect(() => {
    let running = true
    let tickCounter = 0
    const animate = () => {
      if (!running) return
      setRotation(prev => prev + speed)

      // Play tick sound based on speed
      if (status === 'drawing' || status === 'slowing') {
        tickCounter++
        // Higher speed = more frequent ticks, higher pitch
        const tickInterval = Math.max(2, Math.floor(10 - speed))
        if (tickCounter >= tickInterval) {
          tickCounter = 0
          const intensity = Math.min(1, speed / 8)
          soundManager.playDrawTick(intensity)
        }
      }

      animRef.current = requestAnimationFrame(animate)
    }
    animRef.current = requestAnimationFrame(animate)
    return () => {
      running = false
      cancelAnimationFrame(animRef.current)
    }
  }, [speed, status])

  const getCloudItemStyle = useCallback((index: number, total: number) => {
    const phi = Math.acos(-1 + (2 * index + 1) / total)
    const theta = Math.sqrt(total * Math.PI) * phi + (rotation * Math.PI) / 180

    const radius = Math.min(450, Math.max(220, total * 9))
    const x = Math.cos(theta) * Math.sin(phi) * radius
    const y = Math.cos(phi) * radius * 0.6
    const z = Math.sin(theta) * Math.sin(phi) * radius

    const scale = (z + radius) / (2 * radius) * 0.6 + 0.4
    const opacity = (z + radius) / (2 * radius) * 0.7 + 0.3

    return {
      transform: `translate(-50%, -50%) translate3d(${x}px, ${y}px, ${z}px) scale(${scale})`,
      opacity,
      zIndex: Math.round(z + radius),
      fontSize: `${Math.max(12, 14 * scale)}px`,
    }
  }, [rotation])

  const fireConfetti = () => {
    const duration = 3000
    const end = Date.now() + duration

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: ['#E53935', '#FFD54F', '#FF6F61', '#FFC107'],
      })
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: ['#E53935', '#FFD54F', '#FF6F61', '#FFC107'],
      })
      if (Date.now() < end) requestAnimationFrame(frame)
    }
    frame()

    setTimeout(() => {
      confetti({
        particleCount: 100,
        spread: 100,
        origin: { y: 0.5 },
        colors: ['#E53935', '#FFD54F', '#FF6F61', '#FFC107', '#FFFFFF'],
      })
    }, 500)
  }


  const handleDraw = () => {
    if (status !== 'idle' || remaining <= 0) return

    setStatus('preparing')
    setCurrentWinners([])

    // Pre-calculate winners
    const winners = store.drawWinners(prizeId!, drawCount)
    if (winners.length === 0) return

    // Phase 1: Speed up
    setSpeed(8)
    setStatus('drawing')

    // Phase 2: Slow down
    setTimeout(() => {
      setSpeed(0.3)
      setStatus('slowing')
    }, 2500)

    // Phase 3: Reveal
    setTimeout(() => {
      setSpeed(0)
      setStatus('finished')
      setCurrentWinners(winners)
      fireConfetti()
      // Play win sound - layered celebratory effect
      soundManager.playWin()
    }, 3500)
  }

  const handleContinue = () => {
    setStatus('idle')
    setCurrentWinners([])
    setSpeed(0.5)
  }

  if (!prize) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">奖项不存在</p>
      </div>
    )
  }

  const updatedRemaining = prize.count - store.winners.filter(w => w.prizeId === prizeId).length

  return (
    <div className="min-h-screen flex flex-col bg-gradient-bg relative overflow-hidden">
      <ParticleBackground />
      <FireworkEffect isActive={true} />
      {/* Top Bar */}
      <header className="relative z-10 flex items-center justify-between px-4 sm:px-8 py-4">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium hover:bg-accent transition-colors text-foreground"
        >
          <ArrowLeft size={18} />
          <span className="hidden sm:inline">返回</span>
        </button>
        <div className="flex items-center gap-3 text-foreground">
          <span className="text-xl">{icon}</span>
          <span className="font-display font-bold text-lg">{prize.name}</span>
          <span className="text-sm text-muted-foreground">·</span>
          <span className="text-sm text-muted-foreground">{prize.prizeName}</span>
        </div>
        <div className="text-sm text-muted-foreground font-medium">
          {drawn}/{prize.count} 已抽取
        </div>
      </header>

      {/* Main Animation Area */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4">
        {/* Current Round Winners */}
        {currentWinners.length > 0 && status === 'finished' && (
          <div className="mb-8 w-full max-w-4xl animate-fade-in-up">
            <h3 className="text-sm font-bold text-foreground mb-3 text-center">本轮中奖</h3>
            <div className="flex flex-wrap justify-center gap-4 mx-auto items-center">
              {currentWinners.map(w => (
                <div
                  key={w.id}
                  className="w-[30%] min-w-[240px] max-w-[320px] px-6 py-4 rounded-xl bg-card border border-primary/20 shadow-sm flex items-center gap-4 justify-center"
                >
                  <div className="text-center w-full flex items-center justify-center gap-3">
                    <p className="font-bold text-xl text-foreground whitespace-nowrap">{w.name}</p>
                    <div className="h-4 w-[1px] bg-border"></div>
                    <p className="text-sm text-muted-foreground whitespace-nowrap">
                      {w.employeeId}{w.department && ` · ${w.department}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3D Cloud Animation */}
        <div
          ref={containerRef}
          className="cloud-container relative w-full max-w-4xl aspect-square flex items-center justify-center"
          style={{ minHeight: '600px' }}
        >
          <div className="cloud-sphere relative w-full h-full">
            {status === 'finished' ? (
               // Winner display handled above cloud now, so this can be empty or show something else if needed
               // But to keep the structure, we might just hide the cloud items or show a celebration effect
               <div className="absolute inset-0 flex items-center justify-center">
                  {/* Optional: Central Celebration Icon or Text */}
               </div>
            ) : (
              /* Rotating Names */
              availableParticipants.slice(0, 80).map((p, i) => (
                <div
                  key={p.id}
                  className="cloud-item px-3 py-1.5 rounded-lg font-body font-medium whitespace-nowrap"
                  style={{
                    ...getCloudItemStyle(i, Math.min(availableParticipants.length, 80)),
                    color: 'var(--foreground)',
                    backgroundColor: 'var(--accent)',
                    border: '1px solid var(--border)',
                  }}
                >
                  {p.name}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Draw Button */}
        <div className="mt-8 sm:mt-12">
          {status === 'idle' && updatedRemaining > 0 && (
            <div>
              {showWarning && (
                <div className="mb-4 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-600 dark:text-yellow-400 text-sm text-center">
                  <p>⚠️ 注意：剩余参与者数量 ({availableParticipants.length}) 少于当前奖项剩余名额 ({updatedRemaining})</p>
                  <p className="mt-1">
                    <button 
                      onClick={() => navigate('/settings?tab=participants')} 
                      className="text-primary underline font-medium hover:no-underline"
                    >
                      去添加参与者
                    </button>
                  </p>
                </div>
              )}
              <button
                onClick={handleDraw}
                disabled={showWarning}
                className={`px-12 py-4 rounded-2xl text-lg font-bold bg-gradient-primary text-primary-foreground shadow-glow hover:shadow-glow-lg transition-all duration-300 hover:scale-105 active:scale-95 ${showWarning ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                🎲 开始抽奖
              </button>
            </div>
          )}
          {(status === 'drawing' || status === 'preparing' || status === 'slowing') && (
            <div className="px-12 py-4 rounded-2xl text-lg font-bold bg-gradient-primary text-primary-foreground opacity-80 animate-pulse-glow">
              抽奖中...
            </div>
          )}
          {status === 'finished' && (
            <div className="flex gap-4">
              {updatedRemaining > 0 && (
                <button
                  onClick={handleContinue}
                  className="px-8 py-3 rounded-xl text-sm font-bold bg-gradient-primary text-primary-foreground shadow-glow hover:shadow-glow-lg transition-all"
                >
                  继续抽奖 ({updatedRemaining} 名额)
                </button>
              )}
              <button
                onClick={() => navigate('/')}
                className={`px-8 py-3 rounded-xl text-sm font-medium border border-border transition-colors text-foreground ${settings.theme === 'red' ? 'bg-yellow-400 text-foreground hover:bg-yellow-500' : 'hover:bg-accent'}`}
              >
                返回首页
              </button>
            </div>
          )}
          {updatedRemaining <= 0 && status === 'idle' && (
            <button
              onClick={() => navigate('/')}
              className={`px-8 py-3 rounded-xl text-sm font-medium border border-border transition-colors text-foreground ${settings.theme === 'red' ? 'bg-yellow-400 text-foreground hover:bg-yellow-500' : 'hover:bg-accent'}`}
            >
              该奖项已抽完，返回首页
            </button>
          )}
        </div>

        {/* All Winners for this Prize */}
        {prizeWinners.length > 0 && status === 'idle' && (
          <div className="mt-8 w-full max-w-2xl">
            <h3 className="text-sm font-bold text-foreground mb-3 text-center">
              已中奖 ({prizeWinners.length}/{prize.count})
            </h3>
            <div className="flex flex-wrap justify-center gap-2">
              {prizeWinners.map(w => (
                <div
                  key={w.id}
                  className="px-3 py-1.5 rounded-lg bg-accent text-xs font-medium text-foreground"
                >
                  {w.participant.name}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
