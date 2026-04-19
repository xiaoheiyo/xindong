# 组件使用指南

本文档介绍如何使用 HistoryManager 和 HeartRateManager 组件。

## HistoryManager 组件

历史记录管理组件，用于管理心率历史数据的存储、加载和显示。

### 基本用法

```vue
<template>
  <HistoryManager
    ref="historyRef"
    :max-records="50"
    :record-interval="5000"
    :cache-duration="24"
    @record-added="handleRecordAdded"
    @records-cleared="handleRecordsCleared"
    @cache-duration-updated="handleCacheUpdate"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import HistoryManager from './components/HistoryManager.vue'
import type { HeartRateRecord } from './components/HistoryManager.vue'

const historyRef = ref<InstanceType<typeof HistoryManager>>()

// 添加心率记录
const addHeartRate = (bpm: number) => {
  historyRef.value?.tryAddRecord(bpm)
}

// 清空记录
const clearHistory = () => {
  historyRef.value?.clearRecords()
}

// 获取记录数量
const getRecordCount = () => {
  return historyRef.value?.getCount() || 0
}

// 事件处理
const handleRecordAdded = (record: HeartRateRecord) => {
  console.log('新增记录:', record)
}

const handleRecordsCleared = () => {
  console.log('记录已清空')
}

const handleCacheUpdate = (hours: number) => {
  console.log('缓存时长更新为:', hours, '小时')
}
</script>
```

### Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| maxRecords | number | 50 | 最大记录数 |
| recordInterval | number | 5000 | 记录间隔(毫秒) |
| cacheDuration | number | 24 | 缓存时长(小时) |
| maxCacheDuration | number | 48 | 最大缓存时长(小时) |

### Events

| 事件名 | 参数 | 说明 |
|--------|------|------|
| record-added | HeartRateRecord | 新增记录时触发 |
| records-cleared | - | 记录清空时触发 |
| cache-duration-updated | number | 缓存时长更新时触发 |

### 暴露的方法

通过 `ref` 可以访问以下方法：

- `tryAddRecord(bpm: number): boolean` - 尝试添加一条心率记录
- `clearRecords()` - 清空所有记录
- `updateCacheDuration(hours: number): boolean` - 更新缓存时长
- `getRecordsReversed(): HeartRateRecord[]` - 获取倒序的记录列表
- `formatTime(timestamp: number): string` - 格式化时间戳
- `getCount(): number` - 获取记录数量

### 作用域插槽

可以使用作用域插槽自定义UI：

```vue
<HistoryManager ref="historyRef">
  <template #default="{ records, count, clearRecords, formatTime }">
    <div>
      <h3>历史记录 ({{ count }}条)</h3>
      <button @click="clearRecords">清空</button>
      <ul>
        <li v-for="record in records" :key="record.timestamp">
          {{ formatTime(record.timestamp) }} - {{ record.bpm }} BPM
        </li>
      </ul>
    </div>
  </template>
</HistoryManager>
```

---

## HeartRateManager 组件

心跳值管理组件，用于处理心率数据、音频反馈和预警功能。

### 基本用法

```vue
<template>
  <!-- 隐藏的功能组件 -->
  <HeartRateManager
    ref="heartRateRef"
    @bpm-updated="handleBpmUpdate"
    @alert-triggered="handleAlert"
    @audio-toggled="handleAudioToggle"
    @audio-type-changed="handleAudioTypeChange"
    @alert-settings-updated="handleAlertSettingsUpdate"
  />
  
  <!-- UI 显示 -->
  <div>
    <p>当前心率: {{ currentBpm }} BPM</p>
    <button @click="toggleAudio">
      {{ audioEnabled ? '关闭音效' : '开启音效' }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import HeartRateManager from './components/HeartRateManager.vue'
import type { AlertSettings } from './components/HeartRateManager.vue'

const heartRateRef = ref<InstanceType<typeof HeartRateManager>>()
const currentBpm = ref(0)
const audioEnabled = ref(false)

// 更新心率
const updateHeartRate = (bpm: number) => {
  heartRateRef.value?.updateBpm(bpm)
}

// 切换音频
const toggleAudio = () => {
  const newState = !audioEnabled.value
  heartRateRef.value?.toggleAudio(newState)
  audioEnabled.value = newState
}

// 更新预警设置
const setAlertThresholds = (high: number, low: number) => {
  heartRateRef.value?.updateAlertSettings({
    highThreshold: high,
    lowThreshold: low
  })
}

// 事件处理
const handleBpmUpdate = (bpm: number) => {
  currentBpm.value = bpm
  console.log('心率更新:', bpm)
}

const handleAlert = (type: 'high' | 'low', message: string) => {
  console.warn('预警:', message)
  // 可以在这里添加UI特效，如边框闪烁
}

const handleAudioToggle = (enabled: boolean) => {
  audioEnabled.value = enabled
  console.log('音频状态:', enabled)
}

const handleAudioTypeChange = (type: string) => {
  console.log('音效类型:', type)
}

const handleAlertSettingsUpdate = (settings: AlertSettings) => {
  console.log('预警设置:', settings)
}
</script>
```

### Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| initialBpm | number | 0 | 初始心率值 |
| defaultAlertSettings | AlertSettings | { enabled: false, highThreshold: 100, lowThreshold: 50 } | 默认预警设置 |

### Events

| 事件名 | 参数 | 说明 |
|--------|------|------|
| bpm-updated | number | 心率更新时触发 |
| alert-triggered | type, message | 预警触发时触发 |
| audio-toggled | boolean | 音频开关切换时触发 |
| audio-type-changed | AudioType | 音效类型改变时触发 |
| alert-settings-updated | AlertSettings | 预警设置更新时触发 |

### 暴露的方法

通过 `ref` 可以访问以下方法：

- `updateBpm(bpm: number)` - 更新当前心率值
- `getBpm(): number` - 获取当前心率值
- `toggleAudio(enabled: boolean)` - 切换音频开关
- `isAudioEnabled(): boolean` - 获取音频开关状态
- `updateAudioType(type: AudioType)` - 更新音频类型
- `getAudioType(): AudioType` - 获取音频类型
- `updateAlertSettings(settings: Partial<AlertSettings>)` - 更新预警设置
- `getAlertSettings(): AlertSettings` - 获取预警设置
- `cleanup()` - 清理资源（组件卸载时调用）

### 音频类型

支持以下4种音效类型：

- `'sine'` - 正弦波（默认）
- `'square'` - 方波
- `'triangle'` - 三角波
- `'sawtooth'` - 锯齿波

---

## 完整示例

结合两个组件的完整示例：

```vue
<template>
  <div class="app">
    <!-- 功能组件（隐藏） -->
    <HeartRateManager
      ref="heartRateRef"
      @bpm-updated="currentBpm = $event"
      @alert-triggered="showAlert"
    />
    
    <HistoryManager
      ref="historyRef"
      :record-interval="5000"
    />
    
    <!-- UI -->
    <div class="display">
      <h1>{{ currentBpm }} BPM</h1>
      <button @click="simulateHeartRate">模拟心率</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import HeartRateManager from './components/HeartRateManager.vue'
import HistoryManager from './components/HistoryManager.vue'

const heartRateRef = ref<InstanceType<typeof HeartRateManager>>()
const historyRef = ref<InstanceType<typeof HistoryManager>>()
const currentBpm = ref(0)

// 模拟心率数据
const simulateHeartRate = () => {
  const bpm = Math.floor(Math.random() * 40) + 60 // 60-100
  heartRateRef.value?.updateBpm(bpm)
  historyRef.value?.tryAddRecord(bpm)
}

// 显示预警
const showAlert = (type: string, message: string) => {
  alert(message)
}
</script>
```

---

## 注意事项

1. **组件引用**: 使用 `ref` 访问组件方法时，确保在组件挂载后使用
2. **事件监听**: 优先使用事件监听而非直接调用方法，以保持组件解耦
3. **资源清理**: 在父组件卸载时，调用 `cleanup()` 方法清理音频资源
4. **localStorage**: 组件会自动保存和加载数据，无需手动处理
5. **TypeScript**: 建议使用 TypeScript 以获得更好的类型提示

## 迁移指南

如果之前使用的是 modules 方式，可以这样迁移：

**之前 (modules):**
```typescript
import { historyManager } from './modules/history'
import { heartRateManager } from './modules/heartRate'

historyManager.tryAddRecord(75)
heartRateManager.updateBpm(75)
```

**现在 (components):**
```vue
<template>
  <HistoryManager ref="historyRef" />
  <HeartRateManager ref="heartRateRef" />
</template>

<script setup lang="ts">
const historyRef = ref()
const heartRateRef = ref()

historyRef.value?.tryAddRecord(75)
heartRateRef.value?.updateBpm(75)
</script>
```

组件化方式更符合 Vue 的设计理念，提供了更好的封装性和可复用性。

---

## WallpaperManager 组件

壁纸管理组件，用于管理背景壁纸的切换、应用和持久化。

