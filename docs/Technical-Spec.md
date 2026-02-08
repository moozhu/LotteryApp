# 幸运大抽奖 - 技术规范文档

> **版本**: v1.0  
> **日期**: 2026-02-08  
> **技术栈**: Vue 3 + TypeScript + Vite + Pinia + Tailwind CSS

---

## 1. 技术栈选择

### 1.1 核心框架选择

**选择 Vue 3 而非 React 的理由**:

| 维度 | Vue 3 | React |
|-----|-------|-------|
| 动画开发 | Composition API 更适合复杂动画逻辑 | Hooks 需要额外处理闭包问题 |
| 性能 | 响应式系统更细粒度，动画性能更优 | 需要手动优化 useMemo/useCallback |
| 模板语法 | 更直观，动画指令（v-transition）开箱即用 | 需要额外学习 Framer Motion |
| 包体积 | 更小，适合纯前端应用 | 相对较大 |
| 学习曲线 | 对设计师友好 | 需要更多 JavaScript 知识 |

### 1.2 完整技术栈

```
┌─────────────────────────────────────────────────────────────┐
│                        技术架构                              │
├─────────────────────────────────────────────────────────────┤
│  构建工具: Vite 5.x                                          │
│  ├── 快速 HMR                                                │
│  ├── 优化的生产构建                                          │
│  └── 原生 ESM 支持                                           │
├─────────────────────────────────────────────────────────────┤
│  前端框架: Vue 3.4.x                                         │
│  ├── Composition API                                         │
│  ├── `<script setup>` 语法                                   │
│  └── Vue Router 4.x                                          │
├─────────────────────────────────────────────────────────────┤
│  类型系统: TypeScript 5.x                                    │
│  ├── 严格的类型检查                                          │
│  ├── 接口定义                                                │
│  └── 类型安全的 Store                                        │
├─────────────────────────────────────────────────────────────┤
│  状态管理: Pinia 2.x                                         │
│  ├── 类型安全                                                │
│  ├── Devtools 支持                                           │
│  └── 模块化 Store                                            │
├─────────────────────────────────────────────────────────────┤
│  样式方案: Tailwind CSS 3.x                                  │
│  ├── 原子化 CSS                                              │
│  ├── 自定义主题配置                                          │
│  └── 响应式工具类                                            │
├─────────────────────────────────────────────────────────────┤
│  动画库: GSAP 3.x + @vueuse/motion                           │
│  ├── 3D 云团旋转                                             │
│  ├── 粒子系统                                                │
│  └── 复杂时间线控制                                          │
├─────────────────────────────────────────────────────────────┤
│  粒子效果: tsparticles / canvas-confetti                     │
│  ├── 背景粒子                                                │
│  ├── 烟花效果                                                │
│  └── 彩带效果                                                │
├─────────────────────────────────────────────────────────────┤
│  音效: Howler.js / Web Audio API                             │
│  ├── 背景音乐                                                │
│  ├── 音效播放                                                │
│  └── 音量控制                                                │
├─────────────────────────────────────────────────────────────┤
│  数据导入: PapaParse + xlsx                                  │
│  ├── CSV 解析                                                │
│  ├── Excel 解析                                              │
│  └── 文件拖拽                                                │
├─────────────────────────────────────────────────────────────┤
│  图标: Lucide Vue                                            │
│  └── 轻量级 SVG 图标                                         │
├─────────────────────────────────────────────────────────────┤
│  数据存储: LocalStorage + 压缩                               │
│  ├── 状态持久化                                              │
│  ├── 数据导入/导出                                           │
│  └── LZ-string 压缩                                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. 项目结构

### 2.1 目录结构

```
lottery-app/
├── public/                          # 静态资源
│   ├── sounds/                      # 音效文件
│   │   ├── click.mp3
│   │   ├── draw-start.mp3
│   │   ├── draw-tick.mp3
│   │   ├── win.mp3
│   │   └── confetti.mp3
│   └── favicon.ico
├── src/
│   ├── assets/                      # 资源文件
│   │   ├── styles/                  # 全局样式
│   │   │   ├── main.css             # 主样式入口
│   │   │   ├── animations.css       # 动画关键帧
│   │   │   └── themes.css           # 主题变量
│   │   └── images/                  # 图片资源
│   │
│   ├── components/                  # 组件
│   │   ├── common/                  # 通用组件
│   │   │   ├── BaseButton.vue
│   │   │   ├── BaseCard.vue
│   │   │   ├── BaseModal.vue        # 基础弹窗
│   │   │   ├── BaseInput.vue
│   │   │   └── BaseToast.vue
│   │   ├── layout/                  # 布局组件
│   │   │   ├── AppHeader.vue
│   │   │   └── AppContainer.vue
│   │   ├── draw/                    # 抽奖相关
│   │   │   ├── CloudDraw.vue        # 3D云团抽奖
│   │   │   ├── SlotDraw.vue         # 老虎机抽奖
│   │   │   ├── WinnerDisplay.vue    # 中奖展示
│   │   │   └── DrawControls.vue     # 抽奖控制
│   │   ├── settings/                # 设置相关
│   │   │   ├── ParticipantManager.vue
│   │   │   ├── PrizeManager.vue
│   │   │   ├── BasicSettings.vue
│   │   │   └── DataManager.vue
│   │   ├── home/                    # 首页相关
│   │   │   ├── PrizeGrid.vue
│   │   │   ├── PrizeCard.vue
│   │   │   └── QuickActions.vue
│   │   ├── modals/                  # 弹窗组件
│   │   │   ├── WinnerListModal.vue      # 中奖名单弹窗
│   │   │   ├── ResetConfirmModal.vue    # 重置确认弹窗
│   │   │   └── FirstTimeGuideModal.vue  # 首次使用引导弹窗
│   │   └── effects/                 # 特效组件
│   │       ├── ParticleBackground.vue
│   │       ├── Fireworks.vue
│   │       ├── Confetti.vue
│   │       └── SoundPlayer.vue
│   │
│   ├── composables/                 # 组合式函数
│   │   ├── useDraw.ts               # 抽奖逻辑
│   │   ├── useSound.ts              # 音效控制
│   │   ├── useParticles.ts          # 粒子效果
│   │   ├── useFullscreen.ts         # 全屏控制
│   │   ├── useStorage.ts            # 本地存储
│   │   ├── useTheme.ts              # 主题切换
│   │   └── useFileImport.ts         # 文件导入
│   │
│   ├── stores/                      # Pinia Store
│   │   ├── lottery.ts               # 主 Store
│   │   └── types.ts                 # Store 类型
│   │
│   ├── router/                      # 路由
│   │   └── index.ts
│   │
│   ├── types/                       # 全局类型
│   │   └── index.ts
│   │
│   ├── utils/                       # 工具函数
│   │   ├── helpers.ts               # 通用工具
│   │   ├── validators.ts            # 验证函数
│   │   ├── exporters.ts             # 导出功能
│   │   └── importers.ts             # 导入功能
│   │
│   ├── constants/                   # 常量
│   │   └── index.ts
│   │
│   ├── App.vue                      # 根组件
│   └── main.ts                      # 入口文件
│
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── eslint.config.js
```

---

## 3. 类型定义

### 3.1 核心类型

```typescript
// src/types/index.ts

