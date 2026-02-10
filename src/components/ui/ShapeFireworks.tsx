import { useEffect, useRef, useCallback } from 'react'

type ShapeType = 'circle' | 'triangle' | 'diamond'

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

interface FloatingParticle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  phase: number
  phaseSpeed: number
  alpha: number
  color: string
}

interface DriftingParticle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  alpha: number
  color: string
}

interface SoftBlob {
  x: number
  y: number
  radius: number
  vx: number
  vy: number
  phase: number
  phaseSpeed: number
  color: string
}

interface ShapeFireworksProps {
  trigger?: boolean
  onComplete?: () => void
  auto?: boolean
}

export default function ShapeFireworks({ trigger, onComplete, auto = true }: ShapeFireworksProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fireworksRef = useRef<ShapeFirework[]>([])
  const animationRef = useRef<number>(0)
  const triggeredRef = useRef(false)
  const autoRef = useRef(true)

  const colors = [
    '#F6C69A',
    '#F2B6A0',
    '#EBC3A9',
    '#E7BFA0',
    '#F0C4B3',
  ]

  const shapes: ShapeType[] = ['circle', 'triangle', 'diamond']

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
    }
    
    ctx.fill()
    ctx.stroke()
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

  const createFirework = useCallback((x: number, y: number) => {
    const particleCount = 8 + Math.floor(Math.random() * 6)
    const shape = shapes[Math.floor(Math.random() * shapes.length)]
    const color = colors[Math.floor(Math.random() * colors.length)]
    
    const particles: ShapeParticle[] = []
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.2
      const velocity = Math.random() * 1.8 + 1.2
      
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.06,
        scale: Math.random() * 0.35 + 0.7,
        alpha: 1,
        decay: Math.random() * 0.018 + 0.012,
        color,
        shape,
        size: Math.random() * 6 + 6,
      })
    }

    fireworksRef.current.push({ particles, x, y })
  }, [colors, shapes])

  useEffect(() => {
    autoRef.current = auto
    if (trigger && !triggeredRef.current) {
      triggeredRef.current = true
      
      const canvas = canvasRef.current
      if (canvas) {
        const width = canvas.width / (window.devicePixelRatio || 1)
        const height = canvas.height / (window.devicePixelRatio || 1)
        
        const count = 4 + Math.floor(Math.random() * 2)
        for (let i = 0; i < count; i++) {
          setTimeout(() => {
            const x = Math.random() * width * 0.6 + width * 0.2
            const y = Math.random() * height * 0.4 + height * 0.15
            createFirework(x, y)
          }, i * 260 + Math.random() * 180)
        }
      }
    }
  }, [trigger, createFirework, auto])

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

    let lastTime = performance.now()
    let inactiveTime = 0
    let autoTime = 0
    const floatingParticles: FloatingParticle[] = []
    const floatingCount = 72
    const floatingColors = [
      'rgba(255, 214, 182, 0.95)',
      'rgba(250, 208, 182, 0.92)',
      'rgba(245, 202, 174, 0.9)',
      'rgba(252, 198, 170, 0.9)',
    ]
    const driftingParticles: DriftingParticle[] = []
    const driftingCount = 48
    const driftingColors = [
      'rgba(255, 224, 196, 0.95)',
      'rgba(250, 210, 184, 0.92)',
      'rgba(246, 204, 176, 0.9)',
    ]
    const softBlobs: SoftBlob[] = []
    const blobColors = [
      'rgba(255, 220, 192, 0.7)',
      'rgba(248, 210, 184, 0.66)',
      'rgba(242, 202, 176, 0.62)',
    ]

    for (let i = 0; i < floatingCount; i++) {
      floatingParticles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.18,
        vy: -Math.random() * 0.3 - 0.06,
        size: Math.random() * 4.2 + 3.2,
        phase: Math.random() * Math.PI * 2,
        phaseSpeed: Math.random() * 0.012 + 0.005,
        alpha: Math.random() * 0.45 + 0.35,
        color: floatingColors[Math.floor(Math.random() * floatingColors.length)],
      })
    }

    for (let i = 0; i < driftingCount; i++) {
      driftingParticles.push({
        x: Math.random() * width,
        y: height + Math.random() * height * 0.4,
        vx: (Math.random() - 0.5) * 0.264,
        vy: -Math.random() * 0.66 - 0.192,
        size: Math.random() * 3.8 + 2.2,
        alpha: Math.random() * 0.38 + 0.3,
        color: driftingColors[Math.floor(Math.random() * driftingColors.length)],
      })
    }

    const blobCount = 6
    for (let i = 0; i < blobCount; i++) {
      softBlobs.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 340 + 260,
        vx: (Math.random() - 0.5) * 0.16,
        vy: (Math.random() - 0.5) * 0.14,
        phase: Math.random() * Math.PI * 2,
        phaseSpeed: Math.random() * 0.008 + 0.0045,
        color: blobColors[Math.floor(Math.random() * blobColors.length)],
      })
    }

    const animate = (currentTime: number) => {
      const deltaTime = currentTime - lastTime
      lastTime = currentTime

      ctx.clearRect(0, 0, width, height)

      ctx.save()
      ctx.globalCompositeOperation = 'source-over'

      softBlobs.forEach(blob => {
        blob.x += blob.vx * (deltaTime / 16)
        blob.y += blob.vy * (deltaTime / 16)
        blob.phase += blob.phaseSpeed * (deltaTime / 16)
        const breathe = 0.8 + Math.sin(blob.phase) * 0.32
        const radius = blob.radius * breathe
        if (blob.x < -radius) blob.x = width + radius
        if (blob.x > width + radius) blob.x = -radius
        if (blob.y < -radius) blob.y = height + radius
        if (blob.y > height + radius) blob.y = -radius
        ctx.filter = 'blur(30px)'
        const gradient = ctx.createRadialGradient(blob.x, blob.y, 0, blob.x, blob.y, radius)
        gradient.addColorStop(0, blob.color)
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(blob.x, blob.y, radius, 0, Math.PI * 2)
        ctx.fill()
      })
      ctx.filter = 'none'

      floatingParticles.forEach(particle => {
        particle.x += particle.vx * (deltaTime / 16)
        particle.y += particle.vy * (deltaTime / 16)
        particle.phase += particle.phaseSpeed * (deltaTime / 16)
        const pulse = 0.5 + Math.sin(particle.phase) * 0.5
        const opacity = particle.alpha * (0.75 + pulse * 0.55)
        if (particle.x < -10) particle.x = width + 10
        if (particle.x > width + 10) particle.x = -10
        if (particle.y < -10) particle.y = height + 10
        ctx.globalAlpha = opacity
        ctx.fillStyle = particle.color
        ctx.shadowBlur = 8
        ctx.shadowColor = particle.color
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowBlur = 0
        ctx.globalAlpha = 1
      })

      driftingParticles.forEach(particle => {
        particle.x += particle.vx * (deltaTime / 16)
        particle.y += particle.vy * (deltaTime / 16)
        if (particle.y < -20) {
          particle.y = height + 20
          particle.x = Math.random() * width
        }
        if (particle.x < -20) particle.x = width + 20
        if (particle.x > width + 20) particle.x = -20
        ctx.globalAlpha = particle.alpha
        ctx.fillStyle = particle.color
        ctx.shadowBlur = 10
        ctx.shadowColor = particle.color
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowBlur = 0
        ctx.globalAlpha = 1
      })

      ctx.restore()

      let hasActiveFireworks = false

      fireworksRef.current = fireworksRef.current.filter((firework) => {
        drawGlow(ctx, firework.x, firework.y, 'rgb(246, 198, 154)', 80)
        firework.particles = firework.particles.filter((particle) => {
          particle.x += particle.vx * (deltaTime / 16)
          particle.y += particle.vy * (deltaTime / 16)
          particle.vy += 0.04
          
          particle.rotation += particle.rotationSpeed * (deltaTime / 16)
          
          particle.alpha -= particle.decay * (deltaTime / 16)
          
          particle.scale *= 0.995

          if (particle.alpha <= 0) return false

          hasActiveFireworks = true

          ctx.save()
          ctx.translate(particle.x, particle.y)
          ctx.rotate(particle.rotation)
          ctx.scale(particle.scale, particle.scale)
          ctx.fillStyle = particle.color
          ctx.strokeStyle = particle.color
          ctx.globalAlpha = particle.alpha
          ctx.lineWidth = 1
          ctx.shadowBlur = 10
          ctx.shadowColor = particle.color
          
          drawShape(ctx, particle.shape, 0, 0, particle.size)
          
          ctx.restore()

          return true
        })

        return firework.particles.length > 0
      })

      if (!hasActiveFireworks && triggeredRef.current) {
        inactiveTime += deltaTime
        if (inactiveTime > 800) {
          triggeredRef.current = false
          onComplete?.()
        }
      } else {
        inactiveTime = 0
      }

      if (autoRef.current && !triggeredRef.current) {
        autoTime += deltaTime
        if (autoTime > 780 + Math.random() * 520) {
          autoTime = 0
          const batch = 3 + Math.floor(Math.random() * 2)
          for (let i = 0; i < batch; i++) {
            setTimeout(() => {
              const x = Math.random() * width * 0.7 + width * 0.15
              const y = Math.random() * height * 0.45 + height * 0.12
              createFirework(x, y)
            }, i * 180 + Math.random() * 120)
          }
        }
      } else {
        autoTime = 0
      }

      if (fireworksRef.current.length > 0 || triggeredRef.current || autoRef.current) {
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
  }, [onComplete, createFirework])

  if (!trigger && fireworksRef.current.length === 0 && !auto) return null

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 1 }}
    />
  )
}
