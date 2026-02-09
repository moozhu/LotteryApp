// Sound effects manager using Web Audio API
class SoundManager {
  private audioContext: AudioContext | null = null
  private enabled: boolean = true
  private noiseBuffer: AudioBuffer | null = null

  constructor() {
    this.initAudioContext()
    this.createNoiseBuffer()
  }

  private initAudioContext() {
    if (typeof window !== 'undefined' && !this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
  }

  private createNoiseBuffer() {
    if (!this.audioContext) return
    const bufferSize = this.audioContext.sampleRate * 2
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate)
    const output = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1
    }
    this.noiseBuffer = buffer
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

  // Play click sound - short mechanical tick
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

  // Play slot machine rolling sound - mechanical reel spinning
  playSlotTick(speed: number = 1) {
    if (!this.enabled) return
    const ctx = this.ensureContext()
    if (!ctx) return

    const now = ctx.currentTime

    // Mechanical "click-clack" sound - two distinct tones
    const click1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    click1.connect(gain1)
    gain1.connect(ctx.destination)

    click1.type = 'square'
    click1.frequency.setValueAtTime(400 + speed * 200, now)
    click1.frequency.exponentialRampToValueAtTime(200, now + 0.03)

    gain1.gain.setValueAtTime(0.15, now)
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.03)

    click1.start(now)
    click1.stop(now + 0.03)

    // Second click for mechanical feel
    const click2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    click2.connect(gain2)
    gain2.connect(ctx.destination)

    click2.type = 'triangle'
    click2.frequency.setValueAtTime(300 + speed * 150, now + 0.015)

    gain2.gain.setValueAtTime(0, now + 0.015)
    gain2.gain.linearRampToValueAtTime(0.1, now + 0.02)
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.04)

    click2.start(now + 0.015)
    click2.stop(now + 0.04)

    // Add mechanical noise/rattle
    if (this.noiseBuffer && speed > 0.5) {
      const noise = ctx.createBufferSource()
      const noiseGain = ctx.createGain()
      const noiseFilter = ctx.createBiquadFilter()

      noise.buffer = this.noiseBuffer
      noise.connect(noiseFilter)
      noiseFilter.connect(noiseGain)
      noiseGain.connect(ctx.destination)

      noiseFilter.type = 'bandpass'
      noiseFilter.frequency.value = 800 + speed * 400
      noiseFilter.Q.value = 1

      noiseGain.gain.setValueAtTime(0.03 * speed, now)
      noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.05)

      noise.start(now)
      noise.stop(now + 0.05)
    }
  }

  // Play win sound - firework explosion "BANG" followed by sparkle
  playWin() {
    if (!this.enabled) return
    const ctx = this.ensureContext()
    if (!ctx) return

    const now = ctx.currentTime

    // EXPLOSION - The "PENG" sound
    // Layer 1: Deep bass impact (the "boom")
    const boomOsc = ctx.createOscillator()
    const boomGain = ctx.createGain()
    const boomFilter = ctx.createBiquadFilter()

    boomOsc.connect(boomFilter)
    boomFilter.connect(boomGain)
    boomGain.connect(ctx.destination)

    boomOsc.type = 'sawtooth'
    boomOsc.frequency.setValueAtTime(80, now)
    boomOsc.frequency.exponentialRampToValueAtTime(30, now + 0.15)

    boomFilter.type = 'lowpass'
    boomFilter.frequency.setValueAtTime(200, now)
    boomFilter.frequency.exponentialRampToValueAtTime(50, now + 0.2)

    boomGain.gain.setValueAtTime(0.5, now)
    boomGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3)

    boomOsc.start(now)
    boomOsc.stop(now + 0.3)

    // Layer 2: White noise burst (the "crack" of explosion)
    if (this.noiseBuffer) {
      const crack = ctx.createBufferSource()
      const crackGain = ctx.createGain()
      const crackFilter = ctx.createBiquadFilter()

      crack.buffer = this.noiseBuffer
      crack.connect(crackFilter)
      crackFilter.connect(crackGain)
      crackGain.connect(ctx.destination)

      crackFilter.type = 'highpass'
      crackFilter.frequency.value = 1000

      crackGain.gain.setValueAtTime(0.3, now)
      crackGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1)

      crack.start(now)
      crack.stop(now + 0.1)
    }

    // Layer 3: Metallic ring (explosion resonance)
    const ringOsc = ctx.createOscillator()
    const ringGain = ctx.createGain()

    ringOsc.connect(ringGain)
    ringGain.connect(ctx.destination)

    ringOsc.type = 'sine'
    ringOsc.frequency.setValueAtTime(200, now + 0.05)
    ringOsc.frequency.exponentialRampToValueAtTime(150, now + 0.3)

    ringGain.gain.setValueAtTime(0, now + 0.05)
    ringGain.gain.linearRampToValueAtTime(0.2, now + 0.08)
    ringGain.gain.exponentialRampToValueAtTime(0.01, now + 0.4)

    ringOsc.start(now + 0.05)
    ringOsc.stop(now + 0.4)

    // SPARKLE EFFECTS - High pitch chimes after explosion
    const sparkleFreqs = [2093, 2637, 3136, 4186]
    sparkleFreqs.forEach((freq, index) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.frequency.value = freq
      osc.type = 'sine'

      const startTime = now + 0.15 + index * 0.04
      gain.gain.setValueAtTime(0, startTime)
      gain.gain.linearRampToValueAtTime(0.08, startTime + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3)

      osc.start(startTime)
      osc.stop(startTime + 0.35)
    })

    // Additional sparkle with triangle wave for brightness
    const brightSparkle = ctx.createOscillator()
    const brightGain = ctx.createGain()

    brightSparkle.connect(brightGain)
    brightGain.connect(ctx.destination)

    brightSparkle.type = 'triangle'
    brightSparkle.frequency.setValueAtTime(1500, now + 0.2)
    brightSparkle.frequency.linearRampToValueAtTime(3000, now + 0.25)

    brightGain.gain.setValueAtTime(0, now + 0.2)
    brightGain.gain.linearRampToValueAtTime(0.1, now + 0.22)
    brightGain.gain.exponentialRampToValueAtTime(0.01, now + 0.4)

    brightSparkle.start(now + 0.2)
    brightSparkle.stop(now + 0.4)
  }

  // Legacy method for compatibility
  playDrawTick(intensity: number = 1) {
    this.playSlotTick(intensity)
  }
}

export const soundManager = new SoundManager()
