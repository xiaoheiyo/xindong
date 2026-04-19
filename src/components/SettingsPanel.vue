<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'

const props = defineProps<{
  audioEnabled: boolean
  audioType: 'sine' | 'square' | 'triangle' | 'sawtooth'
  alertEnabled: boolean
  highThreshold: number
  lowThreshold: number
  cacheDuration: number
  wallpaper: string
  wallpaperList: Array<{ id: string; name: string; class: string }>
}>()

const emit = defineEmits<{
  close: []
  audioToggle: [enabled: boolean]
  audioTypeChange: [type: 'sine' | 'square' | 'triangle' | 'sawtooth']
  alertUpdate: [enabled: boolean, high?: number, low?: number]
  cacheDurationUpdate: [hours: number]
  wallpaperChange: [wallpaperId: string]
}>()

// 当前激活的设置项
const activeTab = ref('audio')

// 设置项定义
const settingsTabs = [
  { id: 'audio', name: '音频设置', icon: '🔊' },
  { id: 'alert', name: '心率预警', icon: '⚠️' },
  { id: 'cache', name: '缓存设置', icon: '💾' },
  { id: 'wallpaper', name: '背景壁纸', icon: '🎨' },
  { id: 'help', name: '使用说明', icon: '❓' },
  { id: 'about', name: '关于', icon: 'ℹ️' }
]

const audioEnabledLocal = ref(props.audioEnabled)
const audioTypeLocal = ref(props.audioType)
const alertEnabledLocal = ref(props.alertEnabled)
const highThresholdLocal = ref(props.highThreshold)
const lowThresholdLocal = ref(props.lowThreshold)
const cacheDurationLocal = ref(props.cacheDuration)
const wallpaperLocal = ref(props.wallpaper)

// 切换设置项
const switchTab = (tabId: string) => {
  activeTab.value = tabId
}

// 监听props变化
watch(() => props.audioEnabled, (newValue) => {
  audioEnabledLocal.value = newValue
})

watch(() => props.audioType, (newValue) => {
  audioTypeLocal.value = newValue
})

watch(() => props.alertEnabled, (newValue) => {
  alertEnabledLocal.value = newValue
})

watch(() => props.highThreshold, (newValue) => {
  highThresholdLocal.value = newValue
})

watch(() => props.lowThreshold, (newValue) => {
  lowThresholdLocal.value = newValue
})

watch(() => props.cacheDuration, (newValue) => {
  cacheDurationLocal.value = newValue
  updateSliderBackground()
})

watch(() => props.wallpaper, (newValue) => {
  wallpaperLocal.value = newValue
})

// 更新滑块背景
const updateSliderBackground = () => {
  const percent = ((cacheDurationLocal.value - 1) / 47) * 100
  const slider = document.querySelector('.duration-slider') as HTMLElement
  if (slider) {
    slider.style.setProperty('--value-percent', `${percent}%`)
  }
}

// 关闭面板
const handleClose = () => {
  emit('close')
}

// 切换音效
const toggleAudio = () => {
  emit('audioToggle', audioEnabledLocal.value)
}

// 切换音频类型
const changeAudioType = () => {
  emit('audioTypeChange', audioTypeLocal.value)
}

// 切换预警
const toggleAlert = () => {
  emit('alertUpdate', alertEnabledLocal.value)
}

// 验证阈值（仅本地验证，不保存）
const validateThresholds = () => {
  if (highThresholdLocal.value <= lowThresholdLocal.value) {
    console.warn('[验证] 高阈值必须大于低阈值')
    return false
  }
  
  if (highThresholdLocal.value < 60 || highThresholdLocal.value > 200) {
    console.warn('[验证] 高阈值超出范围')
    return false
  }
  
  if (lowThresholdLocal.value < 30 || lowThresholdLocal.value > 90) {
    console.warn('[验证] 低阈值超出范围')
    return false
  }
  
  return true
}

