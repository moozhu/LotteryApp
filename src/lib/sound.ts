// Sound effects manager using Web Audio API
class SoundManager {
  private audioContext: AudioContext | null = null
  private enabled: boolean = true
  private drawingOscillator: OscillatorNode | null = null
  private drawingGain: GainNode | null = null
  private drawingLFO: OscillatorNode | null = null
  private drawingLFOGain: GainNode | null = null

  constructor() {
    this.initAudioContext()
  }

  private initAudioContext() {
    if (typeof window !== 'undefined' && !this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled
    if (enabled && this.audioContext?.state === 'suspended') {
      this.audioContext.resume()
    }
  }

  private ensureContext() {
    if (!this.audioContext) {
      this.initAudioContext()
    }
    if (this.audioContext?.state === 'suspended') {
      this.audioContext.resume()
    }
    return this.audioContext
  }

  // Play click sound - short tick
  playClick() {
    if (!this.enabled) return
    const ctx = this.ensureContext()
    if (!ctx) return

    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.frequency.value = 800
    oscillator.type = 'sine'

    gainNode.gain.setValueAtTime(0.1, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05)

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.05)
  }

  // Start continuous drawing sound with speed-based pitch
  startDrawingSound() {
    if (!this.enabled) return
    const ctx = this.ensureContext()
    if (!ctx) return

    // Stop any existing sound
    this.stopDrawingSound()

    // Create main oscillator (sawtooth for mechanical sound)
    this.drawingOscillator = ctx.createOscillator()
    this.drawingGain = ctx.createGain()

    this.drawingOscillator.connect(this.drawingGain)
    this.drawingGain.connect(ctx.destination)

    this.drawingOscillator.type = 'sawtooth'
    this.drawingOscillator.frequency.setValueAtTime(150, ctx.currentTime)

    // Create LFO for modulation
    this.drawingLFO = ctx.createOscillator()
    this.drawingLFOGain = ctx.createGain()
    this.drawingLFO.connect(this.drawingLFOGain)
    this.drawingLFOGain.connect(this.drawingOscillator.frequency)

    this.drawingLFO.type = 'sine'
    this.drawingLFO.frequency.value = 15
    this.drawingLFOGain.gain.value = 40

    // Set initial volume
    this.drawingGain.gain.setValueAtTime(0.08, ctx.currentTime)

    this.drawingLFO.start()
    this.drawingOscillator.start()
  }

  // Update drawing sound based on rotation speed (0-1)
  updateDrawingSpeed(speed: number) {
    if (!this.enabled || !this.drawingOscillator || !this.drawingLFO) return
    const ctx = this.audioContext
    if (!ctx) return

    // Map speed to frequency range (150Hz - 600Hz)
    const baseFreq = 150 + (speed * 450)
    const lfoFreq = 10 + (speed * 30)
    const volume = 0.05 + (speed * 0.1)

    const now = ctx.currentTime
    this.drawingOscillator.frequency.setTargetAtTime(baseFreq, now, 0.1)
    this.drawingLFO.frequency.setTargetAtTime(lfoFreq, now, 0.1)
    this.drawingGain!.gain.setTargetAtTime(volume, now, 0.1)
  }

  // Stop drawing sound
  stopDrawingSound() {
    if (this.drawingOscillator) {
      try {
        this.drawingOscillator.stop()
        this.drawingOscillator.disconnect()
      } catch (e) {}
      this.drawingOscillator = null
    }
    if (this.drawingLFO) {
      try {
        this.drawingLFO.stop()
        this.drawingLFO.disconnect()
      } catch (e) {}
      this.drawingLFO = null
    }
    this.drawingGain = null
    this.drawingLFOGain = null
  }

  // Play win sound - celebratory chord with confetti match
  playWin() {
    if (!this.enabled) return
    const ctx = this.ensureContext()
    if (!ctx) return

    const now = ctx.currentTime

    // Layer 1: Major chord arpeggio (C-E-G-C)
    const chordFreqs = [523.25, 659.25, 783.99, 1046.5]
    chordFreqs.forEach((freq, index) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      const filter = ctx.createBiquadFilter()

      osc.connect(filter)
      filter.connect(gain)
      gain.connect(ctx.destination)

      osc.frequency.value = freq
      osc.type = 'triangle'
      filter.type = 'lowpass'
      filter.frequency.value = 2000

      const startTime = now + index * 0.08
      gain.gain.setValueAtTime(0, startTime)
      gain.gain.linearRampToValueAtTime(0.12, startTime + 0.05)
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 1.2)

      osc.start(startTime)
      osc.stop(startTime + 1.5)
    })

    // Layer 2: Sparkle effect (high frequency bells)
    const sparkleFreqs = [2093, 2637, 3136, 4186]
    sparkleFreqs.forEach((freq, index) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.frequency.value = freq
      osc.type = 'sine'

      const startTime = now + 0.3 + index * 0.06
      gain.gain.setValueAtTime(0, startTime)
      gain.gain.linearRampToValueAtTime(0.08, startTime + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.4)

      osc.start(startTime)
      osc.stop(startTime + 0.5)
    })

    // Layer 3: Bass thump for impact
    const bassOsc = ctx.createOscillator()
    const bassGain = ctx.createGain()
    const bassFilter = ctx.createBiquadFilter()

    bassOsc.connect(bassFilter)
    bassFilter.connect(bassGain)
    bassGain.connect(ctx.destination)

    bassOsc.frequency.setValueAtTime(80, now)
    bassOsc.frequency.exponentialRampToValueAtTime(40, now + 0.3)
    bassOsc.type = 'sawtooth'
    bassFilter.type = 'lowpass'
    bassFilter.frequency.setValueAtTime(200, now)
    bassFilter.frequency.exponentialRampToValueAtTime(50, now + 0.3)

    bassGain.gain.setValueAtTime(0.2, now)
    bassGain.gain.exponentialRampToValueAtTime(0.01, now + 0.4)

    bassOsc.start(now)
    bassOsc.stop(now + 0.5)
  }

  // Play draw sound - single tick for slot machine effect
  playDrawTick(intensity: number = 1) {
    if (!this.enabled) return
    const ctx = this.ensureContext()
    if (!ctx) return

    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    // Higher pitch for higher intensity
    const baseFreq = 200 + (intensity * 400)
    oscillator.frequency.setValueAtTime(baseFreq, ctx.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(baseFreq * 0.5, ctx.currentTime + 0.05)
    oscillator.type = 'square'

    const volume = 0.05 + (intensity * 0.1)
    gainNode.gain.setValueAtTime(volume, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05)

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.05)
  }
}

export const soundManager = new SoundManager()
