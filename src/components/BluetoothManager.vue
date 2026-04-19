<script setup lang="ts">
import { ref, onUnmounted } from 'vue'

export interface BluetoothDeviceInfo {
  name: string | undefined
  id: string
}

interface Props {
  autoReconnect?: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  'connected': [device: BluetoothDeviceInfo]
  'disconnected': []
  'data-received': [heartRate: number]
  'connection-error': [error: string]
  'status-change': [status: string, isConnected: boolean]
}>()

// 状态
const isConnected = ref(false)
const isConnecting = ref(false)
const statusText = ref('未连接')
const currentDevice = ref<BluetoothDevice | null>(null)
const currentCharacteristic = ref<BluetoothRemoteGATTCharacteristic | null>(null)

// 连接蓝牙设备
const connectDevice = async (): Promise<boolean> => {
  if (isConnected.value) {
    console.log('[蓝牙] 断开连接')
    await disconnectDevice()
    return false
  }

  try {
    isConnecting.value = true
    updateStatus('连接中...', false)
    console.log('[蓝牙] 开始搜索设备...')

    // 检查浏览器支持
    if (!navigator.bluetooth) {
      throw new Error('浏览器不支持Web Bluetooth API')
    }

    // 请求蓝牙设备
    const selectedDevice = await navigator.bluetooth.requestDevice({
      filters: [{ services: ['heart_rate'] }]
    })

    console.log('[蓝牙] 选择设备:', selectedDevice.name || selectedDevice.id)
    currentDevice.value = selectedDevice
    
    const server = await selectedDevice.gatt?.connect()

    if (!server) {
      throw new Error('无法连接到GATT服务器')
    }

    console.log('[蓝牙] GATT服务器连接成功')
    const service = await server.getPrimaryService('heart_rate')
    console.log('[蓝牙] 获取心率服务成功')
    const char = await service.getCharacteristic('heart_rate_measurement')
    console.log('[蓝牙] 获取心率特征值成功')

    currentCharacteristic.value = char

    // 启动通知
    await char.startNotifications()
    console.log('[蓝牙] 通知已启动')
    char.addEventListener('characteristicvaluechanged', handleHeartRateChange)

    isConnected.value = true
    updateStatus('已连接', true)
    console.log('[蓝牙] 连接成功！')

    // 触发连接事件
    emit('connected', {
      name: selectedDevice.name,
      id: selectedDevice.id
    })

    // 监听断开连接
    selectedDevice.addEventListener('gattserverdisconnected', handleDisconnected)

    return true

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '未知错误'
    console.error('[蓝牙] 连接失败:', error)
    updateStatus('连接失败', false)
    emit('connection-error', errorMessage)
    alert(`连接失败: ${errorMessage}`)
    return false
  } finally {
    isConnecting.value = false
  }
}

// 处理心率数据变化
const handleHeartRateChange = (event: Event) => {
  const target = event.target as BluetoothRemoteGATTCharacteristic
  const value = target.value!
  const flags = value.getUint8(0)
  const rate16Bits = flags & 0x1

  let heartRate: number
  if (rate16Bits) {
    heartRate = value.getUint16(1, true)
  } else {
    heartRate = value.getUint8(1)
  }

  console.log('[蓝牙] 接收到心率数据:', heartRate, 'BPM')
  
  // 触发数据接收事件
  emit('data-received', heartRate)
}

// 断开连接
const disconnectDevice = async () => {
  if (currentDevice.value && currentDevice.value.gatt?.connected) {
    currentDevice.value.gatt.disconnect()
  }
  handleDisconnected()
}

// 处理断开连接
const handleDisconnected = () => {
  console.log('[蓝牙] 设备已断开')
  isConnected.value = false
  updateStatus('未连接', false)
  
  // 清除引用
  currentDevice.value = null
  currentCharacteristic.value = null
  
  // 触发断开事件
  emit('disconnected')
}

// 更新状态
const updateStatus = (text: string, connected: boolean) => {
  statusText.value = text
  emit('status-change', text, connected)
}

// 获取连接状态
const getConnectionStatus = () => {
  return {
    isConnected: isConnected.value,
    isConnecting: isConnecting.value,
    statusText: statusText.value,
    device: currentDevice.value ? {
      name: currentDevice.value.name,
      id: currentDevice.value.id
    } : null
  }
}

// 检查浏览器支持
const checkBrowserSupport = (): boolean => {
  return !!navigator.bluetooth
}

// 组件卸载时清理
onUnmounted(() => {
  if (isConnected.value) {
    disconnectDevice()
  }
})

// 暴露方法给父组件
defineExpose({
  connectDevice,
  disconnectDevice,
  getConnectionStatus,
  checkBrowserSupport,
  isConnected,
  isConnecting,
  statusText,
  currentDevice
})
</script>

<template>
  <div class="bluetooth-manager" style="display: none;">
    <!-- 此组件仅提供功能,不显示UI -->
    <!-- UI请在父组件中自定义 -->
  </div>
</template>

<style scoped>
/* 此组件不显示UI,仅提供功能 */
.bluetooth-manager {
  display: none;
}
</style>