// 保存阈值设置
const saveThresholdSettings = () => {
  // 验证阈值范围
  if (!validateThresholds()) {
    alert('阈值设置无效，请检查：\n1. 高阈值必须大于低阈值\n2. 高阈值范围：60-200 BPM\n3. 低阈值范围：30-90 BPM')
    return
  }
  
  // 发送更新事件
  emit('alertUpdate', alertEnabledLocal.value, highThresholdLocal.value, lowThresholdLocal.value)
  console.log('[设置] 阈值已保存:', { high: highThresholdLocal.value, low: lowThresholdLocal.value })
  alert('✅ 阈值设置已保存并生效！')
}

// 更新缓存时长
const updateCacheDuration = () => {
  if (cacheDurationLocal.value >= 1 && cacheDurationLocal.value <= 48) {
    updateSliderBackground()
    emit('cacheDurationUpdate', cacheDurationLocal.value)
  } else {
    alert('缓存时长必须在1-48小时之间！')
    cacheDurationLocal.value = props.cacheDuration
  }
}

// 切换壁纸
const changeWallpaper = (wallpaperId: string) => {
  wallpaperLocal.value = wallpaperId
  emit('wallpaperChange', wallpaperId)
}

// 组件挂载时初始化滑块
onMounted(() => {
  updateSliderBackground()
})
</script>

