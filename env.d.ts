/// <reference types="vite/client" />

// Web Bluetooth API 类型声明
interface Navigator {
  bluetooth?: {
    requestDevice(options?: RequestDeviceOptions): Promise<BluetoothDevice>
  }
}

interface RequestDeviceOptions {
  filters?: Array<{
    services?: string[]
  }>
  optionalServices?: string[]
}

interface BluetoothDevice extends EventTarget {
  id: string
  name?: string
  gatt?: BluetoothRemoteGATTServer
  addEventListener(
    type: 'gattserverdisconnected',
    listener: (this: BluetoothDevice, ev: Event) => any,
    options?: boolean | AddEventListenerOptions
  ): void
}

interface BluetoothRemoteGATTServer {
  connected: boolean
  connect(): Promise<BluetoothRemoteGATTServer>
  disconnect(): void
  getPrimaryService(service: string): Promise<BluetoothRemoteGATTService>
}

interface BluetoothRemoteGATTService {
  getCharacteristic(characteristic: string): Promise<BluetoothRemoteGATTCharacteristic>
}

interface BluetoothRemoteGATTCharacteristic extends EventTarget {
  value?: DataView
  startNotifications(): Promise<BluetoothRemoteGATTCharacteristic>
  stopNotifications(): Promise<BluetoothRemoteGATTCharacteristic>
  addEventListener(
    type: 'characteristicvaluechanged',
    listener: (this: BluetoothRemoteGATTCharacteristic, ev: Event) => any,
    options?: boolean | AddEventListenerOptions
  ): void
}