// ==================== 参与者 ====================
export interface Participant {
  id: string;              // 唯一标识
  employeeId: string;      // 工号/编号
  name: string;            // 姓名
  department?: string;     // 部门（可选）
  createdAt: number;       // 创建时间戳
}

// ==================== 奖项 ====================
export interface Prize {
  id: string;              // 唯一标识
  name: string;            // 奖项名称（如：一等奖）
  count: number;           // 中奖名额
  prizeName: string;       // 奖品名称（如：iPhone 15 Pro）
  prizeImage?: string;     // 奖品图片（Base64 或 URL）
  order: number;           // 排序权重
  createdAt: number;       // 创建时间戳
}

// ==================== 中奖记录 ====================
export interface Winner {
  id: string;              // 唯一标识
  prizeId: string;         // 关联奖项ID
  participantId: string;   // 关联参与者ID
  participant: Participant; // 参与者信息（快照）
  wonAt: number;           // 中奖时间戳
  round: number;           // 第几轮（用于批量抽奖）
}

// ==================== 应用设置 ====================
export interface AppSettings {
  // 抽奖规则
  allowRepeat: boolean;    // 是否允许重复中奖
  drawMode: 'batch' | 'single';  // 抽取方式
  animationMode: 'cloud' | 'slot';  // 动画模式
  