<template>
  <div class="settings-overlay" @click.self="handleClose">
    <div class="settings-panel">
      <div class="settings-header">
        <h3>设置中心</h3>
        <button class="close-btn" @click="handleClose">×</button>
      </div>
      
      <div class="settings-body">
        <!-- 左侧导航栏 -->
        <aside class="settings-sidebar">
          <nav class="settings-nav">
            <button
              v-for="tab in settingsTabs"
              :key="tab.id"
              class="nav-item"
              :class="{ active: activeTab === tab.id }"
              @click="switchTab(tab.id)"
            >
              <span class="nav-icon">{{ tab.icon }}</span>
              <span class="nav-name">{{ tab.name }}</span>
            </button>
          </nav>
        </aside>

        <!-- 右侧内容区 -->
        <div class="settings-content">
          <!-- 音频设置 -->
          <div v-if="activeTab === 'audio'" class="settings-section">
            <h4>🔊 音频设置</h4>
          
          <div class="setting-group">
            <label class="toggle-switch-large">
              <input 
                type="checkbox" 
                v-model="audioEnabledLocal"
                @change="toggleAudio"
              >
              <span class="toggle-slider-large"></span>
              <span class="toggle-label">启用心跳音效</span>
            </label>
            <p class="setting-hint">连接设备后，每次心跳会播放提示音</p>
          </div>
          
          <div class="setting-group">
            <label class="setting-label">音效类型</label>
            <div class="audio-type-options">
              <button
                class="audio-type-btn"
                :class="{ active: audioTypeLocal === 'sine' }"
                @click="audioTypeLocal = 'sine'; changeAudioType()"
              >
                <span class="type-icon">〰️</span>
                <span class="type-name">正弦波</span>
                <span class="type-desc">柔和</span>
              </button>
              <button
                class="audio-type-btn"
                :class="{ active: audioTypeLocal === 'square' }"
                @click="audioTypeLocal = 'square'; changeAudioType()"
              >
                <span class="type-icon">⬜</span>
                <span class="type-name">方波</span>
                <span class="type-desc">电子</span>
              </button>
              <button
                class="audio-type-btn"
                :class="{ active: audioTypeLocal === 'triangle' }"
                @click="audioTypeLocal = 'triangle'; changeAudioType()"
              >
                <span class="type-icon">🔺</span>
                <span class="type-name">三角波</span>
                <span class="type-desc">清脆</span>
              </button>
              <button
                class="audio-type-btn"
                :class="{ active: audioTypeLocal === 'sawtooth' }"
                @click="audioTypeLocal = 'sawtooth'; changeAudioType()"
              >
                <span class="type-icon">📐</span>
                <span class="type-name">锯齿波</span>
                <span class="type-desc">尖锐</span>
              </button>
            </div>
          </div>
        </div>
        
        <!-- 预警设置 -->
        <div v-if="activeTab === 'alert'" class="settings-section">
          <h4>⚠️ 心率预警</h4>
          
          <div class="setting-group">
            <label class="toggle-switch-large">
              <input 
                type="checkbox" 
                v-model="alertEnabledLocal"
                @change="toggleAlert"
              >
              <span class="toggle-slider-large"></span>
              <span class="toggle-label">启用心率预警</span>
            </label>
            <p class="setting-hint">心率过高或过低时发出警报</p>
          </div>
          
          <div class="setting-group" v-if="alertEnabledLocal">
            <label class="setting-label">预警阈值设置</label>
            <div class="threshold-inputs">
              <div class="threshold-item">
                <label>心率过高 (BPM)</label>
                <input 
                  type="number" 
                  v-model.number="highThresholdLocal"
                  min="60"
                  max="200"
                  class="threshold-input"
                  placeholder="60-200"
                />
              </div>
              <div class="threshold-item">
                <label>心率过低 (BPM)</label>
                <input 
                  type="number" 
                  v-model.number="lowThresholdLocal"
                  min="30"
                  max="90"
                  class="threshold-input"
                  placeholder="30-90"
                />
              </div>
            </div>
            <button class="save-threshold-btn" @click="saveThresholdSettings">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                <polyline points="17 21 17 13 7 13 7 21"></polyline>
                <polyline points="7 3 7 8 15 8"></polyline>
              </svg>
              保存生效
            </button>
            <p class="setting-hint">修改后点击“保存生效”按钮应用新阈值</p>
          </div>
        </div>
        
        <!-- 缓存设置 -->
        <div v-if="activeTab === 'cache'" class="settings-section">
          <h4>💾 缓存设置</h4>
          
          <div class="setting-group">
            <label class="setting-label">历史记录缓存时长</label>
            <div class="cache-duration-control">
              <input 
                type="range" 
                v-model.number="cacheDurationLocal"
                @change="updateCacheDuration"
                min="1"
                max="48"
                step="1"
                class="duration-slider"
              />
              <div class="duration-display">
                <span class="duration-value">{{ cacheDurationLocal }}</span>
                <span class="duration-unit">小时</span>
              </div>
              <div class="duration-hints">
                <span class="hint-min">1小时</span>
                <span class="hint-max">48小时</span>
              </div>
            </div>
            <p class="setting-hint">超出时长的记录将自动清理，避免网页卡滞</p>
          </div>
        </div>
        
        <!-- 壁纸设置 -->
        <div v-if="activeTab === 'wallpaper'" class="settings-section">
          <h4>🎨 背景壁纸</h4>
          
          <div class="setting-group">
            <label class="setting-label">选择喜欢的壁纸</label>
            <div class="wallpaper-grid">
              <button
                v-for="wp in wallpaperList"
                :key="wp.id"
                class="wallpaper-option"
                :class="{ active: wallpaperLocal === wp.id }"
                @click="changeWallpaper(wp.id)"
              >
                <div class="wallpaper-preview" :class="wp.class"></div>
                <span class="wallpaper-name">{{ wp.name }}</span>
              </button>
            </div>
            <p class="setting-hint">点击预览图切换背景壁纸</p>
          </div>
        </div>
        
        <!-- 使用说明 -->
        <div v-if="activeTab === 'help'" class="settings-section">
          <h4>❓ 使用说明</h4>
          <div class="info-box">
            <p><strong>如何连接心率设备：</strong></p>
            <ol>
              <li>确保您的心率设备已开启蓝牙广播功能</li>
              <li>点击"连接设备"按钮</li>
              <li>在弹出的设备列表中选择您的心率设备</li>
              <li>授权后即可实时监测心率</li>
            </ol>
            
            <p style="margin-top: 15px;"><strong>支持的设备：</strong></p>
            <ul>
              <li>支持蓝牙心率标准的智能手表/手环</li>
              <li>心率带（如Polar、Garmin等）</li>
              <li>其他支持BLE心率服务的设备</li>
            </ul>
            
            <p style="margin-top: 15px; color: #ffa500;">
              <strong>注意：</strong>请使用Chrome或Edge浏览器以获得最佳体验
            </p>
          </div>
        </div>
        
        <!-- 关于 -->
        <div v-if="activeTab === 'about'" class="settings-section">
          <h4>ℹ️ 关于</h4>
          <div class="about-info">
            <p>心动 - 心率监测系统</p>
            <p>基于 Vue 3 + Three.js 开发</p>
            <p style="margin-top: 10px; font-size: 12px; opacity: 0.7;">
              本应用仅供娱乐和演示用途，不能替代专业医疗设备
            </p>
          </div>
        </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.settings-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(5px);
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: center;
  animation: fadeIn 0.3s;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.settings-panel {
  background: rgba(245, 245, 245, 0.98);
  border-radius: 12px;
  width: 90%;
  max-width: 900px;
  height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  animation: slideUp 0.3s;
}

