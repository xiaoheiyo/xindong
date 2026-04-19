<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import ECGCanvas from './components/ECGCanvas.vue'
import SettingsPanel from './components/SettingsPanel.vue'

// 状态管理
const isConnected = ref(false)
const isConnecting = ref(false)
const bpm = ref(0)
const statusText = ref('未连接')
const showSettings = ref(false)
const device = ref<BluetoothDevice | null>(null)
const characteristic = ref<BluetoothRemoteGATTCharacteristic | null>(null)


// 音频设置
const audioEnabled = ref(false)
const audioType = ref<'sine' | 'square' | 'triangle' | 'sawtooth'>('sine') // 默认正弦波

// 预警设置
const alertEnabled = ref(false)
const highThreshold = ref(100) // 心率过高阈值
const lowThreshold = ref(50)   // 心率过低阈值
let lastAlertTime = 0
const alertInterval = 5000 // 预警间隔5秒，避免频繁报警

// 历史记录
interface HeartRateRecord {
  bpm: number
  timestamp: number
}
const historyRecords = ref<HeartRateRecord[]>([])
const maxHistoryRecords = 50 // 最多保存50条记录
let lastRecordTime = 0
const recordInterval = 5000 // 每5秒记录一次

// 缓存设置
const cacheDuration = ref(24) // 默认缓存24小时（单位：小时）
const maxCacheDuration = 48 // 最大缓存48小时

// 音频上下文
let audioContext: AudioContext | null = null

// 计算样式类
const bodyClass = computed(() => {
  return 'light-mode'
})

// 连接蓝牙设备
const connectDevice = async () => {
  if (isConnected.value) {
    console.log('[蓝牙] 断开连接')
    disconnectDevice()
    return
  }

  try {
    isConnecting.value = true
    statusText.value = '连接中...'
    console.log('[蓝牙] 开始搜索设备...')

    // 请求蓝牙设备
    const selectedDevice = await navigator.bluetooth!.requestDevice({
      filters: [{ services: ['heart_rate'] }]
    })

    console.log('[蓝牙] 选择设备:', selectedDevice.name || selectedDevice.id)
    device.value = selectedDevice
    const server = await selectedDevice.gatt?.connect()

    if (!server) {
      throw new Error('无法连接到GATT服务器')
    }

    console.log('[蓝牙] GATT服务器连接成功')
    const service = await server.getPrimaryService('heart_rate')
    console.log('[蓝牙] 获取心率服务成功')
    const char = await service.getCharacteristic('heart_rate_measurement')
    console.log('[蓝牙] 获取心率特征值成功')

    characteristic.value = char

    // 启动通知
    await char.startNotifications()
    console.log('[蓝牙] 通知已启动')
    char.addEventListener('characteristicvaluechanged', handleHeartRateChange)

    isConnected.value = true
    statusText.value = '已连接'
    console.log('[蓝牙] 连接成功！')

    // 监听断开连接
    selectedDevice.addEventListener('gattserverdisconnected', onDisconnected)

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '未知错误'
    console.error('[蓝牙] 连接失败:', error)
    statusText.value = '连接失败'
    alert(`连接失败: ${errorMessage}`)
  } finally {
    isConnecting.value = false
  }
}

// 处理心率数据变化
const handleHeartRateChange = (event: Event) => {
  const target = event.target as BluetoothRemoteGATTCharacteristic
  const value = target.value!
  const flags = value.getUint8(0)
  const rate16Bits = flags & 0x1

  let heartRate: number
  if (rate16Bits) {
    heartRate = value.getUint16(1, true)
  } else {
    heartRate = value.getUint8(1)
  }

  bpm.value = heartRate
  console.log('[心率] 当前心率:', heartRate, 'BPM')

  // 记录历史数据
  const now = Date.now()
  if (now - lastRecordTime >= recordInterval && heartRate > 0) {
    historyRecords.value.push({
      bpm: heartRate,
      timestamp: now
    })

    // 限制记录数量
    if (historyRecords.value.length > maxHistoryRecords) {
      historyRecords.value.shift()
    }

    lastRecordTime = now

    // 保存到localStorage
    saveHistoryToStorage()
    console.log('[历史记录] 已保存，当前记录数:', historyRecords.value.length)
  }

  // 播放音效（如果启用）
  if (audioEnabled.value && heartRate > 0) {
    playHeartbeatSound(heartRate)
  }
}

