# 心动 - 心率监测系统

一个基于 Vue 3 + Three.js 的实时心率监测网页应用，支持通过蓝牙连接心率设备并实时显示心率和心电图。

## 功能特性

- 🔗 **蓝牙连接** - 通过 Web Bluetooth API 连接心率设备
- 💓 **实时心率显示** - 大字体显示当前心率（BPM）
- 📊 **心电图可视化** - Canvas 绘制的实时 ECG 波形
- 🎨 **主题定制** - 支持浅色模式和自定义样式
- 🔊 **音频反馈** - 可选的心跳音效，4种音效类型
- ⚙️ **设置面板** - 丰富的个性化选项
- ⚠️ **心率预警** - 可配置的心率过高/过低预警
- 💾 **历史记录** - 自动缓存历史数据，可配置缓存时长

## 技术栈

- Vue 3 (Composition API)
- TypeScript
- Vite (构建工具)
- Web Bluetooth API
- Canvas API
- Web Audio API

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

- **心率显示**：页面中央显示当前心率数值（像素字体）
- **心电图**：下方显示实时 ECG 波形（医疗网格背景）
- **音效开关**：设置面板中可开关心跳音效，支持4种类型
- **预警设置**：可配置心率过高/过低阈值
- **历史记录**：自动保存历史数据，可配置缓存时长
- **设置面板**：点击右下角悬浮按钮打开设置

### 支持的蓝牙服务

本应用使用标准的蓝牙心率服务：
- Service UUID: `0x180D` (Heart Rate)
- Characteristic UUID: `0x2A37` (Heart Rate Measurement)

任何符合此标准的蓝牙心率设备都应该可以正常工作。

## 项目结构

```
src/
├── components/
│   ├── ECGCanvas.vue           # 心电图绘制组件
│   ├── SettingsPanel.vue       # 设置面板组件
│   ├── HistoryManager.vue      # 历史记录管理组件
│   ├── HeartRateManager.vue    # 心跳值管理组件
│   ├── WallpaperManager.vue    # 壁纸管理组件
│   ├── BluetoothManager.vue    # 蓝牙管理组件
│   ├── AppHeader.vue           # 应用顶部栏组件
│   └── AppFooter.vue           # 应用底部栏组件
├── modules/
│   ├── history.ts              # 历史记录模块（已弃用）
│   ├── heartRate.ts            # 心跳值模块（已弃用）
│   └── index.ts                # 模块导出索引（已弃用）
├── assets/
│   └── main.css                # 全局样式
├── App.vue                     # 主应用组件
└── main.ts                     # 入口文件
```

### 组件化说明

#### 历史记录组件 (HistoryManager.vue)
- **功能**: 管理心率历史记录的存储、加载和清理
- **特性**:
  - 支持配置缓存时长和最大记录数
  - 自动保存到 localStorage
  - 提供时间格式化功能
  - 通过作用域插槽提供灵活的UI定制
  - 事件驱动：record-added, records-cleared, cache-duration-updated
- **使用方式**: 通过 ref 访问组件方法，或通过插槽自定义UI

#### 心跳值组件 (HeartRateManager.vue)
- **功能**: 管理当前心率值的处理和相关功能
- **特性**:
  - 音频反馈功能（4种音效类型）
  - 心率预警检测（过高/过低）
  - 事件驱动：bpm-updated, alert-triggered, audio-toggled 等
  - 隐藏式组件，仅提供功能逻辑
- **使用方式**: 通过 ref 访问组件方法，监听组件事件

#### 壁纸管理组件 (WallpaperManager.vue)
- **功能**: 管理背景壁纸的切换和持久化
- **特性**:
  - 6种精美壁纸预设（渐变+纯色）
  - 自动应用到页面背景
  - localStorage 持久化存储
  - 事件驱动：wallpaper-changed
  - 实时预览效果
- **使用方式**: 
  - 作为隐藏组件提供功能，通过 ref 调用方法
  - SettingsPanel 中的壁纸选择会调用此组件的方法

#### 蓝牙管理组件 (BluetoothManager.vue)
- **功能**: 管理蓝牙心率设备的连接和数据接收
- **特性**:
  - Web Bluetooth API 封装
  - 自动解析心率数据（支持8位和16位格式）
  - 连接状态管理
  - 事件驱动：connected, disconnected, data-received, connection-error
  - 浏览器兼容性检查
  - 自动资源清理
- **使用方式**: 
  - 作为隐藏组件提供功能
  - 通过 ref 调用 connectDevice/disconnectDevice
  - 监听事件获取心率数据和连接状态

这种组件化设计使得代码更加模块化、可复用，并且符合 Vue 的组件化思想。

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

**注意：** 当前项目已移除测试文件，如需添加测试请重新创建。

## 许可证

MIT License

## 致谢

灵感来源于 [心宿](https://xn--n6qv0quslfsn.top/xinsu/v2.1/) 项目

---

**祝您使用愉快！** 💓