@keyframes slideUp {
  from {
    transform: translateY(50px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.settings-header h3 {
  margin: 0;
  color: #333;
  font-size: 20px;
}

.close-btn {
  background: none;
  border: none;
  color: #333;
  font-size: 28px;
  cursor: pointer;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s;
}

.close-btn:hover {
  background: rgba(0, 0, 0, 0.1);
}

/* 设置主体区域 */
.settings-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* 左侧导航栏 */
.settings-sidebar {
  width: 200px;
  background: rgba(255, 255, 255, 0.5);
  border-right: 1px solid rgba(0, 0, 0, 0.1);
  padding: 20px 0;
  overflow-y: auto;
}

.settings-nav {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.3s;
  text-align: left;
  color: #555;
  font-size: 14px;
  border-left: 3px solid transparent;
}

.nav-item:hover {
  background: rgba(255, 0, 51, 0.05);
  color: #ff0033;
}

.nav-item.active {
  background: rgba(255, 0, 51, 0.1);
  color: #ff0033;
  border-left-color: #ff0033;
  font-weight: bold;
}

.nav-icon {
  font-size: 18px;
  line-height: 1;
}

.nav-name {
  flex: 1;
}

/* 右侧内容区 */
.settings-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.settings-section {
  margin-bottom: 30px;
}

.settings-section h4 {
  color: #333;
  margin: 0 0 15px 0;
  font-size: 16px;
  border-bottom: 2px solid #ff0033;
  padding-bottom: 8px;
}

.setting-group {
  margin-bottom: 20px;
}

.setting-label {
  display: block;
  color: #555;
  margin-bottom: 10px;
  font-size: 14px;
}

/* 大型开关 */
.toggle-switch-large {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  position: relative;
}

.toggle-switch-large input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider-large {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 26px;
  background-color: #ccc;
  transition: .4s;
  border-radius: 26px;
  flex-shrink: 0;
}

.toggle-slider-large:before {
  position: absolute;
  content: "";
  height: 20px;
  width: 20px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
}

input:checked + .toggle-slider-large {
  background-color: #ff0033;
}

input:checked + .toggle-slider-large:before {
  transform: translateX(24px);
}

.toggle-label {
  color: #333;
  font-size: 15px;
  user-select: none;
}

.setting-hint {
  margin: 8px 0 0 0;
  padding-left: 62px;
  font-size: 12px;
  color: #777;
  line-height: 1.5;
}

/* 音频类型选项 */
.audio-type-options {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-top: 10px;
}

.audio-type-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  padding: 12px 8px;
  background: rgba(255, 255, 255, 0.8);
  border: 2px solid rgba(0, 0, 0, 0.15);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  color: #333;
}

.audio-type-btn:hover {
  background: rgba(255, 255, 255, 1);
  border-color: rgba(0, 0, 0, 0.3);
  transform: translateY(-2px);
}

.audio-type-btn.active {
  background: rgba(255, 0, 51, 0.2);
  border-color: #ff0033;
  box-shadow: 0 0 10px rgba(255, 0, 51, 0.3);
}

.type-icon {
  font-size: 24px;
  line-height: 1;
}

.type-name {
  font-size: 13px;
  font-weight: bold;
}

.type-desc {
  font-size: 11px;
  opacity: 0.7;
}

.theme-options {
  display: flex;
  gap: 15px;
}

.theme-option {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: #333;
  padding: 10px 15px;
  border: 2px solid rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  transition: all 0.3s;
  flex: 1;
  justify-content: center;
}

.theme-option:hover {
  border-color: #ff0033;
}

.theme-option input[type="radio"] {
  margin: 0;
}

.theme-option:has(input:checked) {
  border-color: #ff0033;
  background: rgba(255, 0, 51, 0.1);
}

.color-picker-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.color-picker {
  width: 100%;
  height: 50px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.color-presets {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.color-preset {
  width: 36px;
  height: 36px;
  border: 2px solid transparent;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s;
}

.color-preset:hover {
  transform: scale(1.1);
  border-color: #333;
}

.info-box {
  background: rgba(0, 0, 0, 0.03);
  padding: 15px;
  border-radius: 8px;
  color: #555;
  font-size: 14px;
  line-height: 1.6;
}

.info-box ol,
.info-box ul {
  margin: 10px 0;
  padding-left: 20px;
}

.info-box li {
  margin: 5px 0;
}

.about-info {
  color: #555;
  font-size: 14px;
  line-height: 1.8;
}

.about-info p {
  margin: 5px 0;
}

/* 阈值输入框 */
.threshold-inputs {
  display: flex;
  gap: 15px;
  margin-top: 10px;
}

.threshold-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.threshold-item label {
  font-size: 13px;
  color: #555;
  font-weight: 500;
}

.threshold-input {
  padding: 10px;
  border: 2px solid rgba(0, 0, 0, 0.15);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.8);
  color: #333;
  font-size: 14px;
  font-family: var(--font-pixel);
  transition: all 0.3s;
  width: 100%;
}

.threshold-input:focus {
  outline: none;
  border-color: #ff0033;
  background: rgba(255, 255, 255, 1);
  box-shadow: 0 0 0 3px rgba(255, 0, 51, 0.1);
}

.threshold-input::-webkit-inner-spin-button,
.threshold-input::-webkit-outer-spin-button {
  opacity: 1;
}

/* 保存阈值按钮 */
.save-threshold-btn {
  margin-top: 15px;
  width: 100%;
  padding: 12px 20px;
  background: linear-gradient(135deg, #ff0033 0%, #cc0029 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(255, 0, 51, 0.3);
}

.save-threshold-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 0, 51, 0.5);
  background: linear-gradient(135deg, #ff1a47 0%, #e60033 100%);
}

.save-threshold-btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 6px rgba(255, 0, 51, 0.3);
}

.save-threshold-btn svg {
  flex-shrink: 0;
}

/* 壁纸选择网格 */
.wallpaper-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 15px;
  margin-top: 10px;
}

.wallpaper-option {
  border: 3px solid transparent;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s;
  background: rgba(255, 255, 255, 0.8);
  padding: 0;
}

.wallpaper-option:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
  border-color: rgba(255, 0, 51, 0.3);
}

