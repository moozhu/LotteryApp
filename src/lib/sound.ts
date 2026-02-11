// Sound effects manager using Web Audio API
// All sounds are generated in real-time using Web Audio API, no external files needed
class SoundManager {
  private audioContext: AudioContext | null = null
  private enabled: boolean = true
  private spinOsc: OscillatorNode | null = null
  private spinGain: GainNode | null = null
  private spinFilter: BiquadFilterNode | null = null
  private spinLfo: OscillatorNode | null = null
  private spinLfoGain: GainNode | null = null
  private spinAmpLfo: OscillatorNode | null = null
  private spinAmpLfoGain: GainNode | null = null
  private spinNoise: AudioBufferSourceNode | null = null
  private spinNoiseGain: GainNode | null = null
  private spinNoiseFilter: BiquadFilterNode | null = null

  private initAudioContext() {
    if (typeof window !== 'undefined' && !this.audioContext) {
      try {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      } catch {
        this.audioContext = null
      }
    }
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled
    if (!enabled) {
      this.stopSpin(true)
    }
    if (enabled && this.audioContext?.state === 'suspended') {
      try {
        this.audioContext.resume()
      } catch {
        this.audioContext = null
      }
    }
  }

  private ensureContext() {
    if (!this.audioContext) {
      this.initAudioContext()
    }
    if (this.audioContext?.state === 'suspended') {
      try {
        this.audioContext.resume()
      } catch {
        this.audioContext = null
      }
    }
    return this.audioContext
  }

  startSpin(intensity: number = 1) {
    if (!this.enabled) return
    const ctx = this.ensureContext()
    if (!ctx) return

    const now = ctx.currentTime
    const amount = Math.min(1, Math.max(0, intensity))
    const toneTargetGain = 0.012 + amount * 0.03
    const noiseTargetGain = 0.02 + amount * 0.05
    const baseFreq = 90 + amount * 95
    const filterFreq = 700 + amount * 2200
    const noiseFilterFreq = 450 + amount * 1800

    if (this.spinOsc && this.spinGain && this.spinFilter && this.spinNoiseGain && this.spinNoiseFilter) {
      this.spinOsc.frequency.setTargetAtTime(baseFreq, now, 0.03)
      this.spinFilter.frequency.setTargetAtTime(filterFreq, now, 0.03)
      this.spinGain.gain.cancelScheduledValues(now)
      this.spinGain.gain.setTargetAtTime(toneTargetGain, now, 0.04)
      this.spinNoiseFilter.frequency.setTargetAtTime(noiseFilterFreq, now, 0.05)
      this.spinNoiseGain.gain.cancelScheduledValues(now)
      this.spinNoiseGain.gain.setTargetAtTime(noiseTargetGain, now, 0.06)
      return
    }

    const osc = ctx.createOscillator()
    const filter = ctx.createBiquadFilter()
    const gain = ctx.createGain()

    osc.type = 'triangle'
    osc.frequency.setValueAtTime(baseFreq, now)

    filter.type = 'bandpass'
    filter.frequency.setValueAtTime(filterFreq, now)
    filter.Q.setValueAtTime(0.6 + amount * 1.2, now)

    gain.gain.setValueAtTime(0.0001, now)

    const lfo = ctx.createOscillator()
    const lfoGain = ctx.createGain()
    lfo.type = 'sine'
    lfo.frequency.setValueAtTime(4 + amount * 9, now)
    lfoGain.gain.setValueAtTime(110 + amount * 260, now)

    const ampLfo = ctx.createOscillator()
    const ampLfoGain = ctx.createGain()
    ampLfo.type = 'sine'
    ampLfo.frequency.setValueAtTime(2.2 + amount * 4.8, now)
    ampLfoGain.gain.setValueAtTime(0.004 + amount * 0.012, now)

    lfo.connect(lfoGain)
    lfoGain.connect(filter.frequency)
    ampLfo.connect(ampLfoGain)
    ampLfoGain.connect(gain.gain)

    osc.connect(filter)
    filter.connect(gain)
    gain.connect(ctx.destination)

    const noiseBufferSize = ctx.sampleRate * 1
    const noiseBuffer = ctx.createBuffer(1, noiseBufferSize, ctx.sampleRate)
    const noiseData = noiseBuffer.getChannelData(0)
    for (let i = 0; i < noiseBufferSize; i++) {
      noiseData[i] = (Math.random() * 2 - 1) * 0.9
    }

    const noise = ctx.createBufferSource()
    const noiseFilter = ctx.createBiquadFilter()
    const noiseGain = ctx.createGain()

    noise.buffer = noiseBuffer
    noise.loop = true

    noiseFilter.type = 'bandpass'
    noiseFilter.frequency.setValueAtTime(noiseFilterFreq, now)
    noiseFilter.Q.setValueAtTime(0.4 + amount * 0.9, now)

    noiseGain.gain.setValueAtTime(0.0001, now)

    noise.connect(noiseFilter)
    noiseFilter.connect(noiseGain)
    noiseGain.connect(ctx.destination)

    lfoGain.connect(noiseFilter.frequency)
    ampLfoGain.connect(noiseGain.gain)

    osc.start(now)
    lfo.start(now)
    ampLfo.start(now)
    noise.start(now)

    gain.gain.setTargetAtTime(toneTargetGain, now, 0.05)
    noiseGain.gain.setTargetAtTime(noiseTargetGain, now, 0.06)

    this.spinOsc = osc
    this.spinFilter = filter
    this.spinGain = gain
    this.spinLfo = lfo
    this.spinLfoGain = lfoGain
    this.spinAmpLfo = ampLfo
    this.spinAmpLfoGain = ampLfoGain
    this.spinNoise = noise
    this.spinNoiseFilter = noiseFilter
    this.spinNoiseGain = noiseGain
  }

