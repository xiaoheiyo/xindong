<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import ECGCanvas from './components/ECGCanvas.vue'
import SettingsPanel from './components/SettingsPanel.vue'
import HistoryManager from './components/HistoryManager.vue'
import HeartRateManager from './components/HeartRateManager.vue'
import WallpaperManager from './components/WallpaperManager.vue'
import BluetoothManager from './components/BluetoothManager.vue'
import AppHeader from './components/AppHeader.vue'
import AppFooter from './components/AppFooter.vue'
import HeartRateStatus from './components/HeartRateStatus.vue'
import type { AlertSettings } from './components/HeartRateManager.vue'
import type { HeartRateRecord } from './components/HistoryManager.vue'

// 状态管理
const bpm = ref(0)
const showSettings = ref(false)

// 预警激活状态（用于边框闪烁）
const isAlertActive = ref(false)
let alertFlashTimer: number | null = null

// 缓存时长
const cacheDuration = ref(24)

// 组件引用
const historyManagerRef = ref<InstanceType<typeof HistoryManager>>()
const heartRateManagerRef = ref<InstanceType<typeof HeartRateManager>>()
const wallpaperManagerRef = ref<InstanceType<typeof WallpaperManager>>()
const bluetoothManagerRef = ref<InstanceType<typeof BluetoothManager>>()

// 计算样式类
const bodyClass = computed(() => {
  return 'light-mode'
})

// 从蓝牙管理器获取状态
const isConnected = computed(() => bluetoothManagerRef.value?.isConnected || false)
const isConnecting = computed(() => bluetoothManagerRef.value?.isConnecting || false)
const statusText = computed(() => bluetoothManagerRef.value?.statusText || '未连接')

// 壁纸管理器事件处理
const handleWallpaperChanged = (wallpaperId: string) => {
  console.log('[壁纸] 已更换为:', wallpaperId)
}

// 蓝牙事件处理
const handleBluetoothConnected = (device: { name?: string; id: string }) => {
  console.log('[蓝牙] 已连接设备:', device.name || device.id)
}

const handleBluetoothDisconnected = () => {
  console.log('[蓝牙] 设备已断开')
  bpm.value = 0
}

const handleBluetoothDataReceived = (heartRate: number) => {
  bpm.value = heartRate
  
  // 使用心跳值组件处理心率
  if (heartRateManagerRef.value) {
    heartRateManagerRef.value.updateBpm(heartRate)
  }
  
  // 使用历史记录组件添加记录
  if (historyManagerRef.value) {
    historyManagerRef.value.tryAddRecord(heartRate)
  }
}

const handleBluetoothError = (error: string) => {
  console.error('[蓝牙] 错误:', error)
}

const handleStatusChange = (status: string, connected: boolean) => {
  console.log('[蓝牙] 状态变更:', status, connected)
}

// 启动预警边框闪烁
const startAlertFlash = () => {
  isAlertActive.value = true
  console.log('[特效] 启动边框闪烁')

  // 5秒后自动停止闪烁
  if (alertFlashTimer) {
    clearTimeout(alertFlashTimer)
  }
  alertFlashTimer = window.setTimeout(() => {
    stopAlertFlash()
  }, 5000)
}

// 停止预警边框闪烁
const stopAlertFlash = () => {
  isAlertActive.value = false
  if (alertFlashTimer) {
    clearTimeout(alertFlashTimer)
    alertFlashTimer = null
  }
  console.log('[特效] 停止边框闪烁')
}

// 切换设置面板
const toggleSettings = () => {
  showSettings.value = !showSettings.value
}

// 连接/断开设备
const connectDevice = () => {
  bluetoothManagerRef.value?.connectDevice()
}

// 事件处理函数
const handleAlertTriggered = (type: 'high' | 'low', message: string) => {
  console.warn('[预警]', message)
  startAlertFlash()
}

const handleAudioToggle = (enabled: boolean) => {
  console.log('[音频] 开关状态:', enabled)
}

