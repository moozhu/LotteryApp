// Sound effects manager using Web Audio API
// All sounds are generated in real-time using Web Audio API, no external files needed
class SoundManager {
  private audioContext: AudioContext | null = null
  private enabled: boolean = true

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

  // Play slot machine rolling sound - mechanical reel spinning with "clack-clack" feel
  playSlotTick(speed: number = 1) {
    if (!this.enabled) return
    const ctx = this.ensureContext()
    if (!ctx) return

    const now = ctx.currentTime
    const intensity = Math.min(1, Math.max(0.3, speed))

    // Create a mechanical "clack" sound - simulates metal tab hitting
    // First sound: The "tick" - sharp attack, quick decay
    const tickOsc = ctx.createOscillator()
    const tickGain = ctx.createGain()
    const tickFilter = ctx.createBiquadFilter()

    tickOsc.connect(tickFilter)
    tickFilter.connect(tickGain)
    tickGain.connect(ctx.destination)

    // Use triangle wave for a more "hollow" mechanical sound
    tickOsc.type = 'triangle'
    // Frequency based on speed - faster = higher pitch
    tickOsc.frequency.setValueAtTime(600 + intensity * 400, now)
    tickOsc.frequency.exponentialRampToValueAtTime(300, now + 0.02)

    // Bandpass filter to make it sound more like a mechanical click
    tickFilter.type = 'bandpass'
    tickFilter.frequency.value = 1500
    tickFilter.Q.value = 2

    // Sharp attack, quick decay
    tickGain.gain.setValueAtTime(0, now)
    tickGain.gain.linearRampToValueAtTime(0.2 * intensity, now + 0.005)
    tickGain.gain.exponentialRampToValueAtTime(0.01, now + 0.04)

    tickOsc.start(now)
    tickOsc.stop(now + 0.05)

    // Second sound: The "clack" response - slightly delayed, lower pitch
    const clackOsc = ctx.createOscillator()
    const clackGain = ctx.createGain()
    const clackFilter = ctx.createBiquadFilter()

    clackOsc.connect(clackFilter)
    clackFilter.connect(clackGain)
    clackGain.connect(ctx.destination)

    clackOsc.type = 'square'
    clackOsc.frequency.setValueAtTime(200 + intensity * 100, now + 0.008)
    clackOsc.frequency.exponentialRampToValueAtTime(100, now + 0.03)

    clackFilter.type = 'lowpass'
    clackFilter.frequency.value = 800

    clackGain.gain.setValueAtTime(0, now + 0.008)
    clackGain.gain.linearRampToValueAtTime(0.15 * intensity, now + 0.012)
    clackGain.gain.exponentialRampToValueAtTime(0.01, now + 0.05)

    clackOsc.start(now + 0.008)
    clackOsc.stop(now + 0.06)

    // Third layer: Very short noise burst for texture (mechanical rattle)
    const bufferSize = ctx.sampleRate * 0.02
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const output = noiseBuffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3))
    }

    const noise = ctx.createBufferSource()
    const noiseGain = ctx.createGain()
    const noiseFilter = ctx.createBiquadFilter()

    noise.buffer = noiseBuffer
    noise.connect(noiseFilter)
    noiseFilter.connect(noiseGain)
    noiseGain.connect(ctx.destination)

    noiseFilter.type = 'bandpass'
    noiseFilter.frequency.value = 2000 + intensity * 1000
    noiseFilter.Q.value = 1

    noiseGain.gain.setValueAtTime(0.05 * intensity, now)
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.02)

    noise.start(now)
    noise.stop(now + 0.02)
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
    const crackBufferSize = ctx.sampleRate * 0.1
    const crackBuffer = ctx.createBuffer(1, crackBufferSize, ctx.sampleRate)
    const crackOutput = crackBuffer.getChannelData(0)
    for (let i = 0; i < crackBufferSize; i++) {
      crackOutput[i] = Math.random() * 2 - 1
    }

    const crack = ctx.createBufferSource()
    const crackGain = ctx.createGain()
    const crackFilter = ctx.createBiquadFilter()

    crack.buffer = crackBuffer
    crack.connect(crackFilter)
    crackFilter.connect(crackGain)
    crackGain.connect(ctx.destination)

    crackFilter.type = 'highpass'
    crackFilter.frequency.value = 1000

    crackGain.gain.setValueAtTime(0.3, now)
    crackGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1)

    crack.start(now)
    crack.stop(now + 0.1)

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
