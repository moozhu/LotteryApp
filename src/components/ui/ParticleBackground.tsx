import { useEffect, useRef } from 'react'
import { useLotteryStore } from '@/store/lottery'

export default function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const theme = useLotteryStore(s => s.settings.theme)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let width = window.innerWidth
    let height = window.innerHeight
    canvas.width = width
    canvas.height = height

    const particles: Particle[] = []
    const particleCount = 50

    // Get primary color from CSS variable
    const getPrimaryColor = () => {
      const style = getComputedStyle(document.documentElement)
      const color = style.getPropertyValue('--primary').trim()
      // Convert hex to rgb if needed, or just return it if it's a valid color string
      return color || '#E53935'
    }

    const primaryColor = getPrimaryColor()

    class Particle {
      x: number
      y: number
      vx: number
      vy: number
      size: number
      alpha: number
      color: string

      constructor() {
        this.x = Math.random() * width
        this.y = Math.random() * height
        this.vx = (Math.random() - 0.5) * 0.5
        this.vy = (Math.random() - 0.5) * 0.5
        this.size = Math.random() * 3 + 1 // Increased size
        this.alpha = Math.random() * 0.5 + 0.2 // Increased opacity
        this.color = primaryColor
      }

      update() {
        this.x += this.vx
        this.y += this.vy

        if (this.x < 0) this.x = width
        if (this.x > width) this.x = 0
        if (this.y < 0) this.y = height
        if (this.y > height) this.y = 0
      }

      draw() {
        if (!ctx) return
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.fillStyle = this.color
        ctx.globalAlpha = this.alpha
        ctx.fill()
        ctx.globalAlpha = 1.0
      }
    }

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle())
    }

    let animationId: number

    const animate = () => {
      ctx.clearRect(0, 0, width, height)
      particles.forEach(p => {
        p.update()
        p.draw()
      })
      animationId = requestAnimationFrame(animate)
    }

    animate()

    const handleResize = () => {
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = width
      canvas.height = height
    }

    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationId)
    }
  }, [theme])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
    />
  )
}