const handleAudioTypeChange = (type: 'sine' | 'square' | 'triangle' | 'sawtooth') => {
  console.log('[音频] 类型变更:', type)
}

const handleAlertSettingsUpdate = (settings: AlertSettings) => {
  console.log('[预警] 设置更新:', settings)
}

const handleCacheDurationUpdate = (hours: number) => {
  cacheDuration.value = hours
  console.log('[缓存] 时长更新:', hours)
}

const handleMaxRecordsUpdate = (count: number) => {
  console.log('[设置] 最大记录数更新:', count)
}

const handleRecordAdded = (record: HeartRateRecord) => {
  console.log('[历史记录] 新增记录:', record)
}

const handleRecordsCleared = () => {
  console.log('[历史记录] 记录已清空')
}

onMounted(() => {
  console.log('[应用] 心动心率监测系统启动')
  console.log('[应用] Vue版本:', '3.x')

  // 检查浏览器是否支持Web Bluetooth
  if (!bluetoothManagerRef.value?.checkBrowserSupport()) {
    console.warn('[警告] 浏览器不支持Web Bluetooth API')
    alert('您的浏览器不支持Web Bluetooth API，请使用Chrome或Edge浏览器')
  } else {
    console.log('[系统] Web Bluetooth API 可用')
  }

  // 请求通知权限
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission()
  }
})

onUnmounted(() => {
  console.log('[应用] 组件卸载，清理资源')
  // 清理心跳值组件资源
  if (heartRateManagerRef.value) {
    heartRateManagerRef.value.cleanup()
  }
  // 清理预警闪烁定时器
  stopAlertFlash()
})
</script>

<template>
  <div :class="[bodyClass, { 'alert-active': isAlertActive }]" class="app-container">
    <!-- 顶部控制栏组件 -->
    <AppHeader
      :is-connected="isConnected"
      :is-connecting="isConnecting"
      :status-text="statusText"
      @connect="connectDevice"
    />

    <!-- 主内容 -->
    <main class="main-content">
      <!-- 心率显示 - 左侧 -->
      <section class="heart-rate-section">
        <div class="heart-rate-display">
          <span class="heart-icon" :class="{ beating: bpm > 0 }">❤️</span>
          <span class="bpm-value">{{ bpm || '--' }}</span>
          <span class="bpm-unit">次/分</span>
        </div>
        
        <!-- 心跳状况模块 -->
        <HeartRateStatus :bpm="bpm" :is-connected="isConnected" />
      </section>

      <!-- ECG 显示 -->
      <section class="ecg-section">
        <div class="ecg-wrapper">
          <div class="ecg-grid"></div>
          <ECGCanvas :bpm="bpm" :is-connected="isConnected" theme-color="#ff0033" />
        </div>
      </section>

      <!-- 历史记录组件 -->
      <HistoryManager
        ref="historyManagerRef"
        @record-added="handleRecordAdded"
        @records-cleared="handleRecordsCleared"
        @cache-duration-updated="handleCacheDurationUpdate"
      />
    </main>

    <!-- 底部信息组件 -->
    <AppFooter />

    <!-- 心跳值管理组件（隐藏，仅提供功能） -->
    <HeartRateManager
      ref="heartRateManagerRef"
      @bpm-updated="bpm = $event"
      @alert-triggered="handleAlertTriggered"
      @audio-toggled="handleAudioToggle"
      @audio-type-changed="handleAudioTypeChange"
      @alert-settings-updated="handleAlertSettingsUpdate"
    />

    <!-- 壁纸管理组件（隐藏，仅提供功能） -->
    <WallpaperManager
      ref="wallpaperManagerRef"
      @wallpaper-changed="handleWallpaperChanged"
    />

    <!-- 蓝牙管理组件（隐藏，仅提供功能） -->
    <BluetoothManager
      ref="bluetoothManagerRef"
      @connected="handleBluetoothConnected"
      @disconnected="handleBluetoothDisconnected"
      @data-received="handleBluetoothDataReceived"
      @connection-error="handleBluetoothError"
      @status-change="handleStatusChange"
    />

    <!-- 悬浮设置按钮 -->
    <button class="fab-settings" @click="toggleSettings" title="设置">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="3"></circle>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
      </svg>
    </button>

    <!-- 设置面板 -->
    <SettingsPanel
      v-if="showSettings"
      @close="showSettings = false"
      @audio-toggle="heartRateManagerRef?.toggleAudio($event)"
      @audio-type-change="heartRateManagerRef?.updateAudioType($event)"
      @alert-update="(enabled, high, low) => heartRateManagerRef?.updateAlertSettings({ enabled, highThreshold: high, lowThreshold: low })"
      @cache-duration-update="historyManagerRef?.updateCacheDuration($event)"
      @max-records-update="handleMaxRecordsUpdate"
      @wallpaper-change="wallpaperManagerRef?.changeWallpaper($event)"
      :audio-enabled="heartRateManagerRef?.isAudioEnabled() || false"
      :audio-type="heartRateManagerRef?.getAudioType() || 'sine'"
      :alert-enabled="heartRateManagerRef?.getAlertSettings().enabled || false"
      :high-threshold="heartRateManagerRef?.getAlertSettings().highThreshold || 100"
      :low-threshold="heartRateManagerRef?.getAlertSettings().lowThreshold || 50"
      :cache-duration="cacheDuration"
      :max-records="historyManagerRef?.getMaxRecords() || 720"
      :wallpaper="wallpaperManagerRef?.selectedWallpaper || 'gradient-blue'"
      :wallpaper-list="wallpaperManagerRef?.wallpaperList || []"
    />
  </div>
