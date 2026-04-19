<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'

export interface WallpaperOption {
  id: string
  name: string
  class: string
}

interface Props {
  currentWallpaper?: string
  wallpaperList?: WallpaperOption[]
}

const props = withDefaults(defineProps<Props>(), {
  currentWallpaper: 'gradient-blue',
  wallpaperList: () => [
    { id: 'gradient-blue', name: '蓝色渐变', class: 'wallpaper-gradient-blue' },
    { id: 'gradient-purple', name: '紫色渐变', class: 'wallpaper-gradient-purple' },
    { id: 'gradient-sunset', name: '日落橙红', class: 'wallpaper-gradient-sunset' },
    { id: 'gradient-forest', name: '森林绿色', class: 'wallpaper-gradient-forest' },
    { id: 'gradient-ocean', name: '海洋深蓝', class: 'wallpaper-gradient-ocean' },
    { id: 'solid-dark', name: '深色纯色', class: 'wallpaper-solid-dark' }
  ]
})

const emit = defineEmits<{
  'wallpaper-changed': [wallpaperId: string]
}>()

// 当前选中的壁纸
const selectedWallpaper = ref<string>(props.currentWallpaper)

// 应用壁纸到主内容区
const applyWallpaper = (wallpaperId: string) => {
  const mainContent = document.querySelector('.main-content') as HTMLElement
  if (!mainContent) {
    console.warn('[壁纸] 未找到 .main-content 元素')
    return
  }

  // 移除所有壁纸类
  props.wallpaperList.forEach(wp => {
    mainContent.classList.remove(wp.class)
  })

  // 添加新的壁纸类
  const wallpaper = props.wallpaperList.find(wp => wp.id === wallpaperId)
  if (wallpaper) {
    mainContent.classList.add(wallpaper.class)
    console.log('[壁纸] 已应用:', wallpaper.name)
  }
}

// 切换壁纸
const changeWallpaper = (wallpaperId: string) => {
  selectedWallpaper.value = wallpaperId
  
  // 应用到页面
  applyWallpaper(wallpaperId)
  
  // 保存到 localStorage
  try {
    localStorage.setItem('wallpaper', wallpaperId)
    console.log('[壁纸] 已保存设置')
  } catch (error) {
    console.error('[壁纸] 保存失败:', error)
  }
  
  // 触发事件
  emit('wallpaper-changed', wallpaperId)
}

// 从 localStorage 加载壁纸设置
const loadWallpaperSetting = () => {
  try {
    const saved = localStorage.getItem('wallpaper')
    if (saved && props.wallpaperList.some(wp => wp.id === saved)) {
      selectedWallpaper.value = saved
      console.log('[壁纸] 加载设置:', saved)
      return saved
    }
  } catch (error) {
    console.error('[壁纸] 加载失败:', error)
  }
  return props.currentWallpaper
}

// 监听当前壁纸属性变化
watch(() => props.currentWallpaper, (newValue) => {
  if (newValue !== selectedWallpaper.value) {
    selectedWallpaper.value = newValue
    applyWallpaper(newValue)
  }
})

// 组件挂载时初始化
onMounted(() => {
  const savedWallpaper = loadWallpaperSetting()
  applyWallpaper(savedWallpaper)
})

// 暴露方法给父组件
defineExpose({
  changeWallpaper,
  applyWallpaper,
  selectedWallpaper,
  wallpaperList: props.wallpaperList
})
</script>

<template>
  <div class="wallpaper-manager" style="display: none;">
    <!-- 此组件仅提供功能,不显示UI -->
    <!-- 壁纸选择UI请在 SettingsPanel 中使用 -->
  </div>
</template>

<style scoped>
/* 此组件不显示UI,仅提供功能 */
.wallpaper-manager {
  display: none;
}
</style>
