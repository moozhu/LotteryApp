import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateId(): string {
  // 使用 crypto API 生成更安全的随机 ID
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // 降级方案：使用 crypto.getRandomValues
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const arr = new Uint8Array(12)
    crypto.getRandomValues(arr)
    return Array.from(arr, b => b.toString(16).padStart(2, '0')).join('') + Date.now().toString(36)
  }
  // 最终降级
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36)
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function downloadFile(content: string, filename: string, type: string = 'text/csv') {
  const blob = new Blob(['\ufeff' + content], { type: `${type};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ==================== Image Backup Utilities ====================

/**
 * 将图片文件转换为 Base64 字符串
 */
export async function imageToBase64(imagePath: string): Promise<string | null> {
  try {
    const response = await fetch(imagePath)
    if (!response.ok) {
      console.warn(`Failed to fetch image: ${imagePath}`)
      return null
    }
    const blob = await response.blob()
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64 = reader.result as string
        resolve(base64)
      }
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch (error) {
    console.error(`Error converting image to base64: ${imagePath}`, error)
    return null
  }
}

/**
 * 从 Base64 字符串创建 Blob URL
 */
export function base64ToBlobUrl(base64: string): string {
  const byteString = atob(base64.split(',')[1])
  const mimeString = base64.split(',')[0].split(':')[1].split(';')[0]
  const ab = new ArrayBuffer(byteString.length)
  const ia = new Uint8Array(ab)
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i)
  }
  const blob = new Blob([ab], { type: mimeString })
  return URL.createObjectURL(blob)
}

/**
 * 从 Base64 下载图片文件
 */
export function downloadBase64Image(base64: string, filename: string) {
  const link = document.createElement('a')
  link.href = base64
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * 验证备份数据的完整性
 */
export function validateBackupData(data: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!data || typeof data !== 'object') {
    errors.push('备份数据格式无效')
    return { valid: false, errors }
  }

  const backup = data as Record<string, unknown>

  // 检查版本号
  if (!backup.version || typeof backup.version !== 'string') {
    errors.push('缺少版本号信息')
  }

  // 检查导出时间
  if (!backup.exportTime || typeof backup.exportTime !== 'number') {
    errors.push('缺少导出时间信息')
  }

  // 检查数据主体
  if (!backup.data || typeof backup.data !== 'object') {
    errors.push('缺少数据主体')
    return { valid: false, errors }
  }

  const dataBody = backup.data as Record<string, unknown>

  // 检查必需的字段
  if (!Array.isArray(dataBody.participants)) {
    errors.push('参与者数据格式无效')
  }

  if (!Array.isArray(dataBody.prizes)) {
    errors.push('奖项数据格式无效')
  }

  if (!Array.isArray(dataBody.winners)) {
    errors.push('中奖记录数据格式无效')
  }

  if (!dataBody.settings || typeof dataBody.settings !== 'object') {
    errors.push('设置数据格式无效')
  }

  // 检查图片数据（可选）
  if (backup.images && typeof backup.images !== 'object') {
    errors.push('图片数据格式无效')
  }

  return { valid: errors.length === 0, errors }
}
