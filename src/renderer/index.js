// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', () => {
  // 获取网络状态
  fetchNetworkStatus();

  // 添加网络控制按钮事件监听
  document.getElementById('network-toggle-btn').addEventListener('click', toggleNetworkQuick);
  document.getElementById('toggle-network-btn').addEventListener('click', toggleNetwork);
  
  // 添加最小化窗口按钮事件监听
  document.getElementById('minimize-btn').addEventListener('click', minimizeWindow);
  
  // 定时刷新网络状态
  setInterval(fetchNetworkStatus, 5000);
});

// 最小化窗口
function minimizeWindow() {
  window.electronAPI.minimizeWindow();
}

// 隐藏窗口
function hideWindow() {
  window.electronAPI.hideWindow();
}

// 存储快捷键设置
const shortcutSettings = {
  hideWindow: 'Escape',
  toggleNetwork: '',
  showWindow: 'Alt+Shift+S',  // 新增显示窗口快捷键
  autoHideStartup: false,
  startWithSystem: false
};

// 当前正在记录的快捷键输入框
let currentRecordingInput = null;

// 从主进程加载快捷键设置
async function loadShortcutSettings() {
  try {
    const result = await window.electronAPI.loadSettings();
    if (result.success && result.settings) {
      // 更新快捷键设置
      if (result.settings.shortcuts) {
        shortcutSettings.hideWindow = result.settings.shortcuts.hideWindow || 'Escape';
        shortcutSettings.toggleNetwork = result.settings.shortcuts.toggleNetwork || '';
        shortcutSettings.showWindow = result.settings.shortcuts.showWindow || 'Alt+Shift+S';
      }
      shortcutSettings.autoHideStartup = result.settings.autoHideStartup || false;
      shortcutSettings.startWithSystem = result.settings.startWithSystem || false;
      
      // 更新UI
      updateShortcutInputs();
    }
  } catch (e) {
    console.error('加载快捷键设置失败:', e);
  }
}

// 保存快捷键设置到主进程
async function saveShortcutSettings() {
  // 从输入框获取当前值
  const hideWindowInput = document.getElementById('hide-window-shortcut');
  const toggleNetworkInput = document.getElementById('toggle-network-shortcut');
  const showWindowInput = document.getElementById('show-window-shortcut');
  const autoHideStartupCheckbox = document.getElementById('auto-hide-startup');
  const startWithSystemCheckbox = document.getElementById('start-with-system');
  
  if (hideWindowInput && toggleNetworkInput && showWindowInput && autoHideStartupCheckbox && startWithSystemCheckbox) {
    shortcutSettings.hideWindow = hideWindowInput.value || 'Escape';
    shortcutSettings.toggleNetwork = toggleNetworkInput.value || '';
    shortcutSettings.showWindow = showWindowInput.value || 'Alt+Shift+S';
    shortcutSettings.autoHideStartup = autoHideStartupCheckbox.checked;
    shortcutSettings.startWithSystem = startWithSystemCheckbox.checked;
    
    try {
      // 创建要保存的设置对象
      const settings = {
        shortcuts: {
          hideWindow: shortcutSettings.hideWindow,
          toggleNetwork: shortcutSettings.toggleNetwork,
          showWindow: shortcutSettings.showWindow
        },
        autoHideStartup: shortcutSettings.autoHideStartup,
        startWithSystem: shortcutSettings.startWithSystem
      };
      
      // 保存设置到主进程
      const result = await window.electronAPI.saveSettings(settings);
      
      if (result.success) {
        // 隐藏设置面板
        const settingsSection = document.getElementById('settings-section');
        if (settingsSection) {
          settingsSection.classList.add('hidden');
        }
        
        // 显示保存成功提示
        alert('设置已保存');
      } else {
        alert(`保存设置失败: ${result.message || '未知错误'}`);
      }
    } catch (error) {
      console.error('保存设置异常:', error);
      alert('保存设置失败，请查看控制台了解详情');
    }
  }
}

// 更新设置输入框的显示值
function updateShortcutInputs() {
  const hideWindowInput = document.getElementById('hide-window-shortcut');
  const toggleNetworkInput = document.getElementById('toggle-network-shortcut');
  const showWindowInput = document.getElementById('show-window-shortcut');
  const autoHideStartupCheckbox = document.getElementById('auto-hide-startup');
  const startWithSystemCheckbox = document.getElementById('start-with-system');
  
  if (hideWindowInput && toggleNetworkInput && showWindowInput) {
    hideWindowInput.value = shortcutSettings.hideWindow || '';
    toggleNetworkInput.value = shortcutSettings.toggleNetwork || '';
    showWindowInput.value = shortcutSettings.showWindow || 'Alt+Shift+S';
  }
  
  if (autoHideStartupCheckbox) {
    autoHideStartupCheckbox.checked = shortcutSettings.autoHideStartup || false;
  }
  
  if (startWithSystemCheckbox) {
    startWithSystemCheckbox.checked = shortcutSettings.startWithSystem || false;
  }
}