### 基本用法

```vue
<template>
  <!-- 作为隐藏功能组件 -->
  <WallpaperManager
    ref="wallpaperRef"
    @wallpaper-changed="handleWallpaperChange"
  />
  
  <!-- 或在设置面板中使用 -->
  <SettingsPanel
    @wallpaper-change="wallpaperRef?.changeWallpaper($event)"
    :wallpaper="wallpaperRef?.selectedWallpaper"
    :wallpaper-list="wallpaperRef?.wallpaperList"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import WallpaperManager from './components/WallpaperManager.vue'

const wallpaperRef = ref<InstanceType<typeof WallpaperManager>>()

// 切换壁纸
const changeToBlueGradient = () => {
  wallpaperRef.value?.changeWallpaper('gradient-blue')
}

// 事件处理
const handleWallpaperChange = (wallpaperId: string) => {
  console.log('壁纸已更换为:', wallpaperId)
}
</script>
```

### 使用默认UI

```vue
<template>
  <!-- 显示默认的壁纸选择器 -->
  <WallpaperManager @wallpaper-changed="handleChange" />
</template>

<script setup lang="ts">
import WallpaperManager from './components/WallpaperManager.vue'

const handleChange = (id: string) => {
  console.log('选择了:', id)
}
</script>
```

### 自定义UI（作用域插槽）

```vue
<template>
  <WallpaperManager>
    <template #default="{ selectedWallpaper, wallpaperList, changeWallpaper }">
      <div class="custom-wallpaper-selector">
        <h3>选择壁纸</h3>
        <div class="my-grid">
          <button
            v-for="wp in wallpaperList"
            :key="wp.id"
            :class="{ active: selectedWallpaper === wp.id }"
            @click="changeWallpaper(wp.id)"
          >
            {{ wp.name }}
          </button>
        </div>
      </div>
    </template>
  </WallpaperManager>
</template>
```

### Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| currentWallpaper | string | 'gradient-blue' | 当前壁纸ID |
| wallpaperList | WallpaperOption[] | 6种预设壁纸 | 壁纸选项列表 |

### Events

| 事件名 | 参数 | 说明 |
|--------|------|------|
| wallpaper-changed | string | 壁纸更换时触发 |

### 暴露的方法

通过 `ref` 可以访问以下方法：

- `changeWallpaper(wallpaperId: string)` - 切换壁纸
- `applyWallpaper(wallpaperId: string)` - 应用壁纸到页面
- `selectedWallpaper` - 当前选中的壁纸ID
- `wallpaperList` - 壁纸选项列表

### 预设壁纸

组件提供6种精美壁纸：

1. **gradient-blue** - 蓝色渐变 (#667eea → #764ba2)
2. **gradient-purple** - 紫色渐变 (#a8edea → #fed6e3)
3. **gradient-sunset** - 日落橙红 (#ff9a9e → #fecfef)
4. **gradient-forest** - 森林绿色 (#d4fc79 → #96e6a1)
5. **gradient-ocean** - 海洋深蓝 (#2e3192 → #1bffff)
6. **solid-dark** - 深色纯色 (#1a1a1a)

### 自定义壁纸

你可以通过 props 传入自定义壁纸列表：

```vue
<template>
  <WallpaperManager
    :wallpaper-list="customWallpapers"
    @wallpaper-changed="handleChange"
  />
</template>

<script setup lang="ts">
import WallpaperManager from './components/WallpaperManager.vue'
import type { WallpaperOption } from './components/WallpaperManager.vue'

const customWallpapers: WallpaperOption[] = [
  { 
    id: 'my-gradient', 
    name: '我的渐变', 
    class: 'my-custom-gradient' 
  },
  // ... 更多壁纸
]
</script>

<style>
/* 在 global style 中定义 */
.my-custom-gradient {
  background: linear-gradient(135deg, #your-color-1, #your-color-2);
}
</style>
```

### 工作原理

1. **自动应用**: 组件会自动查找 `.main-content` 元素并应用壁纸类
2. **CSS 类管理**: 移除旧的壁纸类，添加新的壁纸类
3. **持久化**: 自动保存到 localStorage，下次加载时恢复
4. **实时生效**: 切换后立即看到效果，无需刷新页面

### 注意事项

1. **确保 .main-content 存在**: 组件需要这个元素来应用壁纸
2. **CSS 优先级**: 壁纸样式使用 !important 确保生效
3. **自定义壁纸**: 需要在 global style 中定义对应的 CSS 类
4. **响应式**: 壁纸选择器支持响应式布局
