/**
 * 心跳值管理模块
 * 负责心率值的处理、预警检测等功能
 */

export interface AlertSettings {
  enabled: boolean
  highThreshold: number
  lowThreshold: number
}

export type AudioType = 'sine' | 'square' | 'triangle' | 'sawtooth'

export type AlertCallback = (type: 'high' | 'low', message: string) => void

class HeartRateManager {
  private currentBpm: number = 0
  private lastAlertTime: number = 0
  
  // 音频设置
  private audioEnabled: boolean = false
  private audioType: AudioType = 'sine'
  
  // 预警设置
  private alertSettings: AlertSettings = {
    enabled: false,
    highThreshold: 100,
    lowThreshold: 50
  }
  
  private readonly alertInterval: number = 5000 // 预警间隔5秒
  
  // 音频上下文
  private audioContext: AudioContext | null = null
  
  // 预警回调函数
  private onAlertTriggered: AlertCallback | null = null
  
  constructor() {
    this.loadSettings()
  }
  
  /**
   * 设置预警回调函数
   * @param callback 回调函数
   */
  setAlertCallback(callback: AlertCallback | null): void {
    this.onAlertTriggered = callback
  }
  
  /**
   * 更新当前心率值
   * @param bpm 心率值
   */
  updateBpm(bpm: number): void {
    this.currentBpm = bpm
    console.log('[心率] 当前心率:', bpm, 'BPM')
    
    // 检查预警
    this.checkAlert(bpm)
    
    // 播放音效（如果启用）
    if (this.audioEnabled && bpm > 0) {
      this.playHeartbeatSound(bpm)
    }
  }
  
  /**
   * 获取当前心率值
   */
  getBpm(): number {
    return this.currentBpm
  }
  
  /**
   * 切换音频开关
   * @param enabled 是否启用音频
   */
  toggleAudio(enabled: boolean): void {
    this.audioEnabled = enabled
    try {
      localStorage.setItem('audioEnabled', String(enabled))
      console.log('[音频] 已', enabled ? '启用' : '禁用')
    } catch (error) {
      console.error('保存音频设置失败:', error)
    }
  }
  
  /**
   * 获取音频开关状态
   */
  isAudioEnabled(): boolean {
    return this.audioEnabled
  }
  
  /**
   * 更新音频类型
   * @param type 音频类型
   */
  updateAudioType(type: AudioType): void {
    this.audioType = type
    try {
      localStorage.setItem('audioType', type)
      console.log('[音频] 音效类型已更新为:', type)
    } catch (error) {
      console.error('保存音频类型失败:', error)
    }
  }
  
  /**
   * 获取音频类型
   */
  getAudioType(): AudioType {
    return this.audioType
  }
  
  /**
   * 更新预警设置
   * @param settings 预警设置
   */
  updateAlertSettings(settings: Partial<AlertSettings>): void {
    if (settings.enabled !== undefined) {
      this.alertSettings.enabled = settings.enabled
    }
    if (settings.highThreshold !== undefined) {
      this.alertSettings.highThreshold = settings.highThreshold
    }
    if (settings.lowThreshold !== undefined) {
      this.alertSettings.lowThreshold = settings.lowThreshold
    }
    
    try {
      localStorage.setItem('alertEnabled', String(this.alertSettings.enabled))
      localStorage.setItem('highThreshold', String(this.alertSettings.highThreshold))
      localStorage.setItem('lowThreshold', String(this.alertSettings.lowThreshold))
      console.log('[预警] 设置已更新:', this.alertSettings)
    } catch (error) {
      console.error('保存预警设置失败:', error)
    }
  }
  
  /**
   * 获取预警设置
   */
  getAlertSettings(): AlertSettings {
    return { ...this.alertSettings }
  }
  
  /**
   * 播放心跳音效
   * @param heartRate 心率值
   */
  private playHeartbeatSound(heartRate: number): void {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    }
    
    const oscillator = this.audioContext.createOscillator()
    const gainNode = this.audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(this.audioContext.destination)
    
    // 根据心率调整频率
    const frequency = 600 + (heartRate - 60) * 2
    oscillator.frequency.value = frequency
    oscillator.type = this.audioType
    
    // 根据音效类型调整音量和时长
    let volume = 0.3
    let duration = 0.1
    
    if (this.audioType === 'square') {
      volume = 0.2
      duration = 0.08
    } else if (this.audioType === 'triangle') {
      volume = 0.35
      duration = 0.12
    } else if (this.audioType === 'sawtooth') {
      volume = 0.25
      duration = 0.09
    }
    
    gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration)
    
    oscillator.start(this.audioContext.currentTime)
    oscillator.stop(this.audioContext.currentTime + duration)
  }
  
  /**
   * 播放预警音效
   * @param type 预警类型
   */
  private playAlertSound(type: 'high' | 'low'): void {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    }
    
    const oscillator = this.audioContext.createOscillator()
    const gainNode = this.audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(this.audioContext.destination)
    
    // 预警音效：高频急促声音
    oscillator.type = 'square'
    
    if (type === 'high') {
      oscillator.frequency.value = 1000 // 过高：高频
    } else {
      oscillator.frequency.value = 400  // 过低：低频
    }
    
    gainNode.gain.setValueAtTime(0.4, this.audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3)
    
    oscillator.start(this.audioContext.currentTime)
    oscillator.stop(this.audioContext.currentTime + 0.3)
  }
  
  /**
   * 检查心率预警
   * @param heartRate 心率值
   * @returns 预警信息，如果没有预警则返回null
   */
  private checkAlert(heartRate: number): { type: 'high' | 'low', message: string } | null {
    if (!this.alertSettings.enabled || heartRate <= 0) {
      return null
    }
    
    const now = Date.now()
    if (now - this.lastAlertTime < this.alertInterval) {
      return null // 避免频繁报警
    }
    
    let alertType: 'high' | 'low' | null = null
    let alertMessage = ''
    
    if (heartRate > this.alertSettings.highThreshold) {
      alertType = 'high'
      alertMessage = `⚠️ 心率过高警告！当前心率：${heartRate} BPM（阈值：${this.alertSettings.highThreshold} BPM）`
    } else if (heartRate < this.alertSettings.lowThreshold) {
      alertType = 'low'
      alertMessage = `⚠️ 心率过低警告！当前心率：${heartRate} BPM（阈值：${this.alertSettings.lowThreshold} BPM）`
    }
    
    if (alertType && alertMessage) {
      console.warn('[预警]', alertMessage)
      
      // 播放预警音效
      this.playAlertSound(alertType)
      
      // 显示浏览器通知（如果允许）
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('心率预警', {
          body: alertMessage,
          icon: '/favicon.ico'
        })
      }
      
      // 更新最后预警时间
      this.lastAlertTime = now
      
      // 触发回调（用于UI特效等）
      if (this.onAlertTriggered) {
        this.onAlertTriggered(alertType, alertMessage)
      }
      
      return { type: alertType, message: alertMessage }
    }
    
    return null
  }
  
  /**
   * 加载设置
   */
  private loadSettings(): void {
    // 加载音频设置
    try {
      const savedAudioEnabled = localStorage.getItem('audioEnabled')
      if (savedAudioEnabled !== null) {
        this.audioEnabled = savedAudioEnabled === 'true'
      }
      
      const savedAudioType = localStorage.getItem('audioType')
      if (savedAudioType && ['sine', 'square', 'triangle', 'sawtooth'].includes(savedAudioType)) {
        this.audioType = savedAudioType as AudioType
      }
      
      console.log('[音频] 加载设置:', { enabled: this.audioEnabled, type: this.audioType })
    } catch (error) {
      console.error('[音频] 加载设置失败:', error)
    }
    
    // 加载预警设置
    try {
      const savedAlertEnabled = localStorage.getItem('alertEnabled')
      if (savedAlertEnabled !== null) {
        this.alertSettings.enabled = savedAlertEnabled === 'true'
      }
      
      const savedHighThreshold = localStorage.getItem('highThreshold')
      if (savedHighThreshold) {
        this.alertSettings.highThreshold = Number(savedHighThreshold)
      }
      
      const savedLowThreshold = localStorage.getItem('lowThreshold')
      if (savedLowThreshold) {
        this.alertSettings.lowThreshold = Number(savedLowThreshold)
      }
      
      console.log('[预警] 加载设置:', this.alertSettings)
    } catch (error) {
      console.error('[预警] 加载设置失败:', error)
    }
  }
  
  /**
   * 清理资源
   */
  cleanup(): void {
    if (this.audioContext) {
      this.audioContext.close()
      console.log('[音频] AudioContext 已关闭')
    }
  }
}

// 导出单例实例
export const heartRateManager = new HeartRateManager()

// 也导出类以便需要时创建新实例
export default HeartRateManager
