<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

export type AudioType = 'sine' | 'square' | 'triangle' | 'sawtooth'

export interface AlertSettings {
  enabled: boolean
  highThreshold: number
  lowThreshold: number
}

interface Props {
  initialBpm?: number
  defaultAlertSettings?: AlertSettings
}

const props = withDefaults(defineProps<Props>(), {
  initialBpm: 0,
  defaultAlertSettings: () => ({
    enabled: false,
    highThreshold: 100,
    lowThreshold: 50
  })
})

const emit = defineEmits<{
  'bpm-updated': [bpm: number]
  'alert-triggered': [type: 'high' | 'low', message: string]
  'audio-toggled': [enabled: boolean]
  'audio-type-changed': [type: AudioType]
  'alert-settings-updated': [settings: AlertSettings]
}>()

// 状态
const currentBpm = ref<number>(props.initialBpm)
const audioEnabled = ref<boolean>(false)
const audioType = ref<AudioType>('sine')
const alertSettings = ref<AlertSettings>({ ...props.defaultAlertSettings })

// 内部状态
const lastAlertTime = ref<number>(0)
const alertInterval = 5000 // 预警间隔5秒

// 音频上下文
let audioContext: AudioContext | null = null

// 更新当前心率值
const updateBpm = (bpm: number) => {
  currentBpm.value = bpm
  console.log('[心率] 当前心率:', bpm, 'BPM')
  
  // 触发事件
  emit('bpm-updated', bpm)
  
  // 检查预警
  checkAlert(bpm)
  
  // 播放音效（如果启用）
  if (audioEnabled.value && bpm > 0) {
    playHeartbeatSound(bpm)
  }
}

// 获取当前心率值
const getBpm = (): number => {
  return currentBpm.value
}

// 切换音频开关
const toggleAudio = (enabled: boolean) => {
  audioEnabled.value = enabled
  try {
    localStorage.setItem('audioEnabled', String(enabled))
    emit('audio-toggled', enabled)
    console.log('[音频] 已', enabled ? '启用' : '禁用')
  } catch (error) {
    console.error('保存音频设置失败:', error)
  }
}

// 获取音频开关状态
const isAudioEnabled = (): boolean => {
  return audioEnabled.value
}

// 更新音频类型
const updateAudioType = (type: AudioType) => {
  audioType.value = type
  try {
    localStorage.setItem('audioType', type)
    emit('audio-type-changed', type)
    console.log('[音频] 音效类型已更新为:', type)
  } catch (error) {
    console.error('保存音频类型失败:', error)
  }
}

// 获取音频类型
const getAudioType = (): AudioType => {
  return audioType.value
}

// 更新预警设置
const updateAlertSettings = (settings: Partial<AlertSettings>) => {
  if (settings.enabled !== undefined) {
    alertSettings.value.enabled = settings.enabled
  }
  if (settings.highThreshold !== undefined) {
    alertSettings.value.highThreshold = settings.highThreshold
  }
  if (settings.lowThreshold !== undefined) {
    alertSettings.value.lowThreshold = settings.lowThreshold
  }
  
  try {
    localStorage.setItem('alertEnabled', String(alertSettings.value.enabled))
    localStorage.setItem('highThreshold', String(alertSettings.value.highThreshold))
    localStorage.setItem('lowThreshold', String(alertSettings.value.lowThreshold))
    emit('alert-settings-updated', { ...alertSettings.value })
    console.log('[预警] 设置已更新:', alertSettings.value)
  } catch (error) {
    console.error('保存预警设置失败:', error)
  }
}

