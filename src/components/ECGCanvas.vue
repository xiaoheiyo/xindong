<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'

const props = defineProps<{
  bpm: number
  isConnected: boolean
  themeColor: string
}>()

const canvasRef = ref<HTMLCanvasElement>()
let ctx: CanvasRenderingContext2D
let animationId: number
const dataPoints: number[] = []
const maxDataPoints = 800

// ECG波形参数 - 更接近真实心电图
const ecgParams = {
  pWave: 0.12,      // P波幅度（心房去极化）
  qWave: -0.08,     // Q波幅度
  rWave: 1.0,       // R波幅度（心室去极化主峰）
  sWave: -0.15,     // S波幅度
  tWave: 0.20,      // T波幅度（心室复极化）
  baselineNoise: 0.02,  // 基线噪声
  muscleNoise: 0.03     // 肌电噪声
}

// 心跳状态追踪
let lastBeatTime = 0
let currentPhase = 0 // 当前心跳周期位置
let beatDetected = false

// 初始化Canvas
const initCanvas = () => {
  if (!canvasRef.value) return
  
  const canvas = canvasRef.value
  const parent = canvas.parentElement
  
  if (parent) {
    canvas.width = parent.clientWidth
    canvas.height = parent.clientHeight
  }
  
  ctx = canvas.getContext('2d')!
  
  // 初始化数据点
  for (let i = 0; i < maxDataPoints; i++) {
    dataPoints.push(0)
  }
  
  // 初始化心跳时间
  lastBeatTime = Date.now()
}

// 生成ECG波形 - 基于时间推进的真实模拟
const generateECGValue = (): number => {
  if (!props.isConnected || props.bpm === 0) {
    // 未连接时显示平线加轻微噪声
    return (Math.random() - 0.5) * 0.02
  }

  const now = Date.now()
  const beatInterval = 60000 / props.bpm // 每次心跳的毫秒数
  
  // 计算当前在心跳周期中的位置 (0-1)
  const timeSinceLastBeat = now - lastBeatTime
  currentPhase = (timeSinceLastBeat % beatInterval) / beatInterval
  
  let value = 0
  
  // P波 - 心房去极化 (0-15%)
  if (currentPhase >= 0.0 && currentPhase < 0.15) {
    const p = currentPhase / 0.15
    value += ecgParams.pWave * Math.sin(p * Math.PI) * Math.exp(-((p - 0.5) ** 2) / 0.02)
  }
  
  // PR段 - 房室传导延迟 (15-35%) - 回到基线
  else if (currentPhase >= 0.15 && currentPhase < 0.35) {
    value = 0
  }
  
  // QRS复合波 - 心室去极化 (35-50%)
  else if (currentPhase >= 0.35 && currentPhase < 0.50) {
    const qrs = (currentPhase - 0.35) / 0.15
    
    // Q波 (35-40%)
    if (qrs < 0.33) {
      const q = qrs / 0.33
      value += ecgParams.qWave * Math.sin(q * Math.PI)
    }
    // R波 (40-47%) - 尖锐的主峰
    else if (qrs < 0.8) {
      const r = (qrs - 0.33) / 0.47
      value += ecgParams.rWave * Math.exp(-((r - 0.5) ** 2) / 0.008)
    }
    // S波 (47-50%)
    else {
      const s = (qrs - 0.8) / 0.2
      value += ecgParams.sWave * Math.sin(s * Math.PI)
    }
  }
  
  // ST段 - 心室收缩平台期 (50-65%) - 回到基线
  else if (currentPhase >= 0.50 && currentPhase < 0.65) {
    value = 0
  }
  
  // T波 - 心室复极化 (65-85%)
  else if (currentPhase >= 0.65 && currentPhase < 0.85) {
    const t = (currentPhase - 0.65) / 0.20
    value += ecgParams.tWave * Math.sin(t * Math.PI) * Math.exp(-((t - 0.5) ** 2) / 0.03)
  }
  
  // TP段 - 舒张期 (85-100%) - 回到基线
  else {
    value = 0
  }
  
  // 添加生理噪声
  value += (Math.random() - 0.5) * ecgParams.baselineNoise
  value += (Math.random() - 0.5) * ecgParams.muscleNoise * Math.sin(now * 0.01)
  
  // 检测R波峰值，更新上次心跳时间
  if (currentPhase >= 0.40 && currentPhase < 0.47 && !beatDetected) {
    lastBeatTime = now - (currentPhase * beatInterval) + (0.435 * beatInterval)
    beatDetected = true
  } else if (currentPhase > 0.50) {
    beatDetected = false
  }
  
  return value
}

