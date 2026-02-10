import { useState, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useLotteryStore } from '@/store/lottery'
import { ArrowLeft, Plus, Trash2, Upload, Download, Hash, Search, Pencil, GripVertical, Image as ImageIcon, X, AlertTriangle } from 'lucide-react'
import { Switch } from '@/components/ui/Switch'
import { THEMES, PRIZE_ICONS } from '@/types'
import type { Participant, Prize } from '@/types'
import { downloadFile } from '@/lib/utils'
import { toast } from '@/components/ui/Toaster'
import { Modal } from '@/components/ui/Modal'
import ParticleBackground from '@/components/ui/ParticleBackground'
import FireworkEffect from '@/components/ui/FireworkEffect'
import { ResetConfirmModal } from '@/components/modals/ResetConfirmModal'
import Papa from 'papaparse'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

const TABS = [
  { id: 'participants', label: '参与者' },
  { id: 'prizes', label: '奖项' },
  { id: 'basic', label: '基础设置' },
  { id: 'data', label: '数据管理' },
] as const

type TabId = typeof TABS[number]['id']

export default function SettingsPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialTab = (searchParams.get('tab') as TabId) || 'participants'
  const [activeTab, setActiveTab] = useState<TabId>(initialTab)

  return (
    <div className="min-h-screen bg-gradient-bg relative overflow-hidden">
      <ParticleBackground />
      <FireworkEffect isActive={true} />
      
      {/* Header */}
      <header className="flex items-center justify-between px-4 sm:px-8 py-4 border-b border-border/50 relative z-10 bg-background/50 backdrop-blur-sm">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium hover:bg-accent transition-colors text-foreground"
        >
          <ArrowLeft size={18} />
          返回
        </button>
        <h1 className="text-lg font-display font-bold text-foreground">设置</h1>
        <div className="w-20" />
      </header>

      {/* Tabs */}
      <div className="px-4 sm:px-8 pt-4 relative z-10">
        <div className="flex gap-1 p-1 rounded-xl bg-muted max-w-xl mx-auto">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-4 sm:px-8 py-6 max-w-4xl mx-auto relative z-10">
        {activeTab === 'participants' && <ParticipantsTab />}
        {activeTab === 'prizes' && <PrizesTab />}
        {activeTab === 'basic' && <BasicSettingsTab />}
        {activeTab === 'data' && <DataManagementTab />}
      </div>
    </div>
  )
}