  stopSpin(immediate: boolean = false) {
    const ctx = this.audioContext
    const gain = this.spinGain
    const osc = this.spinOsc
    const lfo = this.spinLfo
    const ampLfo = this.spinAmpLfo
    const noise = this.spinNoise
    const noiseGain = this.spinNoiseGain

    this.spinOsc = null
    this.spinGain = null
    this.spinFilter = null
    this.spinLfo = null
    this.spinLfoGain = null
    this.spinAmpLfo = null
    this.spinAmpLfoGain = null
    this.spinNoise = null
    this.spinNoiseGain = null
    this.spinNoiseFilter = null

    if (!ctx) return
    const now = ctx.currentTime
    const stopAt = now + (immediate ? 0.02 : 0.14)

    if (gain) {
      gain.gain.cancelScheduledValues(now)
      gain.gain.setTargetAtTime(0.0001, now, immediate ? 0.01 : 0.06)
    }
    if (noiseGain) {
      noiseGain.gain.cancelScheduledValues(now)
      noiseGain.gain.setTargetAtTime(0.0001, now, immediate ? 0.01 : 0.08)
    }

    osc?.stop(stopAt)
    lfo?.stop(stopAt)
    ampLfo?.stop(stopAt)
    noise?.stop(stopAt)
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

  playFireworkBurst() {
    if (!this.enabled) return
    const ctx = this.ensureContext()
    if (!ctx) return

    const now = ctx.currentTime

    const clickOsc = ctx.createOscillator()
    const clickGain = ctx.createGain()
    clickOsc.type = 'square'
    clickOsc.frequency.setValueAtTime(1800, now)
    clickGain.gain.setValueAtTime(0.0001, now)
    clickGain.gain.linearRampToValueAtTime(0.12, now + 0.002)
    clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.02)
    clickOsc.connect(clickGain)
    clickGain.connect(ctx.destination)
    clickOsc.start(now)
    clickOsc.stop(now + 0.03)

    const kickOsc = ctx.createOscillator()
    const kickGain = ctx.createGain()
    kickOsc.type = 'sine'
    kickOsc.frequency.setValueAtTime(120, now)
    kickOsc.frequency.exponentialRampToValueAtTime(42, now + 0.16)
    kickGain.gain.setValueAtTime(0.0001, now)
    kickGain.gain.linearRampToValueAtTime(0.9, now + 0.006)
    kickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32)
    kickOsc.connect(kickGain)
    kickGain.connect(ctx.destination)
    kickOsc.start(now)
    kickOsc.stop(now + 0.34)