  // 界面设置
  title: string;           // 主标题
  theme: 'luxury' | 'red' | 'vibrant';  // 主题
  
  // 功能开关
  soundEnabled: boolean;   // 音效开关
  showDonation: boolean;   // 显示打赏
}

// ==================== 应用状态 ====================
export interface AppState {
  participants: Participant[];
  prizes: Prize[];
  winners: Winner[];
  settings: AppSettings;
}

// ==================== 抽奖状态 ====================
export type DrawStatus = 'idle' | 'preparing' | 'drawing' | 'slowing' | 'finished';

export interface DrawState {
  status: DrawStatus;
  currentPrize: Prize | null;
  currentWinners: Participant[];
  remainingParticipants: Participant[];
  animationProgress: number;  // 0-100
}

// ==================== 导入/导出 ====================
export interface ExportData {
  version: string;
  exportTime: number;
  data: AppState;
}

export interface ImportResult {
  success: boolean;
  message: string;
  imported?: AppState;
  errors?: string[];
}

// ==================== 主题配置 ====================
export interface ThemeConfig {
  name: string;
  colors: {
    primary: string;
    primaryLight: string;
    primaryDark: string;
    secondary: string;
    secondaryLight: string;
    secondaryDark: string;
    background: string;
    backgroundSecondary: string;
    card: string;
    text: string;
    textSecondary: string;
    textMuted: string;
  };
  fonts: {
    display: string;
    body: string;
    mono: string;
  };
}
```

---

## 4. Store 设计

### 4.1 Pinia Store 结构

```typescript
// src/stores/lottery.ts

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { 
  Participant, 
  Prize, 
  Winner, 
  AppSettings, 
  AppState,
  DrawState 
} from '@/types';
import { useStorage } from '@/composables/useStorage';

