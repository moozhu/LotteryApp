import { useEffect, useRef, useCallback } from 'react'
import { soundManager } from '@/lib/sound'

/**
 * 中奖彩带喷散动画组件
 * 中奖时从中心向四周喷射彩色纸片/彩带，配合"嘭"的音效
 * 自动适配当前主题色
 */

type RibbonShape = 'ribbon' | 'paper' | 'star' | 'circle'

interface RibbonParticle {
  x: number
  y: number
  vx: number
  vy: number
  width: number
  height: number
  rotation: number
  rotationSpeed: number
  color: string
  alpha: number
  life: number
  maxLife: number
  gravity: number
  drag: number
  wind: number
  shape: RibbonShape
  oscillation: number
  oscillationSpeed: number
  oscillationPhase: number
}

interface PrizeFireworksProps {
  trigger?: boolean
  onComplete?: () => void
  center?: { x: number; y: number }
  duration?: number
  withSound?: boolean
}

/**
 * 获取主题对应的彩带颜色
 */
function getThemeRibbonColors(): string[] {
  const theme = document.documentElement.getAttribute('data-theme') || 'red'
  switch (theme) {
    case 'luxury':
      return ['#FFD700', '#C9A227', '#E6C875', '#F0DDA0', '#DAA520', '#FFF8DC', '#B8860B', '#FFFACD']
    case 'vibrant':
      return ['#FF6B35', '#FF2D55', '#4ECDC4', '#FFD54F', '#FF8C61', '#7EDDD7', '#FF4081', '#FFAB40']
    default:
      return ['#FF3B30', '#FF9500', '#FFCC00', '#E53935', '#FF6F61', '#FFD54F', '#FF4444', '#FFA07A']
  }
}

const RIBBON_SHAPES: RibbonShape[] = ['ribbon', 'paper', 'star', 'circle']

function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, spikes: number, outerR: number, innerR: number) {
  let rot = (Math.PI / 2) * 3
  const step = Math.PI / spikes
  ctx.beginPath()
  ctx.moveTo(cx, cy - outerR)
  for (let i = 0; i < spikes; i++) {
    ctx.lineTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR)
    rot += step
    ctx.lineTo(cx + Math.cos(rot) * innerR, cy + Math.sin(rot) * innerR)
    rot += step
  }
  ctx.lineTo(cx, cy - outerR)
  ctx.closePath()
  ctx.fill()
}