.wallpaper-option.active {
  border-color: #ff0033;
  box-shadow: 0 0 15px rgba(255, 0, 51, 0.4);
}

.wallpaper-preview {
  width: 100%;
  height: 80px;
  transition: all 0.3s;
}

.wallpaper-name {
  display: block;
  padding: 8px;
  font-size: 12px;
  color: #333;
  text-align: center;
  font-weight: 500;
  background: rgba(255, 255, 255, 0.9);
}

/* 壁纸预览样式（与App.vue保持一致） */
.wallpaper-preview.wallpaper-gradient-blue {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.wallpaper-preview.wallpaper-gradient-purple {
  background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
}

.wallpaper-preview.wallpaper-gradient-sunset {
  background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%);
}

.wallpaper-preview.wallpaper-gradient-forest {
  background: linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%);
}

.wallpaper-preview.wallpaper-gradient-ocean {
  background: linear-gradient(135deg, #2e3192 0%, #1bffff 100%);
}

.wallpaper-preview.wallpaper-solid-dark {
  background: #1a1a1a;
}

/* 缓存时长滑块 */
.cache-duration-control {
  margin-top: 10px;
  padding: 15px;
  background: rgba(0, 0, 0, 0.03);
  border-radius: 8px;
}

.duration-slider {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: linear-gradient(to right, #ff0033 0%, #ff0033 var(--value-percent, 50%), rgba(0, 0, 0, 0.1) var(--value-percent, 50%), rgba(0, 0, 0, 0.1) 100%);
  outline: none;
  -webkit-appearance: none;
  appearance: none;
  cursor: pointer;
}

.duration-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #ff0033;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(255, 0, 51, 0.4);
  transition: all 0.2s;
}

.duration-slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
  box-shadow: 0 3px 10px rgba(255, 0, 51, 0.6);
}