// 播放心跳音效
const playHeartbeatSound = (heartRate: number) => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
  }

  const oscillator = audioContext.createOscillator()
  const gainNode = audioContext.createGain()

  oscillator.connect(gainNode)
  gainNode.connect(audioContext.destination)

  // 根据心率调整频率
  const frequency = 600 + (heartRate - 60) * 2
  oscillator.frequency.value = frequency
  oscillator.type = audioType.value // 使用选择的音效类型

  // 根据音效类型调整音量和时长
  let volume = 0.3
  let duration = 0.1

  if (audioType.value === 'square') {
    volume = 0.2
    duration = 0.08
  } else if (audioType.value === 'triangle') {
    volume = 0.35
    duration = 0.12
  } else if (audioType.value === 'sawtooth') {
    volume = 0.25
    duration = 0.09
  }

  gainNode.gain.setValueAtTime(volume, audioContext.currentTime)
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration)

  oscillator.start(audioContext.currentTime)
  oscillator.stop(audioContext.currentTime + duration)
}

// 播放预警音效
const playAlertSound = (type: 'high' | 'low') => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
  }

  const oscillator = audioContext.createOscillator()
  const gainNode = audioContext.createGain()

  oscillator.connect(gainNode)
  gainNode.connect(audioContext.destination)

  // 预警音效：高频急促声音
  oscillator.type = 'square'
  
  if (type === 'high') {
    oscillator.frequency.value = 1000 // 过高：高频
  } else {
    oscillator.frequency.value = 400  // 过低：低频
  }

  gainNode.gain.setValueAtTime(0.4, audioContext.currentTime)
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)

  oscillator.start(audioContext.currentTime)
  oscillator.stop(audioContext.currentTime + 0.3)
}

// 检查心率预警
const checkHeartRateAlert = (heartRate: number) => {
  if (!alertEnabled.value || heartRate <= 0) return

  const now = Date.now()
  if (now - lastAlertTime < alertInterval) return // 避免频繁报警

  let alertType: 'high' | 'low' | null = null
  let alertMessage = ''

  if (heartRate > highThreshold.value) {
    alertType = 'high'
    alertMessage = `⚠️ 心率过高警告！当前心率：${heartRate} BPM（阈值：${highThreshold.value} BPM）`
  } else if (heartRate < lowThreshold.value) {
    alertType = 'low'
    alertMessage = `⚠️ 心率过低警告！当前心率：${heartRate} BPM（阈值：${lowThreshold.value} BPM）`
  }

  if (alertType && alertMessage) {
    console.warn('[预警]', alertMessage)
    
    // 播放预警音效
    playAlertSound(alertType)
    
    // 显示浏览器通知（如果允许）
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('心率预警', {
        body: alertMessage,
        icon: '/favicon.ico'
      })
    }
    
    // 更新最后预警时间
    lastAlertTime = now
  }
}

// 断开连接
const disconnectDevice = () => {
  if (device.value && device.value.gatt?.connected) {
    device.value.gatt.disconnect()
  }
  onDisconnected()
}

// 断开连接处理
const onDisconnected = () => {
  console.log('[蓝牙] 设备已断开')
  isConnected.value = false
  statusText.value = '未连接'
  bpm.value = 0
  device.value = null
  characteristic.value = null
}

