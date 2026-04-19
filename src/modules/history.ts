/**
 * 历史记录管理模块
 * 负责心率历史记录的存储、加载、清理等操作
 */

export interface HeartRateRecord {
  bpm: number
  timestamp: number
}

export interface HistoryOptions {
  maxRecords?: number        // 最大记录数
  recordInterval?: number    // 记录间隔(毫秒)
  cacheDuration?: number     // 缓存时长(小时)
  maxCacheDuration?: number  // 最大缓存时长(小时)
}

class HeartRateHistoryManager {
  private records: HeartRateRecord[] = []
  private lastRecordTime: number = 0
  
  // 配置选项
  private maxRecords: number
  private recordInterval: number
  private cacheDuration: number
  private maxCacheDuration: number
  
  constructor(options: HistoryOptions = {}) {
    this.maxRecords = options.maxRecords || 50
    this.recordInterval = options.recordInterval || 5000
    this.cacheDuration = options.cacheDuration || 24
    this.maxCacheDuration = options.maxCacheDuration || 48
    
    // 从localStorage加载历史记录
    this.loadFromStorage()
  }
  
  /**
   * 尝试添加一条心率记录
   * @param bpm 心率值
   * @returns 是否成功添加记录
   */
  tryAddRecord(bpm: number): boolean {
    const now = Date.now()
    
    // 检查是否满足记录条件
    if (now - this.lastRecordTime < this.recordInterval || bpm <= 0) {
      return false
    }
    
    // 添加新记录
    this.records.push({
      bpm,
      timestamp: now
    })
    
    // 限制记录数量
    if (this.records.length > this.maxRecords) {
      this.records.shift()
    }
    
    this.lastRecordTime = now
    
    // 保存到localStorage
    this.saveToStorage()
    
    console.log('[历史记录] 已保存，当前记录数:', this.records.length)
    return true
  }
  
  /**
   * 获取所有历史记录
   */
  getRecords(): HeartRateRecord[] {
    return [...this.records]
  }
  
  /**
   * 获取倒序的记录列表（最新的在前）
   */
  getRecordsReversed(): HeartRateRecord[] {
    return [...this.records].reverse()
  }
  
  /**
   * 清空所有历史记录
   */
  clearRecords(): void {
    console.log('[历史记录] 清空所有记录')
    this.records = []
    localStorage.removeItem('heartRateHistory')
  }
  
  /**
   * 更新缓存时长设置
   * @param hours 缓存时长(小时)
   */
  updateCacheDuration(hours: number): boolean {
    if (hours >= 1 && hours <= this.maxCacheDuration) {
      this.cacheDuration = hours
      try {
        localStorage.setItem('cacheDuration', String(hours))
        // 立即清理过期记录
        this.cleanExpiredRecords()
        this.saveToStorage()
        console.log('[缓存设置] 已更新为', hours, '小时')
        return true
      } catch (error) {
        console.error('保存缓存设置失败:', error)
        return false
      }
    } else {
      alert(`缓存时长必须在1-${this.maxCacheDuration}小时之间！`)
      return false
    }
  }
  
  /**
   * 获取当前缓存时长
   */
  getCacheDuration(): number {
    return this.cacheDuration
  }
  
  /**
   * 获取最大缓存时长
   */
  getMaxCacheDuration(): number {
    return this.maxCacheDuration
  }
  
  /**
   * 获取记录间隔
   */
  getRecordInterval(): number {
    return this.recordInterval
  }
  
  /**
   * 获取记录数量
   */
  getCount(): number {
    return this.records.length
  }
  
  /**
   * 格式化时间戳为可读时间
   * @param timestamp 时间戳
   */
  formatTime(timestamp: number): string {
    const date = new Date(timestamp)
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')
    return `${hours}:${minutes}:${seconds}`
  }
  
  /**
   * 保存记录到localStorage
   */
  private saveToStorage(): void {
    try {
      // 先清理过期记录
      this.cleanExpiredRecords()
      
      localStorage.setItem('heartRateHistory', JSON.stringify(this.records))
    } catch (error) {
      console.error('保存历史记录失败:', error)
    }
  }
  
  /**
   * 从localStorage加载记录
   */
  private loadFromStorage(): void {
    try {
      const saved = localStorage.getItem('heartRateHistory')
      if (saved) {
        this.records = JSON.parse(saved)
        // 加载后立即清理过期记录
        this.cleanExpiredRecords()
        console.log('[历史记录] 已加载', this.records.length, '条记录')
      }
    } catch (error) {
      console.error('加载历史记录失败:', error)
    }
    
    // 加载缓存设置
    try {
      const savedCacheDuration = localStorage.getItem('cacheDuration')
      if (savedCacheDuration) {
        const duration = Number(savedCacheDuration)
        if (duration >= 1 && duration <= this.maxCacheDuration) {
          this.cacheDuration = duration
        }
      }
      console.log('[缓存] 加载设置:', this.cacheDuration, '小时')
    } catch (error) {
      console.error('[缓存] 加载设置失败:', error)
    }
  }
  
  /**
   * 清理过期记录
   */
  private cleanExpiredRecords(): void {
    const now = Date.now()
    const maxAge = this.cacheDuration * 60 * 60 * 1000 // 转换为毫秒
    
    const beforeCount = this.records.length
    this.records = this.records.filter(record => {
      return (now - record.timestamp) < maxAge
    })
    
    const removedCount = beforeCount - this.records.length
    if (removedCount > 0) {
      console.log('[缓存清理] 已删除', removedCount, '条过期记录')
    }
  }
}

// 导出单例实例
export const historyManager = new HeartRateHistoryManager()

// 也导出类以便需要时创建新实例
export default HeartRateHistoryManager