// 初始化快捷键输入框
function initShortcutInputs() {
  const hideWindowInput = document.getElementById('hide-window-shortcut');
  const toggleNetworkInput = document.getElementById('toggle-network-shortcut');
  const showWindowInput = document.getElementById('show-window-shortcut');
  
  // 初始化输入框值
  updateShortcutInputs();
  
  // 添加点击事件监听器
  if (hideWindowInput) {
    hideWindowInput.addEventListener('click', function() {
      startRecordingShortcut(this);
    });
  }
  
  if (toggleNetworkInput) {
    toggleNetworkInput.addEventListener('click', function() {
      startRecordingShortcut(this);
    });
  }
  
  if (showWindowInput) {
    showWindowInput.addEventListener('click', function() {
      startRecordingShortcut(this);
    });
  }
}

// 初始化清除按钮
function initClearButtons() {
  const clearHideBtn = document.getElementById('clear-hide-shortcut');
  const clearNetworkBtn = document.getElementById('clear-network-shortcut');
  const clearShowBtn = document.getElementById('clear-show-shortcut');
  
  if (clearHideBtn) {
    clearHideBtn.addEventListener('click', () => {
      const input = document.getElementById('hide-window-shortcut');
      if (input) {
        input.value = '';
      }
    });
  }
  
  if (clearNetworkBtn) {
    clearNetworkBtn.addEventListener('click', () => {
      const input = document.getElementById('toggle-network-shortcut');
      if (input) {
        input.value = '';
      }
    });
  }
  
  if (clearShowBtn) {
    clearShowBtn.addEventListener('click', () => {
      const input = document.getElementById('show-window-shortcut');
      if (input) {
        input.value = 'Alt+Shift+S'; // 重置为默认值
      }
    });
  }
}