export const useLotteryStore = defineStore('lottery', () => {
  // ==================== State ====================
  const participants = ref<Participant[]>([]);
  const prizes = ref<Prize[]>([]);
  const winners = ref<Winner[]>([]);
  const settings = ref<AppSettings>({
    allowRepeat: false,
    drawMode: 'batch',
    animationMode: 'cloud',
    title: '幸运大抽奖',
    theme: 'red',
    soundEnabled: true,
    showDonation: true,
  });

  // ==================== Getters ====================
  
  // 统计数据
  const stats = computed(() => ({
    totalParticipants: participants.value.length,
    totalPrizes: prizes.value.length,
    totalWinners: winners.value.length,
    remainingPrizes: prizes.value.filter(p => 
      getWinnersByPrize(p.id).length < p.count
    ).length,
  }));

  // 获取某奖项的中奖者
  const getWinnersByPrize = (prizeId: string) => 
    winners.value.filter(w => w.prizeId === prizeId);

  // 获取某奖项的剩余名额
  const getRemainingCount = (prizeId: string) => {
    const prize = prizes.value.find(p => p.id === prizeId);
    if (!prize) return 0;
    return prize.count - getWinnersByPrize(prizeId).length;
  };

  // 获取可参与抽奖的人员（排除已中奖者，根据设置）
  const availableParticipants = computed(() => {
    if (settings.value.allowRepeat) {
      return participants.value;
    }
    const winnerIds = new Set(winners.value.map(w => w.participantId));
    return participants.value.filter(p => !winnerIds.has(p.id));
  });

  // ==================== Actions ====================
  
  // 参与者管理
  const addParticipant = (participant: Omit<Participant, 'id' | 'createdAt'>) => {
    const newParticipant: Participant = {
      ...participant,
      id: generateId(),
      createdAt: Date.now(),
    };
    participants.value.push(newParticipant);
    saveToStorage();
  };

  const removeParticipant = (id: string) => {
    participants.value = participants.value.filter(p => p.id !== id);
    saveToStorage();
  };

  const updateParticipant = (id: string, updates: Partial<Participant>) => {
    const index = participants.value.findIndex(p => p.id === id);
    if (index !== -1) {
      participants.value[index] = { ...participants.value[index], ...updates };
      saveToStorage();
    }
  };

  const importParticipants = (newParticipants: Omit<Participant, 'id' | 'createdAt'>[]) => {
    const imported = newParticipants.map(p => ({
      ...p,
      id: generateId(),
      createdAt: Date.now(),
    }));
    participants.value.push(...imported);
    saveToStorage();
  };

  const generateParticipants = (start: number, end: number) => {
    const generated: Participant[] = [];
    for (let i = start; i <= end; i++) {
      generated.push({
        id: generateId(),
        employeeId: String(i).padStart(3, '0'),
        name: `参与者${i}`,
        createdAt: Date.now(),
      });
    }
    participants.value.push(...generated);
    saveToStorage();
  };

  // 奖项管理
  const addPrize = (prize: Omit<Prize, 'id' | 'createdAt'>) => {
    const newPrize: Prize = {
      ...prize,
      id: generateId(),
      createdAt: Date.now(),
    };
    prizes.value.push(newPrize);
    saveToStorage();
  };

  const removePrize = (id: string) => {
    prizes.value = prizes.value.filter(p => p.id !== id);
    saveToStorage();
  };

  const updatePrize = (id: string, updates: Partial<Prize>) => {
    const index = prizes.value.findIndex(p => p.id === id);
    if (index !== -1) {
      prizes.value[index] = { ...prizes.value[index], ...updates };
      saveToStorage();
    }
  };

  const reorderPrizes = (newOrder: string[]) => {
    prizes.value = newOrder
      .map(id => prizes.value.find(p => p.id === id))
      .filter((p): p is Prize => !!p);
    saveToStorage();
  };

  // 抽奖逻辑
  const drawWinners = (prizeId: string, count: number): Participant[] => {
    const available = availableParticipants.value;
    if (available.length === 0) return [];
    
    const shuffled = [...available].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(count, shuffled.length));
    
    // 创建中奖记录
    const newWinners: Winner[] = selected.map((participant, index) => ({
      id: generateId(),
      prizeId,
      participantId: participant.id,
      participant: { ...participant },  // 快照
      wonAt: Date.now(),
      round: index + 1,
    }));
    
    winners.value.push(...newWinners);
    saveToStorage();
    
    return selected;
  };

  // 设置管理
  const updateSettings = (updates: Partial<AppSettings>) => {
    settings.value = { ...settings.value, ...updates };
    saveToStorage();
  };

  // 数据管理
  const exportData = (): string => {
    const data: AppState = {
      participants: participants.value,
      prizes: prizes.value,
      winners: winners.value,
      settings: settings.value,
    };
    return JSON.stringify({
      version: '1.0',
      exportTime: Date.now(),
      data,
    });
  };

  const importData = (json: string): boolean => {
    try {
      const parsed = JSON.parse(json);
      if (parsed.data) {
        participants.value = parsed.data.participants || [];
        prizes.value = parsed.data.prizes || [];
        winners.value = parsed.data.winners || [];
        settings.value = { ...settings.value, ...parsed.data.settings };
        saveToStorage();
        return true;
      }
    } catch (e) {
      console.error('Import failed:', e);
    }
    return false;
  };

  const resetData = (keepSettings = false) => {
    winners.value = [];
    if (!keepSettings) {
      participants.value = [];
      prizes.value = [];
      settings.value = {
        allowRepeat: false,
        drawMode: 'batch',
        animationMode: 'cloud',
        title: '幸运大抽奖',
        theme: 'red',
        soundEnabled: true,
        showDonation: true,
      };
    }
    saveToStorage();
  };

  // 存储管理
  const { save, load } = useStorage('lottery-app');
  
  const saveToStorage = () => {
    save({
      participants: participants.value,
      prizes: prizes.value,
      winners: winners.value,
      settings: settings.value,
    });
  };

  const loadFromStorage = () => {
    const data = load();
    if (data) {
      participants.value = data.participants || [];
      prizes.value = data.prizes || [];
      winners.value = data.winners || [];
      settings.value = { ...settings.value, ...data.settings };
    }
  };

  // 初始化
  loadFromStorage();

  return {
    // State
    participants,
    prizes,
    winners,
    settings,
    // Getters
    stats,
    availableParticipants,
    getWinnersByPrize,
    getRemainingCount,
    // Actions
    addParticipant,
    removeParticipant,
    updateParticipant,
    importParticipants,
    generateParticipants,
    addPrize,
    removePrize,
    updatePrize,
    reorderPrizes,
    drawWinners,
    updateSettings,
    exportData,
    importData,
    resetData,
  };
});

