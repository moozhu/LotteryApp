import { useEffect, useRef, useCallback } from 'react'

/**
 * 中奖礼花爆炸动效组件
 * 专门为中奖场景设计的礼花爆炸效果，具有层次感和立体感
 */
interface FireworkParticle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  alpha: number
  color: string
  type: 'sparkle' | 'ribbon' | 'star' | 'circle'
  rotation: number
  rotationSpeed: number
  gravity: number
  drag: number
  life: number
  maxLife: number
  trail: Array<{ x: number; y: number; alpha: number }>
}

interface PrizeFireworksProps {
  /** 是否触发动画 */
  trigger?: boolean
  /** 动画完成回调 */
  onComplete?: () => void
  /** 爆炸中心点坐标 */
  center?: { x: number; y: number }
  /** 动画持续时间（毫秒） */
  duration?: number
}

/**
 * 喜庆色彩方案 - 金色、红色、橙色为主
 */
const CELEBRATION_COLORS = [
  '#FFD700', // 金色
  '#FFA500', // 橙色
  '#FF6347', // 番茄红
  '#FF4500', // 橙红
  '#FF8C00', // 深橙
  '#DC143C', // 深红
  '#FF1493', // 深粉
  '#FFB347', // 浅橙
  '#FF6B35', // 珊瑚橙
  '#FFD700', // 金色
]

/**
 * 粒子类型定义
 */
const PARTICLE_TYPES: Array<'sparkle' | 'ribbon' | 'star' | 'circle'> = [
  'sparkle', 'ribbon', 'star', 'circle'
]

