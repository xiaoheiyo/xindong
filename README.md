# 心动 - 心率监测系统

一个基于 Vue 3 + Three.js 的实时心率监测网页应用，支持通过蓝牙连接心率设备并实时显示心率和心电图。

## 功能特性

- 🔗 **蓝牙连接** - 通过 Web Bluetooth API 连接心率设备
- 💓 **实时心率显示** - 大字体显示当前心率（BPM）
- 📊 **心电图可视化** - Canvas 绘制的实时 ECG 波形
- ✨ **3D粒子背景** - Three.js 实现的动态粒子效果
- 🎨 **主题定制** - 支持深色/浅色模式和自定义主题色
- 🔊 **音频反馈** - 可选的心跳音效
- ⚙️ **设置面板** - 丰富的个性化选项

## 技术栈

- Vue 3 (Composition API)
- TypeScript
- Three.js (3D 图形)
- Vite (构建工具)
- Web Bluetooth API
- Canvas API

## 浏览器要求

**重要：** 需要使用支持 Web Bluetooth API 的浏览器

推荐浏览器：
- ✅ Chrome (桌面版/安卓版)
- ✅ Edge (桌面版)
- ❌ Firefox (不支持 Web Bluetooth)
- ❌ Safari (不支持 Web Bluetooth)

## 安装和运行

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

访问 http://localhost:5174/

### 构建生产版本

```bash
npm run build
```

### 预览生产构建

```bash
npm run preview
```

## 使用方法

### 连接心率设备

1. 确保您的心率设备已开启蓝牙广播功能
   - 智能手表/手环：在设置中开启"心率广播"或"心率共享"
   - 心率带：按照设备说明开启广播模式

2. 点击页面顶部的"连接设备"按钮

3. 在弹出的设备列表中选择您的心率设备

4. 授权后即可实时监测心率

### 功能说明

- **心率显示**：页面中央显示当前心率数值
- **心电图**：下方显示实时 ECG 波形
- **音效开关**：顶部可开关心跳音效
- **设置面板**：点击"设置"按钮可自定义外观

### 支持的蓝牙服务

本应用使用标准的蓝牙心率服务：
- Service UUID: `0x180D` (Heart Rate)
- Characteristic UUID: `0x2A37` (Heart Rate Measurement)

任何符合此标准的蓝牙心率设备都应该可以正常工作。

## 项目结构

```
src/
├── components/
│   ├── ParticleBackground.vue  # 3D粒子背景组件
│   ├── ECGCanvas.vue           # 心电图绘制组件
│   └── SettingsPanel.vue       # 设置面板组件
├── assets/
│   └── main.css                # 全局样式
├── App.vue                     # 主应用组件
└── main.ts                     # 入口文件
```

## 注意事项

⚠️ **免责声明**

- 本应用仅供娱乐和演示用途
- 心电图是基于心率数据模拟生成的，不具备医疗诊断价值
- 不能替代专业医疗设备
- 如有健康问题，请咨询专业医生

## 常见问题

### Q: 为什么无法连接设备？

A: 请检查以下几点：
1. 浏览器是否支持 Web Bluetooth API（推荐使用 Chrome 或 Edge）
2. 心率设备是否开启了广播模式
3. 设备是否已与其他应用断开连接
4. 电脑/手机的蓝牙功能是否已开启

### Q: 连接后立即断开？

A: 可能是以下原因：
1. 设备电池电量不足
2. 信号干扰或距离过远
3. 设备同时连接到其他应用

### Q: 心电图是真实的吗？

A: 不是。心电图是根据接收到的心率数值（BPM）模拟生成的波形，仅用于可视化展示，不能作为医疗诊断依据。

## 开发

### 代码规范

项目使用以下工具保持代码质量：
- ESLint - 代码检查
- Prettier - 代码格式化
- TypeScript - 类型检查

### 运行测试

```bash
npm run test:unit
```

## 许可证

MIT License

## 致谢

灵感来源于 [心宿](https://xn--n6qv0quslfsn.top/xinsu/v2.1/) 项目

---

**祝您使用愉快！** 💓