// 辅助函数
function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}
```

---

## 5. 组件规范

### 5.1 组件命名规范

```
组件命名:
- 大驼峰命名: MyComponent.vue
- 语义化命名: 功能 + 类型
  ✓ PrizeCard.vue
  ✓ ParticipantManager.vue
  ✓ CloudDraw.vue
  ✗ Card.vue (太泛)
  ✗ PrtMgmt.vue (缩写)

目录组织:
- common/: 通用基础组件
- layout/: 布局组件
- features/: 功能组件（按功能分组）
```

### 5.2 组件模板结构

```vue
<!-- 标准组件模板 -->
<template>
  <!-- 根元素使用语义化标签 -->
  <div class="component-name">
    <!-- 结构清晰，适当注释 -->
  </div>
</template>

<script setup lang="ts">
// 1. 类型导入
import type { PropType } from 'vue';
import type { SomeType } from '@/types';

// 2. Vue 导入
import { ref, computed, watch, onMounted } from 'vue';

// 3. 第三方库
import { gsap } from 'gsap';

// 4. 组件导入
import BaseButton from '@/components/common/BaseButton.vue';

// 5. Composables
import { useLotteryStore } from '@/stores/lottery';
import { useSound } from '@/composables/useSound';

// 6. Props 定义
interface Props {
  title: string;
  count?: number;
}

const props = withDefaults(defineProps<Props>(), {
  count: 0,
});

// 7. Emits 定义
const emit = defineEmits<{
  (e: 'click', id: string): void;
  (e: 'update', value: number): void;
}>();

// 8. Store 和 Composables
const store = useLotteryStore();
const { playSound } = useSound();

// 9. 响应式数据
const isLoading = ref(false);
const items = ref<SomeType[]>([]);

// 10. 计算属性
const totalCount = computed(() => items.value.length);

// 11. 方法
const handleClick = (id: string) => {
  emit('click', id);
};

// 12. 生命周期
onMounted(() => {
  // 初始化逻辑
});

// 13. 监听器
watch(() => props.count, (newVal) => {
  // 响应变化
});
</script>