    const thumpSize = Math.floor(ctx.sampleRate * 0.09)
    const thumpBuffer = ctx.createBuffer(1, thumpSize, ctx.sampleRate)
    const thumpData = thumpBuffer.getChannelData(0)
    for (let i = 0; i < thumpSize; i++) {
      thumpData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (thumpSize * 0.22))
    }

    const thump = ctx.createBufferSource()
    const thumpFilter = ctx.createBiquadFilter()
    const thumpGain = ctx.createGain()
    thump.buffer = thumpBuffer
    thumpFilter.type = 'lowpass'
    thumpFilter.frequency.setValueAtTime(180, now)
    thumpFilter.Q.setValueAtTime(0.7, now)
    thumpGain.gain.setValueAtTime(0.0001, now)
    thumpGain.gain.linearRampToValueAtTime(0.55, now + 0.008)
    thumpGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14)
    thump.connect(thumpFilter)
    thumpFilter.connect(thumpGain)
    thumpGain.connect(ctx.destination)
    thump.start(now)
    thump.stop(now + 0.1)

    const crackSize = Math.floor(ctx.sampleRate * 0.06)
    const crackBuffer = ctx.createBuffer(1, crackSize, ctx.sampleRate)
    const crackData = crackBuffer.getChannelData(0)
    for (let i = 0; i < crackSize; i++) {
      crackData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (crackSize * 0.16))
    }

    const crack = ctx.createBufferSource()
    const crackFilter = ctx.createBiquadFilter()
    const crackGain = ctx.createGain()
    crack.buffer = crackBuffer
    crackFilter.type = 'highpass'
    crackFilter.frequency.setValueAtTime(1200, now)
    crackFilter.Q.setValueAtTime(0.8, now)
    crackGain.gain.setValueAtTime(0.0001, now)
    crackGain.gain.linearRampToValueAtTime(0.26, now + 0.004)
    crackGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08)
    crack.connect(crackFilter)
    crackFilter.connect(crackGain)
    crackGain.connect(ctx.destination)
    crack.start(now)
    crack.stop(now + 0.08)

    const tailOsc = ctx.createOscillator()
    const tailGain = ctx.createGain()
    tailOsc.type = 'triangle'
    tailOsc.frequency.setValueAtTime(240, now + 0.03)
    tailOsc.frequency.exponentialRampToValueAtTime(160, now + 0.22)
    tailGain.gain.setValueAtTime(0.0001, now + 0.03)
    tailGain.gain.linearRampToValueAtTime(0.12, now + 0.06)
    tailGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.26)
    tailOsc.connect(tailGain)
    tailGain.connect(ctx.destination)
    tailOsc.start(now + 0.03)
    tailOsc.stop(now + 0.28)
  }

  playWin() {
    if (!this.enabled) return
    const ctx = this.ensureContext()
    if (!ctx) return

    const now = ctx.currentTime

    const freqs = [523.25, 659.25, 783.99, 1046.5]
    freqs.forEach((freq, index) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, now)
      osc.detune.setValueAtTime((Math.random() - 0.5) * 10, now)

      const start = now + index * 0.055
      gain.gain.setValueAtTime(0, start)
      gain.gain.linearRampToValueAtTime(0.16, start + 0.012)
      gain.gain.exponentialRampToValueAtTime(0.01, start + 0.32)

      osc.start(start)
      osc.stop(start + 0.38)
    })

    const sparkleBufferSize = Math.floor(ctx.sampleRate * 0.08)
    const sparkleBuffer = ctx.createBuffer(1, sparkleBufferSize, ctx.sampleRate)
    const sparkleOutput = sparkleBuffer.getChannelData(0)
    for (let i = 0; i < sparkleBufferSize; i++) {
      sparkleOutput[i] = (Math.random() * 2 - 1) * Math.exp(-i / (sparkleBufferSize * 0.25))
    }

    const sparkle = ctx.createBufferSource()
    const sparkleGain = ctx.createGain()
    const sparkleFilter = ctx.createBiquadFilter()

    sparkle.buffer = sparkleBuffer
    sparkle.connect(sparkleFilter)
    sparkleFilter.connect(sparkleGain)
    sparkleGain.connect(ctx.destination)

    sparkleFilter.type = 'highpass'
    sparkleFilter.frequency.setValueAtTime(2600, now)

    sparkleGain.gain.setValueAtTime(0.09, now + 0.1)
    sparkleGain.gain.exponentialRampToValueAtTime(0.01, now + 0.28)

    sparkle.start(now + 0.1)
    sparkle.stop(now + 0.24)
  }

  // Legacy method for compatibility
  playDrawTick(intensity: number = 1) {
    this.playSlotTick(intensity)
  }
}

export const soundManager = new SoundManager()
