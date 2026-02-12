import { useEffect, useRef, useCallback } from 'react'

// ==================== 类型定义 ====================

type ShapeType = 'circle' | 'triangle' | 'diamond' | 'rectangle'

// 自动烟花粒子
interface ShapeParticle {
  x: number
  y: number
  vx: number
  vy: number
  rotation: number
  rotationSpeed: number
  scale: number
  alpha: number
  decay: number
  color: string
  shape: ShapeType
  size: number
}

interface ShapeFirework {
  particles: ShapeParticle[]
  x: number
  y: number
}

// 触发式彩带粒子
interface ConfettiParticle {
  x: number
  y: number
  vx: number
  vy: number
  rotation: number
  rotationSpeed: number
  scale: number
  alpha: number
  life: number
  ttl: number
  color: string
  shape: ShapeType
  size: number
  drag: number
  gravity: number
  wind: number
}

// 网格粒子（背景粒子网络）
interface NetworkParticle {
  x: number
  y: number
  originX: number
  originY: number
  vx: number
  vy: number
  radius: number
  alpha: number
  baseAlpha: number
  phase: number
  phaseSpeed: number
  color: string
}

interface ShapeFireworksProps {
  trigger?: boolean
  onComplete?: () => void
  auto?: boolean
  enableBackground?: boolean
  burstPoints?: Array<{ x: number; y: number }>
}

const SHAPES: ShapeType[] = ['circle', 'triangle', 'diamond', 'rectangle']

// ==================== 主题色方案 ====================

function getThemeParticleColors(): { particles: string[]; lines: string; glow: string } {
  const theme = document.documentElement.getAttribute('data-theme') || 'red'
  switch (theme) {
    case 'luxury':
      return {
        particles: [
          'rgba(201, 162, 39, 0.7)', 'rgba(230, 200, 117, 0.6)',
          'rgba(240, 221, 160, 0.5)', 'rgba(255, 215, 0, 0.5)', 'rgba(180, 145, 35, 0.4)',
        ],
        lines: 'rgba(201, 162, 39, ',
        glow: 'rgba(230, 200, 117, ',
      }
    case 'vibrant':
      return {
        particles: [
          'rgba(255, 107, 53, 0.6)', 'rgba(255, 140, 97, 0.5)',
          'rgba(78, 205, 196, 0.5)', 'rgba(255, 213, 79, 0.5)', 'rgba(255, 160, 122, 0.4)',
        ],
        lines: 'rgba(255, 107, 53, ',
        glow: 'rgba(255, 140, 97, ',
      }
    default:
      return {
        particles: [
          'rgba(229, 57, 53, 0.6)', 'rgba(255, 111, 97, 0.55)',
          'rgba(255, 213, 79, 0.5)', 'rgba(255, 160, 122, 0.5)', 'rgba(200, 40, 40, 0.45)',
        ],
        lines: 'rgba(229, 57, 53, ',
        glow: 'rgba(255, 111, 97, ',
      }
  }
}

function getThemeBurstColors(): string[] {
  const theme = document.documentElement.getAttribute('data-theme') || 'red'
  switch (theme) {
    case 'luxury':
      return ['#C9A227', '#E6C875', '#F0DDA0', '#FFD700', '#FFF8DC', '#DAA520']
    case 'vibrant':
      return ['#FF6B35', '#FF8C61', '#4ECDC4', '#FFD54F', '#FF2D55', '#7EDDD7']
    default:
      return ['#FF3B30', '#FF9500', '#FFCC00', '#E53935', '#FF6F61', '#FFD54F']
  }
}

// ==================== 组件 ====================