<style scoped>
/* 使用 Tailwind 类为主，scoped 样式为辅 */
.component-name {
  /* 特定样式 */
}
</style>
```

### 5.3 关键组件实现要点

#### 3D 云团抽奖组件

```vue
<!-- src/components/draw/CloudDraw.vue -->
<template>
  <div class="cloud-draw" ref="containerRef">
    <div 
      v-for="participant in displayParticipants" 
      :key="participant.id"
      class="cloud-item"
      :style="getItemStyle(participant)"
    >
      {{ participant.name }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { gsap } from 'gsap';
import type { Participant } from '@/types';

interface Props {
  participants: Participant[];
  isDrawing: boolean;
  winners: Participant[];
}

const props = defineProps<Props>();
const containerRef = ref<HTMLDivElement>();

// 3D 位置计算
const getItemStyle = (participant: Participant) => {
  // 计算球面坐标
  const angle = (participant.index / props.participants.length) * Math.PI * 2;
  const y = Math.sin(angle) * 150;
  const x = Math.cos(angle) * 150;
  const z = Math.sin(angle * 2) * 100;
  
  return {
    transform: `translate3d(${x}px, ${y}px, ${z}px)`,
    opacity: props.winners.includes(participant) ? 0 : 1,
  };
};

// GSAP 动画
let animation: gsap.core.Tween | null = null;

const startAnimation = () => {
  if (!containerRef.value) return;
  
  animation = gsap.to(containerRef.value, {
    rotationY: 360,
    duration: 2,
    repeat: -1,
    ease: 'none',
  });
};

const stopAnimation = () => {
  animation?.kill();
};

watch(() => props.isDrawing, (drawing) => {
  if (drawing) {
    startAnimation();
  } else {
    stopAnimation();
  }
});

onUnmounted(() => {
  stopAnimation();
});
</script>

<style scoped>
.cloud-draw {
  perspective: 1000px;
  transform-style: preserve-3d;
}

.cloud-item {
  position: absolute;
  transform-style: preserve-3d;
  will-change: transform;
}
</style>
```

---

## 6. 动画实现方案

### 6.1 动画库选择

| 动画类型 | 推荐方案 | 理由 |
|---------|---------|------|
| 页面过渡 | Vue `<Transition>` | 原生支持，轻量 |
| 组件动画 | GSAP | 时间线控制精确 |
| 3D 效果 | CSS 3D + GSAP | 性能好，可控性强 |
| 粒子效果 | tsparticles | 功能丰富，配置简单 |
| 彩带效果 | canvas-confetti | 开箱即用 |

### 6.2 动画性能优化

```css
/* GPU 加速 */
.animated-element {
  will-change: transform, opacity;
  transform: translateZ(0);
  backface-visibility: hidden;
}

/* 减少重绘区域 */
.isolate-animation {
  contain: layout style paint;
}

/* 使用 transform 代替 top/left */
/* ✓ 性能好 */
transform: translateX(100px);

/* ✗ 性能差 */
left: 100px;
```

### 6.3 音效实现

```typescript
// src/composables/useSound.ts
import { Howl } from 'howler';
import { ref } from 'vue';

const sounds = {
  click: new Howl({ src: ['/sounds/click.mp3'] }),
  drawStart: new Howl({ src: ['/sounds/draw-start.mp3'] }),
  drawTick: new Howl({ src: ['/sounds/draw-tick.mp3'], loop: true }),
  win: new Howl({ src: ['/sounds/win.mp3'] }),
  confetti: new Howl({ src: ['/sounds/confetti.mp3'] }),
};

export function useSound() {
  const isMuted = ref(false);
  const volume = ref(0.8);

  const playSound = (name: keyof typeof sounds) => {
    if (isMuted.value) return;
    sounds[name].volume(volume.value);
    sounds[name].play();
  };

  const stopSound = (name: keyof typeof sounds) => {
    sounds[name].stop();
  };

  return {
    isMuted,
    volume,
    playSound,
    stopSound,
  };
}
```

---

## 7. 样式规范

### 7.1 Tailwind 配置

```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // 中国红主题
        'china-red': {
          DEFAULT: '#E53935',
          light: '#FF6F61',
          dark: '#C62828',
        },
        'china-gold': {
          DEFAULT: '#FFD54F',
          light: '#FFE082',
          dark: '#FFC107',
        },
        'china-cream': {
          DEFAULT: '#FFF8E7',
          dark: '#FFECB3',
        },
        'china-brown': {
          DEFAULT: '#3E2723',
          light: '#6D4C41',
        },
      },
      fontFamily: {
        display: ['Noto Serif SC', 'serif'],
        body: ['Noto Sans SC', 'sans-serif'],
        mono: ['Roboto Mono', 'monospace'],
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'spin-slow': 'spin 8s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      boxShadow: {
        'glow': '0 0 20px rgba(229,57,53,0.3)',
        'glow-lg': '0 0 40px rgba(229,57,53,0.4)',
      },
    },
  },
  plugins: [],
};
```

### 7.2 CSS 变量主题系统

```css
/* src/assets/styles/themes.css */

/* 基础变量 */
:root {
  --radius-sm: 4px;
  --radius: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --shadow: 0 2px 8px rgba(0,0,0,0.08);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.12);
  --shadow-lg: 0 8px 24px rgba(0,0,0,0.15);
}

/* 中国红主题 */
[data-theme="red"] {
  --color-primary: #E53935;
  --color-primary-light: #FF6F61;
  --color-primary-dark: #C62828;
  --color-secondary: #FFD54F;
  --color-secondary-light: #FFE082;
  --color-secondary-dark: #FFC107;
  --color-bg: #FFF8E7;
  --color-bg-secondary: #FFECB3;
  --color-card: #FFFFFF;
  --color-text: #3E2723;
  --color-text-secondary: #6D4C41;
  --color-text-muted: #9E9E9E;
}

