<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  bpm: number
  isConnected: boolean
}

const props = defineProps<Props>()

// 心跳状况类型
type HeartRateStatus = 'normal' | 'low' | 'high' | 'veryHigh' | 'dangerous'

// 计算心跳状况
const status = computed<HeartRateStatus>(() => {
  if (!props.isConnected || props.bpm === 0) {
    return 'normal'
  }

  if (props.bpm < 50) {
    return 'low'
  } else if (props.bpm >= 50 && props.bpm <= 100) {
    return 'normal'
  } else if (props.bpm > 100 && props.bpm <= 120) {
    return 'high'
  } else if (props.bpm > 120 && props.bpm <= 150) {
    return 'veryHigh'
  } else {
    return 'dangerous'
  }
})

// 状况文本
const statusText = computed(() => {
  const texts: Record<HeartRateStatus, string> = {
    normal: '正常',
    low: '偏低',
    high: '偏高',
    veryHigh: '过高',
    dangerous: '危险'
  }
  return texts[status.value]
})

// 状况描述 - 更详细的分析
const statusDescription = computed(() => {
  const descriptions: Record<HeartRateStatus, string> = {
    normal: '心率在正常范围内(50-100次/分),心脏功能良好',
    low: `当前心率${props.bpm}次/分偏低,可能原因:休息状态、运动员体质或药物影响。建议:如伴有头晕、乏力等症状,请及时就医`,
    high: `当前心率${props.bpm}次/分略高,可能原因:运动后、情绪激动、咖啡因摄入。建议:深呼吸放松,避免剧烈活动,观察10-15分钟`,
    veryHigh: `当前心率${props.bpm}次/分过高!可能原因:剧烈运动、发热、焦虑或缺氧。建议:立即停止活动,坐下休息,保持呼吸平稳,如持续超过20分钟请就医`,
    dangerous: `当前心率${props.bpm}次/分异常危险!可能存在心律失常或其他心脏问题。建议:立即停止一切活动,保持安静,尽快联系医生或拨打急救电话`
  }
  return descriptions[status.value]
})

// 状态颜色
const statusColor = computed(() => {
  const colors: Record<HeartRateStatus, string> = {
    normal: '#4CAF50',      // 绿色
    low: '#FF9800',         // 橙色
    high: '#FF9800',        // 橙色
    veryHigh: '#F44336',    // 红色
    dangerous: '#D32F2F'    // 深红色
  }
  return colors[status.value]
})

// 状态图标
const statusIcon = computed(() => {
  const icons: Record<HeartRateStatus, string> = {
    normal: '✅',
    low: '⚠️',
    high: '⚠️',
    veryHigh: '🔴',
    dangerous: '🚨'
  }
  return icons[status.value]
})
</script>

<template>
  <div class="heart-rate-status">
    <div class="status-indicator" :style="{ color: statusColor }">
      <span class="status-icon">{{ statusIcon }}</span>
      <span class="status-text">{{ statusText }}</span>
    </div>
    <div class="status-description" v-if="isConnected && bpm > 0">
      <div class="analysis-content">
        {{ statusDescription }}
      </div>
      <div class="recommendation" v-if="status !== 'normal'">
        <strong>💡 健康建议:</strong>
        <ul>
          <li v-if="status === 'low'">监测是否有头晕、胸闷等症状</li>
          <li v-if="status === 'low'">适当补充水分和电解质</li>
          <li v-if="status === 'high' || status === 'veryHigh'">进行深呼吸练习(吸气4秒,屏息4秒,呼气6秒)</li>
          <li v-if="status === 'high' || status === 'veryHigh'">避免咖啡、茶等刺激性饮料</li>
          <li v-if="status === 'dangerous'">保持平静,避免紧张情绪</li>
          <li v-if="status === 'dangerous'">如有胸痛、呼吸困难,立即就医</li>
        </ul>
      </div>
    </div>
    <div class="status-description" v-else>
      连接设备后将显示心率分析和健康建议
    </div>
  </div>
</template>

<style scoped>
.heart-rate-status {
  display: flex;
  flex-direction: column;
  justify-content: center;  /* 垂直居中 */
  gap: 8px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 8px;
  border-left: 4px solid #ccc;
  flex: 1;  /* 自适应宽度,占满剩余空间 */
  min-width: 200px;  /* 最小宽度 */
  height: 100%;  /* 占满父容器高度 */
  transition: all 0.3s ease;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: bold;
}

.status-icon {
  font-size: 24px;
  line-height: 1;
}

.status-text {
  font-family: 'Press Start 2P', 'Courier New', monospace;
}

.status-description {
  font-size: 13px;
  color: #444;
  line-height: 1.7;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Microsoft YaHei', sans-serif;
}

.analysis-content {
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px dashed rgba(255, 0, 51, 0.2);  /* 使用主题红色 */
}

.recommendation {
  font-size: 12px;
  color: #555;
  background: rgba(255, 0, 51, 0.03);  /* 淡红色背景 */
  padding: 10px 12px;
  border-radius: 6px;
  border-left: 3px solid rgba(255, 0, 51, 0.3);  /* 红色左边框 */
}

.recommendation strong {
  display: block;
  margin-bottom: 8px;
  color: #ff0033;  /* 主题红色 */
  font-size: 13px;
  font-weight: 600;
}

.recommendation ul {
  margin: 0;
  padding-left: 20px;
  list-style-type: none;  /* 移除默认列表样式 */
}

.recommendation li {
  margin: 6px 0;
  line-height: 1.6;
  position: relative;
  padding-left: 18px;
}

.recommendation li::before {
  content: '▸';  /* 自定义箭头 */
  position: absolute;
  left: 0;
  color: #ff0033;  /* 主题红色 */
  font-weight: bold;
}

/* 不同状态的边框颜色 */
.heart-rate-status:has(.status-indicator[style*="4CAF50"]) {
  border-left-color: #4CAF50;
  background: rgba(76, 175, 80, 0.1);
}

.heart-rate-status:has(.status-indicator[style*="FF9800"]) {
  border-left-color: #FF9800;
  background: rgba(255, 152, 0, 0.1);
}

.heart-rate-status:has(.status-indicator[style*="F44336"]) {
  border-left-color: #F44336;
  background: rgba(244, 67, 54, 0.1);
}

.heart-rate-status:has(.status-indicator[style*="D32F2F"]) {
  border-left-color: #D32F2F;
  background: rgba(211, 47, 47, 0.15);
  animation: pulse 1s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(211, 47, 47, 0.4);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(211, 47, 47, 0);
  }
}

/* 浅色模式适配 */
.light-mode .heart-rate-status {
  background: rgb(255 255 255 / 53%);
}

.light-mode .status-description {
  color: #333;
}

.light-mode .recommendation {
  background: rgba(255, 0, 51, 0.05);
  border-left-color: rgba(255, 0, 51, 0.4);
}
</style>
