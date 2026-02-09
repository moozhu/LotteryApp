import { create } from 'zustand'
import type { Participant, Prize, Winner, AppSettings } from '@/types'
import { DEFAULT_PRIZES } from '@/types'
import { generateId, imageToBase64, validateBackupData } from '@/lib/utils'

const STORAGE_KEY = 'lottery-app-data'

interface LotteryState {
  participants: Participant[]
  prizes: Prize[]
  winners: Winner[]
  settings: AppSettings

  // Computed helpers
  getWinnersByPrize: (prizeId: string) => Winner[]
  getRemainingCount: (prizeId: string) => number
  getAvailableParticipants: () => Participant[]

  // Participant actions
  addParticipant: (p: Omit<Participant, 'id' | 'createdAt'>) => void
  removeParticipant: (id: string) => void
  updateParticipant: (id: string, updates: Partial<Participant>) => void
  importParticipants: (list: Omit<Participant, 'id' | 'createdAt'>[]) => void
  generateParticipants: (start: number, end: number, prefix?: string) => void
  clearParticipants: () => void

  // Prize actions
  addPrize: (p: Omit<Prize, 'id' | 'createdAt'>) => void
  removePrize: (id: string) => void
  updatePrize: (id: string, updates: Partial<Prize>) => void
  reorderPrizes: (ids: string[]) => void
  resetPrizesToDefault: () => void

  // Draw actions
  drawWinners: (prizeId: string, count: number) => Participant[]

  // Settings
  updateSettings: (updates: Partial<AppSettings>) => void

  // Data management
  exportData: () => string
  exportDataWithImages: () => Promise<{ json: string; imageCount: number }>
  importData: (json: string) => boolean
  importDataWithImages: (json: string) => Promise<{ success: boolean; message: string }>
  resetWinners: () => void
  resetAll: (options: { winners: boolean; participants: boolean; prizes: boolean }) => void
}

function loadFromStorage(): Partial<{ participants: Participant[]; prizes: Prize[]; winners: Winner[]; settings: AppSettings }> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) {
    console.error('Failed to load from storage:', e)
  }
  return {}
}

function saveToStorage(state: { participants: Participant[]; prizes: Prize[]; winners: Winner[]; settings: AppSettings }) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      participants: state.participants,
      prizes: state.prizes,
      winners: state.winners,
      settings: state.settings,
    }))
  } catch (e) {
    console.error('Failed to save to storage:', e)
  }
}

function createDefaultPrizes(): Prize[] {
  return DEFAULT_PRIZES.map(p => ({
    ...p,
    id: generateId(),
    createdAt: Date.now(),
  }))
}

const stored = loadFromStorage()

