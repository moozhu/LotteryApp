import { useEffect, useRef } from 'react'

interface FireworkEffectProps {
  isActive?: boolean
}

export default function FireworkEffect({ isActive = true }: FireworkEffectProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!isActive) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let width = window.innerWidth
    let height = window.innerHeight
    canvas.width = width
    canvas.height = height

    interface Particle {
      x: number
      y: number
      vx: number
      vy: number
      alpha: number
      color: string
    }

    let particles: Particle[] = []

    const createFirework = () => {
      const x = Math.random() * width
      const y = Math.random() * (height * 0.5)
      const color = `hsl(${Math.random() * 360}, 50%, 50%)`

      for (let i = 0; i < 30; i++) {
        const angle = (Math.PI * 2 * i) / 30
        const velocity = Math.random() * 2 + 1
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * velocity,
          vy: Math.sin(angle) * velocity,
          alpha: 1,
          color
        })
      }
    }

    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)' // Trail effect
      ctx.fillRect(0, 0, width, height)

      if (Math.random() < 0.02) {
        createFirework()
      }

      particles = particles.filter(p => p.alpha > 0)
      particles.forEach(p => {
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.05 // Gravity
        p.alpha -= 0.01
        ctx.beginPath()
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2)
        ctx.fillStyle = p.color.replace(')', `, ${p.alpha})`).replace('hsl', 'hsla')
        ctx.fill()
      })

      requestAnimationFrame(animate)
    }

    const animationId = requestAnimationFrame(animate)

    const handleResize = () => {
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = width
      canvas.height = height
    }

    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', handleResize)
    }
  }, [isActive])

  if (!isActive) return null

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 opacity-40 mix-blend-screen"
    />
  )
}
