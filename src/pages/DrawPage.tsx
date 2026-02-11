import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useLotteryStore } from '@/store/lottery'
import { PRIZE_ICONS } from '@/types'
import type { Participant, DrawStatus } from '@/types'
import { ArrowLeft } from 'lucide-react'
import { soundManager } from '@/lib/sound'
import BackgroundEffects from '@/components/ui/BackgroundEffects'
import PrizeFireworks from '@/components/ui/PrizeFireworks'

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
  const [preDrawCount, setPreDrawCount] = useState(0)
  const [rotation, setRotation] = useState(0)
  const [speed, setSpeed] = useState(0.5)
  const [showAllWinners, setShowAllWinners] = useState(false)
  const [cloudSize, setCloudSize] = useState({ width: 0, height: 0 })
  const [showPrizeFireworks, setShowPrizeFireworks] = useState(false)
  
  const animRef = useRef<number>(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const cloudItemRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const winnersListRef = useRef<HTMLDivElement>(null)

  const availableParticipants = store.getAvailableParticipants()
  const drawCount = store.settings.drawMode === 'single' ? 1 : remaining
  const icon = prize ? (PRIZE_ICONS[prize.order] || '🎁') : '🎁'

  // Manage display list to ensure winners stay in cloud during animation
  const [displayParticipants, setDisplayParticipants] = useState<Participant[]>([])

  // Sync display list with available participants when idle
  useEffect(() => {
    if (status === 'idle') {
      // Shuffle or just take first 80? 
      // To make it look dynamic, we could shuffle, but for consistency let's stick to slice
      // unless the list is small.
      // Let's just take the available ones.
      setDisplayParticipants(availableParticipants)
    }
  }, [availableParticipants, status])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver(entries => {
      const rect = entries[0]?.contentRect
      if (!rect) return
      setCloudSize({ width: rect.width, height: rect.height })
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const showWarning = availableParticipants.length < remaining && status === 'idle'

  // 3D Cloud Animation
  useEffect(() => {
    let running = true
    let tickCounter = 0
    const animate = () => {
      if (!running) return
      
      // Stop rotation when highlighting winners
      if (status !== 'highlighting') {
        setRotation(prev => prev + speed)
      }

      // Play slot machine tick sound based on speed
      if (status === 'drawing' || status === 'slowing') {
        tickCounter++
        // Higher speed = more frequent ticks
        const tickInterval = Math.max(3, Math.floor(12 - speed))
        if (tickCounter >= tickInterval) {
          tickCounter = 0
          const intensity = Math.min(1, speed / 8)
          soundManager.playSlotTick(intensity)
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

  useEffect(() => {
    if (status === 'drawing' || status === 'slowing') {
      const intensity = Math.min(1, Math.max(0.25, speed / 8))
      soundManager.startSpin(intensity)
      return () => {
        soundManager.stopSpin()
      }
    }
    soundManager.stopSpin()
  }, [status, speed])

  const getCloudItemStyle = useCallback((index: number, total: number, isWinner: boolean) => {
    // Hide winners when finished (they move to top list)
    if (status === 'finished' && isWinner) {
      return {
        transform: 'scale(0)',
        opacity: 0,
        zIndex: 0,
        transition: 'all 0.5s ease-in'
      }
    }

    const phi = Math.acos(-1 + (2 * index + 1) / total)
    const theta = Math.sqrt(total * Math.PI) * phi + (rotation * Math.PI) / 180

    // Scale up cloud by ~30%
    const radius = Math.min(600, Math.max(300, total * 12))
    // Adjust radius for smaller screens
    const responsiveRadius = window.innerWidth < 640 ? radius * 0.6 : radius

    const x = Math.cos(theta) * Math.sin(phi) * responsiveRadius
    const y = Math.cos(phi) * responsiveRadius * 0.6
    const z = Math.sin(theta) * Math.sin(phi) * responsiveRadius

    const baseScale = (z + responsiveRadius) / (2 * responsiveRadius) * 0.6 + 0.4
    const baseOpacity = (z + responsiveRadius) / (2 * responsiveRadius) * 0.7 + 0.3

    if (status === 'highlighting' && isWinner) {
      const scale = Math.min(2.2, baseScale * 1.6)
      return {
        transform: `translate(-50%, -50%) translate3d(${x}px, ${y}px, ${z}px) scale(${scale})`,
        opacity: 1,
        zIndex: 200,
        fontSize: `${Math.max(16, 16 * scale)}px`,
        fontWeight: 'bold',
        transition: 'all 0.5s ease-out'
      }
    }

    return {
      transform: `translate(-50%, -50%) translate3d(${x}px, ${y}px, ${z}px) scale(${baseScale})`,
      opacity: status === 'highlighting' ? 0.1 : baseOpacity,
      zIndex: Math.round(z + responsiveRadius),
      fontSize: `${Math.max(12, 14 * baseScale)}px`,
      transition: status === 'highlighting' ? 'opacity 0.5s ease-out' : 'none'
    }
  }, [rotation, status, displayParticipants, cloudSize.width, cloudSize.height])

  const handleDraw = () => {
    // Allow drawing if idle OR finished (for continuous draw), as long as prizes remain
    if ((status !== 'idle' && status !== 'finished') || remaining <= 0) return

    // 1. Prepare
    setStatus('preparing')
    setPreDrawCount(prizeWinners.length)
    
    // 2. Draw (Store updates immediately)
    const winners = store.drawWinners(prizeId!, drawCount)
    if (winners.length === 0) return

    setCurrentWinners(winners)

    // 3. Inject winners into displayParticipants if they are not present
    // This ensures they are visible in the cloud for highlighting
    setDisplayParticipants(prev => {
      const newDisplay = [...prev]
      // Use a limited set for cloud (e.g. 80)
      // If we have more than 80, we slice.
      // But we must ensure winners are in the slice.
      
      const winnerIds = new Set(winners.map(w => w.id))
      // Filter out winners that are already in the display list
      const missingParticipants = winners.filter(w => !newDisplay.find(p => p && p.id === w.id))
      
      let finalDisplay = newDisplay
      
      if (missingParticipants.length > 0) {
        // We need to add them. 
        // If list is small, just push.
        // If list is large (sliced), replace items or prepend.
        // Let's just prepend them to ensure they are in the first N items
        finalDisplay = [...missingParticipants, ...newDisplay]
      }
      
      // Limit to 80 for performance/visuals
      if (finalDisplay.length > 80) {
        // Ensure winners are kept
        // We just prepended them, so slice(0, 80) should keep them
        // unless there are > 80 winners (unlikely)
        finalDisplay = finalDisplay.slice(0, 80)
      }
      
      return finalDisplay
    })

    // 4. Start Animation Phase 1: Speed up
    setSpeed(8)
    setStatus('drawing')

    // Phase 2: Slow down
    setTimeout(() => {
      setSpeed(0.3)
      setStatus('slowing')
    }, 2500)

    // Phase 3: Highlight (Stop and Show Winners in Cloud)
    setTimeout(() => {
      setSpeed(0)
      setStatus('highlighting')
      setShowPrizeFireworks(true) // 触发中奖礼花动效
      soundManager.playFireworkBurst()
      setTimeout(() => soundManager.playWin(), 120)
      
      // Haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100])
      }
      
    }, 3500)

    setTimeout(() => {
      setSpeed(0.5)
      setStatus('finished')
    }, 4700)
  }

  const handleContinue = () => {
    // Reset speed for next draw
    setSpeed(0.5)
    // Trigger draw immediately but allow state to settle
    setTimeout(() => {
      handleDraw()
    }, 100)
  }

  if (!prize) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">奖项不存在</p>
      </div>
    )
  }

  const updatedRemaining = prize.count - store.winners.filter(w => w.prizeId === prizeId).length
  const currentWinnerIds = new Set(currentWinners.map(w => w.id))

  return (
    <div className="h-screen flex flex-col bg-gradient-bg relative overflow-hidden">
      {/* 中奖礼花动效 - 仅在 highlighting 状态显示 */}
      <PrizeFireworks
        trigger={showPrizeFireworks}
        onComplete={() => {
          // 动效完成后自动隐藏
          setShowPrizeFireworks(false)
        }}
        center={(() => {
          if (status !== 'highlighting') return undefined
          const rect = containerRef.current?.getBoundingClientRect()
          const width = rect?.width || window.innerWidth
          const height = rect?.height || window.innerHeight
          const left = rect?.left || 0
          const top = rect?.top || 0
          // 云团中心位置
          return { 
            x: left + width * 0.5, 
            y: top + height * 0.5 
          }
        })()}
        duration={4000}
      />
      
      {/* 保留原有背景动效，但只在 finished 状态显示 */}
      <BackgroundEffects 
        showFireworks={status === 'finished'}
        auto={false}
        enableBackground={false}
        burstPoints={(() => {
          if (status !== 'finished') return undefined
          const rect = containerRef.current?.getBoundingClientRect()
          const width = rect?.width || window.innerWidth
          const height = rect?.height || window.innerHeight
          const left = rect?.left || 0
          const top = rect?.top || 0
          return [
            { x: left + width * 0.5, y: top + height * 0.5 },
          ]
        })()}
      />
      {/* Adaptive Title Status Bar */}
      <header className="flex-none relative z-10 flex items-center justify-between px-4 sm:px-8 py-4 sm:py-6 bg-background/10 backdrop-blur-[2px]">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium hover:bg-accent/50 transition-colors text-foreground"
        >
          <ArrowLeft size={20} />
          <span className="hidden sm:inline">返回</span>
        </button>
        
        {/* Enlarged Title - Single Row Layout */}
        <div className="flex items-center gap-4 text-foreground animate-fade-in">
          {prize.prizeImage ? (
            <img 
              src={prize.prizeImage} 
              alt={prize.prizeName} 
              className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-xl border-2 border-white/20"
            />
          ) : (
            <span className="text-4xl sm:text-5xl filter drop-shadow-md">{icon}</span>
          )}
          
          <div className="flex flex-row items-baseline gap-3">
            <span className="font-display font-bold text-3xl sm:text-4xl tracking-wide filter drop-shadow-sm">
              {prize.name}
            </span>
            <span className="text-lg sm:text-xl text-muted-foreground/90 font-medium">
              {prize.prizeName}
            </span>
          </div>
        </div>
        
        <div className="text-base sm:text-lg text-foreground/80 font-medium font-mono bg-background/20 px-3 py-1 rounded-full backdrop-blur-md border border-white/10">
          {drawn} / {prize.count}
        </div>
      </header>

      {/* Current Winners List (Above Cloud) */}
      <div className="flex-none relative z-10 flex flex-col items-center justify-center py-4 min-h-[100px]">
        {/* Always show winners if there are any */}
        {(status === 'finished' || status === 'idle' || status === 'preparing' || status === 'drawing' || status === 'slowing' || status === 'highlighting') && prizeWinners.length > 0 && (
          <div
            ref={winnersListRef}
            className="flex flex-col items-center gap-2 w-full max-w-[1400px] px-4 transition-all duration-500 ease-out"
            style={{
              opacity: status === 'finished' || status === 'idle' ? 1 : 0,
              transform: status === 'finished' || status === 'idle' ? 'translateY(0)' : 'translateY(10px)'
            }}
          >
            <div className={`flex flex-wrap justify-center gap-4 w-full transition-all duration-300 ease-in-out ${showAllWinners ? '' : 'overflow-hidden'}`}>
            {(() => {
              // Logic to filter and slice winners
              // 1. Filter visible winners based on logic (hide current batch if not finished/idle)
              const visibleWinners = prizeWinners.filter((w, index) => {
                 if (!w || !w.participant) return false
                 // Hide winners that are newly added (index >= preDrawCount) during the draw
                 if ((status === 'preparing' || status === 'drawing' || status === 'slowing' || status === 'highlighting') && index >= preDrawCount) {
                   return false
                 }
                 return true
              })

              // 2. Slice if not showAll
              const displayList = showAllWinners ? visibleWinners : visibleWinners.slice(0, 16)
              
              return (
                  <>
                    {displayList.map((w, index) => {
                      if (!w || !w.participant) return null
                      const isNew = status === 'finished' && currentWinners.some(cw => cw.id === w.participantId)
                      return (
                        <div
                          key={w.id}
                          className={`bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-3 rounded-xl flex items-center justify-center gap-2 transform transition-all duration-500 hover:scale-105 min-w-[140px] ${isNew ? 'animate-fade-in-up' : ''}`}
                        >
                        <span className="text-lg font-bold truncate max-w-[80px]">{w.participant.name}</span>
                        <span className="opacity-90 text-xs border-l border-white/30 pl-2">{w.participant.employeeId}</span>
                      </div>
                    )
                  })}
                </>
              )
            })()}
            </div>
            
            {/* Show More Toggle */}
            {(() => {
               const visibleCount = prizeWinners.filter((w, index) => {
                 if (!w || !w.participant) return false
                 if ((status === 'preparing' || status === 'drawing' || status === 'slowing' || status === 'highlighting') && index >= preDrawCount) {
                   return false
                 }
                 return true
               }).length
               
               if (visibleCount > 16) {
                 return (
                   <div className="flex justify-center w-full mt-4">
                      <button
                       onClick={() => setShowAllWinners(!showAllWinners)}
                        className="px-4 py-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white text-xs backdrop-blur-sm transition-colors flex items-center gap-2 border border-white/10 shadow-sm"
                     >
                       {showAllWinners ? (
                         <>
                           <span>收起名单</span>
                           <span className="text-xs opacity-70">▲</span>
                         </>
                       ) : (
                         <>
                           <span>显示更多 ({visibleCount - 16})</span>
                           <span className="text-xs opacity-70">▼</span>
                         </>
                       )}
                     </button>
                   </div>
                 )
               }
               return null
            })()}
          </div>
        )}
      </div>

      {/* Main Cloud Area - Centered and occupying available space */}
      <main className="flex-1 min-h-0 relative z-10 flex items-center justify-center overflow-hidden w-full pb-[180px]">
        <div
          ref={containerRef}
          className="cloud-container relative w-full h-full max-w-5xl flex items-center justify-center perspective-[1000px]"
        >
          <div className="cloud-sphere relative w-full h-full flex items-center justify-center preserve-3d">
            {displayParticipants.slice(0, 80).map((p, i) => {
               const isWinner = currentWinnerIds.has(p.id)
               const style = getCloudItemStyle(i, Math.min(displayParticipants.length, 80), isWinner)
               
               return (
                <div
                  key={p.id}
                  ref={el => {
                    if (el) cloudItemRefs.current.set(p.id, el)
                    else cloudItemRefs.current.delete(p.id)
                  }}
                  className={`cloud-item absolute flex items-center justify-center px-4 py-2 rounded-xl font-body font-medium whitespace-nowrap transition-colors duration-300
                    ${isWinner && status === 'highlighting' 
                      ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-[0_0_30px_rgba(255,165,0,0.6)] border-2 border-white' 
                      : 'bg-card/90 text-foreground border border-white/10 shadow-sm backdrop-blur-sm'
                    }
                  `}
                  style={style}
                >
                  <span className="mr-2">{p.name}</span>
                  {/* Show ID only if space permits or if winner */}
                  {(isWinner || displayParticipants.length < 20) && (
                    <span className="opacity-80 text-[0.8em]">{p.employeeId}</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </main>

      {/* Footer - Fixed/Sticky Bottom Area */}
      <footer className="fixed inset-x-0 bottom-0 z-30 px-4 pb-6 pt-3 bg-gradient-to-t from-background via-background/90 to-transparent flex flex-col items-center">
        <div className="w-full max-w-md mx-auto space-y-4">
          {status === 'idle' && updatedRemaining > 0 && (
            <>
              {showWarning && (
                <div className="mb-2 p-3 rounded-lg bg-yellow-500/20 border border-yellow-500/30 text-yellow-600 dark:text-yellow-400 text-xs sm:text-sm text-center animate-bounce-subtle">
                  ⚠️ 剩余参与者不足 ({availableParticipants.length} &lt; {updatedRemaining})
                </div>
              )}
              <button
                onClick={handleDraw}
                disabled={showWarning}
                className={`w-full py-4 sm:py-5 rounded-2xl text-xl sm:text-2xl font-bold bg-gradient-primary text-primary-foreground shadow-glow hover:shadow-glow-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2
                  ${showWarning ? 'opacity-50 cursor-not-allowed grayscale' : ''}
                `}
              >
                <span>🎲</span> 开始抽奖
              </button>
            </>
          )}

          {(status === 'drawing' || status === 'preparing' || status === 'slowing') && (
            <div className="w-full py-4 sm:py-5 rounded-2xl text-xl sm:text-2xl font-bold bg-muted/50 text-muted-foreground border-2 border-primary/20 flex items-center justify-center gap-3 animate-pulse">
               <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
               <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
               <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
               <span>抽奖中...</span>
            </div>
          )}

          {(status === 'highlighting' || status === 'finished') && (
            <div className="flex gap-3 w-full animate-fade-in-up">
              {updatedRemaining > 0 && (
                <button
                  onClick={handleContinue}
                  className="flex-1 py-3 sm:py-4 rounded-xl text-lg font-bold bg-gradient-primary text-primary-foreground shadow-glow hover:shadow-glow-lg transition-all hover:scale-[1.02]"
                >
                  继续抽奖 ({updatedRemaining})
                </button>
              )}
              <button
                onClick={() => navigate('/')}
                className="flex-1 py-3 sm:py-4 rounded-xl text-lg font-medium border-2 border-border/50 hover:bg-accent hover:border-accent transition-all"
              >
                返回首页
              </button>
            </div>
          )}
        </div>
      </footer>
      
      {/* Global Style for 3D preserve */}
      <style>{`
        .preserve-3d {
          transform-style: preserve-3d;
        }
        .perspective-1000 {
          perspective: 1000px;
        }
        @keyframes pulse-scale {
          0%, 100% { transform: translate(-50%, -50%) scale(2); box-shadow: 0 0 30px rgba(255,165,0,0.6); }
          50% { transform: translate(-50%, -50%) scale(2.2); box-shadow: 0 0 50px rgba(255,165,0,0.8); }
        }
        .animate-pulse-scale {
          animation: pulse-scale 2s infinite ease-in-out;
        }
        .pb-safe {
          padding-bottom: env(safe-area-inset-bottom, 20px);
        }
      `}</style>
    </div>
  )
}
