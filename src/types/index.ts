// ==================== Participant ====================
export interface Participant {
  id: string
  employeeId: string
  name: string
  department?: string
  createdAt: number
}

// ==================== Prize ====================
export interface Prize {
  id: string
  name: string
  count: number
  prizeName: string
  prizeImage?: string
  order: number
  createdAt: number
}

// ==================== Winner ====================
export interface Winner {
  id: string
  prizeId: string
  participantId: string
  participant: Participant
  wonAt: number
  round: number
}

// ==================== Settings ====================
export interface AppSettings {
  allowRepeat: boolean
  drawMode: 'batch' | 'single'
  animationMode: 'cloud' // Removed 'slot'
  title: string
  theme: 'luxury' | 'red' | 'vibrant'
  fontFamily: 'serif' | 'sans'
  soundEnabled: boolean
  showDonation: boolean
}

// ==================== Draw State ====================
export type DrawStatus = 'idle' | 'preparing' | 'drawing' | 'slowing' | 'highlighting' | 'finished'

// ==================== Theme ====================
export interface ThemeConfig {
  key: 'red' | 'luxury' | 'vibrant'
  name: string
  description: string
  primaryColor: string
}

export const THEMES: ThemeConfig[] = [
  { key: 'red', name: '中国红', description: '喜庆传统', primaryColor: '#E53935' },
  { key: 'luxury', name: '奢华金', description: '精致高端', primaryColor: '#C9A227' },
  { key: 'vibrant', name: '活力橙', description: '轻松活泼', primaryColor: '#FF6B35' },
]

// ==================== Default Prizes ====================
export const DEFAULT_PRIZES: Omit<Prize, 'id' | 'createdAt'>[] = [
  { name: '一等奖', count: 1, prizeName: 'HUAWEI Mate 80 Pro Max', order: 1, prizeImage: '/images/prizes/huawei-mate80.png' },
  { name: '二等奖', count: 2, prizeName: 'iPhone 17', order: 2, prizeImage: '/images/prizes/iPhone17.png' },
  { name: '三等奖', count: 3, prizeName: 'HUAWEI MatePad Air', order: 3, prizeImage: '/images/prizes/huawei-matepad.png' },
  { name: '幸运奖', count: 10, prizeName: '小米手环 10', order: 4, prizeImage: '/images/prizes/xiaomi-band10.png' },
]

// ==================== Prize Icons ====================
export const PRIZE_ICONS: Record<number, string> = {
  1: '🥇',
  2: '🥈',
  3: '🥉',
  4: '🎁',
  5: '🎀',
  6: '⭐',
  7: '💎',
  8: '🏆',
}
