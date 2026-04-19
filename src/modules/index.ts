/**
 * 模块导出索引
 * 方便统一导入各个模块
 */

export { historyManager, default as HeartRateHistoryManager } from './history'
export type { HeartRateRecord, HistoryOptions } from './history'

export { heartRateManager, default as HeartRateManager } from './heartRate'
export type { AlertSettings, AudioType, AlertCallback } from './heartRate'