export default function PrizeFireworks({
  trigger,
  onComplete,
  center,
  duration = 4500,
  withSound = true,
}: PrizeFireworksProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<RibbonParticle[]>([])
  const animationRef = useRef<number>(0)
  const triggeredRef = useRef(false)
  const startTimeRef = useRef<number>(0)

  /**
   * 创建彩带喷散
   */
  const createRibbonBurst = useCallback((cx: number, cy: number) => {
    const colors = getThemeRibbonColors()
    const particles: RibbonParticle[] = []
    const totalParticles = 120 + Math.floor(Math.random() * 40)

    for (let i = 0; i < totalParticles; i++) {
      // 多方向喷射 — 偏上方为主，少量向下
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.6
      const speed = 4 + Math.random() * 12
      const life = 2500 + Math.random() * 2000
      const color = colors[Math.floor(Math.random() * colors.length)]
      const shape = RIBBON_SHAPES[Math.floor(Math.random() * RIBBON_SHAPES.length)]

      particles.push({
        x: cx + (Math.random() - 0.5) * 30,
        y: cy + (Math.random() - 0.5) * 20,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        width: shape === 'ribbon' ? (3 + Math.random() * 5) : (5 + Math.random() * 7),
        height: shape === 'ribbon' ? (10 + Math.random() * 18) : (5 + Math.random() * 7),
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.25,
        color,
        alpha: 1,
        life,
        maxLife: life,
        gravity: 0.08 + Math.random() * 0.06,
        drag: 0.985 + Math.random() * 0.01,
        wind: (Math.random() - 0.5) * 0.03,
        shape,
        oscillation: shape === 'ribbon' ? (2 + Math.random() * 4) : 0,
        oscillationSpeed: 0.03 + Math.random() * 0.04,
        oscillationPhase: Math.random() * Math.PI * 2,
      })
    }

    return particles
  }, [])

  useEffect(() => {
    if (!trigger) {
      triggeredRef.current = false
      return
    }

    if (!triggeredRef.current) {
      triggeredRef.current = true

      const canvas = canvasRef.current
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      const c = center || { x: rect.width * 0.5, y: rect.height * 0.5 }

      startTimeRef.current = performance.now()
      particlesRef.current = createRibbonBurst(c.x, c.y)

      // 播放"嘭"的音效
      if (withSound) {
        soundManager.playConfettiBoom()
        setTimeout(() => soundManager.playWin(), 120)
      }
    }
  }, [trigger, center, createRibbonBurst, withSound])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let width = window.innerWidth
    let height = window.innerHeight

    const setCanvasSize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = width * dpr
      canvas.height = height * dpr
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.scale(dpr, dpr)
    }
    setCanvasSize()

    let lastTime = performance.now()
    let animationComplete = false

    const animate = (currentTime: number) => {
      const deltaTime = Math.min(34, currentTime - lastTime)
      lastTime = currentTime
      const t = deltaTime / 16

      ctx.clearRect(0, 0, width, height)

      let hasActive = false

      particlesRef.current = particlesRef.current.filter(p => {
        // 物理更新
        const windForce = p.wind + Math.sin((currentTime + p.x) * 0.0015) * 0.04
        p.vx += windForce * t
        p.vy += p.gravity * t
        p.vx *= p.drag
        p.vy *= p.drag
        p.x += p.vx * t
        p.y += p.vy * t
        p.rotation += p.rotationSpeed * t
        p.oscillationPhase += p.oscillationSpeed * t
        p.life -= deltaTime

        if (p.life <= 0) return false

        // 小于 30% 生命时开始淡出
        p.alpha = p.life < p.maxLife * 0.3
          ? p.life / (p.maxLife * 0.3)
          : 1

        hasActive = true

        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rotation)
        ctx.globalAlpha = p.alpha
        ctx.fillStyle = p.color

        // 彩带有摇摆效果的阴影
        if (p.shape === 'ribbon' || p.shape === 'paper') {
          ctx.shadowBlur = 4
          ctx.shadowColor = p.color
        }

        switch (p.shape) {
          case 'ribbon': {
            // 弯曲彩带条
            const sway = Math.sin(p.oscillationPhase) * p.oscillation
            ctx.beginPath()
            ctx.moveTo(-p.width / 2, -p.height / 2)
            ctx.quadraticCurveTo(sway, -p.height / 4, p.width / 2, 0)
            ctx.quadraticCurveTo(-sway, p.height / 4, -p.width / 2, p.height / 2)
            ctx.lineTo(-p.width / 2, -p.height / 2)
            ctx.fill()
            break
          }
          case 'paper':
            // 方形纸片
            ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height)
            break
          case 'star':
            // 五角星
            drawStar(ctx, 0, 0, 5, p.width / 2, p.width / 5)
            break
          case 'circle':
            // 小圆点
            ctx.beginPath()
            ctx.arc(0, 0, p.width / 3, 0, Math.PI * 2)
            ctx.fill()
            break
        }

        ctx.restore()
        return true
      })

      if (!hasActive && triggeredRef.current && !animationComplete) {
        animationComplete = true
        triggeredRef.current = false
        onComplete?.()
      }

      if (particlesRef.current.length > 0 || triggeredRef.current) {
        animationRef.current = requestAnimationFrame(animate)
      }
    }

    animationRef.current = requestAnimationFrame(animate)

    const handleResize = () => {
      width = window.innerWidth
      height = window.innerHeight
      setCanvasSize()
    }
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationRef.current)
    }
  }, [onComplete, duration])

  if (!trigger && particlesRef.current.length === 0) return null

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 60 }}
    />
  )
}
