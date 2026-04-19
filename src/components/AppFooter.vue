<template>
  <footer class="footer">
    <div class="footer-content">
      <div class="warning-info">
        警告：心电图像是心率模拟结果，仅供娱乐，切勿代替医疗器械
      </div>
      <div class="footer-info">
        <a href="https://www.heiu.top" target="_blank">嘿哟博客</a>提供支持 |
        <a href="https://github.com/xiaoheiyo/xindong" target="_blank">心跳</a>项目 | 基于
        <a href="https://cn.vitejs.dev/" target="_blank">Vue 3</a>制作
      </div>
    </div>
  </footer>
</template>

<style scoped>
/* 底部 */
.footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  padding: 15px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  z-index: 100;
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  text-align: center;
}

.warning-info {
  color: #ffa500;
  font-size: 12px;
  margin-bottom: 8px;
}

.footer-info {
  color: #fff;
  font-size: 12px;
  opacity: 0.7;
}

.footer-info a {
  color: #9acd32;
  text-decoration: none;
  transition: all 0.3s;
}

.footer-info a:hover {
  color: #7ec850;
  text-decoration: underline;
}

/* 浅色模式适配 */
.light-mode .footer {
  background: rgba(255, 255, 255, 0.9);
  border-color: rgba(0, 0, 0, 0.1);
}

.light-mode .footer-info {
  color: #333;
}

.light-mode .footer-info a {
  color: #6abf4b;
}

.light-mode .footer-info a:hover {
  color: #4a9f2b;
}
</style>
