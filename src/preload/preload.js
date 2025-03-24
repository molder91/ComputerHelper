const { contextBridge, ipcRenderer } = require('electron');

// 暴露受保护的API给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 获取系统信息
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
  
  // 网络控制API
  toggleNetwork: (enable) => ipcRenderer.invoke('toggle-network', enable),
  getNetworkStatus: () => ipcRenderer.invoke('get-network-status'),
  
  // 窗口控制API
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  hideWindow: () => ipcRenderer.invoke('hide-window'),
  
  // 系统设置API
  setAutoLaunch: (enable) => ipcRenderer.invoke('set-auto-launch', enable),
  
  // 快捷键设置API
  setShowWindowShortcut: (shortcut) => ipcRenderer.invoke('set-show-window-shortcut', shortcut),
  
  // 设置保存和加载API
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  loadSettings: () => ipcRenderer.invoke('load-settings'),
});

// 可以在这里添加其他预加载逻辑
console.log('预加载脚本已执行');