// 保存历史记录到localStorage
const saveHistoryToStorage = () => {
  try {
    // 先清理过期记录
    cleanExpiredRecords()
    
    localStorage.setItem('heartRateHistory', JSON.stringify(historyRecords.value))
    console.log('[历史记录] 已保存，当前记录数:', historyRecords.value.length)
  } catch (error) {
    console.error('保存历史记录失败:', error)
  }
}

// 清理过期记录
const cleanExpiredRecords = () => {
  const now = Date.now()
  const maxAge = cacheDuration.value * 60 * 60 * 1000 // 转换为毫秒
  
  const beforeCount = historyRecords.value.length
  historyRecords.value = historyRecords.value.filter(record => {
    return (now - record.timestamp) < maxAge
  })
  
  const removedCount = beforeCount - historyRecords.value.length
  if (removedCount > 0) {
    console.log('[缓存清理] 已删除', removedCount, '条过期记录')
  }
}

// 更新缓存时长设置
const updateCacheDuration = (hours: number) => {
  if (hours >= 1 && hours <= maxCacheDuration) {
    cacheDuration.value = hours
    try {
      localStorage.setItem('cacheDuration', String(hours))
      // 立即清理过期记录
      cleanExpiredRecords()
      saveHistoryToStorage()
      console.log('[缓存设置] 已更新为', hours, '小时')
    } catch (error) {
      console.error('保存缓存设置失败:', error)
    }
  } else {
    alert(`缓存时长必须在1-${maxCacheDuration}小时之间！`)
  }
}

// 从localStorage加载历史记录
const loadHistoryFromStorage = () => {
  try {
    const saved = localStorage.getItem('heartRateHistory')
    if (saved) {
      historyRecords.value = JSON.parse(saved)
      // 加载后立即清理过期记录
      cleanExpiredRecords()
    }
  } catch (error) {
    console.error('加载历史记录失败:', error)
  }
}

// 清空历史记录
const clearHistory = () => {
  console.log('[历史记录] 清空所有记录')
  historyRecords.value = []
  localStorage.removeItem('heartRateHistory')
}