export default function ShapeFireworks({ trigger, onComplete, auto = true, enableBackground = true, burstPoints }: ShapeFireworksProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fireworksRef = useRef<ShapeFirework[]>([])
  const confettiRef = useRef<ConfettiParticle[]>([])
  const animationRef = useRef<number>(0)
  const triggeredRef = useRef(false)
  const autoRef = useRef(true)
  const mouseRef = useRef<{ x: number; y: number; active: boolean }>({ x: -9999, y: -9999, active: false })
  const networkParticlesRef = useRef<NetworkParticle[]>([])
  const bgInitializedRef = useRef(false)

  // 形状绘制
  const drawShape = (ctx: CanvasRenderingContext2D, shape: ShapeType, x: number, y: number, size: number) => {
    ctx.beginPath()
    switch (shape) {
      case 'circle':
        ctx.arc(x, y, size * 0.45, 0, Math.PI * 2)
        break
      case 'triangle':
        ctx.moveTo(x, y - size * 0.6)
        ctx.lineTo(x + size * 0.55, y + size * 0.4)
        ctx.lineTo(x - size * 0.55, y + size * 0.4)
        ctx.closePath()
        break
      case 'diamond':
        ctx.moveTo(x, y - size * 0.6)
        ctx.lineTo(x + size * 0.5, y)
        ctx.lineTo(x, y + size * 0.6)
        ctx.lineTo(x - size * 0.5, y)
        ctx.closePath()
        break
      case 'rectangle':
        ctx.rect(x - size * 0.4, y - size * 0.6, size * 0.8, size * 1.2)
        break
    }
    ctx.fill()
  }

  const drawGlow = (ctx: CanvasRenderingContext2D, x: number, y: number, color: string, strength: number) => {
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, strength)
    gradient.addColorStop(0, color.replace(')', ', 0.18)').replace('rgb', 'rgba'))
    gradient.addColorStop(1, color.replace(')', ', 0)').replace('rgb', 'rgba'))
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(x, y, strength, 0, Math.PI * 2)
    ctx.fill()
  }

  // 初始化网格粒子
  const initNetworkParticles = useCallback((width: number, height: number) => {
    const colors = getThemeParticleColors()
    const particles: NetworkParticle[] = []
    const area = width * height
    const count = Math.min(140, Math.max(60, Math.floor(area / 12000)))
    for (let i = 0; i < count; i++) {
      const x = Math.random() * width
      const y = Math.random() * height
      const baseAlpha = 0.3 + Math.random() * 0.4
      particles.push({
        x, y, originX: x, originY: y,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: 1.5 + Math.random() * 2.5,
        alpha: baseAlpha, baseAlpha,
        phase: Math.random() * Math.PI * 2,
        phaseSpeed: 0.005 + Math.random() * 0.01,
        color: colors.particles[Math.floor(Math.random() * colors.particles.length)],
      })
    }
    networkParticlesRef.current = particles
    bgInitializedRef.current = true
  }, [])

  // 创建自动烟花绽放
  const createFirework = useCallback((x: number, y: number) => {
    const burstColors = getThemeBurstColors()
    const particleCount = 12 + Math.floor(Math.random() * 8)
    const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)]
    const color = burstColors[Math.floor(Math.random() * burstColors.length)]
    const particles: ShapeParticle[] = []
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.2
      const velocity = Math.random() * 2.5 + 1.5
      particles.push({
        x, y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.2,
        scale: Math.random() * 0.4 + 0.8,
        alpha: 1,
        decay: Math.random() * 0.015 + 0.008,
        color, shape,
        size: Math.random() * 8 + 6,
      })
    }
    fireworksRef.current.push({ particles, x, y })
  }, [])

  // 触发式彩带爆炸
  const createConfettiBurst = useCallback((x: number, y: number, count: number, targetX?: number) => {
    const burstColors = getThemeBurstColors()
    const particles: ConfettiParticle[] = []
    let baseAngle: number, spread: number
    if (targetX !== undefined) {
      baseAngle = Math.atan2(-100, targetX - x)
      spread = Math.PI * 0.5
    } else {
      baseAngle = -Math.PI / 2
      spread = Math.PI * 0.7
    }
    for (let i = 0; i < count; i++) {
      const angle = baseAngle + (Math.random() - 0.5) * spread
      const speed = Math.random() * 7 + 5
      const ttl = 2000 + Math.random() * 700
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.3,
        scale: Math.random() * 0.5 + 0.7,
        alpha: 1, life: ttl, ttl,
        color: burstColors[Math.floor(Math.random() * burstColors.length)],
        shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
        size: Math.random() * 10 + 6,
        drag: 0.985 - Math.random() * 0.02,
        gravity: 0.18 + Math.random() * 0.1,
        wind: (Math.random() - 0.5) * 0.05,
      })
    }
    confettiRef.current = confettiRef.current.concat(particles)
  }, [])

  // 触发爆炸
  useEffect(() => {
    autoRef.current = auto
    if (!trigger) { triggeredRef.current = false }
    if (trigger && !triggeredRef.current) {
      triggeredRef.current = true
      const canvas = canvasRef.current
      if (canvas) {
        const width = canvas.width / (window.devicePixelRatio || 1)
        const height = canvas.height / (window.devicePixelRatio || 1)
        const points = burstPoints && burstPoints.length > 0
          ? burstPoints
          : [{ x: width * 0.5, y: height * 0.45 }]
        const totalCount = 160 + Math.floor(Math.random() * 40)
        const perBurst = Math.max(90, Math.floor(totalCount / points.length))
        const centerX = points.length >= 2 ? (points[0].x + points[1].x) / 2 : width * 0.5
        points.forEach(point => {
          const x = Math.max(0, Math.min(width, point.x))
          const y = Math.max(0, Math.min(height, point.y))
          createConfettiBurst(x, y, perBurst, centerX)
        })
      }
    }
  }, [trigger, createConfettiBurst, auto, burstPoints])

  // 鼠标交互
  useEffect(() => {
    if (!enableBackground) return
    const handleMouseMove = (e: MouseEvent) => { mouseRef.current = { x: e.clientX, y: e.clientY, active: true } }
    const handleMouseLeave = () => { mouseRef.current.active = false }
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseleave', handleMouseLeave)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [enableBackground])

  // 主动画循环
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let width = window.innerWidth
    let height = window.innerHeight
    const setCanvasSize = () => {
      const dpr = Math.min(window.devicePixelRatio, 2)
      canvas.width = width * dpr
      canvas.height = height * dpr
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.scale(dpr, dpr)
    }
    setCanvasSize()

    if (enableBackground && !bgInitializedRef.current) {
      initNetworkParticles(width, height)
    }

    let lastTime = performance.now()
    let inactiveTime = 0
    let autoTime = 0
    const linkDistance = 150
    const mouseRadius = 120

    const animate = (currentTime: number) => {
      const deltaTime = Math.min(40, currentTime - lastTime)
      lastTime = currentTime
      const t = deltaTime / 16

      ctx.clearRect(0, 0, width, height)

      // ==================== 背景粒子网络 ====================
      if (enableBackground) {
        const themeColors = getThemeParticleColors()
        const particles = networkParticlesRef.current
        const mouse = mouseRef.current

        for (const p of particles) {
          p.phase += p.phaseSpeed * t
          p.alpha = p.baseAlpha * (1 + Math.sin(p.phase) * 0.15)
          p.x += p.vx * t
          p.y += p.vy * t
          if (mouse.active) {
            const dx = p.x - mouse.x, dy = p.y - mouse.y
            const dist = Math.sqrt(dx * dx + dy * dy)
            if (dist < mouseRadius && dist > 0) {
              const force = (mouseRadius - dist) / mouseRadius * 0.8
              p.x += (dx / dist) * force * t * 3
              p.y += (dy / dist) * force * t * 3
            }
          }
          p.x += (p.originX - p.x) * 0.003 * t
          p.y += (p.originY - p.y) * 0.003 * t
          if (p.x < -20) { p.x = -20; p.vx = Math.abs(p.vx) * 0.5 }
          if (p.x > width + 20) { p.x = width + 20; p.vx = -Math.abs(p.vx) * 0.5 }
          if (p.y < -20) { p.y = -20; p.vy = Math.abs(p.vy) * 0.5 }
          if (p.y > height + 20) { p.y = height + 20; p.vy = -Math.abs(p.vy) * 0.5 }
        }

        // 连线
        ctx.lineWidth = 1
        for (let i = 0; i < particles.length; i++) {
          for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x, dy = particles[i].y - particles[j].y
            const dist = Math.sqrt(dx * dx + dy * dy)
            if (dist < linkDistance) {
              const lineAlpha = (1 - dist / linkDistance) * 0.2 * Math.min(particles[i].alpha, particles[j].alpha)
              ctx.strokeStyle = themeColors.lines + lineAlpha + ')'
              ctx.beginPath()
              ctx.moveTo(particles[i].x, particles[i].y)
              ctx.lineTo(particles[j].x, particles[j].y)
              ctx.stroke()
            }
          }
        }

        // 鼠标连线
        if (mouse.active) {
          for (const p of particles) {
            const dx = p.x - mouse.x, dy = p.y - mouse.y
            const dist = Math.sqrt(dx * dx + dy * dy)
            if (dist < mouseRadius * 1.5) {
              ctx.strokeStyle = themeColors.lines + ((1 - dist / (mouseRadius * 1.5)) * 0.25) + ')'
              ctx.lineWidth = 0.8
              ctx.beginPath()
              ctx.moveTo(mouse.x, mouse.y)
              ctx.lineTo(p.x, p.y)
              ctx.stroke()
              ctx.lineWidth = 1
            }
          }
        }

        // 绘制粒子
        for (const p of particles) {
          const glowRadius = p.radius * 4
          const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowRadius)
          gradient.addColorStop(0, themeColors.glow + (p.alpha * 0.3) + ')')
          gradient.addColorStop(1, themeColors.glow + '0)')
          ctx.fillStyle = gradient
          ctx.beginPath()
          ctx.arc(p.x, p.y, glowRadius, 0, Math.PI * 2)
          ctx.fill()

          ctx.globalAlpha = p.alpha
          ctx.fillStyle = p.color
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
          ctx.fill()
          ctx.globalAlpha = 1
        }
      }

      // ==================== 自动烟花绽放 ====================
      let hasActiveFireworks = false

      fireworksRef.current = fireworksRef.current.filter((firework) => {
        drawGlow(ctx, firework.x, firework.y, 'rgb(246, 198, 154)', 80)
        firework.particles = firework.particles.filter((particle) => {
          particle.x += particle.vx * t
          particle.y += particle.vy * t
          particle.vy += 0.04
          particle.rotation += particle.rotationSpeed * t
          particle.alpha -= particle.decay * t
          particle.scale *= 0.995
          if (particle.alpha <= 0) return false

          hasActiveFireworks = true
          ctx.save()
          ctx.translate(particle.x, particle.y)
          ctx.rotate(particle.rotation)
          ctx.scale(particle.scale, particle.scale)
          ctx.fillStyle = particle.color
          ctx.globalAlpha = particle.alpha
          ctx.shadowBlur = 10
          ctx.shadowColor = particle.color
          drawShape(ctx, particle.shape, 0, 0, particle.size)
          ctx.restore()
          return true
        })
        return firework.particles.length > 0
      })

      // ==================== 触发式彩带爆炸 ====================
      let hasActiveConfetti = false

      confettiRef.current = confettiRef.current.filter((particle) => {
        const wind = particle.wind + Math.sin((currentTime + particle.x) * 0.002) * 0.05
        particle.vx += wind * t
        particle.vy += particle.gravity * t
        particle.vx *= particle.drag
        particle.vy *= particle.drag
        particle.x += particle.vx * t
        particle.y += particle.vy * t
        particle.rotation += particle.rotationSpeed * t
        particle.life -= deltaTime
        particle.alpha = Math.max(0, particle.life / particle.ttl)
        if (particle.life <= 0 || particle.alpha <= 0) return false

        hasActiveConfetti = true
        ctx.save()
        ctx.translate(particle.x, particle.y)
        ctx.rotate(particle.rotation)
        ctx.scale(particle.scale, particle.scale)
        ctx.globalAlpha = particle.alpha
        ctx.fillStyle = particle.color
        ctx.shadowBlur = 6
        ctx.shadowColor = particle.color
        drawShape(ctx, particle.shape, 0, 0, particle.size)
        ctx.restore()
        return true
      })

      if (!hasActiveFireworks && !hasActiveConfetti && triggeredRef.current) {
        inactiveTime += deltaTime
        if (inactiveTime > 800) {
          triggeredRef.current = false
          onComplete?.()
        }
      } else {
        inactiveTime = 0
      }

      // 自动生成烟花绽放
      if (autoRef.current && !triggeredRef.current) {
        autoTime += deltaTime
        if (autoTime > 780 + Math.random() * 520) {
          autoTime = 0
          const batch = 3 + Math.floor(Math.random() * 2)
          for (let i = 0; i < batch; i++) {
            setTimeout(() => {
              const fx = Math.random() * width * 0.7 + width * 0.15
              const fy = Math.random() * height * 0.45 + height * 0.12
              createFirework(fx, fy)
            }, i * 180 + Math.random() * 120)
          }
        }
      } else {
        autoTime = 0
      }

      if (fireworksRef.current.length > 0 || confettiRef.current.length > 0 || triggeredRef.current || autoRef.current || enableBackground) {
        animationRef.current = requestAnimationFrame(animate)
      }
    }

    animationRef.current = requestAnimationFrame(animate)

    const handleResize = () => {
      width = window.innerWidth
      height = window.innerHeight
      setCanvasSize()
      if (enableBackground) {
        for (const p of networkParticlesRef.current) {
          p.originX = Math.random() * width
          p.originY = Math.random() * height
        }
      }
    }
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationRef.current)
    }
  }, [onComplete, createFirework, trigger, auto, enableBackground, initNetworkParticles])

  // 监听主题变化
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const colors = getThemeParticleColors()
      for (const p of networkParticlesRef.current) {
        p.color = colors.particles[Math.floor(Math.random() * colors.particles.length)]
      }
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => observer.disconnect()
  }, [])

  if (!trigger && fireworksRef.current.length === 0 && confettiRef.current.length === 0 && !auto && !enableBackground) return null

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 1 }}
    />
  )
}