/* ==================== Participants Tab ==================== */
function ParticipantsTab() {
  const store = useLotteryStore()
  const [mode, setMode] = useState<'manual' | 'import' | 'generate'>('manual')
  const [search, setSearch] = useState('')
  const [name, setName] = useState('')
  const [employeeId, setEmployeeId] = useState('')
  const [department, setDepartment] = useState('')
  const [rangeStart, setRangeStart] = useState('')
  const [rangeEnd, setRangeEnd] = useState('')
  const [prefix, setPrefix] = useState('参与者')
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)

  // Edit State
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null)

  const filteredParticipants = store.participants.filter(p =>
    p.name.includes(search) || p.employeeId.includes(search) || (p.department || '').includes(search)
  )

  const handleAdd = () => {
    if (!name.trim()) { toast('请输入姓名', 'error'); return }
    
    const finalEmployeeId = employeeId.trim() || String(store.participants.length + 1).padStart(3, '0')
    const finalName = name.trim()
    
    const existingParticipant = store.participants.find(p => 
      p.employeeId === finalEmployeeId || p.name === finalName
    )
    
    if (existingParticipant) {
      if (existingParticipant.employeeId === finalEmployeeId && existingParticipant.name === finalName) {
        toast('该参与者已存在（工号和姓名重复）', 'error')
      } else if (existingParticipant.employeeId === finalEmployeeId) {
        toast(`工号 "${finalEmployeeId}" 已存在，请使用其他工号`, 'error')
      } else {
        toast(`姓名 "${finalName}" 已存在，请检查是否重复`, 'error')
      }
      return
    }
    
    store.addParticipant({
      employeeId: finalEmployeeId,
      name: finalName,
      department: department.trim() || undefined,
    })
    setName('')
    setEmployeeId('')
    setDepartment('')
    toast('添加成功')
  }

  const handleGenerate = () => {
    const start = parseInt(rangeStart)
    const end = parseInt(rangeEnd)
    if (isNaN(start) || isNaN(end) || start > end || end - start > 999) {
      toast('请输入有效的号码区间（最多1000人）', 'error')
      return
    }
    
    const existingIds = new Set(store.participants.map(p => p.employeeId))
    const conflictIds: string[] = []
    const overlapRanges: string[] = []
    
    for (let i = start; i <= end; i++) {
      const id = String(i).padStart(3, '0')
      if (existingIds.has(id)) {
        conflictIds.push(id)
      }
    }
    
    if (conflictIds.length > 0) {
      if (conflictIds.length === end - start + 1) {
        toast(`号码段 ${start}-${end} 已完全存在，无法生成`, 'error')
      } else {
        const uniqueConflicts = [...new Set(conflictIds)]
        if (uniqueConflicts.length <= 10) {
          toast(`号码段冲突：工号 ${uniqueConflicts.join(', ')} 已存在`, 'error')
        } else {
          toast(`号码段冲突：${uniqueConflicts.length} 个工号已存在，请调整号码范围`, 'error')
        }
      }
      return
    }
    
    store.generateParticipants(start, end, prefix)
    toast(`已生成 ${end - start + 1} 位参与者`)
    setRangeStart('')
    setRangeEnd('')
  }

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    await processCSVFile(file)
    e.target.value = ''
  }

  const processCSVFile = async (file: File) => {
    if (!file.name.endsWith('.csv') && !file.name.endsWith('.txt')) {
      toast('仅支持 .csv 或 .txt 格式的文件', 'error')
      return
    }
    
    if (file.size > 50 * 1024 * 1024) {
      toast('文件大小超过限制（最大 50MB）', 'error')
      return
    }

    try {
      const { text, encoding } = await readFileWithEncoding(file)
      const normalizedText = normalizeNewlines(text.replace(/^\uFEFF/, ''))
      const { parsed, delimiter, errors, warnings } = parseCsvContent(normalizedText)

      if (errors.length > 0) {
        toast(errors[0], 'error')
        if (errors.length > 1) {
          toast(errors.slice(1, 3).join('；'), 'info')
        }
        return
      }

      const imported: Omit<Participant, 'id' | 'createdAt'>[] = []
      const duplicates: string[] = []
      const invalidRows: number[] = []
      const existingIds = new Set(store.participants.map(p => normalizeEmployeeId(p.employeeId)))
      const existingNames = new Set(store.participants.map(p => normalizeName(p.name)))
      let autoIdCounter = store.participants.length + 1

      for (let index = 0; index < parsed.data.length; index++) {
        const row = parsed.data[index] as Record<string, string | undefined>
        const eName = extractRowValue(row, parsed.mappedHeaders.name)
        const eId = extractRowValue(row, parsed.mappedHeaders.employeeId)
        const eDept = extractRowValue(row, parsed.mappedHeaders.department)

        if (!eName) {
          invalidRows.push(index + 2)
          continue
        }

        const finalName = eName
        const finalEmployeeId = eId || getNextEmployeeId(() => autoIdCounter++, existingIds)
        const normalizedId = normalizeEmployeeId(finalEmployeeId)
        const normalizedName = normalizeName(finalName)

        if (existingIds.has(normalizedId)) {
          duplicates.push(`工号 ${finalEmployeeId}`)
          continue
        }
        if (existingNames.has(normalizedName)) {
          duplicates.push(`姓名 ${finalName}`)
          continue
        }

        imported.push({
          employeeId: finalEmployeeId,
          name: finalName,
          department: eDept || undefined,
        })
        existingIds.add(normalizedId)
        existingNames.add(normalizedName)
      }

      if (imported.length > 0) {
        store.importParticipants(imported)
        const duplicateMsg = duplicates.length > 0 ? `，已排除 ${duplicates.length} 个重复数据` : ''
        const invalidMsg = invalidRows.length > 0 ? `，已忽略 ${invalidRows.length} 行空姓名` : ''
        const encodingMsg = encoding ? `（编码：${encoding}，分隔符：${delimiter}）` : ''
        toast(`成功导入 ${imported.length} 位参与者${duplicateMsg}${invalidMsg}${encodingMsg}`)
        if (duplicates.length > 0 && duplicates.length <= 5) {
          toast(`重复数据：${duplicates.join(', ')}`, 'info')
        }
        if (invalidRows.length > 0 && invalidRows.length <= 5) {
          toast(`空姓名行：${invalidRows.join(', ')}`, 'info')
        }
        if (warnings.length > 0) {
          toast(warnings.slice(0, 2).join('；'), 'info')
        }
      } else if (duplicates.length > 0) {
        toast(`所有数据都已存在，共 ${duplicates.length} 个重复`, 'error')
        if (duplicates.length <= 5) {
          toast(`重复数据：${duplicates.join(', ')}`, 'info')
        }
      } else if (invalidRows.length > 0) {
        toast(`未找到有效数据，${invalidRows.length} 行姓名为空`, 'error')
      } else {
        toast('未找到有效数据，请检查文件格式', 'error')
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '文件解析失败，请检查文件格式'
      toast(message, 'error')
    }
  }

  const readFileWithEncoding = async (file: File): Promise<{ text: string; encoding: string }> => {
    const buffer = await readFileAsArrayBuffer(file)
    const bom = detectBom(buffer)
    if (bom) {
      const text = decodeBuffer(buffer.slice(bom.offset), bom.encoding)
      if (isValidCSVContent(text)) {
        return { text, encoding: bom.encoding }
      }
    }

    const encodings = ['utf-8', 'gbk', 'gb2312', 'big5', 'utf-16le', 'utf-16be']
    const scored: { encoding: string; text: string; score: number }[] = []

    for (const encoding of encodings) {
      try {
        const text = decodeBuffer(buffer, encoding)
        if (!isValidCSVContent(text)) continue
        const score = scoreDecodedText(text)
        scored.push({ encoding, text, score })
      } catch (error) {
        continue
      }
    }

    const best = scored.sort((a, b) => b.score - a.score)[0]
    if (best) {
      return { text: best.text, encoding: best.encoding }
    }

    throw new Error('无法识别文件编码，请保存为 UTF-8 或 GBK 后重试')
  }

  const readFileAsArrayBuffer = (file: File): Promise<ArrayBuffer> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as ArrayBuffer)
      reader.onerror = () => reject(new Error('文件读取失败'))
      reader.readAsArrayBuffer(file)
    })
  }

  const isValidCSVContent = (text: string): boolean => {
    const lines = text.split(/\r?\n/).filter(line => line.trim())
    if (lines.length < 1) return false
    
    return true
  }

  const normalizeNewlines = (text: string) => {
    if (text.includes('\n')) return text
    if (text.includes('\r')) return text.replace(/\r/g, '\n')
    return text
  }

  const detectBom = (buffer: ArrayBuffer) => {
    const bytes = new Uint8Array(buffer.slice(0, 4))
    if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
      return { encoding: 'utf-8', offset: 3 }
    }
    if (bytes[0] === 0xff && bytes[1] === 0xfe) {
      return { encoding: 'utf-16le', offset: 2 }
    }
    if (bytes[0] === 0xfe && bytes[1] === 0xff) {
      return { encoding: 'utf-16be', offset: 2 }
    }
    return null
  }

  const decodeBuffer = (buffer: ArrayBuffer, encoding: string) => {
    return new TextDecoder(encoding).decode(buffer)
  }

  const scoreDecodedText = (text: string) => {
    const sample = text.slice(0, 4000)
    const replacementCount = (sample.match(/\uFFFD/g) || []).length
    const nullCount = (sample.match(/\u0000/g) || []).length
    const headerScore = /姓名|name|employeeid|工号|部门|department/i.test(sample) ? 1000 : 0
    const printableScore = sample.length - replacementCount * 10 - nullCount * 50
    return headerScore + printableScore
  }

  const normalizeHeader = (header: string) => {
    return header
      .replace(/^\uFEFF/, '')
      .replace(/^["']|["']$/g, '')
      .replace(/\u3000/g, ' ')
      .trim()
      .replace(/\s+/g, '')
      .toLowerCase()
  }

  const normalizeEmployeeId = (value: string) => {
    return value.replace(/\u00A0/g, ' ').replace(/\u3000/g, ' ').trim()
  }

  const normalizeName = (value: string) => {
    return value.replace(/\u00A0/g, ' ').replace(/\u3000/g, ' ').trim().replace(/\s+/g, ' ').toLowerCase()
  }

  const extractRowValue = (row: Record<string, string | undefined>, key?: string) => {
    if (!key) return ''
    const raw = row[key]
    if (raw === undefined || raw === null) return ''
    return String(raw).replace(/\u00A0/g, ' ').replace(/\u3000/g, ' ').trim()
  }

  const getNextEmployeeId = (nextCounter: () => number, existing: Set<string>) => {
    let id = String(nextCounter()).padStart(3, '0')
    while (existing.has(normalizeEmployeeId(id))) {
      id = String(nextCounter()).padStart(3, '0')
    }
    return id
  }

  const detectDelimiter = (text: string) => {
    const lines = text.split(/\r?\n/).filter(line => line.trim()).slice(0, 5)
    const candidates = [',', '，', ';', '\t', '|']
    let best = { delimiter: ',', count: -1 }

    for (const delimiter of candidates) {
      let total = 0
      for (const line of lines) {
        total += countDelimiter(line, delimiter)
      }
      if (total > best.count) {
        best = { delimiter, count: total }
      }
    }
    return best.delimiter
  }

  const countDelimiter = (line: string, delimiter: string) => {
    let count = 0
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          i++
        } else {
          inQuotes = !inQuotes
        }
      } else if (!inQuotes && char === delimiter) {
        count++
      }
    }
    return count
  }

  const parseCsvContent = (text: string) => {
    const emptyParsed = {
      data: [] as Record<string, string | undefined>[],
      mappedHeaders: {
        name: undefined as string | undefined,
        employeeId: undefined as string | undefined,
        department: undefined as string | undefined
      }
    }
    const errors: string[] = []
    const warnings: string[] = []

    if (!text.trim()) {
      return { parsed: emptyParsed, delimiter: ',', errors: ['文件为空，请检查内容'], warnings }
    }

    // 检测分隔符，优先使用常见分隔符
    const delimiter = detectDelimiter(text)
    
    // 使用 papaparse 解析
    const parsedData = Papa.parse(text, {
      header: true,
      skipEmptyLines: 'greedy', // 更严格的空行跳过
      delimiter,
      transformHeader: (header: string) => {
        // 移除 BOM 和首尾空白
        return header.replace(/^\uFEFF/, '').trim()
      },
      transform: (value: string) => {
        // 移除首尾空白
        return value.trim()
      }
    })

    if (parsedData.errors.length > 0) {
      const details = parsedData.errors.slice(0, 3).map(err => {
        const row = typeof err.row === 'number' ? err.row + 1 : '未知'
        return `第 ${row} 行：${err.message}`
      })
      warnings.push(`解析警告：${details.join('；')}`)
      if (parsedData.data.length === 0) {
        errors.push('CSV 解析失败，请检查引号、换行或分隔符是否正确')
      }
    }

    const fields = parsedData.meta.fields?.filter(Boolean) ?? []
    if (fields.length === 0) {
      errors.push('未识别到表头，请确保首行是列名')
      return { parsed: emptyParsed, delimiter, errors, warnings }
    }

    const headerMap = new Map<string, string>()
    for (const field of fields) {
      headerMap.set(normalizeHeader(field), field)
    }

    // 调试日志
    console.log('CSV Headers:', fields)
    console.log('Normalized Headers:', Array.from(headerMap.keys()))

    const findHeader = (aliases: string[]) => {
      for (const alias of aliases) {
        const normalized = normalizeHeader(alias)
        const found = headerMap.get(normalized)
        if (found) return found
      }
      return undefined
    }

    const nameHeader = findHeader(['姓名', 'name', '用户名', '人员姓名', 'user_name', 'username'])
    const idHeader = findHeader(['工号', 'employeeid', 'employee_id', 'id', '编号', 'user_id', 'userid'])
    const deptHeader = findHeader(['部门', 'department', 'dept', '事业部', 'group'])

    if (!nameHeader) {
      // 尝试根据列位置推断（如果有3列且没匹配到，假设中间是姓名）
      if (fields.length === 3 && !idHeader && !deptHeader) {
        warnings.push('未匹配到标准表头，尝试按位置解析：工号,姓名,部门')
        return {
          parsed: {
            data: parsedData.data as Record<string, string | undefined>[],
            mappedHeaders: {
              name: fields[1],
              employeeId: fields[0],
              department: fields[2]
            }
          },
          delimiter,
          errors,
          warnings
        }
      }
      errors.push(`缺少必需列：姓名。已识别列：${fields.join(', ')}`)
    }

    return {
      parsed: {
        data: parsedData.data as Record<string, string | undefined>[],
        mappedHeaders: {
          name: nameHeader,
          employeeId: idHeader,
          department: deptHeader
        }
      },
      delimiter,
      errors,
      warnings
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      processCSVFile(file)
    }
  }

  const downloadTemplate = () => {
    downloadFile('\uFEFF工号,姓名,部门\n001,张三,技术部\n002,李四,销售部\n003,王五,人事部', '参与者模板.csv')
    toast('模板已下载 (可用 Excel 打开)')
  }

  const handleUpdateParticipant = () => {
    if (!editingParticipant) return
    if (!editingParticipant.name.trim()) {
      toast('姓名不能为空', 'error')
      return
    }
    
    const conflictParticipant = store.participants.find(p => 
      p.id !== editingParticipant.id && (
        p.employeeId === editingParticipant.employeeId || 
        p.name === editingParticipant.name.trim()
      )
    )
    
    if (conflictParticipant) {
      if (conflictParticipant.employeeId === editingParticipant.employeeId && conflictParticipant.name === editingParticipant.name.trim()) {
        toast('修改失败：工号和姓名与现有参与者冲突', 'error')
      } else if (conflictParticipant.employeeId === editingParticipant.employeeId) {
        toast(`修改失败：工号 "${editingParticipant.employeeId}" 已被 "${conflictParticipant.name}" 使用`, 'error')
      } else {
        toast(`修改失败：姓名 "${editingParticipant.name.trim()}" 已存在`, 'error')
      }
      return
    }
    
    store.updateParticipant(editingParticipant.id, {
      name: editingParticipant.name.trim(),
      employeeId: editingParticipant.employeeId,
      department: editingParticipant.department
    })
    setEditingParticipant(null)
    toast('更新成功')
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats Card */}
      <div className="p-5 rounded-2xl bg-card border border-border shadow-card">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">当前参与者</p>
            <p className="text-3xl font-bold font-display text-foreground">{store.participants.length} <span className="text-base font-normal text-muted-foreground">人</span></p>
          </div>
          <button
            onClick={() => {
              if (store.participants.length === 0) return
              store.clearParticipants()
              toast('已清除所有参与者')
            }}
            className="px-4 py-2 rounded-xl text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
          >
            清空全部
          </button>
        </div>
      </div>

      {/* Add Methods */}
      <div className="p-5 rounded-2xl bg-card border border-border shadow-card">
        <div className="flex gap-1 p-1 rounded-xl bg-muted mb-5">
          {(['manual', 'import', 'generate'] as const).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === m ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {m === 'manual' ? '手动添加' : m === 'import' ? '批量导入' : '号码生成'}
            </button>
          ))}
        </div>

        {mode === 'manual' && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <input
                value={employeeId}
                onChange={e => setEmployeeId(e.target.value)}
                placeholder="工号"
                className="px-4 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-transparent outline-none"
              />
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="姓名 *"
                className="px-4 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-transparent outline-none"
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
              />
              <input
                value={department}
                onChange={e => setDepartment(e.target.value)}
                placeholder="部门"
                className="px-4 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-transparent outline-none"
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
              />
            </div>
            <button
              onClick={handleAdd}
              className="w-full py-2.5 rounded-xl text-sm font-bold bg-gradient-primary text-primary-foreground hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              <Plus size={16} />
              添加参与者
            </button>
          </div>
        )}

        {mode === 'import' && (
          <div className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt"
              onChange={handleFileImport}
              className="hidden"
            />
            <div
              ref={dropZoneRef}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                isDragging 
                  ? 'border-primary bg-primary/5 scale-[1.02]' 
                  : 'border-border hover:border-primary/50 hover:bg-accent/30'
              }`}
            >
              <Upload className={`mx-auto mb-3 transition-colors ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} size={32} />
              <p className="text-sm font-medium text-foreground mb-1">
                {isDragging ? '释放文件上传' : '点击或拖拽上传 CSV 文件'}
              </p>
              <p className="text-xs text-muted-foreground">
                仅支持 .csv 或 .txt 格式，最大 10MB，需包含"姓名"列
              </p>
            </div>
            <button
              onClick={downloadTemplate}
              className="flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <Download size={14} />
              下载 CSV 模板 (可用 Excel 打开)
            </button>
          </div>
        )}

        {mode === 'generate' && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <input
                value={rangeStart}
                onChange={e => setRangeStart(e.target.value)}
                placeholder="起始编号"
                type="number"
                className="px-4 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-transparent outline-none"
              />
              <input
                value={rangeEnd}
                onChange={e => setRangeEnd(e.target.value)}
                placeholder="结束编号"
                type="number"
                className="px-4 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-transparent outline-none"
              />
              <input
                value={prefix}
                onChange={e => setPrefix(e.target.value)}
                placeholder="名称前缀"
                className="px-4 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-transparent outline-none"
              />
            </div>
            <button
              onClick={handleGenerate}
              className="w-full py-2.5 rounded-xl text-sm font-bold bg-gradient-primary text-primary-foreground hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              <Hash size={16} />
              生成参与者
            </button>
          </div>
        )}
      </div>

      {/* Participant List */}
      <div className="p-5 rounded-2xl bg-card border border-border shadow-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-foreground">参与者列表</h3>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="搜索..."
              className="pl-8 pr-4 py-2 rounded-xl bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring outline-none w-48"
            />
          </div>
        </div>

        {filteredParticipants.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            {store.participants.length === 0 ? '暂无参与者，请添加后开始抽奖' : '未找到匹配的参与者'}
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto space-y-1">
            {filteredParticipants.map(p => (
              <div key={p.id} className="flex items-center justify-between px-4 py-2.5 rounded-xl hover:bg-muted transition-colors group">
                <div className="flex items-center gap-4">
                  <span className="text-xs text-muted-foreground font-mono w-10">{p.employeeId}</span>
                  <span className="text-sm font-medium text-foreground">{p.name}</span>
                  {p.department && (
                    <span className="text-xs text-muted-foreground">{p.department}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setEditingParticipant(p)}
                    className="p-1.5 rounded-lg hover:bg-primary/10 text-primary transition-all"
                    title="编辑"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => {
                      store.removeParticipant(p.id)
                      toast('已删除')
                    }}
                    className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive transition-all"
                    title="删除"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <Modal
        open={!!editingParticipant}
        onClose={() => setEditingParticipant(null)}
        title="编辑参与者"
      >
        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">工号</label>
            <input
              value={editingParticipant?.employeeId || ''}
              onChange={e => setEditingParticipant(prev => prev ? { ...prev, employeeId: e.target.value } : null)}
              className="w-full px-4 py-2.5 rounded-xl bg-muted border border-border text-sm focus:ring-2 focus:ring-ring outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">姓名</label>
            <input
              value={editingParticipant?.name || ''}
              onChange={e => setEditingParticipant(prev => prev ? { ...prev, name: e.target.value } : null)}
              className="w-full px-4 py-2.5 rounded-xl bg-muted border border-border text-sm focus:ring-2 focus:ring-ring outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">部门</label>
            <input
              value={editingParticipant?.department || ''}
              onChange={e => setEditingParticipant(prev => prev ? { ...prev, department: e.target.value } : null)}
              className="w-full px-4 py-2.5 rounded-xl bg-muted border border-border text-sm focus:ring-2 focus:ring-ring outline-none"
            />
          </div>
          <div className="pt-2 flex justify-end gap-3">
            <button
              onClick={() => setEditingParticipant(null)}
              className="px-4 py-2 rounded-xl text-sm font-medium hover:bg-accent transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleUpdateParticipant}
              className="px-4 py-2 rounded-xl text-sm font-bold bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
            >
              保存
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

/* ==================== Prizes Tab ==================== */
function SortablePrizeItem({ prize, onEdit, onRemove, winnersCount }: { prize: Prize, onEdit: (p: Prize) => void, onRemove: (id: string) => void, winnersCount: number }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: prize.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const icon = prize.prizeImage ? (
    <img src={prize.prizeImage} alt="prize" className="w-8 h-8 object-contain" />
  ) : (
    <span className="text-2xl">{PRIZE_ICONS[prize.order] || '🎁'}</span>
  );

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between px-4 py-3 rounded-xl bg-card border border-border hover:shadow-sm transition-all group mb-2"
    >
      <div className="flex items-center gap-4">
        <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground">
          <GripVertical size={20} />
        </button>
        {icon}
        <div>
          <p className="text-sm font-bold text-foreground">{prize.name}</p>
          <p className="text-xs text-muted-foreground">
            {prize.prizeName} · {winnersCount}/{prize.count} 已抽取
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onEdit(prize)}
          className="p-1.5 rounded-lg hover:bg-primary/10 text-primary transition-colors"
        >
          <Pencil size={14} />
        </button>
        <button
          onClick={() => onRemove(prize.id)}
          className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

function PrizesTab() {
  const store = useLotteryStore()
  const [editingPrize, setEditingPrize] = useState<Prize | null>(null)
  const [newPrize, setNewPrize] = useState({ name: '', count: '1', prizeName: '', prizeImage: '' })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const editFileInputRef = useRef<HTMLInputElement>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = store.prizes.findIndex((p) => p.id === active.id);
      const newIndex = store.prizes.findIndex((p) => p.id === over?.id);
      const newOrder = arrayMove(store.prizes, oldIndex, newIndex);
      // Update order property and save
      const reordered = newOrder.map((p, index) => ({ ...p, order: index + 1 }));
      // We need to update all prizes with new order
      // But store.reorderPrizes takes IDs.
      store.reorderPrizes(newOrder.map(p => p.id));
    }
  };

  const handleAdd = () => {
    if (!newPrize.name.trim() || !newPrize.prizeName.trim()) {
      toast('请填写奖项名称和奖品名称', 'error')
      return
    }
    store.addPrize({
      name: newPrize.name.trim(),
      count: Math.max(1, parseInt(newPrize.count) || 1),
      prizeName: newPrize.prizeName.trim(),
      order: store.prizes.length + 1,
      prizeImage: newPrize.prizeImage
    })
    setNewPrize({ name: '', count: '1', prizeName: '', prizeImage: '' })
    toast('奖项已添加')
  }

  const handleUpdatePrize = () => {
    if (!editingPrize) return
    store.updatePrize(editingPrize.id, {
      name: editingPrize.name,
      count: editingPrize.count,
      prizeName: editingPrize.prizeName,
      prizeImage: editingPrize.prizeImage
    })
    setEditingPrize(null)
    toast('更新成功')
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      toast('图片大小不能超过 2MB', 'error')
      return
    }

    const reader = new FileReader()
    reader.onload = (ev) => {
      const result = ev.target?.result as string
      if (isEdit && editingPrize) {
        setEditingPrize({ ...editingPrize, prizeImage: result })
      } else {
        setNewPrize(p => ({ ...p, prizeImage: result }))
      }
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Add Prize */}
      <div className="p-5 rounded-2xl bg-card border border-border shadow-card">
        <h3 className="font-display font-bold text-foreground mb-4">添加奖项</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
          <input
            value={newPrize.name}
            onChange={e => setNewPrize(p => ({ ...p, name: e.target.value }))}
            placeholder="奖项名称（如：一等奖）"
            className="px-4 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring outline-none"
          />
          <input
            value={newPrize.count}
            onChange={e => setNewPrize(p => ({ ...p, count: e.target.value }))}
            placeholder="名额"
            type="number"
            min="1"
            className="px-4 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring outline-none"
          />
          <input
            value={newPrize.prizeName}
            onChange={e => setNewPrize(p => ({ ...p, prizeName: e.target.value }))}
            placeholder="奖品名称（如：iPhone）"
            className="px-4 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring outline-none"
          />
           <div className="flex items-center gap-2">
             <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleImageUpload(e, false)}
             />
             <button
               onClick={() => fileInputRef.current?.click()}
               className="flex-1 px-4 py-2.5 rounded-xl bg-muted border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition-all flex items-center justify-center gap-2"
             >
               {newPrize.prizeImage ? <ImageIcon size={16} className="text-primary" /> : <Upload size={16} />}
               {newPrize.prizeImage ? '已选图片' : '上传图片'}
             </button>
             {newPrize.prizeImage && (
               <button onClick={() => setNewPrize(p => ({...p, prizeImage: ''}))} className="p-2 hover:bg-destructive/10 text-destructive rounded-lg">
                 <X size={16} />
               </button>
             )}
           </div>
        </div>
        <button
          onClick={handleAdd}
          className="w-full py-2.5 rounded-xl text-sm font-bold bg-gradient-primary text-primary-foreground hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
        >
          <Plus size={16} />
          添加奖项
        </button>
      </div>

      {/* Prize List */}
      <div className="p-5 rounded-2xl bg-card border border-border shadow-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-foreground">奖项列表 (拖拽排序)</h3>
          <button
            onClick={() => {
              store.resetPrizesToDefault()
              toast('已恢复默认奖项')
            }}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            恢复默认
          </button>
        </div>

        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext 
            items={store.prizes.map(p => p.id)}
            strategy={verticalListSortingStrategy}
          >
            {store.prizes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">暂无奖项</div>
            ) : (
              <div className="space-y-2">
                {store.prizes.map(prize => (
                  <SortablePrizeItem 
                    key={prize.id} 
                    prize={prize} 
                    onEdit={setEditingPrize}
                    onRemove={store.removePrize}
                    winnersCount={store.winners.filter(w => w.prizeId === prize.id).length}
                  />
                ))}
              </div>
            )}
          </SortableContext>
        </DndContext>
      </div>

      {/* Edit Prize Modal */}
      <Modal
        open={!!editingPrize}
        onClose={() => setEditingPrize(null)}
        title="编辑奖项"
      >
        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">奖项名称</label>
            <input
              value={editingPrize?.name || ''}
              onChange={e => setEditingPrize(prev => prev ? { ...prev, name: e.target.value } : null)}
              className="w-full px-4 py-2.5 rounded-xl bg-muted border border-border text-sm focus:ring-2 focus:ring-ring outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">名额</label>
            <input
              type="number"
              min="1"
              value={editingPrize?.count || ''}
              onChange={e => setEditingPrize(prev => prev ? { ...prev, count: parseInt(e.target.value) || 1 } : null)}
              className="w-full px-4 py-2.5 rounded-xl bg-muted border border-border text-sm focus:ring-2 focus:ring-ring outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">奖品名称</label>
            <input
              value={editingPrize?.prizeName || ''}
              onChange={e => setEditingPrize(prev => prev ? { ...prev, prizeName: e.target.value } : null)}
              className="w-full px-4 py-2.5 rounded-xl bg-muted border border-border text-sm focus:ring-2 focus:ring-ring outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">奖品图片</label>
            <div className="flex items-center gap-4">
              {editingPrize?.prizeImage && (
                <img src={editingPrize.prizeImage} alt="preview" className="w-16 h-16 object-contain rounded-lg border border-border" />
              )}
              <input
                ref={editFileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleImageUpload(e, true)}
              />
              <button
                onClick={() => editFileInputRef.current?.click()}
                className="px-4 py-2 rounded-xl bg-muted hover:bg-accent text-sm transition-colors flex items-center gap-2"
              >
                <Upload size={14} />
                {editingPrize?.prizeImage ? '更换图片' : '上传图片'}
              </button>
              {editingPrize?.prizeImage && (
                 <button 
                   onClick={() => setEditingPrize(prev => prev ? {...prev, prizeImage: undefined} : null)} 
                   className="text-destructive hover:underline text-sm"
                 >
                   清除
                 </button>
               )}
            </div>
          </div>
          <div className="pt-2 flex justify-end gap-3">
            <button
              onClick={() => setEditingPrize(null)}
              className="px-4 py-2 rounded-xl text-sm font-medium hover:bg-accent transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleUpdatePrize}
              className="px-4 py-2 rounded-xl text-sm font-bold bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
            >
              保存
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

/* ==================== Basic Settings Tab ==================== */
function BasicSettingsTab() {
  const store = useLotteryStore()
  const { settings, updateSettings } = store

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title */}
      <div className="p-5 rounded-2xl bg-card border border-border shadow-card">
        <h3 className="font-display font-bold text-foreground mb-4">界面设置</h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground mb-1.5 block">主标题</label>
            <input
              value={settings.title}
              onChange={e => updateSettings({ title: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground focus:ring-2 focus:ring-ring outline-none"
            />
          </div>

          {/* Font Family */}
          <div>
             <label className="text-sm text-muted-foreground mb-2 block">全局字体</label>
             <div className="flex gap-4">
               <button
                 onClick={() => updateSettings({ fontFamily: 'sans' })}
                 className={`flex-1 p-3 rounded-xl border-2 text-center transition-all ${
                   settings.fontFamily === 'sans'
                     ? 'border-primary bg-primary/5 shadow-sm'
                     : 'border-border hover:border-primary/30'
                 }`}
               >
                 <span className="font-sans text-lg block mb-1">Sans Serif</span>
                 <span className="text-xs text-muted-foreground">非衬线字体 (现代)</span>
               </button>
               <button
                 onClick={() => updateSettings({ fontFamily: 'serif' })}
                 className={`flex-1 p-3 rounded-xl border-2 text-center transition-all ${
                   settings.fontFamily === 'serif'
                     ? 'border-primary bg-primary/5 shadow-sm'
                     : 'border-border hover:border-primary/30'
                 }`}
               >
                 <span className="font-serif text-lg block mb-1">Serif</span>
                 <span className="text-xs text-muted-foreground">衬线字体 (经典)</span>
               </button>
             </div>
          </div>

          {/* Theme */}
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">主题配色</label>
            <div className="grid grid-cols-3 gap-3">
              {THEMES.map(theme => (
                <button
                  key={theme.key}
                  onClick={() => updateSettings({ theme: theme.key })}
                  className={`p-4 rounded-xl border-2 text-center transition-all ${
                    settings.theme === theme.key
                      ? 'border-primary shadow-glow'
                      : 'border-border hover:border-primary/30'
                  }`}
                >
                  <div
                    className="w-8 h-8 rounded-full mx-auto mb-2"
                    style={{ background: theme.primaryColor }}
                  />
                  <span className="text-xs font-medium text-foreground">{theme.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Draw Rules */}
      <div className="p-5 rounded-2xl bg-card border border-border shadow-card">
        <h3 className="font-display font-bold text-foreground mb-4">抽奖规则</h3>
        <div className="space-y-4">
          {/* Allow Repeat */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
            <div>
              <span className="text-sm font-medium text-foreground block">允许重复中奖</span>
              <span className="text-xs text-muted-foreground">开启后，同一人可被多次抽中</span>
            </div>
            <Switch
              checked={settings.allowRepeat}
              onChange={(checked) => updateSettings({ allowRepeat: checked })}
              size="md"
            />
          </div>

          {/* Draw Mode */}
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">抽取方式</label>
            <div className="flex gap-3">
              <button
                onClick={() => updateSettings({ drawMode: 'batch' })}
                className={`flex-1 p-3 rounded-xl border-2 text-center transition-all ${
                  settings.drawMode === 'batch'
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border hover:border-primary/30'
                }`}
              >
                <span className="text-sm font-medium text-foreground block">批量抽取</span>
                <span className="text-xs text-muted-foreground">一次性抽取所有名额</span>
              </button>
              <button
                onClick={() => updateSettings({ drawMode: 'single' })}
                className={`flex-1 p-3 rounded-xl border-2 text-center transition-all ${
                  settings.drawMode === 'single'
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border hover:border-primary/30'
                }`}
              >
                <span className="text-sm font-medium text-foreground block">逐个抽取</span>
                <span className="text-xs text-muted-foreground">每次只抽一人</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sound & Donation */}
      <div className="p-5 rounded-2xl bg-card border border-border shadow-card">
        <h3 className="font-display font-bold text-foreground mb-4">功能设置</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
            <span className="text-sm font-medium text-foreground">开启音效</span>
            <Switch
              checked={settings.soundEnabled}
              onChange={(checked) => updateSettings({ soundEnabled: checked })}
              size="md"
            />
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
            <span className="text-sm font-medium text-foreground">显示打赏入口</span>
            <Switch
              checked={settings.showDonation}
              onChange={(checked) => updateSettings({ showDonation: checked })}
              size="md"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

/* ==================== Data Management Tab ==================== */
function DataManagementTab() {
  const store = useLotteryStore()
  const [showResetModal, setShowResetModal] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExport = () => {
    const json = store.exportData()
    downloadFile(json, `lottery-data-${new Date().toISOString().slice(0, 10)}.json`)
    toast('数据已导出')
  }

  const handleExportWithImages = async () => {
    setIsExporting(true)
    try {
      const { json, imageCount } = await store.exportDataWithImages()
      downloadFile(json, `lottery-backup-${new Date().toISOString().slice(0, 10)}.json`)
      toast(imageCount > 0 ? `备份完成，包含 ${imageCount} 张图片` : '备份完成')
    } catch (error) {
      toast('备份失败', 'error')
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportWinners = () => {
    if (store.winners.length === 0) {
      toast('暂无中奖数据', 'error')
      return
    }
    const csv = Papa.unparse(store.winners.map(w => ({
      '奖项': store.prizes.find(p => p.id === w.prizeId)?.name || '未知',
      '奖品': store.prizes.find(p => p.id === w.prizeId)?.prizeName || '未知',
      '工号': w.participant.employeeId,
      '姓名': w.participant.name,
      '部门': w.participant.department || '',
      '中奖时间': new Date(w.wonAt).toLocaleString(),
    })))
    // Add BOM for Excel compatibility
    downloadFile('\uFEFF' + csv, `中奖名单-${new Date().toISOString().slice(0, 10)}.csv`)
    toast('中奖名单已导出 (可用 Office 打开)')
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    try {
      const text = await file.text()
      const result = await store.importDataWithImages(text)
      
      if (result.success) {
        toast(result.message)
      } else {
        toast(result.message, 'error')
      }
    } catch (error) {
      toast('导入失败：文件格式错误', 'error')
    } finally {
      setIsImporting(false)
      // 重置文件输入
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 数据导出 */}
      <div className="p-5 rounded-2xl bg-card border border-border shadow-card">
        <h3 className="font-display font-bold text-foreground mb-4">数据导出</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={handleExportWithImages}
            disabled={isExporting}
            className="p-4 rounded-xl bg-muted hover:bg-accent transition-colors text-left group disabled:opacity-50"
          >
            <Download className="mb-2 text-primary" size={24} />
            <p className="font-bold text-foreground">完整备份</p>
            <p className="text-xs text-muted-foreground mt-1">
              {isExporting ? '正在备份...' : '导出所有数据，包含奖项图片'}
            </p>
          </button>
          <button
            onClick={handleExportWinners}
            className="p-4 rounded-xl bg-muted hover:bg-accent transition-colors text-left group"
          >
            <Download className="mb-2 text-primary" size={24} />
            <p className="font-bold text-foreground">导出中奖名单</p>
            <p className="text-xs text-muted-foreground mt-1">导出 CSV 表格文件，可用 Office Excel 打开</p>
          </button>
        </div>
      </div>

      {/* 数据导入 */}
      <div className="p-5 rounded-2xl bg-card border border-border shadow-card">
        <h3 className="font-display font-bold text-foreground mb-4">数据导入</h3>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          onClick={handleImportClick}
          disabled={isImporting}
          className="w-full py-3 rounded-xl text-sm font-bold bg-gradient-primary text-primary-foreground hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Upload size={16} />
          {isImporting ? '正在导入...' : '导入备份文件（JSON格式）'}
        </button>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          支持导入包含奖项数据和图片的完整备份文件
        </p>
      </div>

      {/* 谨慎操作 */}
      <div className="p-5 rounded-2xl bg-card border border-border shadow-card">
        <h3 className="font-display font-bold text-foreground mb-4">谨慎操作</h3>
        <button
          onClick={() => setShowResetModal(true)}
          className="w-full py-3 rounded-xl text-sm font-bold bg-gradient-primary text-primary-foreground hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
        >
          <AlertTriangle size={16} />
          重置数据（清除中奖记录、参与者或奖项数据）
        </button>
      </div>

      <ResetConfirmModal open={showResetModal} onClose={() => setShowResetModal(false)} />
    </div>
  )
}