// 格式化时间
const formatTime = (timestamp: number) => {
  const date = new Date(timestamp)
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${hours}:${minutes}:${seconds}`
}

// 切换设置面板
const toggleSettings = () => {
  showSettings.value = !showSettings.value
}


// 更新音频类型
const updateAudioType = (type: 'sine' | 'square' | 'triangle' | 'sawtooth') => {
  audioType.value = type
  // 保存到localStorage
  try {
    localStorage.setItem('audioType', type)
  } catch (error) {
    console.error('保存音频类型失败:', error)
  }
}

// 更新预警设置
const updateAlertSettings = (enabled: boolean, high?: number, low?: number) => {
  alertEnabled.value = enabled
  if (high !== undefined) highThreshold.value = high
  if (low !== undefined) lowThreshold.value = low
  
  try {
    localStorage.setItem('alertEnabled', String(enabled))
    if (high !== undefined) localStorage.setItem('highThreshold', String(high))
    if (low !== undefined) localStorage.setItem('lowThreshold', String(low))
    console.log('[预警] 设置已更新:', { enabled, high, low })
  } catch (error) {
    console.error('保存预警设置失败:', error)
  }
}

onMounted(() => {
  console.log('[应用] 心动心率监测系统启动')
  console.log('[应用] Vue版本:', '3.x')

  // 检查浏览器是否支持Web Bluetooth
  if (!navigator.bluetooth) {
    console.warn('[警告] 浏览器不支持Web Bluetooth API')
    alert('您的浏览器不支持Web Bluetooth API，请使用Chrome或Edge浏览器')
  } else {
    console.log('[系统] Web Bluetooth API 可用')
  }

  // 加载历史记录
  loadHistoryFromStorage()
  console.log('[历史记录] 已加载', historyRecords.value.length, '条记录')

  // 加载音频类型设置
  try {
    const savedAudioType = localStorage.getItem('audioType')
    if (savedAudioType && ['sine', 'square', 'triangle', 'sawtooth'].includes(savedAudioType)) {
      audioType.value = savedAudioType as 'sine' | 'square' | 'triangle' | 'sawtooth'
      console.log('[音频] 加载音效类型:', audioType.value)
    }
  } catch (error) {
    console.error('[音频] 加载音效类型失败:', error)
  }

  // 加载预警设置
  try {
    const savedAlertEnabled = localStorage.getItem('alertEnabled')
    if (savedAlertEnabled !== null) {
      alertEnabled.value = savedAlertEnabled === 'true'
    }
    
    const savedHighThreshold = localStorage.getItem('highThreshold')
    if (savedHighThreshold) {
      highThreshold.value = Number(savedHighThreshold)
    }
    
    const savedLowThreshold = localStorage.getItem('lowThreshold')
    if (savedLowThreshold) {
      lowThreshold.value = Number(savedLowThreshold)
    }
    
    console.log('[预警] 加载设置:', { 
      enabled: alertEnabled.value, 
      high: highThreshold.value, 
      low: lowThreshold.value 
    })
  } catch (error) {
    console.error('[预警] 加载设置失败:', error)
  }

  // 加载缓存设置
  try {
    const savedCacheDuration = localStorage.getItem('cacheDuration')
    if (savedCacheDuration) {
      const duration = Number(savedCacheDuration)
      if (duration >= 1 && duration <= maxCacheDuration) {
        cacheDuration.value = duration
      }
    }
    console.log('[缓存] 加载设置:', cacheDuration.value, '小时')
  } catch (error) {
    console.error('[缓存] 加载设置失败:', error)
  }

  // 请求通知权限
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission()
  }
})

onUnmounted(() => {
  console.log('[应用] 组件卸载，清理资源')
  disconnectDevice()
  if (audioContext) {
    audioContext.close()
    console.log('[音频] AudioContext 已关闭')
  }
})
</script>

<template>
  <div :class="bodyClass" class="app-container">
    <!-- 顶部控制栏 -->
    <header class="top-bar">
      <div class="brand">
        <div class="logo">💓心动</div>
        <div class="status-indicator" :title="statusText">
          <span class="status-dot" :class="{ connected: isConnected }"></span>
          <span>{{ statusText }}</span>
        </div>
      </div>

      <div class="controls">
        <button
          class="connect-btn"
          @click="connectDevice"
          :disabled="isConnecting"
        >
          {{ isConnecting ? '连接中...' : (isConnected ? '断开连接' : '连接设备') }}
        </button>
      </div>
    </header>

    <!-- 主内容 -->
    <main class="main-content">
      <!-- 心率显示 - 左侧 -->
      <section class="heart-rate-section">
        <div class="heart-rate-display">
          <span class="heart-icon" :class="{ beating: bpm > 0 }">❤️</span>
          <span class="bpm-value">{{ bpm || '--' }}</span>
          <span class="bpm-unit">次/分</span>
        </div>
      </section>

      <!-- ECG 显示 -->
      <section class="ecg-section">
        <div class="ecg-wrapper">
          <div class="ecg-grid"></div>
          <ECGCanvas :bpm="bpm" :is-connected="isConnected" theme-color="#ff0033" />
        </div>
      </section>

      <!-- 历史记录 -->
      <section class="history-section">
        <div class="history-header">
          <h3>💓 历史心率记录</h3>
          <button v-if="historyRecords.length > 0" class="clear-btn" @click="clearHistory">清空记录</button>
        </div>
        <div class="history-list" v-if="historyRecords.length > 0">
          <div
            v-for="(record, index) in historyRecords.slice().reverse()"
            :key="index"
            class="history-item"
          >
            <span class="history-time">{{ formatTime(record.timestamp) }}</span>
            <span class="history-bpm">{{ record.bpm }} 次/分</span>
          </div>
        </div>
        <div class="history-empty" v-else>
          <p>暂无历史记录</p>
          <p class="hint">连接设备后，每5秒自动记录一次心率数据</p>
        </div>
      </section>
    </main>

    <!-- 底部信息 -->
    <footer class="footer">
      <div class="footer-content">
        <div class="warning-info">
          警告：心电图像是心率模拟结果，仅供娱乐，切勿代替医疗器械
        </div>
        <div class="footer-info">
          <a href="https://www.heiu.top" target="_blank">嘿哟博客</a>支持 |
          <a href="https://xt.uomao.top" target="_blank">心跳</a> | 基于
          <a href="https://cn.vitejs.dev/" target="_blank">Vue 3</a>
        </div>
      </div>
    </footer>

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
      @audio-toggle="audioEnabled = $event"
      @audio-type-change="updateAudioType"
      @alert-update="updateAlertSettings"
      @cache-duration-update="updateCacheDuration"
      :audio-enabled="audioEnabled"
      :audio-type="audioType"
      :alert-enabled="alertEnabled"
      :high-threshold="highThreshold"
      :low-threshold="lowThreshold"
      :cache-duration="cacheDuration"
    />
  </div>
</template>

<style scoped>
.app-container {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
}

/* 顶部控制栏 */
.top-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  z-index: 100;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.brand {
  display: flex;
  align-items: center;
  gap: 20px;
}

.logo {
  font-size: 24px;
  font-weight: bold;
  color: #ff0033;
  font-family: 'Orbitron', sans-serif;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #fff;
  font-size: 14px;
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #666;
  transition: all 0.3s;
}

.status-dot.connected {
  background: #00ff00;
  box-shadow: 0 0 10px #00ff00;
}

.controls {
  display: flex;
  align-items: center;
  gap: 15px;
}

.sound-control {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #fff;
  font-size: 14px;
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: .4s;
  border-radius: 24px;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
}

input:checked + .toggle-slider {
  background-color: #ff0033;
}

input:checked + .toggle-slider:before {
  transform: translateX(26px);
}

.connect-btn {
  padding: 8px 16px;
  background: #ff0033;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.connect-btn:hover:not(:disabled) {
  background: #cc0029;
  transform: translateY(-2px);
}

.connect-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 主内容区 */
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
}

.heart-rate-section {
  width: 100%;
  text-align: left;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding-left: 20px;
}

.ecg-section {
  width: 100%;
  max-width: none;
  padding: 0;
}

.heart-rate-display {
  display: flex;
  align-items: baseline;
  justify-content: flex-start;
  gap: 15px;
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
  font-family: 'Press Start 2P', 'Courier New', monospace;
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
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
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
  font-family: 'JetBrains Mono', monospace;
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

/* 底部 */
.footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  padding: 15px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  z-index: 100;
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  text-align: center;
}

.warning-info {
  color: #ffa500;
  font-size: 12px;
  margin-bottom: 8px;
}

.footer-info {
  color: #fff;
  font-size: 12px;
  opacity: 0.7;
}

.footer-info a {
  color: #9acd32;
  text-decoration: none;
  transition: all 0.3s;
}

.footer-info a:hover {
  color: #7ec850;
  text-decoration: underline;
}

/* 浅色模式 */
.light-mode .top-bar,
.light-mode .footer {
  background: rgba(255, 255, 255, 0.9);
  border-color: rgba(0, 0, 0, 0.1);
}

.light-mode .status-indicator,
.light-mode .sound-control {
  color: #333;
}

.light-mode .ecg-wrapper {
  background: rgba(255, 255, 255, 0.5);
  border-color: rgba(0, 0, 0, 0.2);
}

.light-mode .bpm-unit {
  color: #333;
}

.light-mode .footer-info {
  color: #333;
}

.light-mode .footer-info a {
  color: #6abf4b;
}

.light-mode .footer-info a:hover {
  color: #4a9f2b;
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
  .top-bar {
    padding: 0 10px;
  }

  .logo {
    font-size: 18px;
  }

  .connect-btn {
    padding: 6px 12px;
    font-size: 12px;
  }

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
