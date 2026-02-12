// 音效管理器 - 基于 Web Audio API
// 所有音效均使用 Web Audio API 实时生成，无需外部文件
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

  /**
   * 抽奖旋转音效 - 电子扫频 + 带通滤波产生旋转感
   * intensity 0~1 映射频率和音量
   */
  startSpin(intensity: number = 1) {
    if (!this.enabled) return
    const ctx = this.ensureContext()
    if (!ctx) return

    const now = ctx.currentTime
    const amount = Math.min(1, Math.max(0, intensity))
    const toneTargetGain = 0.008 + amount * 0.022
    const noiseTargetGain = 0.012 + amount * 0.035
    const baseFreq = 80 + amount * 120
    const filterFreq = 600 + amount * 2500
    const noiseFilterFreq = 400 + amount * 2000

    // 若已有旋转音，平滑过渡参数
    if (this.spinOsc && this.spinGain && this.spinFilter && this.spinNoiseGain && this.spinNoiseFilter) {
      this.spinOsc.frequency.setTargetAtTime(baseFreq, now, 0.04)
      this.spinFilter.frequency.setTargetAtTime(filterFreq, now, 0.04)
      this.spinGain.gain.cancelScheduledValues(now)
      this.spinGain.gain.setTargetAtTime(toneTargetGain, now, 0.05)
      this.spinNoiseFilter.frequency.setTargetAtTime(noiseFilterFreq, now, 0.05)
      this.spinNoiseGain.gain.cancelScheduledValues(now)
      this.spinNoiseGain.gain.setTargetAtTime(noiseTargetGain, now, 0.06)
      return
    }

    // 锯齿波基音 + 带通滤波 → 更有质感的电子扫频
    const osc = ctx.createOscillator()
    const filter = ctx.createBiquadFilter()
    const gain = ctx.createGain()

    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(baseFreq, now)

    filter.type = 'bandpass'
    filter.frequency.setValueAtTime(filterFreq, now)
    filter.Q.setValueAtTime(1.2 + amount * 2.0, now)

    gain.gain.setValueAtTime(0.0001, now)

    // 频率 LFO → 产生"嗡嗡"旋转感
    const lfo = ctx.createOscillator()
    const lfoGain = ctx.createGain()
    lfo.type = 'sine'
    lfo.frequency.setValueAtTime(3 + amount * 10, now)
    lfoGain.gain.setValueAtTime(80 + amount * 200, now)

    // 振幅 LFO → 产生节奏脉动感
    const ampLfo = ctx.createOscillator()
    const ampLfoGain = ctx.createGain()
    ampLfo.type = 'sine'
    ampLfo.frequency.setValueAtTime(2 + amount * 5, now)
    ampLfoGain.gain.setValueAtTime(0.003 + amount * 0.009, now)

    lfo.connect(lfoGain)
    lfoGain.connect(filter.frequency)
    ampLfo.connect(ampLfoGain)
    ampLfoGain.connect(gain.gain)

    osc.connect(filter)
    filter.connect(gain)
    gain.connect(ctx.destination)

    // 白噪声层 → 增加空气感/风声效果
    const noiseBufferSize = ctx.sampleRate * 1
    const noiseBuffer = ctx.createBuffer(1, noiseBufferSize, ctx.sampleRate)
    const noiseData = noiseBuffer.getChannelData(0)
    for (let i = 0; i < noiseBufferSize; i++) {
      noiseData[i] = (Math.random() * 2 - 1) * 0.85
    }

    const noise = ctx.createBufferSource()
    const noiseFilter = ctx.createBiquadFilter()
    const noiseGain = ctx.createGain()

    noise.buffer = noiseBuffer
    noise.loop = true

    noiseFilter.type = 'bandpass'
    noiseFilter.frequency.setValueAtTime(noiseFilterFreq, now)
    noiseFilter.Q.setValueAtTime(0.5 + amount * 1.0, now)

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

    gain.gain.setTargetAtTime(toneTargetGain, now, 0.06)
    noiseGain.gain.setTargetAtTime(noiseTargetGain, now, 0.07)

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
    const stopAt = now + (immediate ? 0.03 : 0.18)

    if (gain) {
      gain.gain.cancelScheduledValues(now)
      gain.gain.setTargetAtTime(0.0001, now, immediate ? 0.01 : 0.08)
    }
    if (noiseGain) {
      noiseGain.gain.cancelScheduledValues(now)
      noiseGain.gain.setTargetAtTime(0.0001, now, immediate ? 0.01 : 0.1)
    }

    osc?.stop(stopAt)
    lfo?.stop(stopAt)
    ampLfo?.stop(stopAt)
    noise?.stop(stopAt)
  }

  /**
   * 点击反馈音
   */
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

  /**
   * 滚动刻度音 - 清脆"叮"声 + 金属共振泛音
   * speed 0~1 映射音高和音量
   */
  playSlotTick(speed: number = 1) {
    if (!this.enabled) return
    const ctx = this.ensureContext()
    if (!ctx) return

    const now = ctx.currentTime
    const intensity = Math.min(1, Math.max(0.3, speed))

    // 清脆"叮"声 — 纯正弦波短脉冲
    const pingOsc = ctx.createOscillator()
    const pingGain = ctx.createGain()

    pingOsc.connect(pingGain)
    pingGain.connect(ctx.destination)

    pingOsc.type = 'sine'
    // 速度越快音高越高，产生加速感
    pingOsc.frequency.setValueAtTime(1200 + intensity * 600, now)
    pingOsc.frequency.exponentialRampToValueAtTime(800 + intensity * 300, now + 0.04)

    // 极快 attack，快速衰减
    pingGain.gain.setValueAtTime(0, now)
    pingGain.gain.linearRampToValueAtTime(0.12 * intensity, now + 0.002)
    pingGain.gain.exponentialRampToValueAtTime(0.005, now + 0.06)

    pingOsc.start(now)
    pingOsc.stop(now + 0.07)

    // 金属共振泛音 — 三角波倍频
    const harmOsc = ctx.createOscillator()
    const harmGain = ctx.createGain()
    const harmFilter = ctx.createBiquadFilter()

    harmOsc.connect(harmFilter)
    harmFilter.connect(harmGain)
    harmGain.connect(ctx.destination)

    harmOsc.type = 'triangle'
    harmOsc.frequency.setValueAtTime(2400 + intensity * 800, now)
    harmOsc.frequency.exponentialRampToValueAtTime(1600, now + 0.03)

    harmFilter.type = 'highpass'
    harmFilter.frequency.value = 1800
    harmFilter.Q.value = 1.5

    harmGain.gain.setValueAtTime(0, now)
    harmGain.gain.linearRampToValueAtTime(0.04 * intensity, now + 0.003)
    harmGain.gain.exponentialRampToValueAtTime(0.002, now + 0.05)

    harmOsc.start(now)
    harmOsc.stop(now + 0.06)

    // 微弱余音尾部 — 延长的细微共鸣
    const tailOsc = ctx.createOscillator()
    const tailGain = ctx.createGain()

    tailOsc.connect(tailGain)
    tailGain.connect(ctx.destination)

    tailOsc.type = 'sine'
    tailOsc.frequency.setValueAtTime(600 + intensity * 200, now)

    tailGain.gain.setValueAtTime(0, now + 0.01)
    tailGain.gain.linearRampToValueAtTime(0.015 * intensity, now + 0.015)
    tailGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1)

    tailOsc.start(now + 0.01)
    tailOsc.stop(now + 0.11)
  }

  /**
   * 爆炸音效 - 饱满低频冲击 + 高频碎裂 + 中频余音
   */
  playFireworkBurst() {
    if (!this.enabled) return
    const ctx = this.ensureContext()
    if (!ctx) return

    const now = ctx.currentTime

    // 层 1: 低频冲击 — 30Hz→80Hz 扫频
    const kickOsc = ctx.createOscillator()
    const kickGain = ctx.createGain()
    kickOsc.type = 'sine'
    kickOsc.frequency.setValueAtTime(80, now)
    kickOsc.frequency.exponentialRampToValueAtTime(30, now + 0.2)
    kickGain.gain.setValueAtTime(0.0001, now)
    kickGain.gain.linearRampToValueAtTime(0.6, now + 0.005)
    kickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35)
    kickOsc.connect(kickGain)
    kickGain.connect(ctx.destination)
    kickOsc.start(now)
    kickOsc.stop(now + 0.38)

    // 层 2: 高频碎裂 — 噪声 + 高通滤波
    const crackSize = Math.floor(ctx.sampleRate * 0.08)
    const crackBuffer = ctx.createBuffer(1, crackSize, ctx.sampleRate)
    const crackData = crackBuffer.getChannelData(0)
    for (let i = 0; i < crackSize; i++) {
      crackData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (crackSize * 0.12))
    }

    const crack = ctx.createBufferSource()
    const crackFilter = ctx.createBiquadFilter()
    const crackGain = ctx.createGain()
    crack.buffer = crackBuffer
    crackFilter.type = 'highpass'
    crackFilter.frequency.setValueAtTime(1500, now)
    crackFilter.Q.setValueAtTime(0.6, now)
    crackGain.gain.setValueAtTime(0.0001, now)
    crackGain.gain.linearRampToValueAtTime(0.22, now + 0.003)
    crackGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1)
    crack.connect(crackFilter)
    crackFilter.connect(crackGain)
    crackGain.connect(ctx.destination)
    crack.start(now)
    crack.stop(now + 0.1)

    // 层 3: 低频重击噪声 — 增加震撼体感
    const thumpSize = Math.floor(ctx.sampleRate * 0.1)
    const thumpBuffer = ctx.createBuffer(1, thumpSize, ctx.sampleRate)
    const thumpData = thumpBuffer.getChannelData(0)
    for (let i = 0; i < thumpSize; i++) {
      thumpData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (thumpSize * 0.2))
    }

    const thump = ctx.createBufferSource()
    const thumpFilter = ctx.createBiquadFilter()
    const thumpGain = ctx.createGain()
    thump.buffer = thumpBuffer
    thumpFilter.type = 'lowpass'
    thumpFilter.frequency.setValueAtTime(200, now)
    thumpFilter.Q.setValueAtTime(0.8, now)
    thumpGain.gain.setValueAtTime(0.0001, now)
    thumpGain.gain.linearRampToValueAtTime(0.4, now + 0.006)
    thumpGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16)
    thump.connect(thumpFilter)
    thumpFilter.connect(thumpGain)
    thumpGain.connect(ctx.destination)
    thump.start(now)
    thump.stop(now + 0.12)

    // 层 4: 中频余音 — 空间延伸感
    const tailOsc = ctx.createOscillator()
    const tailGain = ctx.createGain()
    const tailFilter = ctx.createBiquadFilter()
    tailOsc.type = 'triangle'
    tailOsc.frequency.setValueAtTime(280, now + 0.02)
    tailOsc.frequency.exponentialRampToValueAtTime(140, now + 0.3)
    tailFilter.type = 'bandpass'
    tailFilter.frequency.setValueAtTime(350, now + 0.02)
    tailFilter.Q.setValueAtTime(1.5, now + 0.02)
    tailGain.gain.setValueAtTime(0.0001, now + 0.02)
    tailGain.gain.linearRampToValueAtTime(0.08, now + 0.05)
    tailGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32)
    tailOsc.connect(tailFilter)
    tailFilter.connect(tailGain)
    tailGain.connect(ctx.destination)
    tailOsc.start(now + 0.02)
    tailOsc.stop(now + 0.34)
  }

  /**
   * 中奖音效 - 上行琶音和弦 + shimmer 闪烁 + sub-bass 冲击
   * C大调 C5→E5→G5→C6 琶音
   */
  playWin() {
    if (!this.enabled) return
    const ctx = this.ensureContext()
    if (!ctx) return

    const now = ctx.currentTime

    // 层 1: 上行琶音和弦 C5→E5→G5→C6
    const freqs = [523.25, 659.25, 783.99, 1046.5]
    freqs.forEach((freq, index) => {
      // 主音
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, now)

      const start = now + index * 0.07
      gain.gain.setValueAtTime(0, start)
      gain.gain.linearRampToValueAtTime(0.14, start + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.02, start + 0.4)
      gain.gain.setTargetAtTime(0.0001, start + 0.4, 0.05)

      osc.start(start)
      osc.stop(start + 0.5)

      // 倍频泛音 — 增加丰富度
      const harmOsc = ctx.createOscillator()
      const harmGain = ctx.createGain()
      harmOsc.connect(harmGain)
      harmGain.connect(ctx.destination)
      harmOsc.type = 'sine'
      harmOsc.frequency.setValueAtTime(freq * 2, now)
      harmOsc.detune.setValueAtTime((Math.random() - 0.5) * 8, now)

      harmGain.gain.setValueAtTime(0, start)
      harmGain.gain.linearRampToValueAtTime(0.04, start + 0.01)
      harmGain.gain.exponentialRampToValueAtTime(0.005, start + 0.3)

      harmOsc.start(start)
      harmOsc.stop(start + 0.35)
    })

    // 层 2: Shimmer 高频闪烁 — 白噪声 + 高通滤波
    const shimmerSize = Math.floor(ctx.sampleRate * 0.15)
    const shimmerBuffer = ctx.createBuffer(1, shimmerSize, ctx.sampleRate)
    const shimmerData = shimmerBuffer.getChannelData(0)
    for (let i = 0; i < shimmerSize; i++) {
      shimmerData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (shimmerSize * 0.4))
    }

    const shimmer = ctx.createBufferSource()
    const shimmerGain = ctx.createGain()
    const shimmerFilter = ctx.createBiquadFilter()

    shimmer.buffer = shimmerBuffer
    shimmer.connect(shimmerFilter)
    shimmerFilter.connect(shimmerGain)
    shimmerGain.connect(ctx.destination)

    shimmerFilter.type = 'highpass'
    shimmerFilter.frequency.setValueAtTime(3000, now)
    shimmerFilter.Q.setValueAtTime(0.5, now)

    shimmerGain.gain.setValueAtTime(0.0001, now + 0.05)
    shimmerGain.gain.linearRampToValueAtTime(0.06, now + 0.1)
    shimmerGain.gain.exponentialRampToValueAtTime(0.005, now + 0.4)

    shimmer.start(now + 0.05)
    shimmer.stop(now + 0.35)

    // 层 3: Sub-bass 冲击 — 增加震撼感
    const subOsc = ctx.createOscillator()
    const subGain = ctx.createGain()
    subOsc.type = 'sine'
    subOsc.frequency.setValueAtTime(60, now)
    subOsc.frequency.exponentialRampToValueAtTime(35, now + 0.15)
    subGain.gain.setValueAtTime(0.0001, now)
    subGain.gain.linearRampToValueAtTime(0.35, now + 0.008)
    subGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25)
    subOsc.connect(subGain)
    subGain.connect(ctx.destination)
    subOsc.start(now)
    subOsc.stop(now + 0.28)

    // 层 4: 上行滑音尾部 — 增加"升起"的感觉
    const sweepOsc = ctx.createOscillator()
    const sweepGain = ctx.createGain()
    const sweepFilter = ctx.createBiquadFilter()
    sweepOsc.type = 'sine'
    sweepOsc.frequency.setValueAtTime(400, now + 0.15)
    sweepOsc.frequency.exponentialRampToValueAtTime(2000, now + 0.55)
    sweepFilter.type = 'bandpass'
    sweepFilter.frequency.setValueAtTime(1200, now + 0.15)
    sweepFilter.Q.setValueAtTime(2, now + 0.15)
    sweepGain.gain.setValueAtTime(0, now + 0.15)
    sweepGain.gain.linearRampToValueAtTime(0.03, now + 0.2)
    sweepGain.gain.exponentialRampToValueAtTime(0.001, now + 0.55)
    sweepOsc.connect(sweepFilter)
    sweepFilter.connect(sweepGain)
    sweepGain.connect(ctx.destination)
    sweepOsc.start(now + 0.15)
    sweepOsc.stop(now + 0.58)
  }

  /**
   * 彩带炸开 "嘭" 音效 — 礼炮效果
   * 低频冲击 + 气流爆破 + 弹簧回弹
   */
  playConfettiBoom() {
    if (!this.enabled) return
    const ctx = this.ensureContext()
    if (!ctx) return

    const now = ctx.currentTime

    // 层 1: 低频"嘭" — 短促有力的冲击
    const boomOsc = ctx.createOscillator()
    const boomGain = ctx.createGain()
    boomOsc.type = 'sine'
    boomOsc.frequency.setValueAtTime(150, now)
    boomOsc.frequency.exponentialRampToValueAtTime(40, now + 0.12)
    boomGain.gain.setValueAtTime(0.0001, now)
    boomGain.gain.linearRampToValueAtTime(0.7, now + 0.004)
    boomGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2)
    boomOsc.connect(boomGain)
    boomGain.connect(ctx.destination)
    boomOsc.start(now)
    boomOsc.stop(now + 0.22)

    // 层 2: 气流爆破噪声 — 模拟空气冲击
    const popSize = Math.floor(ctx.sampleRate * 0.06)
    const popBuffer = ctx.createBuffer(1, popSize, ctx.sampleRate)
    const popData = popBuffer.getChannelData(0)
    for (let i = 0; i < popSize; i++) {
      // 前半段强后半段弱的噪声包络
      const envelope = i < popSize * 0.1
        ? i / (popSize * 0.1)
        : Math.exp(-(i - popSize * 0.1) / (popSize * 0.15))
      popData[i] = (Math.random() * 2 - 1) * envelope
    }

    const pop = ctx.createBufferSource()
    const popFilter = ctx.createBiquadFilter()
    const popGain = ctx.createGain()
    pop.buffer = popBuffer
    popFilter.type = 'bandpass'
    popFilter.frequency.setValueAtTime(800, now)
    popFilter.Q.setValueAtTime(0.8, now)
    popGain.gain.setValueAtTime(0.45, now)
    pop.connect(popFilter)
    popFilter.connect(popGain)
    popGain.connect(ctx.destination)
    pop.start(now)
    pop.stop(now + 0.08)

    // 层 3: 弹簧回弹泛音 — "啵"的尾音
    const springOsc = ctx.createOscillator()
    const springGain = ctx.createGain()
    springOsc.type = 'triangle'
    springOsc.frequency.setValueAtTime(400, now + 0.02)
    springOsc.frequency.exponentialRampToValueAtTime(200, now + 0.1)
    springGain.gain.setValueAtTime(0, now + 0.02)
    springGain.gain.linearRampToValueAtTime(0.12, now + 0.03)
    springGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14)
    springOsc.connect(springGain)
    springGain.connect(ctx.destination)
    springOsc.start(now + 0.02)
    springOsc.stop(now + 0.16)
  }

  // 兼容旧接口
  playDrawTick(intensity: number = 1) {
    this.playSlotTick(intensity)
  }
}

export const soundManager = new SoundManager()