.duration-slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #ff0033;
  cursor: pointer;
  border: none;
  box-shadow: 0 2px 6px rgba(255, 0, 51, 0.4);
  transition: all 0.2s;
}

.duration-slider::-moz-range-thumb:hover {
  transform: scale(1.2);
  box-shadow: 0 3px 10px rgba(255, 0, 51, 0.6);
}

.duration-display {
  text-align: center;
  margin: 15px 0 10px 0;
}

.duration-value {
  font-size: 32px;
  font-weight: bold;
  color: #ff0033;
  font-family: var(--font-pixel);
  margin-right: 8px;
}

.duration-unit {
  font-size: 16px;
  color: #666;
}

.duration-hints {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #999;
  padding: 0 5px;
}

/* 滚动条样式 */
.settings-panel::-webkit-scrollbar,
.settings-content::-webkit-scrollbar,
.settings-sidebar::-webkit-scrollbar {
  width: 8px;
}

.settings-panel::-webkit-scrollbar-track,
.settings-content::-webkit-scrollbar-track,
.settings-sidebar::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
}

.settings-panel::-webkit-scrollbar-thumb,
.settings-content::-webkit-scrollbar-thumb,
.settings-sidebar::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}

.settings-panel::-webkit-scrollbar-thumb:hover,
.settings-content::-webkit-scrollbar-thumb:hover,
.settings-sidebar::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}

/* 浅色模式适配 */
.light-mode .settings-panel {
  background: rgba(255, 255, 255, 0.95);
}

.light-mode .settings-header h3,
.light-mode .close-btn,
.light-mode .settings-section h4,
.light-mode .theme-option,
.light-mode .setting-label {
  color: #333;
}

.light-mode .info-box,
.light-mode .about-info {
  color: #666;
}

.light-mode .theme-option {
  border-color: rgba(0, 0, 0, 0.2);
}

.light-mode .theme-option:has(input:checked) {
  background: rgba(255, 0, 51, 0.05);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .settings-panel {
    width: 95%;
    max-width: none;
    height: 85vh;
  }

  .settings-body {
    flex-direction: column;
  }

  .settings-sidebar {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
    padding: 10px 0;
  }

  .settings-nav {
    flex-direction: row;
    overflow-x: auto;
    gap: 5px;
    padding: 0 10px;
  }

  .nav-item {
    flex-direction: column;
    gap: 4px;
    padding: 8px 12px;
    font-size: 12px;
    border-left: none;
    border-bottom: 3px solid transparent;
    white-space: nowrap;
  }

  .nav-item.active {
    border-left-color: transparent;
    border-bottom-color: #ff0033;
  }

  .nav-icon {
    font-size: 20px;
  }

  .settings-content {
    padding: 15px;
  }

  .audio-type-options {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .settings-header {
    padding: 15px;
  }

  .settings-header h3 {
    font-size: 18px;
  }

  .nav-name {
    display: none;
  }

  .nav-item {
    padding: 8px;
  }

  .nav-icon {
    font-size: 22px;
  }
}
</style>