// 开始记录快捷键
function startRecordingShortcut(inputElement) {
  // 如果有其他输入框正在记录，停止它
  if (currentRecordingInput && currentRecordingInput !== inputElement) {
    currentRecordingInput.classList.remove('recording');
  }
  
  // 设置当前输入框为记录状态
  currentRecordingInput = inputElement;
  inputElement.classList.add('recording');
  inputElement.value = '请按下快捷键...';
  
  // 添加一次性键盘事件监听器
  const recordShortcut = (e) => {
    e.preventDefault();
    
    // 忽略单独的修饰键
    if (['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) {
      return;
    }
    
    // 构建快捷键字符串
    const shortcut = [];
    if (e.ctrlKey) shortcut.push('Ctrl');
    if (e.altKey) shortcut.push('Alt');
    if (e.shiftKey) shortcut.push('Shift');
    if (e.metaKey) shortcut.push('Meta');
    
    // 添加实际按键
    shortcut.push(e.key);
    
    // 设置输入框值
    inputElement.value = shortcut.join('+');
    inputElement.classList.remove('recording');
    
    // 移除事件监听器
    window.removeEventListener('keydown', recordShortcut);
    currentRecordingInput = null;
  };
  
  // 添加事件监听器
  window.addEventListener('keydown', recordShortcut);
}

// 在页面加载时加载快捷键设置
document.addEventListener('DOMContentLoaded', () => {
  loadShortcutSettings();
});

// 添加键盘快捷键
window.addEventListener('keydown', (event) => {
  // 如果正在记录快捷键，不触发快捷键功能
  if (currentRecordingInput) return;
  
  // 隐藏窗口快捷键
  if (shortcutSettings.hideWindow && isMatchingShortcut(event, shortcutSettings.hideWindow)) {
    hideWindow();
    event.preventDefault();
  }
  
  // 断网快捷键
  if (shortcutSettings.toggleNetwork && isMatchingShortcut(event, shortcutSettings.toggleNetwork)) {
    toggleNetworkQuick();
    event.preventDefault();
  }
});

// 检查事件是否匹配快捷键
function isMatchingShortcut(event, shortcut) {
  if (!shortcut) return false;
  
  const parts = shortcut.split('+');
  const key = parts[parts.length - 1].toLowerCase();
  const hasCtrl = parts.includes('Ctrl');
  const hasAlt = parts.includes('Alt');
  const hasShift = parts.includes('Shift');
  const hasMeta = parts.includes('Meta'); // Meta 是 macOS 上的 Command 键
  
  return event.key.toLowerCase() === key &&
         event.ctrlKey === hasCtrl &&
         event.altKey === hasAlt &&
         event.shiftKey === hasShift &&
         event.metaKey === hasMeta;
}

// 初始化UI和事件监听
document.addEventListener('DOMContentLoaded', () => {
  // 隐藏窗口按钮
  const minimizeBtn = document.getElementById('minimize-btn');
  if (minimizeBtn) {
    minimizeBtn.addEventListener('click', hideWindow);
  }
  
  // 设置按钮
  const settingsBtn = document.getElementById('settings-btn');
  const settingsSection = document.getElementById('settings-section');
  if (settingsBtn && settingsSection) {
    settingsBtn.addEventListener('click', () => {
      settingsSection.classList.toggle('hidden');
      // 如果设置面板显示，加载最新设置并更新输入框
      if (!settingsSection.classList.contains('hidden')) {
        loadShortcutSettings().then(() => {
          updateShortcutInputs();
        });
      }
    });
  }
  
  // 取消设置按钮
  const cancelSettingsBtn = document.getElementById('cancel-settings');
  if (cancelSettingsBtn && settingsSection) {
    cancelSettingsBtn.addEventListener('click', () => {
      settingsSection.classList.add('hidden');
    });
  }
  
  // 保存设置按钮
  const saveSettingsBtn = document.getElementById('save-settings');
  if (saveSettingsBtn) {
    saveSettingsBtn.addEventListener('click', saveShortcutSettings);
  }
  
  // 初始化快捷键输入框
  initShortcutInputs();
  
  // 初始化清除按钮
  initClearButtons();
  
  // 加载设置
  loadShortcutSettings();
  
  // 如果设置了启动时自动隐藏窗口，则自动隐藏
  if (shortcutSettings.autoHideStartup) {
    setTimeout(() => {
      hideWindow();
    }, 1000); // 延迟1秒隐藏，让用户有时间看到窗口
  }
});

// 格式化CPU时间
function formatTime(ms) {
  const seconds = ms / 1000;
  const minutes = seconds / 60;
  const hours = minutes / 60;
  
  if (hours >= 1) {
    return `${hours.toFixed(2)}小时`;
  }
  if (minutes >= 1) {
    return `${minutes.toFixed(2)}分钟`;
  }
  return `${seconds.toFixed(2)}秒`;
}

// 获取网络状态
async function fetchNetworkStatus() {
  try {
    const statusDot = document.getElementById('network-status-dot');
    const statusText = document.getElementById('network-status-text');
    const toggleButton = document.getElementById('toggle-network-btn');
    const quickToggleButton = document.getElementById('network-toggle-btn');
    
    // 显示加载中状态
    statusDot.className = 'status-dot';
    statusText.textContent = '正在检测网络状态...';
    
    const status = await window.electronAPI.getNetworkStatus();
    
    if (status.connected) {
      // 网络已连接
      statusDot.className = 'status-dot connected';
      statusText.textContent = status.message || '网络已连接';
      toggleButton.textContent = '断开网络';
      toggleButton.className = 'action-button danger';
      quickToggleButton.textContent = '一键断网';
      quickToggleButton.className = 'tool-button network-toggle connected';
    } else {
      // 网络已断开
      statusDot.className = 'status-dot disconnected';
      statusText.textContent = status.message || '网络已断开';
      toggleButton.textContent = '恢复网络';
      toggleButton.className = 'action-button success';
      quickToggleButton.textContent = '恢复网络';
      quickToggleButton.className = 'tool-button network-toggle disconnected';
    }
    
    return status.connected;
  } catch (error) {
    console.error('获取网络状态失败:', error);
    const statusDot = document.getElementById('network-status-dot');
    const statusText = document.getElementById('network-status-text');
    
    statusDot.className = 'status-dot';
    statusText.textContent = `获取网络状态失败: ${error.message || error}`;
    return false;
  }
}

// 切换网络状态
async function toggleNetwork() {
  try {
    const statusDot = document.getElementById('network-status-dot');
    const statusText = document.getElementById('network-status-text');
    const toggleButton = document.getElementById('toggle-network-btn');
    
    // 获取当前网络状态
    const isConnected = await fetchNetworkStatus();
    
    // 显示加载中状态
    statusDot.className = 'status-dot pulse';
    statusText.textContent = isConnected ? '正在断开网络...' : '正在恢复网络...';
    toggleButton.disabled = true;
    
    // 调用切换网络状态API
    const result = await window.electronAPI.toggleNetwork(!isConnected);
    
    // 更新UI
    toggleButton.disabled = false;
    await fetchNetworkStatus();
    
    // 显示操作结果
    if (!result.success) {
      statusText.textContent = result.message || '操作失败';
    }
  } catch (error) {
    console.error('切换网络状态失败:', error);
    const statusText = document.getElementById('network-status-text');
    statusText.textContent = `切换网络状态失败: ${error.message || error}`;
    document.getElementById('toggle-network-btn').disabled = false;
  }
}

// 一键断网/恢复网络
async function toggleNetworkQuick() {
  try {
    const quickToggleButton = document.getElementById('network-toggle-btn');
    
    // 获取当前网络状态
    const isConnected = await fetchNetworkStatus();
    
    // 显示加载中状态
    quickToggleButton.disabled = true;
    quickToggleButton.textContent = isConnected ? '正在断开...' : '正在恢复...';
    
    // 调用切换网络状态API
    await window.electronAPI.toggleNetwork(!isConnected);
    
    // 更新UI
    quickToggleButton.disabled = false;
    await fetchNetworkStatus();
  } catch (error) {
    console.error('快速切换网络状态失败:', error);
    const quickToggleButton = document.getElementById('network-toggle-btn');
    quickToggleButton.disabled = false;
    quickToggleButton.textContent = '操作失败';
    await fetchNetworkStatus();
  }
}
