<script setup lang="ts">
interface Props {
  isConnected: boolean
  isConnecting: boolean
  statusText: string
}

defineProps<Props>()

const emit = defineEmits<{
  connect: []
}>()

const handleConnect = () => {
  emit('connect')
}
</script>

<template>
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
        @click="handleConnect"
        :disabled="isConnecting"
      >
        {{ isConnecting ? '连接中...' : (isConnected ? '断开连接' : '连接设备') }}
      </button>
    </div>
  </header>
</template>

<style scoped>
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
  font-family: var(--font-modern);
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

/* 浅色模式适配 */
.light-mode .top-bar {
  background: rgba(255, 255, 255, 0.9);
  border-color: rgba(0, 0, 0, 0.1);
}

.light-mode .status-indicator {
  color: #333;
}

/* 响应式设计 */
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
}
</style>
