<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'

const props = defineProps<{
  enabled: boolean
  themeColor: string
  bpm: number
}>()

const canvasContainer = ref<HTMLDivElement>()
let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let particles: THREE.Points
let particleMaterial: THREE.PointsMaterial
let animationId: number
let lastBpm = 0
let pulsePhase = 0
const baseParticleSize = 0.5

// 初始化Three.js场景
const init = () => {
  if (!canvasContainer.value) return

  // 场景
  scene = new THREE.Scene()

  // 相机
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  )
  camera.position.z = 50

  // 渲染器
  renderer = new THREE.WebGLRenderer({ 
    antialias: true,
    alpha: true 
  })
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(window.devicePixelRatio)
  canvasContainer.value.appendChild(renderer.domElement)

  // 创建粒子
  createParticles()

  // 监听窗口大小变化
  window.addEventListener('resize', handleResize)
}

// 创建粒子系统
const createParticles = () => {
  const particleCount = 2000
  const geometry = new THREE.BufferGeometry()
  const positions = new Float32Array(particleCount * 3)
  const colors = new Float32Array(particleCount * 3)

  const color = new THREE.Color(props.themeColor)

  for (let i = 0; i < particleCount; i++) {
    // 位置
    positions[i * 3] = (Math.random() - 0.5) * 100
    positions[i * 3 + 1] = (Math.random() - 0.5) * 100
    positions[i * 3 + 2] = (Math.random() - 0.5) * 100

    // 颜色
    colors[i * 3] = color.r
    colors[i * 3 + 1] = color.g
    colors[i * 3 + 2] = color.b
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

  particleMaterial = new THREE.PointsMaterial({
    size: baseParticleSize,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true
  })

  particles = new THREE.Points(geometry, particleMaterial)
  scene.add(particles)
}

// 动画循环
const animate = () => {
  animationId = requestAnimationFrame(animate)

  if (particles && particleMaterial) {
    // 基础旋转
    particles.rotation.x += 0.0005
    particles.rotation.y += 0.0005

    // 根据心率调整动画效果
    if (props.bpm > 0) {
      const currentTime = Date.now()
      
      // 检测心率变化
      const bpmChanged = Math.abs(props.bpm - lastBpm) > 2
      if (bpmChanged) {
        pulsePhase = 0 // 重置脉冲相位
        lastBpm = props.bpm
      }
      
      // 心跳脉冲效果 - 更强的视觉反馈
      const heartRate = props.bpm / 60 // 转换为Hz
      
      // 主脉冲效果（模拟心跳收缩）
      pulsePhase += 0.05 * heartRate
      const mainPulse = Math.sin(pulsePhase) * 0.5 + 0.5 // 0-1范围
      
      // 二次谐波增加层次感
      const secondaryPulse = Math.sin(pulsePhase * 2) * 0.3 + 0.5
      
      // 综合脉冲强度
      const pulseIntensity = (mainPulse * 0.7 + secondaryPulse * 0.3)
      
      // 粒子大小随心跳变化（更明显的效果）
      const targetSize = baseParticleSize * (1 + pulseIntensity * 0.8)
      particleMaterial.size += (targetSize - particleMaterial.size) * 0.1 // 平滑过渡
      
      // 粒子系统整体缩放（呼吸效果）
      const scaleBase = 1 + pulseIntensity * 0.15
      const waveEffect = Math.sin(currentTime * 0.001) * 0.02 // 轻微波浪
      particles.scale.setScalar(scaleBase + waveEffect)
      
      // 透明度随心跳变化
      const targetOpacity = 0.6 + pulseIntensity * 0.4
      particleMaterial.opacity += (targetOpacity - particleMaterial.opacity) * 0.1
      
      // 根据心率调整旋转速度
      const speedMultiplier = heartRate
      particles.rotation.y += 0.001 * speedMultiplier
      
      // 高心率时的额外效果
      if (props.bpm > 100) {
        const stressFactor = (props.bpm - 100) / 100 // 0-1
        particles.rotation.z += 0.0005 * stressFactor
        particleMaterial.size *= 1 + stressFactor * 0.2
      }
    } else {
      // 未连接时的待机效果
      const idlePulse = Math.sin(Date.now() * 0.001) * 0.1 + 1
      particles.scale.setScalar(idlePulse)
      particleMaterial.size = baseParticleSize
      particleMaterial.opacity = 0.6
    }
  }

  renderer.render(scene, camera)
}

// 处理窗口大小变化
const handleResize = () => {
  if (!camera || !renderer) return
  
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
}

// 更新粒子颜色
const updateParticleColor = () => {
  if (!particles) return
  
  const color = new THREE.Color(props.themeColor)
  const colors = particles.geometry.attributes.color.array as Float32Array
  
  for (let i = 0; i < colors.length / 3; i++) {
    colors[i * 3] = color.r
    colors[i * 3 + 1] = color.g
    colors[i * 3 + 2] = color.b
  }
  
  particles.geometry.attributes.color.needsUpdate = true
}

// 监听主题色变化
watch(() => props.themeColor, () => {
  updateParticleColor()
})

onMounted(() => {
  if (props.enabled) {
    init()
    animate()
  }
})

onUnmounted(() => {
  cancelAnimationFrame(animationId)
  window.removeEventListener('resize', handleResize)
  
  if (renderer) {
    renderer.dispose()
  }
  
  if (canvasContainer.value && renderer?.domElement) {
    canvasContainer.value.removeChild(renderer.domElement)
  }
})
</script>

<template>
  <div ref="canvasContainer" id="canvas-container"></div>
</template>

<style scoped>
#canvas-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  pointer-events: none;
}
</style>
