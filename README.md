# 🎉 Lucky Lottery - 幸运大抽奖

<p align="center">
  <img src="https://img.shields.io/badge/React-18.3.1-61DAFB?logo=react&logoColor=white" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-5.3.3-3178C6?logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Vite-5.1.4-646CFF?logo=vite&logoColor=white" alt="Vite">
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.4.1-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind CSS">
  <img src="https://img.shields.io/badge/Zustand-4.5.0-FF9F43?logo=react&logoColor=white" alt="Zustand">
</p>

<p align="center">
  <b>一款面向企业年会、团队活动的纯前端抽奖应用</b>
</p>

<p align="center">
  <a href="#-功能特性">功能特性</a> •
  <a href="#-技术栈">技术栈</a> •
  <a href="#-快速开始">快速开始</a> •
  <a href="#-使用指南">使用指南</a> •
  <a href="#-项目结构">项目结构</a>
</p>

---

## ✨ 功能特性

### 🎯 核心功能

- **🏆 奖项管理** - 支持自定义奖项名称、数量、奖品图片，拖拽排序
- **👥 参与者管理** - 手动添加、CSV/Excel 批量导入、号码区间生成
- **🎲 抽奖动画** - 3D 云团旋转动画 + 彩带烟花特效，仪式感满满
- **📊 中奖记录** - 实时记录中奖名单，支持导出
- **🔊 音效配合** - 抽奖音效、中奖庆祝音效

### 🛠️ 数据管理

- **📥 数据导入** - 支持 CSV、Excel 格式批量导入参与者
- **📤 数据导出** - 中奖名单导出为 CSV/Excel/JSON
- **💾 本地存储** - 所有数据存储在浏览器本地，保护隐私
- **🔄 数据重置** - 灵活选择重置范围（中奖/参与者/奖项）

### 🎨 界面特性

- **🌈 多套主题** - 支持多种配色主题切换
- **📱 响应式设计** - 适配大屏展示和移动设备
- **🎬 粒子特效** - 背景粒子动画 + 中奖烟花彩带效果
- **🔧 可配置** - 音效开关、作者信息显示开关

---

## 🛠️ 技术栈

| 类别 | 技术 |
|------|------|
| **框架** | React 18 + TypeScript 5 |
| **构建工具** | Vite 5 |
| **状态管理** | Zustand |
| **样式方案** | Tailwind CSS 3 + tailwindcss-animate |
| **路由** | React Router 6 |
| **拖拽排序** | @dnd-kit/core + @dnd-kit/sortable |
| **数据解析** | PapaParse (CSV) + xlsx (Excel) |
| **图标** | Lucide React |
| **测试** | Vitest |

---

## 🚀 快速开始

### 环境要求

- Node.js 18+
- npm 9+ 或 yarn 1.22+

### 安装依赖

```bash
# 克隆项目
git clone https://github.com/moozhu/LotteryApp.git
cd LotteryApp

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### 构建部署

```bash
# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

构建完成后，`dist` 目录中的文件可直接部署到任何静态服务器。

---

## 📖 使用指南

### 1️⃣ 首次使用

1. 打开应用后，先进入**设置页面**添加参与者
2. 配置奖项信息（名称、数量、奖品图片）
3. 返回首页即可开始抽奖

### 2️⃣ 添加参与者

**方式一：手动添加**
- 在设置页面的参与者管理中逐个添加

**方式二：批量导入**
- 支持 CSV、Excel 文件导入
- 文件格式：包含 `id` 和 `name` 列
- 支持拖拽上传

**方式三：号码区间生成**
- 设置起始号码和结束号码自动生成

### 3️⃣ 开始抽奖

1. 在首页点击要抽取的奖项卡片
2. 进入抽奖页面，点击"开始抽奖"按钮
3. 欣赏 3D 云团旋转动画
4. 中奖结果展示，彩带烟花庆祝

### 4️⃣ 导出数据

- 中奖名单可导出为 CSV、Excel 或 JSON 格式
- 支持数据备份和迁移

---

## 📁 项目结构

```
LotteryApp/
├── public/                 # 静态资源
│   └── sounds/            # 音效文件
├── src/
│   ├── components/        # 组件
│   │   ├── modals/       # 弹窗组件
│   │   │   ├── DonationModal.tsx
│   │   │   ├── FirstTimeGuideModal.tsx
│   │   │   ├── ResetConfirmModal.tsx
│   │   │   └── WinnerListModal.tsx
│   │   └── ui/           # UI 组件
│   │       ├── BackgroundEffects.tsx
│   │       ├── Modal.tsx
│   │       ├── PrizeFireworks.tsx
│   │       ├── ShapeFireworks.tsx
│   │       ├── Switch.tsx
│   │       └── Toaster.tsx
│   ├── lib/              # 工具函数
│   │   ├── sound.ts      # 音效管理
│   │   ├── utils.ts      # 通用工具
│   │   └── winnerLayout.ts
│   ├── pages/            # 页面
│   │   ├── DrawPage.tsx  # 抽奖页面
│   │   ├── HomePage.tsx  # 首页
│   │   └── SettingsPage.tsx  # 设置页面
│   ├── store/            # 状态管理
│   │   └── lottery.ts    # Zustand Store
│   ├── types/            # TypeScript 类型
│   │   └── index.ts
│   ├── App.tsx           # 应用入口
│   ├── index.css         # 全局样式
│   └── main.tsx          # 主入口
├── docs/                  # 文档
│   ├── PRD.md            # 产品需求文档
│   ├── Technical-Spec.md # 技术规范文档
│   └── IA-UX.md          # 交互设计文档
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

---

## 🎨 主题配置

应用内置多套主题，可在设置页面切换：

- **默认主题** - 经典蓝紫渐变
- **喜庆主题** - 红金配色，适合年会
- **科技主题** - 深色背景，科技感十足

---

## 🔧 配置选项

| 选项 | 说明 | 默认值 |
|------|------|--------|
| 音效开关 | 启用/禁用抽奖音效 | 开启 |
| 显示作者信息 | 在首页底部显示创作者信息 | 开启 |
| 允许重复中奖 | 同一人是否可以多次中奖 | 关闭 |
| 抽取方式 | 单次抽取/批量抽取 | 单次 |

---

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request
---

## 📄 许可证

本项目基于 [MIT](LICENSE) 许可证开源。

---

## 👨‍💻 创作者

**moozhu** - 前端开发者

- GitHub: [@moozhu](https://github.com/moozhu)

---

<p align="center">
  如果这个项目对你有帮助，请给个 ⭐ Star 支持一下！
</p>