// 绘制ECG - 医院心电图机风格
const draw = () => {
  if (!ctx || !canvasRef.value) return
  
  const canvas = canvasRef.value
  const width = canvas.width
  const height = canvas.height
  
  // 清空画布
  ctx.clearRect(0, 0, width, height)
  
  // 绘制医疗网格背景
  drawMedicalGrid(width, height)
  
  // 更新数据点 - 每次添加一个新点
  const newValue = generateECGValue()
  dataPoints.push(newValue)
  if (dataPoints.length > maxDataPoints) {
    dataPoints.shift()
  }
  
  // 绘制ECG波形 - 绿色荧光效果
  drawECGWaveform(width, height)
  
  // 绘制扫描线（从左到右移动）
  drawScanLine(width, height)
}

// 绘制医疗网格
const drawMedicalGrid = (width: number, height: number) => {
  // 小网格 - 1mm (5px)
  ctx.strokeStyle = 'rgba(255, 100, 100, 0.15)'
  ctx.lineWidth = 0.5
  
  for (let x = 0; x < width; x += 5) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, height)
    ctx.stroke()
  }
  
  for (let y = 0; y < height; y += 5) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(width, y)
    ctx.stroke()
  }
  
  // 大网格 - 5mm (25px)
  ctx.strokeStyle = 'rgba(255, 50, 50, 0.25)'
  ctx.lineWidth = 1
  
  for (let x = 0; x < width; x += 25) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, height)
    ctx.stroke()
  }
  
  for (let y = 0; y < height; y += 25) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(width, y)
    ctx.stroke()
  }
}

// 绘制ECG波形
const drawECGWaveform = (width: number, height: number) => {
  ctx.strokeStyle = props.themeColor
  ctx.lineWidth = 2.5
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  
  // 发光效果 - 模拟CRT显示器
  ctx.shadowBlur = 15
  ctx.shadowColor = props.themeColor
  
  ctx.beginPath()
  
  const stepX = width / maxDataPoints
  const centerY = height / 2
  const scaleY = height * 0.35 // 调整缩放比例
  
  for (let i = 0; i < dataPoints.length; i++) {
    const x = i * stepX
    const y = centerY - dataPoints[i] * scaleY
    
    if (i === 0) {
      ctx.moveTo(x, y)
    } else {
      // 使用二次贝塞尔曲线使线条更平滑
      const prevX = (i - 1) * stepX
      const prevY = centerY - dataPoints[i - 1] * scaleY
      const cpX = (prevX + x) / 2
      const cpY = (prevY + y) / 2
      ctx.quadraticCurveTo(prevX, prevY, cpX, cpY)
    }
  }
  
  ctx.stroke()
  
  // 重置阴影
  ctx.shadowBlur = 0
}

// 绘制扫描线
const drawScanLine = (width: number, height: number) => {
  const scanX = ((Date.now() / 20) % width)
  
  // 扫描线渐变效果
  const gradient = ctx.createLinearGradient(scanX - 50, 0, scanX + 50, 0)
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0)')
  gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.4)')
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
  
  ctx.strokeStyle = gradient
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(scanX, 0)
  ctx.lineTo(scanX, height)
  ctx.stroke()
}

// 动画循环
const animate = () => {
  animationId = requestAnimationFrame(animate)
  draw()
}

// 监听Canvas大小变化
const handleResize = () => {
  if (!canvasRef.value) return
  
  const canvas = canvasRef.value
  const parent = canvas.parentElement
  
  if (parent) {
    canvas.width = parent.clientWidth
    canvas.height = parent.clientHeight
  }
}

onMounted(() => {
  initCanvas()
  animate()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  cancelAnimationFrame(animationId)
  window.removeEventListener('resize', handleResize)
})

// 监听主题色变化
watch(() => props.themeColor, () => {
  // 主题色变化时会自动在下一帧生效
})
</script>

<template>
  <canvas ref="canvasRef" class="ecg-canvas"></canvas>
</template>

<style scoped>
.ecg-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 2;
}
</style>