export const useLotteryStore = create<LotteryState>((set, get) => ({
  participants: stored.participants || [],
  prizes: stored.prizes?.length ? stored.prizes : createDefaultPrizes(),
  winners: stored.winners || [],
  settings: {
    allowRepeat: false,
    drawMode: 'batch',
    animationMode: 'cloud',
    title: '幸运大抽奖',
    theme: 'red',
    fontFamily: 'sans',
    soundEnabled: true,
    showDonation: true,
    ...stored.settings,
  },

  getWinnersByPrize: (prizeId) => {
    return get().winners.filter(w => w.prizeId === prizeId)
  },

  getRemainingCount: (prizeId) => {
    const state = get()
    const prize = state.prizes.find(p => p.id === prizeId)
    if (!prize) return 0
    return prize.count - state.winners.filter(w => w.prizeId === prizeId).length
  },

  getAvailableParticipants: () => {
    const state = get()
    if (state.settings.allowRepeat) return state.participants
    const winnerIds = new Set(state.winners.map(w => w.participantId))
    return state.participants.filter(p => !winnerIds.has(p.id))
  },

  addParticipant: (p) => {
    set(state => {
      const newState = {
        ...state,
        participants: [...state.participants, {
          ...p,
          id: generateId(),
          createdAt: Date.now(),
        }],
      }
      saveToStorage(newState)
      return newState
    })
  },

  removeParticipant: (id) => {
    set(state => {
      const newState = {
        ...state,
        participants: state.participants.filter(p => p.id !== id),
      }
      saveToStorage(newState)
      return newState
    })
  },

  updateParticipant: (id, updates) => {
    set(state => {
      const newState = {
        ...state,
        participants: state.participants.map(p =>
          p.id === id ? { ...p, ...updates } : p
        ),
      }
      saveToStorage(newState)
      return newState
    })
  },

  importParticipants: (list) => {
    set(state => {
      const imported = list.map(p => ({
        ...p,
        id: generateId(),
        createdAt: Date.now(),
      }))
      const newState = {
        ...state,
        participants: [...state.participants, ...imported],
      }
      saveToStorage(newState)
      return newState
    })
  },

  generateParticipants: (start, end, prefix = '参与者') => {
    set(state => {
      const generated: Participant[] = []
      for (let i = start; i <= end; i++) {
        generated.push({
          id: generateId(),
          employeeId: String(i).padStart(3, '0'),
          name: `${prefix}${i}`,
          createdAt: Date.now(),
        })
      }
      const newState = {
        ...state,
        participants: [...state.participants, ...generated],
      }
      saveToStorage(newState)
      return newState
    })
  },

  clearParticipants: () => {
    set(state => {
      const newState = { ...state, participants: [] }
      saveToStorage(newState)
      return newState
    })
  },

  addPrize: (p) => {
    set(state => {
      const newState = {
        ...state,
        prizes: [...state.prizes, {
          ...p,
          id: generateId(),
          createdAt: Date.now(),
        }],
      }
      saveToStorage(newState)
      return newState
    })
  },

  removePrize: (id) => {
    set(state => {
      const newState = {
        ...state,
        prizes: state.prizes.filter(p => p.id !== id),
      }
      saveToStorage(newState)
      return newState
    })
  },

  updatePrize: (id, updates) => {
    set(state => {
      const newState = {
        ...state,
        prizes: state.prizes.map(p =>
          p.id === id ? { ...p, ...updates } : p
        ),
      }
      saveToStorage(newState)
      return newState
    })
  },

  reorderPrizes: (ids) => {
    set(state => {
      const newPrizes = ids
        .map(id => state.prizes.find(p => p.id === id))
        .filter((p): p is Prize => !!p)
        .map((p, i) => ({ ...p, order: i + 1 }))
      const newState = { ...state, prizes: newPrizes }
      saveToStorage(newState)
      return newState
    })
  },

  resetPrizesToDefault: () => {
    set(state => {
      const newState = { ...state, prizes: createDefaultPrizes() }
      saveToStorage(newState)
      return newState
    })
  },

  drawWinners: (prizeId, count) => {
    const state = get()
    const available = state.getAvailableParticipants()
    if (available.length === 0) return []

    const shuffled = [...available].sort(() => Math.random() - 0.5)
    const selected = shuffled.slice(0, Math.min(count, shuffled.length))

    const newWinners: Winner[] = selected.map((participant, index) => ({
      id: generateId(),
      prizeId,
      participantId: participant.id,
      participant: { ...participant },
      wonAt: Date.now(),
      round: index + 1,
    }))

    set(state => {
      const newState = {
        ...state,
        winners: [...state.winners, ...newWinners],
      }
      saveToStorage(newState)
      return newState
    })

    return selected
  },

  updateSettings: (updates) => {
    set(state => {
      const newState = {
        ...state,
        settings: { ...state.settings, ...updates },
      }
      saveToStorage(newState)
      return newState
    })
  },

  exportData: () => {
    const state = get()
    return JSON.stringify({
      version: '1.0',
      exportTime: Date.now(),
      data: {
        participants: state.participants,
        prizes: state.prizes,
        winners: state.winners,
        settings: state.settings,
      },
    }, null, 2)
  },

  exportDataWithImages: async () => {
    const state = get()
    const images: Record<string, string> = {}
    let imageCount = 0

    // 收集所有奖项图片
    const imagePaths = new Set<string>()
    state.prizes.forEach(prize => {
      if (prize.prizeImage && prize.prizeImage.startsWith('/images/')) {
        imagePaths.add(prize.prizeImage)
      }
    })

    // 将图片转换为 Base64
    for (const path of imagePaths) {
      const base64 = await imageToBase64(path)
      if (base64) {
        images[path] = base64
        imageCount++
      }
    }

    const exportData = {
      version: '1.1',
      exportTime: Date.now(),
      data: {
        participants: state.participants,
        prizes: state.prizes,
        winners: state.winners,
        settings: state.settings,
      },
      images: imageCount > 0 ? images : undefined,
    }

    return {
      json: JSON.stringify(exportData, null, 2),
      imageCount,
    }
  },

  importData: (json) => {
    try {
      const parsed = JSON.parse(json)
      if (parsed.data) {
        set(state => {
          const newState = {
            ...state,
            participants: parsed.data.participants || state.participants,
            prizes: parsed.data.prizes || state.prizes,
            winners: parsed.data.winners || state.winners,
            settings: { ...state.settings, ...parsed.data.settings },
          }
          saveToStorage(newState)
          return newState
        })
        return true
      }
    } catch (e) {
      console.error('Import failed:', e)
    }
    return false
  },

  importDataWithImages: async (json) => {
    try {
      const parsed = JSON.parse(json)
      
      // 验证数据完整性
      const validation = validateBackupData(parsed)
      if (!validation.valid) {
        return { success: false, message: `数据验证失败: ${validation.errors.join(', ')}` }
      }

      // 处理图片数据
      const images = parsed.images as Record<string, string> | undefined
      let importedImages = 0

      if (images && typeof images === 'object') {
        // 创建图片下载队列
        for (const [path, base64] of Object.entries(images)) {
          if (typeof base64 === 'string' && base64.startsWith('data:')) {
            try {
              // 下载图片到本地
              const response = await fetch(base64)
              const blob = await response.blob()
              const blobUrl = URL.createObjectURL(blob)
              
              // 存储图片引用
              localStorage.setItem(`prize-image:${path}`, blobUrl)
              importedImages++
            } catch (e) {
              console.warn(`Failed to import image: ${path}`, e)
            }
          }
        }
      }

      // 更新状态
      set(state => {
        const newState = {
          ...state,
          participants: parsed.data.participants || state.participants,
          prizes: parsed.data.prizes || state.prizes,
          winners: parsed.data.winners || state.winners,
          settings: { ...state.settings, ...parsed.data.settings },
        }
        saveToStorage(newState)
        return newState
      })

      const message = importedImages > 0 
        ? `数据导入成功，包含 ${importedImages} 张图片` 
        : '数据导入成功'
      
      return { success: true, message }
    } catch (e) {
      console.error('Import failed:', e)
      return { success: false, message: `导入失败: ${e instanceof Error ? e.message : '未知错误'}` }
    }
  },

  resetWinners: () => {
    set(state => {
      const newState = { ...state, winners: [] }
      saveToStorage(newState)
      return newState
    })
  },

  resetAll: (options) => {
    set(state => {
      const newState = { ...state }
      if (options.winners) newState.winners = []
      if (options.participants) newState.participants = []
      if (options.prizes) newState.prizes = createDefaultPrizes()
      saveToStorage(newState)
      return newState
    })
  },
}))
