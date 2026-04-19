<script setup lang="ts">
import { ref, onMounted } from 'vue'
import * as XLSX from 'xlsx'

export interface HeartRateRecord {
  bpm: number
  timestamp: number
}

interface Props {
  maxRecords?: number        // 最大记录数
  recordInterval?: number    // 记录间隔(毫秒)
  cacheDuration?: number     // 缓存时长(小时)
  maxCacheDuration?: number  // 最大缓存时长(小时)
}

const props = withDefaults(defineProps<Props>(), {
  maxRecords: 720,           // 最大记录数 (1小时，每分钟1条)
  recordInterval: 60000,     // 记录间隔(毫秒) - 改为60秒
  cacheDuration: 24,
  maxCacheDuration: 48
})

const emit = defineEmits<{
  'record-added': [record: HeartRateRecord]
  'records-cleared': []
  'cache-duration-updated': [hours: number]
}>()

// 状态
const records = ref<HeartRateRecord[]>([])
const lastRecordTime = ref<number>(0)
const lastRecordedBpm = ref<number>(0)  // 上次记录的心率值
const currentCacheDuration = ref<number>(props.cacheDuration)

// 尝试添加一条心率记录
const tryAddRecord = (bpm: number): boolean => {
  const now = Date.now()

  // 检查是否满足记录条件
  if (bpm <= 0) {
    return false
  }

  // 智能记录策略:
  // 1. 首次记录
  // 2. 距离上次记录超过间隔时间
  // 3. 心率变化超过阈值(5 BPM)
  const timeCondition = (now - lastRecordTime.value) >= props.recordInterval
  const bpmChangeCondition = Math.abs(bpm - lastRecordedBpm.value) >= 5
  
  if (!timeCondition && !bpmChangeCondition) {
    return false
  }

  // 添加新记录
  const newRecord: HeartRateRecord = {
    bpm,
    timestamp: now
  }

  records.value.push(newRecord)

  // 限制记录数量
  if (records.value.length > props.maxRecords) {
    records.value.shift()
  }

  lastRecordTime.value = now
  lastRecordedBpm.value = bpm

  // 保存到localStorage
  saveToStorage()

  // 触发事件
  emit('record-added', newRecord)

  console.log('[历史记录] 已保存，当前记录数:', records.value.length, 'BPM:', bpm)
  return true
}

// 获取倒序的记录列表（最新的在前）
const getRecordsReversed = (): HeartRateRecord[] => {
  return [...records.value].reverse()
}

// 清空所有历史记录
const clearRecords = () => {
  console.log('[历史记录] 清空所有记录')
  records.value = []
  localStorage.removeItem('heartRateHistory')
  emit('records-cleared')
}

// 导出记录为Excel
const exportToExcel = () => {
  if (records.value.length === 0) {
    alert('暂无记录可导出！')
    return
  }

  try {
    // 准备数据
    const exportData = records.value.map(record => ({
      '时间': formatTime(record.timestamp),
      '日期': new Date(record.timestamp).toLocaleDateString('zh-CN'),
      '心率(BPM)': record.bpm,
      '时间戳': new Date(record.timestamp).toISOString()
    }))

    // 创建工作簿
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.json_to_sheet(exportData)

    // 设置列宽
    worksheet['!cols'] = [
      { wch: 12 }, // 时间
      { wch: 12 }, // 日期
      { wch: 12 }, // 心率
      { wch: 25 }  // 时间戳
    ]

    // 添加工作表到工作簿
    XLSX.utils.book_append_sheet(workbook, worksheet, '心率记录')

    // 生成文件名（包含当前日期时间）
    const now = new Date()
    const fileName = `心率记录_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}.xlsx`

    // 下载文件
    XLSX.writeFile(workbook, fileName)

    console.log('[导出] 成功导出', records.value.length, '条记录')
    alert(`✅ 成功导出 ${records.value.length} 条心率记录！`)
  } catch (error) {
    console.error('[导出] 失败:', error)
    alert('❌ 导出失败，请重试！')
  }
}

