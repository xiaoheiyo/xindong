<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  audioEnabled: boolean
  audioType: 'sine' | 'square' | 'triangle' | 'sawtooth'
}>()

const emit = defineEmits<{
  close: []
  audioToggle: [enabled: boolean]
  audioTypeChange: [type: 'sine' | 'square' | 'triangle' | 'sawtooth']
}>()

const audioEnabledLocal = ref(props.audioEnabled)
const audioTypeLocal = ref(props.audioType)

// 监听props变化
watch(() => props.audioEnabled, (newValue) => {
  audioEnabledLocal.value = newValue
})

watch(() => props.audioType, (newValue) => {
  audioTypeLocal.value = newValue
})

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
</script>

<template>
  <div class="settings-overlay" @click.self="handleClose">
    <div class="settings-panel">
      <div class="settings-header">
        <h3>设置中心</h3>
        <button class="close-btn" @click="handleClose">×</button>
      </div>
      
      <div class="settings-content">
        <!-- 音频设置 -->
        <div class="settings-section">
          <h4>音频设置</h4>
          
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

        <!-- 使用说明 -->
        <div class="settings-section">
          <h4>使用说明</h4>
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
        <div class="settings-section">
          <h4>关于</h4>
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
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
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

.settings-content {
  padding: 20px;
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

/* 滚动条样式 */
.settings-panel::-webkit-scrollbar {
  width: 8px;
}

.settings-panel::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
}

.settings-panel::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}

.settings-panel::-webkit-scrollbar-thumb:hover {
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
</style>