/* 奢华金主题 */
[data-theme="luxury"] {
  --color-primary: #C9A227;
  --color-primary-light: #E6C875;
  --color-primary-dark: #9A7B1A;
  --color-secondary: #FFFFFF;
  --color-bg: #1A1A2E;
  --color-bg-secondary: #16213E;
  --color-card: #252542;
  --color-text: #FFFFFF;
  --color-text-secondary: #B8B8D1;
  --color-text-muted: #6B6B8D;
}

/* 活力橙主题 */
[data-theme="vibrant"] {
  --color-primary: #FF6B35;
  --color-primary-light: #FF8C61;
  --color-primary-dark: #E55A2B;
  --color-secondary: #4ECDC4;
  --color-bg: #FFFFFF;
  --color-bg-secondary: #FFF3E0;
  --color-card: #FFFFFF;
  --color-text: #212121;
  --color-text-secondary: #757575;
  --color-text-muted: #9E9E9E;
}
```

---

## 8. 路由设计

### 8.1 路由配置

```typescript
// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '@/views/HomeView.vue';
import DrawView from '@/views/DrawView.vue';
import SettingsView from '@/views/SettingsView.vue';

// 注意：只有3个页面路由，中奖名单改为弹窗实现
const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: { title: '幸运大抽奖' },
    },
    {
      path: '/draw/:prizeId',
      name: 'draw',
      component: DrawView,
      props: true,
      meta: { title: '抽奖中...' },
    },
    {
      path: '/settings',
      name: 'settings',
      component: SettingsView,
      meta: { title: '设置' },
    },
    // 注意：中奖名单改为弹窗，不单独设置路由
    // WinnersView 作为组件在首页弹窗中使用
  ],
});

// 动态标题
router.beforeEach((to, from, next) => {
  document.title = to.meta.title as string || '幸运大抽奖';
  next();
});

export default router;
```

---

## 9. 构建与部署

### 9.1 构建配置

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    target: 'esnext',
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['vue', 'vue-router', 'pinia'],
          'animation': ['gsap', '@vueuse/motion'],
          'particles': ['tsparticles'],
        },
      },
    },
  },
});
```

### 9.2 部署方案

```
方案一: 静态托管（推荐）
- 构建: npm run build
- 输出: dist/ 目录
- 部署: GitHub Pages / Vercel / Netlify
- 优点: 免费，简单，CDN 加速

方案二: 本地运行
- 构建: npm run build
- 启动: npx serve dist
- 访问: http://localhost:3000
- 优点: 完全离线，数据不外泄

方案三: 内网部署
- 构建: npm run build
- 部署: 内网 Nginx / Apache
- 配置: 静态文件服务
- 优点: 企业内网使用
```

---

## 10. 开发规范

### 10.1 ESLint 配置

```javascript
// eslint.config.js
import pluginVue from 'eslint-plugin-vue';
import ts from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

export default [
  {
    files: ['**/*.{vue,ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': ts,
      vue: pluginVue,
    },
    rules: {
      'vue/multi-word-component-names': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
];
```

### 10.2 提交规范

```
提交信息格式:
<type>(<scope>): <subject>

类型:
- feat: 新功能
- fix: 修复
- docs: 文档
- style: 格式
- refactor: 重构
- test: 测试
- chore: 构建/工具

示例:
feat(draw): 添加 3D 云团抽奖动画
fix(storage): 修复 LocalStorage 溢出问题
docs(readme): 更新使用说明
```

---

## 11. 性能优化

### 11.1 加载优化

```typescript
// 路由懒加载
const DrawView = () => import('@/views/DrawView.vue');

// 组件异步加载
const ParticleBackground = defineAsyncComponent(() => 
  import('@/components/effects/ParticleBackground.vue')
);

// 图片懒加载
<img v-lazy="prizeImage" :alt="prizeName" />
```

### 11.2 运行时优化

```typescript
// 使用 shallowRef 避免深层响应
const particles = shallowRef<Particle[]>([]);

// 使用 computed 缓存计算结果
const availableCount = computed(() => 
  participants.value.filter(p => !isWinner(p)).length
);

// 使用 v-memo 缓存列表渲染
<div v-memo="[participant.id, participant.name]">
  {{ participant.name }}
</div>
```

---

**文档结束**
