import { useEffect, useRef, useCallback } from 'react'
import { soundManager } from '@/lib/sound'

/**
 * 彩带爆炸动效组件
 * 专门为中奖场景设计的彩带爆炸效果
 */
interface ConfettiParticle {
  x: number
  y: number
  vx: number
  vy: number
  width: number
  height: number
  color: string
  rotation: number
  rotationSpeed: number
  gravity: number
  drag: number
  life: number
  maxLife: number
  alpha: number
  type: 'ribbon' | 'paper' | 'star'
  oscillation: number
  oscillationSpeed: number
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
  /** 是否播放音效 */
  withSound?: boolean
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
  '#FF69B4', // 热粉
  '#FFA07A', // 浅鲑鱼色
]

/**
 * 彩带类型定义
 */
const CONFETTI_TYPES: Array<'ribbon' | 'paper' | 'star'> = ['ribbon', 'paper', 'star']

export default function PrizeFireworks({
  trigger,
  onComplete,
  center,
  duration = 4000,
  withSound = true,
}: PrizeFireworksProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<ConfettiParticle[]>([])
  const animationRef = useRef<number>(0)
  const triggeredRef = useRef(false)
  const startTimeRef = useRef<number>(0)
  const centerRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })

  /**
   * 创建彩带粒子
   */
  const createParticle = useCallback((x: number, y: number, angle: number, speed: number): ConfettiParticle => {
    const type = CONFETTI_TYPES[Math.floor(Math.random() * CONFETTI_TYPES.length)]
    const life = 2500 + Math.random() * 2000 // 2.5-4.5秒生命周期
    const color = CELEBRATION_COLORS[Math.floor(Math.random() * CELEBRATION_COLORS.length)]
    
    // 根据类型设置不同的尺寸
    let width: number, height: number
    switch (type) {
      case 'ribbon':
        width = Math.random() * 8 + 6
        height = Math.random() * 20 + 15
        break
      case 'paper':
        width = Math.random() * 10 + 8
        height = width
        break
      case 'star':
        width = Math.random() * 12 + 8
        height = width
        break
    }
    
    return {
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      width,
      height,
      color,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.4,
      gravity: 0.15 + Math.random() * 0.1,
      drag: 0.985 + Math.random() * 0.01,
      life,
      maxLife: life,
      alpha: 1,
      type,
      oscillation: Math.random() * Math.PI * 2,
      oscillationSpeed: 0.05 + Math.random() * 0.05,
    }
  }, [])

  /**
   * 创建彩带爆炸效果
   */
  const createConfettiBurst = useCallback((centerX: number, centerY: number) => {
    const particles: ConfettiParticle[] = []
    const totalParticles = 150 + Math.floor(Math.random() * 50) // 150-200个粒子
    
    // 第一波：核心爆炸 - 快速向外扩散
    const coreCount = Math.floor(totalParticles * 0.35)
    for (let i = 0; i < coreCount; i++) {
      const angle = (Math.PI * 2 * i) / coreCount + Math.random() * 0.5
      const speed = 9 + Math.random() * 7
      particles.push(createParticle(centerX, centerY, angle, speed))
    }
    
    // 第二波：中层扩散 - 中等速度，填充间隙
    const midCount = Math.floor(totalParticles * 0.4)
    for (let i = 0; i < midCount; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 5 + Math.random() * 5
      particles.push(createParticle(centerX, centerY, angle, speed))
    }
    
    // 第三波：外围粒子 - 缓慢飘散
    const outerCount = Math.floor(totalParticles * 0.25)
    for (let i = 0; i < outerCount; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 3 + Math.random() * 4
      particles.push(createParticle(centerX, centerY, angle, speed))
    }

    particlesRef.current = particles
    startTimeRef.current = performance.now()
  }, [createParticle])

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
   * 绘制彩带粒子
   */
  const drawParticle = (ctx: CanvasRenderingContext2D, particle: ConfettiParticle, time: number) => {
    ctx.save()
    ctx.translate(particle.x, particle.y)
    ctx.rotate(particle.rotation)
    ctx.globalAlpha = particle.alpha

    // 添加摆动效果
    const oscillation = Math.sin(time * particle.oscillationSpeed + particle.oscillation) * 0.1
    ctx.scale(1 + oscillation, 1 - oscillation)

    ctx.fillStyle = particle.color
    ctx.shadowBlur = 8
    ctx.shadowColor = particle.color

    switch (particle.type) {
      case 'ribbon':
        // 绘制彩带条 - 带弯曲效果
        ctx.beginPath()
        ctx.moveTo(-particle.width / 2, -particle.height / 2)
        ctx.quadraticCurveTo(
          particle.width / 2, 
          -particle.height / 4,
          particle.width / 2,
          0
        )
        ctx.quadraticCurveTo(
          particle.width / 2,
          particle.height / 4,
          -particle.width / 2,
          particle.height / 2
        )
        ctx.quadraticCurveTo(
          -particle.width / 2,
          particle.height / 4,
          -particle.width / 2,
          0
        )
        ctx.quadraticCurveTo(
          -particle.width / 2,
          -particle.height / 4,
          -particle.width / 2,
          -particle.height / 2
        )
        ctx.closePath()
        ctx.fill()
        break
        
      case 'paper':
        // 绘制方形纸片
        ctx.fillRect(
          -particle.width / 2,
          -particle.height / 2,
          particle.width,
          particle.height
        )
        break
        
      case 'star':
        // 绘制五角星
        drawStar(ctx, 0, 0, 5, particle.width / 2, particle.width / 5)
        break
    }

    ctx.restore()
  }

  /**
   * 绘制爆炸光晕效果
   */
  const drawExplosionGlow = (ctx: CanvasRenderingContext2D, x: number, y: number, progress: number) => {
    const maxRadius = 180
    const radius = maxRadius * (1 - progress * 0.6)
    const alpha = 0.35 * (1 - progress)
    
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius)
    gradient.addColorStop(0, `rgba(255, 215, 0, ${alpha})`)
    gradient.addColorStop(0.3, `rgba(255, 165, 0, ${alpha * 0.7})`)
    gradient.addColorStop(0.7, `rgba(255, 69, 0, ${alpha * 0.3})`)
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

    if (!triggeredRef.current) {
      triggeredRef.current = true

      const canvas = canvasRef.current
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      const c = center || { x: rect.width * 0.5, y: rect.height * 0.5 }
      centerRef.current = c

      particlesRef.current = []
      startTimeRef.current = performance.now()

      // 创建彩带爆炸
      createConfettiBurst(c.x, c.y)

      // 播放音效
      if (withSound) {
        soundManager.playWin()
        setTimeout(() => soundManager.playFireworkBurst(), 40)
        setTimeout(() => soundManager.playFireworkBurst(), 240)
      }
    }
  }, [trigger, center, createConfettiBurst, withSound])

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
      const deltaTime = Math.min(34, currentTime - lastTime)
      lastTime = currentTime

      // 清空画布
      ctx.clearRect(0, 0, width, height)

      const elapsed = currentTime - startTimeRef.current
      const progress = Math.min(elapsed / duration, 1)

      // 使用 lighter 混合模式实现发光效果
      ctx.globalCompositeOperation = 'lighter'

      let hasActiveParticles = false
      const c = centerRef.current

      // 绘制爆炸光晕（仅在动画前半段）
      if (progress < 0.5) {
        drawExplosionGlow(ctx, c.x, c.y, progress * 2)
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
        particle.oscillation += particle.oscillationSpeed * (deltaTime / 16)
        
        // 生命值衰减
        particle.life -= deltaTime
        particle.alpha = Math.max(0, particle.life / particle.maxLife)

        if (particle.life <= 0 || particle.alpha <= 0) return false

        hasActiveParticles = true
        drawParticle(ctx, particle, currentTime / 1000)
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