// 获取预警设置
const getAlertSettings = (): AlertSettings => {
  return { ...alertSettings.value }
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
  oscillator.type = audioType.value
  
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
const checkAlert = (heartRate: number) => {
  if (!alertSettings.value.enabled || heartRate <= 0) {
    return
  }
  
  const now = Date.now()
  if (now - lastAlertTime.value < alertInterval) {
    return // 避免频繁报警
  }
  
  let alertType: 'high' | 'low' | null = null
  let alertMessage = ''
  
  if (heartRate > alertSettings.value.highThreshold) {
    alertType = 'high'
    alertMessage = `⚠️ 心率过高警告！当前心率：${heartRate} BPM（阈值：${alertSettings.value.highThreshold} BPM）`
  } else if (heartRate < alertSettings.value.lowThreshold) {
    alertType = 'low'
    alertMessage = `⚠️ 心率过低警告！当前心率：${heartRate} BPM（阈值：${alertSettings.value.lowThreshold} BPM）`
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
    
    // 触发事件
    emit('alert-triggered', alertType, alertMessage)
    
    // 更新最后预警时间
    lastAlertTime.value = now
  }
}

// 加载设置
const loadSettings = () => {
  // 加载音频设置
  try {
    const savedAudioEnabled = localStorage.getItem('audioEnabled')
    if (savedAudioEnabled !== null) {
      audioEnabled.value = savedAudioEnabled === 'true'
    }
    
    const savedAudioType = localStorage.getItem('audioType')
    if (savedAudioType && ['sine', 'square', 'triangle', 'sawtooth'].includes(savedAudioType)) {
      audioType.value = savedAudioType as AudioType
    }
    
    console.log('[音频] 加载设置:', { enabled: audioEnabled.value, type: audioType.value })
  } catch (error) {
    console.error('[音频] 加载设置失败:', error)
  }
  
  // 加载预警设置
  try {
    const savedAlertEnabled = localStorage.getItem('alertEnabled')
    if (savedAlertEnabled !== null) {
      alertSettings.value.enabled = savedAlertEnabled === 'true'
    }
    
    const savedHighThreshold = localStorage.getItem('highThreshold')
    if (savedHighThreshold) {
      alertSettings.value.highThreshold = Number(savedHighThreshold)
    }
    
    const savedLowThreshold = localStorage.getItem('lowThreshold')
    if (savedLowThreshold) {
      alertSettings.value.lowThreshold = Number(savedLowThreshold)
    }
    
    console.log('[预警] 加载设置:', alertSettings.value)
  } catch (error) {
    console.error('[预警] 加载设置失败:', error)
  }
}

// 清理资源
const cleanup = () => {
  if (audioContext) {
    audioContext.close()
    console.log('[音频] AudioContext 已关闭')
  }
}

// 组件挂载时加载设置
onMounted(() => {
  loadSettings()
})

// 组件卸载时清理资源
onUnmounted(() => {
  cleanup()
})

// 暴露方法给父组件
defineExpose({
  updateBpm,
  getBpm,
  toggleAudio,
  isAudioEnabled,
  updateAudioType,
  getAudioType,
  updateAlertSettings,
  getAlertSettings,
  cleanup,
  currentBpm,
  audioEnabled,
  audioType,
  alertSettings
})
</script>

<template>
  <div class="heart-rate-manager">
    <slot
      :bpm="currentBpm"
      :audio-enabled="audioEnabled"
      :audio-type="audioType"
      :alert-settings="alertSettings"
      :update-bpm="updateBpm"
      :toggle-audio="toggleAudio"
      :update-audio-type="updateAudioType"
      :update-alert-settings="updateAlertSettings"
    >
      <!-- 默认插槽内容 - 通常不需要显示，只是提供功能 -->
      <div class="heart-rate-info" v-if="false">
        <p>当前心率: {{ currentBpm }} BPM</p>
        <p>音频: {{ audioEnabled ? '开启' : '关闭' }}</p>
        <p>音效类型: {{ audioType }}</p>
        <p>预警: {{ alertSettings.enabled ? '开启' : '关闭' }}</p>
      </div>
    </slot>
  </div>
</template>

<style scoped>
.heart-rate-manager {
  display: none; /* 这个组件主要是功能性的，不显示UI */
}

.heart-rate-info {
  padding: 10px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  font-size: 12px;
}
</style>