</template>

<style scoped>
.app-container {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
}

/* 预警激活时的边框闪烁效果 - 使用伪元素置顶 */
.app-container.alert-active::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 9999;
  animation: alertBorderFlash 0.5s ease-in-out infinite;
}

@keyframes alertBorderFlash {
  0%, 100% {
    box-shadow: inset 0 0 0 4px rgba(255, 0, 0, 0);
  }
  50% {
    box-shadow: inset 0 0 50px 8px rgba(255, 0, 0, 0.9);
  }
}

/* 主内容区背景壁纸 */
.main-content {
  padding-top: 60px;
  min-height: calc(100vh - 120px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 30px;
  padding: 80px 20px 80px 20px;
  position: relative;
  z-index: 10;
  transition: background 0.5s ease;
  /* 默认背景色 */
  background: #e6f4f4;
}

/* 壁纸样式 - 使用 !important 确保优先级 */
.main-content.wallpaper-gradient-blue {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
}

.main-content.wallpaper-gradient-purple {
  background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%) !important;
}

.main-content.wallpaper-gradient-sunset {
  background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%) !important;
}

.main-content.wallpaper-gradient-forest {
  background: linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%) !important;
}

.main-content.wallpaper-gradient-ocean {
  background: linear-gradient(135deg, #2e3192 0%, #1bffff 100%) !important;
}

.main-content.wallpaper-solid-dark {
  background: #1a1a1a !important;
}

.heart-rate-section {
  width: 100%;
  text-align: left;
  display: flex;
  align-items: stretch;  /* 改为stretch,让子元素高度一致 */
  justify-content: space-between;
  padding: 0 40px;
  gap: 30px;
  min-height: 150px;  /* 设置最小高度 */
}

/* 响应式:小屏幕时垂直排列 */
@media (max-width: 1024px) {
  .heart-rate-section {
    flex-direction: column;
    align-items: flex-start;
    gap: 20px;
    min-height: auto;
  }
  
  .heart-rate-display {
    width: 100%;
  }
  
  .heart-rate-status {
    width: 100%;
    height: auto;  /* 移除固定高度 */
  }
}

.heart-rate-display {
  display: flex;
  align-items: baseline;
  justify-content: flex-start;
  gap: 15px;
  flex-shrink: 0;
}

.heart-icon {
  font-size: 80px;
  filter: drop-shadow(0 0 10px rgba(255, 0, 51, 0.5));
  transition: all 0.3s;
  display: inline-block;
}

.heart-icon.beating {
  animation: heartbeat 1s ease-in-out infinite;
}

@keyframes heartbeat {
  0%, 100% {
    transform: scale(1);
  }
  10% {
    transform: scale(1.1);
  }
  20% {
    transform: scale(1);
  }
  30% {
    transform: scale(1.1);
  }
  40% {
    transform: scale(1);
  }
}

.bpm-value {
  font-size: 120px;
  font-weight: bold;
  color: #9acd32;
  font-family: var(--font-pixel);
  text-shadow: 0 0 20px rgba(154, 205, 50, 0.5);
  letter-spacing: 4px;
}

.bpm-unit {
  font-size: 18px;
  color: #fff;
  opacity: 0.7;
  margin-left: 5px;
  font-weight: normal;
}

.ecg-section {
  width: 100%;
  max-width: none;
  padding: 0;
}


.ecg-wrapper {
  position: relative;
  height: 350px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.2);
}

