import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useLotteryStore } from '@/store/lottery'
import { PRIZE_ICONS } from '@/types'
import type { Participant, DrawStatus } from '@/types'
import { ArrowLeft } from 'lucide-react'
import confetti from 'canvas-confetti'

export default function DrawPage() {
  const { prizeId } = useParams<{ prizeId: string }>()
  const navigate = useNavigate()
  const store = useLotteryStore()

  const prize = store.prizes.find(p => p.id === prizeId)
  const prizeWinners = store.winners.filter(w => w.prizeId === prizeId)
  const drawn = prizeWinners.length
  const remaining = prize ? prize.count - drawn : 0
  const animationMode = store.settings.animationMode

  const [status, setStatus] = useState<DrawStatus>('idle')
  const [currentWinners, setCurrentWinners] = useState<Participant[]>([])
  const [rotation, setRotation] = useState(0)
  const [speed, setSpeed] = useState(0.5)
  const animRef = useRef<number>(0)
  const containerRef = useRef<HTMLDivElement>(null)

  // Slot machine state
  const [slotOffsets, setSlotOffsets] = useState<number[]>([0, 0, 0])
  const slotTimers = useRef<number[]>([])

  const availableParticipants = store.getAvailableParticipants()
  const drawCount = store.settings.drawMode === 'single' ? 1 : remaining
  const icon = prize ? (PRIZE_ICONS[prize.order] || '🎁') : '🎁'

  // 3D Cloud Animation
  useEffect(() => {
    if (animationMode !== 'cloud') return
    let running = true
    const animate = () => {
      if (!running) return
      setRotation(prev => prev + speed)
      animRef.current = requestAnimationFrame(animate)
    }
    animRef.current = requestAnimationFrame(animate)
    return () => {
      running = false
      cancelAnimationFrame(animRef.current)
    }
  }, [speed, animationMode])

  const getCloudItemStyle = useCallback((index: number, total: number) => {
    const phi = Math.acos(-1 + (2 * index + 1) / total)
    const theta = Math.sqrt(total * Math.PI) * phi + (rotation * Math.PI) / 180

    const radius = Math.min(220, Math.max(120, total * 5))
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

  // Slot Machine Animation
  const startSlotAnimation = (winners: Participant[]) => {
    const totalSlots = Math.min(winners.length, 3)
    const newOffsets = Array(totalSlots).fill(0)
    setSlotOffsets(newOffsets)

    slotTimers.current.forEach(t => clearInterval(t))
    slotTimers.current = []

    for (let i = 0; i < totalSlots; i++) {
      let offset = 0
      const timer = window.setInterval(() => {
        offset += 1
        setSlotOffsets(prev => {
          const next = [...prev]
          next[i] = offset
          return next
        })
      }, 50)
      slotTimers.current.push(timer)

      setTimeout(() => {
        clearInterval(timer)
      }, 2000 + i * 500)
    }
  }

  const handleDraw = () => {
    if (status !== 'idle' || remaining <= 0) return

    setStatus('preparing')
    setCurrentWinners([])

    // Pre-calculate winners
    const winners = store.drawWinners(prizeId!, drawCount)
    if (winners.length === 0) return

    if (animationMode === 'cloud') {
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
      }, 3500)
    } else {
      // Slot machine mode
      setStatus('drawing')
      startSlotAnimation(winners)

      setTimeout(() => {
        setStatus('finished')
        setCurrentWinners(winners)
        fireConfetti()
      }, 3500)
    }
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
        {animationMode === 'cloud' ? (
          /* 3D Cloud Animation */
          <div
            ref={containerRef}
            className="cloud-container relative w-full max-w-2xl aspect-square flex items-center justify-center"
          >
            <div className="cloud-sphere relative w-full h-full">
              {status === 'finished' ? (
                /* Winner Display */
                <div className="absolute inset-0 flex flex-col items-center justify-center animate-winner-reveal">
                  {currentWinners.map((winner, i) => (
                    <div
                      key={winner.id}
                      className="text-center mb-4"
                      style={{ animationDelay: `${i * 200}ms` }}
                    >
                      <div className="text-fluid-3xl font-display font-bold text-gradient mb-1">
                        {winner.name}
                      </div>
                      <div className="text-fluid-base text-muted-foreground">
                        {winner.employeeId}
                        {winner.department && ` · ${winner.department}`}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Rotating Names */
                availableParticipants.slice(0, 60).map((p, i) => (
                  <div
                    key={p.id}
                    className="cloud-item px-3 py-1.5 rounded-lg font-body font-medium whitespace-nowrap"
                    style={{
                      ...getCloudItemStyle(i, Math.min(availableParticipants.length, 60)),
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
        ) : (
          /* Slot Machine */
          <div className="flex gap-5 items-center">
            {Array.from({ length: Math.min(drawCount, 3) }).map((_, slotIdx) => (
              <div
                key={slotIdx}
                className="slot-window w-32 h-48 rounded-2xl border-2 border-primary bg-card overflow-hidden relative"
              >
                <div
                  className="transition-transform"
                  style={{
                    transform: `translateY(-${(slotOffsets[slotIdx] || 0) * 48}px)`,
                    transition: status === 'finished' ? 'transform 0.5s ease-out' : 'none',
                  }}
                >
                  {availableParticipants.map((p, i) => (
                    <div
                      key={p.id}
                      className="h-12 flex items-center justify-center text-sm font-bold text-foreground"
                    >
                      {p.name}
                    </div>
                  ))}
                </div>
                {/* Highlight Line */}
                <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-12 border-y-2 border-primary pointer-events-none" />
              </div>
            ))}
          </div>
        )}

        {/* Draw Button */}
        <div className="mt-8 sm:mt-12">
          {status === 'idle' && updatedRemaining > 0 && (
            <button
              onClick={handleDraw}
              className="px-12 py-4 rounded-2xl text-lg font-bold bg-gradient-primary text-primary-foreground shadow-glow hover:shadow-glow-lg transition-all duration-300 hover:scale-105 active:scale-95"
            >
              🎲 开始抽奖
            </button>
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
                className="px-8 py-3 rounded-xl text-sm font-medium border border-border hover:bg-accent transition-colors text-foreground"
              >
                返回首页
              </button>
            </div>
          )}
          {updatedRemaining <= 0 && status === 'idle' && (
            <button
              onClick={() => navigate('/')}
              className="px-8 py-3 rounded-xl text-sm font-medium border border-border hover:bg-accent transition-colors text-foreground"
            >
              该奖项已抽完，返回首页
            </button>
          )}
        </div>

        {/* Current Round Winners */}
        {currentWinners.length > 0 && status === 'finished' && (
          <div className="mt-8 w-full max-w-2xl animate-fade-in-up">
            <h3 className="text-sm font-bold text-foreground mb-3 text-center">本轮中奖</h3>
            <div className="flex flex-wrap justify-center gap-3">
              {currentWinners.map(w => (
                <div
                  key={w.id}
                  className="px-4 py-2 rounded-xl bg-card border border-primary/30 shadow-sm"
                >
                  <p className="font-bold text-sm text-foreground">{w.name}</p>
                  <p className="text-xs text-muted-foreground">{w.employeeId}</p>
                </div>
              ))}
            </div>
          </div>
        )}

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