// 更新缓存时长设置
const updateCacheDuration = (hours: number): boolean => {
  if (hours >= 1 && hours <= props.maxCacheDuration) {
    currentCacheDuration.value = hours
    try {
      localStorage.setItem('cacheDuration', String(hours))
      // 立即清理过期记录
      cleanExpiredRecords()
      saveToStorage()
      emit('cache-duration-updated', hours)
      console.log('[缓存设置] 已更新为', hours, '小时')
      return true
    } catch (error) {
      console.error('保存缓存设置失败:', error)
      return false
    }
  } else {
    alert(`缓存时长必须在1-${props.maxCacheDuration}小时之间！`)
    return false
  }
}

// 格式化时间戳为可读时间
const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp)
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${hours}:${minutes}:${seconds}`
}

// 获取记录数量
const getCount = (): number => {
  return records.value.length
}

// 保存记录到localStorage
const saveToStorage = () => {
  try {
    // 先清理过期记录
    cleanExpiredRecords()

    localStorage.setItem('heartRateHistory', JSON.stringify(records.value))
  } catch (error) {
    console.error('保存历史记录失败:', error)
  }
}

// 清理过期记录
const cleanExpiredRecords = () => {
  const now = Date.now()
  const maxAge = currentCacheDuration.value * 60 * 60 * 1000 // 转换为毫秒

  const beforeCount = records.value.length
  records.value = records.value.filter(record => {
    return (now - record.timestamp) < maxAge
  })

  const removedCount = beforeCount - records.value.length
  if (removedCount > 0) {
    console.log('[缓存清理] 已删除', removedCount, '条过期记录')
  }
}

// 从localStorage加载记录
const loadFromStorage = () => {
  try {
    const saved = localStorage.getItem('heartRateHistory')
    if (saved) {
      records.value = JSON.parse(saved)
      // 加载后立即清理过期记录
      cleanExpiredRecords()
      console.log('[历史记录] 已加载', records.value.length, '条记录')
    }
  } catch (error) {
    console.error('加载历史记录失败:', error)
  }

  // 加载缓存设置
  try {
    const savedCacheDuration = localStorage.getItem('cacheDuration')
    if (savedCacheDuration) {
      const duration = Number(savedCacheDuration)
      if (duration >= 1 && duration <= props.maxCacheDuration) {
        currentCacheDuration.value = duration
      }
    }
    console.log('[缓存] 加载设置:', currentCacheDuration.value, '小时')
  } catch (error) {
    console.error('[缓存] 加载设置失败:', error)
  }
}

// 组件挂载时加载数据
onMounted(() => {
  loadFromStorage()
})

// 暴露方法给父组件
defineExpose({
  tryAddRecord,
  clearRecords,
  exportToExcel,
  updateCacheDuration,
  getRecordsReversed,
  formatTime,
  getCount,
  getMaxRecords: () => props.maxRecords,  // 新增：获取最大记录数
  records
})
</script>

<template>
  <div class="history-manager">
    <slot
      :records="getRecordsReversed()"
      :count="getCount()"
      :clear-records="clearRecords"
      :format-time="formatTime"
    >
      <!-- 默认插槽内容 -->
      <div class="history-section">
        <div class="history-header">
          <h3>💓 历史心率记录（每5秒记录一次）</h3>
          <div class="header-actions">
            <button v-if="getCount() > 0" class="export-btn" @click="exportToExcel">📊 导出记录</button>
            <button v-if="getCount() > 0" class="clear-btn" @click="clearRecords">清空记录</button>
          </div>
        </div>
        <div class="history-list" v-if="getCount() > 0">
          <div
            v-for="(record, index) in getRecordsReversed()"
            :key="index"
            class="history-item"
          >
            <span class="history-time">{{ formatTime(record.timestamp) }}</span>
            <span class="history-bpm">{{ record.bpm }} 次/分</span>
          </div>
        </div>
        <div class="history-empty" v-else>
          <p>暂无历史记录</p>
          <p class="hint">连接设备后，每{{ recordInterval / 1000 }}秒自动记录一次心率数据</p>
        </div>
      </div>
    </slot>
  </div>
</template>

<style scoped>
.history-manager {
  width: 100%;
}

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

.header-actions {
  display: flex;
  gap: 8px;
}

.export-btn {
  padding: 6px 12px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.3s;
}

.export-btn:hover {
  background: #45a049;
  transform: translateY(-1px);
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
</style>