.ecg-grid {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image:
    linear-gradient(rgba(255, 255, 0, 0.1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 0, 0.1) 1px, transparent 1px);
  background-size: 20px 20px;
  pointer-events: none;
}

/* 历史记录区域 */
.history-section {
  width: 100%;
  padding: 20px 40px;  /* 与heart-rate-section保持一致的左右边距 */
  background: rgba(255, 255, 255, 0.6);
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 2px solid rgba(255, 0, 51, 0.3);
}

.history-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.clear-btn {
  padding: 6px 12px;
  background: #ff4444;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.3s;
}

.clear-btn:hover {
  background: #cc0000;
  transform: translateY(-1px);
}

.history-list {
  max-height: 300px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 6px;
  border-left: 3px solid #ff0033;
  transition: all 0.3s;
}

.history-item:hover {
  background: rgba(255, 255, 255, 1);
  transform: translateX(5px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.history-time {
  font-size: 14px;
  color: #666;
  font-family: var(--font-mono);
}

.history-bpm {
  font-size: 16px;
  font-weight: bold;
  color: #ff0033;
}

.history-empty {
  text-align: center;
  padding: 40px 20px;
  color: #999;
}

.history-empty p {
  margin: 8px 0;
}

.history-empty .hint {
  font-size: 12px;
  color: #bbb;
}

/* 浅色模式 */
.light-mode .ecg-wrapper {
  background: rgba(255, 255, 255, 0.5);
  border-color: rgba(0, 0, 0, 0.2);
}

.light-mode .bpm-unit {
  color: #333;
}

/* 悬浮设置按钮 */
.fab-settings {
  position: fixed;
  bottom: 80px;
  right: 20px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ff0033, #ff6b6b);
  color: white;
  border: none;
  box-shadow: 0 4px 12px rgba(255, 0, 51, 0.4);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  z-index: 99;
}

.fab-settings:hover {
  transform: scale(1.1) rotate(90deg);
  box-shadow: 0 6px 20px rgba(255, 0, 51, 0.6);
}

.fab-settings:active {
  transform: scale(0.95);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .main-content {
    padding: 70px 15px 70px 15px;
    gap: 20px;
  }

  .bpm-value {
    font-size: 80px;
  }

  .bpm-unit {
    font-size: 14px;
  }

  .heart-icon {
    font-size: 60px;
  }

  .ecg-wrapper {
    height: 250px;
  }
}

@media (max-width: 480px) {
  .bpm-value {
    font-size: 60px;
  }

  .bpm-unit {
    font-size: 12px;
  }

  .heart-icon {
    font-size: 50px;
  }

  .ecg-wrapper {
    height: 200px;
  }
}
</style>