export default function PrizeFireworks({ 
  trigger, 
  onComplete, 
  center,
  duration = 4000 
}: PrizeFireworksProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<FireworkParticle[]>([])
  const animationRef = useRef<number>(0)
  const triggeredRef = useRef(false)
  const startTimeRef = useRef<number>(0)

  /**
   * 创建单个粒子
   */
  const createParticle = useCallback((x: number, y: number, angle: number, speed: number): FireworkParticle => {
    const type = PARTICLE_TYPES[Math.floor(Math.random() * PARTICLE_TYPES.length)]
    const life = 2000 + Math.random() * 2000 // 2-4秒生命周期
    const size = type === 'ribbon' ? 
      Math.random() * 3 + 2 : 
      Math.random() * 6 + 3
    
    return {
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size,
      alpha: 1,
      color: CELEBRATION_COLORS[Math.floor(Math.random() * CELEBRATION_COLORS.length)],
      type,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.4,
      gravity: 0.12 + Math.random() * 0.08,
      drag: 0.985 + Math.random() * 0.01,
      life,
      maxLife: life,
      trail: []
    }
  }, [])

  /**
   * 创建礼花爆炸效果
   */
  const createFireworkBurst = useCallback((centerX: number, centerY: number) => {
    const particles: FireworkParticle[] = []
    const totalParticles = 120 + Math.floor(Math.random() * 60) // 120-180个粒子
    
    // 第一波：核心爆炸 - 快速向外扩散
    const coreCount = Math.floor(totalParticles * 0.3)
    for (let i = 0; i < coreCount; i++) {
      const angle = (Math.PI * 2 * i) / coreCount + Math.random() * 0.3
      const speed = 8 + Math.random() * 6
      particles.push(createParticle(centerX, centerY, angle, speed))
    }
    
    // 第二波：中层扩散 - 中等速度，填充间隙
    const midCount = Math.floor(totalParticles * 0.4)
    for (let i = 0; i < midCount; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 5 + Math.random() * 4
      particles.push(createParticle(centerX, centerY, angle, speed))
    }
    
    // 第三波：外围粒子 - 缓慢飘散，增加层次感
    const outerCount = Math.floor(totalParticles * 0.3)
    for (let i = 0; i < outerCount; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 3 + Math.random() * 3
      particles.push(createParticle(centerX, centerY, angle, speed))
    }

    particlesRef.current = particles
    startTimeRef.current = performance.now()
  }, [createParticle])

  /**
   * 绘制粒子
   */
  const drawParticle = (ctx: CanvasRenderingContext2D, particle: FireworkParticle) => {
    ctx.save()
    ctx.translate(particle.x, particle.y)
    ctx.rotate(particle.rotation)
    ctx.globalAlpha = particle.alpha

    // 绘制粒子拖尾效果
    if (particle.trail.length > 0) {
      ctx.strokeStyle = particle.color
      ctx.lineWidth = particle.size * 0.5
      ctx.globalAlpha = particle.alpha * 0.3
      ctx.beginPath()
      ctx.moveTo(0, 0)
      
      for (let i = 0; i < particle.trail.length; i++) {
        const point = particle.trail[i]
        ctx.lineTo(point.x - particle.x, point.y - particle.y)
        ctx.globalAlpha = point.alpha * particle.alpha * 0.3
      }
      
      ctx.stroke()
    }

    ctx.globalAlpha = particle.alpha

    switch (particle.type) {
      case 'sparkle':
        // 绘制闪烁星星
        ctx.fillStyle = particle.color
        ctx.shadowBlur = 15
        ctx.shadowColor = particle.color
        drawStar(ctx, 0, 0, 5, particle.size, particle.size * 0.4)
        break
        
      case 'star':
        // 绘制四角星
        ctx.fillStyle = particle.color
        ctx.shadowBlur = 12
        ctx.shadowColor = particle.color
        drawStar(ctx, 0, 0, 4, particle.size * 1.2, particle.size * 0.3)
        break
        
      case 'circle':
        // 绘制发光圆点
        ctx.beginPath()
        ctx.arc(0, 0, particle.size, 0, Math.PI * 2)
        ctx.fillStyle = particle.color
        ctx.shadowBlur = 10
        ctx.shadowColor = particle.color
        ctx.fill()
        break
        
      case 'ribbon':
        // 绘制彩带
        ctx.fillStyle = particle.color
        ctx.shadowBlur = 8
        ctx.shadowColor = particle.color
        const width = particle.size * 3
        const height = particle.size * 0.4
        ctx.fillRect(-width / 2, -height / 2, width, height)
        break
    }

    ctx.restore()
  }

  /**
   * 绘制星形
   */
  const drawStar = (ctx: CanvasRenderingContext2D, cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number) => {
    let rot = Math.PI / 2 * 3
    let x = cx
    let y = cy
    const step = Math.PI / spikes

    ctx.beginPath()
    ctx.moveTo(cx, cy - outerRadius)
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius
      y = cy + Math.sin(rot) * outerRadius
      ctx.lineTo(x, y)
      rot += step

      x = cx + Math.cos(rot) * innerRadius
      y = cy + Math.sin(rot) * innerRadius
      ctx.lineTo(x, y)
      rot += step
    }
    ctx.lineTo(cx, cy - outerRadius)
    ctx.closePath()
    ctx.fill()
  }

  /**
   * 绘制爆炸光晕效果
   */
  const drawExplosionGlow = (ctx: CanvasRenderingContext2D, x: number, y: number, progress: number) => {
    const maxRadius = 200
    const radius = maxRadius * (1 - progress * 0.7)
    const alpha = 0.4 * (1 - progress)
    
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius)
    gradient.addColorStop(0, `rgba(255, 215, 0, ${alpha})`)
    gradient.addColorStop(0.3, `rgba(255, 165, 0, ${alpha * 0.7})`)
    gradient.addColorStop(0.6, `rgba(255, 69, 0, ${alpha * 0.4})`)
    gradient.addColorStop(1, 'rgba(255, 165, 0, 0)')
    
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.fill()
  }

  useEffect(() => {
    if (!trigger) {
      triggeredRef.current = false
      return
    }
    
    if (trigger && !triggeredRef.current) {
      triggeredRef.current = true
      
      const canvas = canvasRef.current
      if (canvas) {
        const rect = canvas.getBoundingClientRect()
        const centerPoint = center || { 
          x: rect.width * 0.5, 
          y: rect.height * 0.4 
        }
        
        createFireworkBurst(centerPoint.x, centerPoint.y)
      }
    }
  }, [trigger, center, createFireworkBurst])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let width = window.innerWidth
    let height = window.innerHeight
    
    /**
     * 设置画布尺寸
     */
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

    /**
     * 动画循环
     */
    const animate = (currentTime: number) => {
      const deltaTime = currentTime - lastTime
      lastTime = currentTime

      // 清空画布
      ctx.clearRect(0, 0, width, height)

      // 使用 lighter 混合模式实现发光效果
      ctx.globalCompositeOperation = 'lighter'

      let hasActiveParticles = false
      const elapsed = currentTime - startTimeRef.current
      const progress = Math.min(elapsed / duration, 1)

      // 绘制爆炸光晕（仅在动画前半段）
      if (progress < 0.5 && particlesRef.current.length > 0) {
        const firstParticle = particlesRef.current[0]
        drawExplosionGlow(ctx, firstParticle.x, firstParticle.y, progress * 2)
      }

      // 更新和绘制粒子
      particlesRef.current = particlesRef.current.filter((particle) => {
        // 物理运动计算
        particle.vy += particle.gravity * (deltaTime / 16)
        particle.vx *= particle.drag
        particle.vy *= particle.drag
        
        particle.x += particle.vx * (deltaTime / 16)
        particle.y += particle.vy * (deltaTime / 16)
        
        particle.rotation += particle.rotationSpeed * (deltaTime / 16)
        
        // 生命值衰减
        particle.life -= deltaTime
        particle.alpha = Math.max(0, particle.life / particle.maxLife)

        // 更新拖尾
        particle.trail.unshift({ x: particle.x, y: particle.y, alpha: particle.alpha })
        if (particle.trail.length > 8) {
          particle.trail.pop()
        }

        if (particle.life <= 0 || particle.alpha <= 0) return false

        hasActiveParticles = true
        drawParticle(ctx, particle)
        return true
      })

      ctx.globalCompositeOperation = 'source-over'

      // 检查动画是否完成
      if (!hasActiveParticles && triggeredRef.current && !animationComplete) {
        animationComplete = true
        triggeredRef.current = false
        onComplete?.()
      }

      if (particlesRef.current.length > 0 || triggeredRef.current) {
        animationRef.current = requestAnimationFrame(animate)
      }
    }

    animationRef.current = requestAnimationFrame(animate)

    /**
     * 窗口大小变化处理
     */
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
