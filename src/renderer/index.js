// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', () => {
  // 添加淡入动画效果
  document.querySelectorAll('.card').forEach((card, index) => {
    if (!card.classList.contains('hidden')) {
      card.classList.add('fade-in');
      card.style.animationDelay = `${index * 0.1}s`;
    }
  });

  // 初始化主题
  initTheme();

  // 获取网络状态
  fetchNetworkStatus();

  // 添加网络控制按钮事件监听
  document.getElementById('toggle-network-btn').addEventListener('click', toggleNetwork);
  
  // 定时刷新网络状态
  setInterval(fetchNetworkStatus, 5000);
  
  // 添加主题切换按钮事件监听
  document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
});

// 存储快捷键设置
const shortcutSettings = {
  hideWindow: 'Escape',
  toggleNetwork: '',
  showWindow: 'Alt+Shift+S',  // 显示窗口快捷键
  hideApp: 'CommandOrControl+Shift+H',  // 隐藏应用快捷键
  autoHideStartup: false,
  startWithSystem: false
};

// 主题设置
let themeSettings = {
  theme: 'system', // 'light', 'dark', 'system'
  backgroundColors: {
    light: {
      color1: '#667eea', // 默认亮色渐变起始色
      color2: '#764ba2'  // 默认亮色渐变结束色
    },
    dark: {
      color1: '#1f2937', // 默认暗色渐变起始色
      color2: '#111827'  // 默认暗色渐变结束色
    }
  }
};

// 存储隐藏的应用列表
let hiddenApps = [];

// 当前正在记录的快捷键输入框
let currentRecordingInput = null;

// 最小化窗口
function minimizeWindow() {
  window.electronAPI.minimizeWindow();
}

// 隐藏窗口
function hideWindow() {
  window.electronAPI.hideWindow();
}

// 从主进程加载快捷键设置和隐藏的应用列表
async function loadShortcutSettings() {
  try {
    const result = await window.electronAPI.loadSettings();
    if (result.success && result.settings) {
      // 更新快捷键设置
      if (result.settings.shortcuts) {
        shortcutSettings.hideWindow = result.settings.shortcuts.hideWindow || 'Escape';
        shortcutSettings.toggleNetwork = result.settings.shortcuts.toggleNetwork || '';
        shortcutSettings.showWindow = result.settings.shortcuts.showWindow || 'Alt+Shift+S';
        shortcutSettings.hideApp = result.settings.shortcuts.hideApp || 'CommandOrControl+Shift+H';
      }
      shortcutSettings.autoHideStartup = result.settings.autoHideStartup || false;
      shortcutSettings.startWithSystem = result.settings.startWithSystem || false;
      
      // 更新隐藏的应用列表
      if (result.settings.hiddenApps) {
        hiddenApps = result.settings.hiddenApps;
        updateHiddenAppsList();
      }

      // 更新主题设置并应用
      if (result.settings.theme) {
        themeSettings.theme = result.settings.theme || 'system';
        console.log('从设置加载主题:', themeSettings.theme);
      }
      
      // 更新背景颜色设置
      if (result.settings.backgroundColors) {
        themeSettings.backgroundColors = result.settings.backgroundColors;
        applyBackgroundColors();
      }
      
      // 更新UI
      updateShortcutInputs();
      updateColorPickers();
      
      return result.settings;
    }
  } catch (e) {
    console.error('加载设置失败:', e);
  }
  return null;
}

// 保存快捷键设置到主进程
async function saveShortcutSettings() {
  // 从输入框获取当前值
  const hideWindowInput = document.getElementById('hide-window-shortcut');
  const toggleNetworkInput = document.getElementById('toggle-network-shortcut');
  const showWindowInput = document.getElementById('show-window-shortcut');
  const hideAppInput = document.getElementById('hide-app-shortcut');
  const autoHideStartupCheckbox = document.getElementById('auto-hide-startup');
  const startWithSystemCheckbox = document.getElementById('start-with-system');
  
  // 获取选中的主题
  const themeLightRadio = document.getElementById('theme-light');
  const themeDarkRadio = document.getElementById('theme-dark');
  const themeSystemRadio = document.getElementById('theme-system');
  
  if (themeLightRadio && themeLightRadio.checked) {
    themeSettings.theme = 'light';
  } else if (themeDarkRadio && themeDarkRadio.checked) {
    themeSettings.theme = 'dark';
  } else if (themeSystemRadio && themeSystemRadio.checked) {
    themeSettings.theme = 'system';
  }
  
  if (hideWindowInput && toggleNetworkInput && showWindowInput && hideAppInput && autoHideStartupCheckbox && startWithSystemCheckbox) {
    shortcutSettings.hideWindow = hideWindowInput.value || 'Escape';
    shortcutSettings.toggleNetwork = toggleNetworkInput.value || '';
    shortcutSettings.showWindow = showWindowInput.value || 'Alt+Shift+S';
    shortcutSettings.hideApp = hideAppInput.value || 'CommandOrControl+Shift+H';
    shortcutSettings.autoHideStartup = autoHideStartupCheckbox.checked;
    shortcutSettings.startWithSystem = startWithSystemCheckbox.checked;
    
    try {
      // 创建要保存的设置对象
      const settings = {
        shortcuts: {
          hideWindow: shortcutSettings.hideWindow,
          toggleNetwork: shortcutSettings.toggleNetwork,
          showWindow: shortcutSettings.showWindow,
          hideApp: shortcutSettings.hideApp
        },
        autoHideStartup: shortcutSettings.autoHideStartup,
        startWithSystem: shortcutSettings.startWithSystem,
        theme: themeSettings.theme,
        backgroundColors: themeSettings.backgroundColors
      };
      
      // 保存设置到主进程
      const result = await window.electronAPI.saveSettings(settings);
      
      if (result.success) {
        // 隐藏设置面板
        const settingsSection = document.getElementById('settings-section');
        if (settingsSection) {
          settingsSection.classList.add('hidden');
        }
        
        // 应用主题和背景颜色
        applyTheme(themeSettings.theme);
        applyBackgroundColors();
        
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

// 初始化主题
async function initTheme() {
  // 加载保存的主题设置
  const settings = await loadShortcutSettings();
  console.log('已加载设置:', settings);
  
  // 监听系统主题变化
  if (window.matchMedia) {
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    console.log('系统主题是否为深色:', darkModeMediaQuery.matches);
    
    // 应用主题设置
    if (themeSettings.theme === 'system') {
      setTheme(darkModeMediaQuery.matches ? 'dark' : 'light', false);
    } else {
      // 直接应用用户选择的主题
      setTheme(themeSettings.theme, false);
    }
    
    // 监听系统主题变化
    darkModeMediaQuery.addEventListener('change', (e) => {
      console.log('系统主题变化:', e.matches ? 'dark' : 'light');
      if (themeSettings.theme === 'system') {
        setTheme(e.matches ? 'dark' : 'light', false);
      }
    });
  } else {
    // 如果浏览器不支持matchMedia，默认使用亮色主题
    setTheme('light', false);
  }
}

// 切换主题
function toggleTheme() {
  const htmlElement = document.documentElement;
  const currentTheme = htmlElement.getAttribute('data-theme');
  
  console.log('点击切换主题按钮，当前主题:', currentTheme);
  
  if (currentTheme === 'dark') {
    themeSettings.theme = 'light';
    setTheme('light', true);
  } else {
    themeSettings.theme = 'dark';
    setTheme('dark', true);
  }
  
  // 更新主题单选按钮状态
  updateThemeRadios();
  
  // 保存主题设置
  saveThemeSetting();
}

// 更新主题单选按钮状态
function updateThemeRadios() {
  const themeLightRadio = document.getElementById('theme-light');
  const themeDarkRadio = document.getElementById('theme-dark');
  const themeSystemRadio = document.getElementById('theme-system');
  
  if (themeLightRadio && themeDarkRadio && themeSystemRadio) {
    themeLightRadio.checked = themeSettings.theme === 'light';
    themeDarkRadio.checked = themeSettings.theme === 'dark';
    themeSystemRadio.checked = themeSettings.theme === 'system';
  }
}

// 应用主题
function applyTheme(themeSetting) {
  console.log('应用主题:', themeSetting);
  if (themeSetting === 'system') {
    // 检测系统主题
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark', false);
    } else {
      setTheme('light', false);
    }
  } else {
    setTheme(themeSetting, false);
  }
}

// 设置主题
function setTheme(theme, savePreference) {
  console.log('设置主题:', theme);
  const htmlElement = document.documentElement;
  
  if (theme === 'dark') {
    htmlElement.setAttribute('data-theme', 'dark');
  } else {
    htmlElement.removeAttribute('data-theme');
  }
  
  // 更新背景颜色
  applyBackgroundColors();
  
  if (savePreference) {
    themeSettings.theme = theme;
    saveThemeSetting();
  }
}

// 保存主题设置
async function saveThemeSetting() {
  try {
    // 创建要保存的设置对象，包含现有设置和主题
    const settings = {
      shortcuts: {
        hideWindow: shortcutSettings.hideWindow,
        toggleNetwork: shortcutSettings.toggleNetwork,
        showWindow: shortcutSettings.showWindow,
        hideApp: shortcutSettings.hideApp
      },
      autoHideStartup: shortcutSettings.autoHideStartup,
      startWithSystem: shortcutSettings.startWithSystem,
      theme: themeSettings.theme,
      backgroundColors: themeSettings.backgroundColors
    };
    
    // 保存设置到主进程
    await window.electronAPI.saveSettings(settings);
  } catch (error) {
    console.error('保存主题设置失败:', error);
  }
}

// 更新设置输入框的显示值
function updateShortcutInputs() {
  const hideWindowInput = document.getElementById('hide-window-shortcut');
  const toggleNetworkInput = document.getElementById('toggle-network-shortcut');
  const showWindowInput = document.getElementById('show-window-shortcut');
  const hideAppInput = document.getElementById('hide-app-shortcut');
  const autoHideStartupCheckbox = document.getElementById('auto-hide-startup');
  const startWithSystemCheckbox = document.getElementById('start-with-system');
  
  // 更新主题单选按钮
  const themeLightRadio = document.getElementById('theme-light');
  const themeDarkRadio = document.getElementById('theme-dark');
  const themeSystemRadio = document.getElementById('theme-system');
  
  if (hideWindowInput && toggleNetworkInput && showWindowInput && hideAppInput) {
    hideWindowInput.value = shortcutSettings.hideWindow || '';
    toggleNetworkInput.value = shortcutSettings.toggleNetwork || '';
    showWindowInput.value = shortcutSettings.showWindow || 'Alt+Shift+S';
    hideAppInput.value = shortcutSettings.hideApp || 'CommandOrControl+Shift+H';
  }
  
  if (autoHideStartupCheckbox) {
    autoHideStartupCheckbox.checked = shortcutSettings.autoHideStartup || false;
  }
  
  if (startWithSystemCheckbox) {
    startWithSystemCheckbox.checked = shortcutSettings.startWithSystem || false;
  }
  
  // 设置主题单选按钮状态
  if (themeLightRadio && themeDarkRadio && themeSystemRadio) {
    themeLightRadio.checked = themeSettings.theme === 'light';
    themeDarkRadio.checked = themeSettings.theme === 'dark';
    themeSystemRadio.checked = themeSettings.theme === 'system';
  }
}

// 初始化快捷键输入框
function initShortcutInputs() {
  const hideWindowInput = document.getElementById('hide-window-shortcut');
  const toggleNetworkInput = document.getElementById('toggle-network-shortcut');
  const showWindowInput = document.getElementById('show-window-shortcut');
  const hideAppInput = document.getElementById('hide-app-shortcut');
  
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
  
  if (hideAppInput) {
    hideAppInput.addEventListener('click', function() {
      startRecordingShortcut(this);
    });
  }
  
  // 初始化主题单选按钮事件
  initThemeRadios();
  
  // 初始化颜色选择器
  initColorPickers();
}

// 初始化主题单选按钮
function initThemeRadios() {
  const themeLightRadio = document.getElementById('theme-light');
  const themeDarkRadio = document.getElementById('theme-dark');
  const themeSystemRadio = document.getElementById('theme-system');
  
  if (themeLightRadio && themeDarkRadio && themeSystemRadio) {
    // 设置初始选中状态
    themeLightRadio.checked = themeSettings.theme === 'light';
    themeDarkRadio.checked = themeSettings.theme === 'dark';
    themeSystemRadio.checked = themeSettings.theme === 'system';
    
    // 添加变更事件
    themeLightRadio.addEventListener('change', function() {
      if (this.checked) {
        themeSettings.theme = 'light';
        applyTheme('light'); // 立即应用新主题
      }
    });
    
    themeDarkRadio.addEventListener('change', function() {
      if (this.checked) {
        themeSettings.theme = 'dark';
        applyTheme('dark'); // 立即应用新主题
      }
    });
    
    themeSystemRadio.addEventListener('change', function() {
      if (this.checked) {
        themeSettings.theme = 'system';
        applyTheme('system'); // 立即应用新主题
      }
    });
  }
}

// 初始化清除按钮
function initClearButtons() {
  const clearHideBtn = document.getElementById('clear-hide-shortcut');
  const clearNetworkBtn = document.getElementById('clear-network-shortcut');
  const clearShowBtn = document.getElementById('clear-show-shortcut');
  const clearHideAppBtn = document.getElementById('clear-hide-app-shortcut');
  
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
  
  if (clearHideAppBtn) {
    clearHideAppBtn.addEventListener('click', () => {
      const input = document.getElementById('hide-app-shortcut');
      if (input) {
        input.value = 'CommandOrControl+Shift+H'; // 重置为默认值
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

// 更新隐藏应用列表
async function updateHiddenAppsList() {
  // 获取隐藏应用列表容器
  const hiddenAppsList = document.getElementById('hidden-apps-list');
  const noHiddenAppsMessage = document.getElementById('no-hidden-apps');
  
  if (!hiddenAppsList) return;
  
  // 清除列表内容，但保留"无隐藏应用"的提示
  for (const child of Array.from(hiddenAppsList.children)) {
    if (child.id !== 'no-hidden-apps') {
      hiddenAppsList.removeChild(child);
    }
  }
  
  // 从主进程获取最新的隐藏应用列表
  try {
    const result = await window.electronAPI.getHiddenApps();
    if (result.success && result.hiddenApps) {
      hiddenApps = result.hiddenApps;
    }
  } catch (error) {
    console.error('获取隐藏应用列表失败:', error);
  }
  
  // 判断是否有隐藏的应用
  if (hiddenApps.length === 0) {
    if (noHiddenAppsMessage) {
      noHiddenAppsMessage.style.display = 'block';
    }
    return;
  }
  
  // 隐藏"无隐藏应用"的提示
  if (noHiddenAppsMessage) {
    noHiddenAppsMessage.style.display = 'none';
  }
  
  // 生成隐藏应用列表
  for (const app of hiddenApps) {
    const appItem = document.createElement('div');
    appItem.className = 'hidden-app-item';
    appItem.dataset.id = app.id;
    
    // 创建应用信息显示区
    const appInfo = document.createElement('div');
    appInfo.className = 'hidden-app-info';
    
    // 应用名称
    const appName = document.createElement('div');
    appName.className = 'hidden-app-name';
    appName.textContent = app.name;
    appInfo.appendChild(appName);
    
    // 应用路径
    const appPath = document.createElement('div');
    appPath.className = 'hidden-app-path';
    appPath.textContent = `路径: ${app.path || '未知'}`;
    appInfo.appendChild(appPath);
    
    // 隐藏时间
    const appTime = document.createElement('div');
    appTime.className = 'hidden-app-time';
    const hideTime = app.hideTime ? new Date(app.hideTime).toLocaleString() : '未知时间';
    appTime.textContent = `隐藏于: ${hideTime}`;
    appInfo.appendChild(appTime);
    
    // 添加应用信息到列表项
    appItem.appendChild(appInfo);
    
    // 创建操作区
    const appActions = document.createElement('div');
    appActions.className = 'hidden-app-actions';
    
    // 恢复按钮
    const restoreBtn = document.createElement('button');
    restoreBtn.className = 'restore-app-btn';
    restoreBtn.textContent = '恢复应用';
    restoreBtn.addEventListener('click', () => restoreHiddenApp(app.id));
    appActions.appendChild(restoreBtn);
    
    // 添加操作区到列表项
    appItem.appendChild(appActions);
    
    // 添加到隐藏应用列表
    hiddenAppsList.appendChild(appItem);
  }
}

// 隐藏当前应用
async function hideCurrentApp() {
  try {
    const result = await window.electronAPI.hideCurrentApp();
    if (result.success) {
      console.log('已隐藏应用:', result.appInfo?.name);
      // 显示隐藏应用列表面板
      showHiddenAppsPanel();
      // 更新隐藏应用列表
      updateHiddenAppsList();
    } else {
      console.error('隐藏应用失败:', result.message);
      alert(`隐藏应用失败: ${result.message || '未知原因'}`);
    }
  } catch (error) {
    console.error('隐藏应用时出错:', error);
    alert('隐藏应用失败，请查看控制台日志');
  }
}

// 恢复隐藏的应用
async function restoreHiddenApp(appId) {
  if (!appId) {
    console.error('未提供有效的应用ID');
    return;
  }
  
  try {
    const result = await window.electronAPI.restoreHiddenApp(appId);
    if (result.success) {
      console.log('已恢复应用:', result.appName);
      // 更新隐藏应用列表
      updateHiddenAppsList();
    } else {
      console.error('恢复应用失败:', result.message);
      alert(`恢复应用失败: ${result.message || '未知原因'}`);
    }
  } catch (error) {
    console.error('恢复应用时出错:', error);
    alert('恢复应用失败，请查看控制台日志');
  }
}

// 显示隐藏应用列表面板
function showHiddenAppsPanel() {
  // 隐藏其他面板
  const settingsSection = document.getElementById('settings-section');
  const networkRepairSection = document.getElementById('network-repair-section');
  
  settingsSection?.classList.add('hidden');
  networkRepairSection?.classList.add('hidden');
  
  // 显示隐藏应用列表面板
  const hiddenAppsSection = document.getElementById('hidden-apps-section');
  hiddenAppsSection?.classList.remove('hidden');
  // 只在面板存在时更新列表
  if (hiddenAppsSection) {
    updateHiddenAppsList();
  }
}

// 隐藏应用列表面板
function hideHiddenAppsPanel() {
  const hiddenAppsSection = document.getElementById('hidden-apps-section');
  hiddenAppsSection?.classList.add('hidden');
}

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
    toggleNetwork();
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
  
  // 隐藏当前应用按钮
  const hideAppBtn = document.getElementById('hide-app-btn');
  hideAppBtn?.addEventListener('click', hideCurrentApp);
  
  // 显示隐藏应用列表按钮
  const showHiddenAppsBtn = document.getElementById('show-hidden-apps-btn');
  showHiddenAppsBtn?.addEventListener('click', showHiddenAppsPanel);
  
  // 关闭隐藏应用列表按钮
  const closeHiddenAppsBtn = document.getElementById('close-hidden-apps-btn');
  closeHiddenAppsBtn?.addEventListener('click', hideHiddenAppsPanel);
  
  // 刷新隐藏应用列表按钮
  const refreshHiddenAppsBtn = document.getElementById('refresh-hidden-apps-btn');
  refreshHiddenAppsBtn?.addEventListener('click', updateHiddenAppsList);
  
  // 监听隐藏应用结果事件
  document.addEventListener('hide-app-result', (event) => {
    const result = event.detail;
    if (result && result.success) {
      console.log('已隐藏应用:', result.appInfo?.name);
      // 显示隐藏应用列表面板
      showHiddenAppsPanel();
      // 更新隐藏应用列表
      updateHiddenAppsList();
    } else {
      const errorMsg = result ? result.message : '未知错误';
      console.error('隐藏应用失败:', errorMsg);
      alert(`隐藏应用失败: ${errorMsg}`);
    }
  });
  minimizeBtn?.addEventListener('click', hideWindow);
  
  // 设置按钮
  const settingsBtn = document.getElementById('settings-btn');
  const settingsSection = document.getElementById('settings-section');
  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
      // 删除该事件监听器，因为已经删除了该按钮
    });
  }
  
  // 添加保存设置按钮事件监听
  const saveSettingsBtn = document.getElementById('save-settings');
  if (saveSettingsBtn) {
    saveSettingsBtn.addEventListener('click', saveShortcutSettings);
  }
  
  // 添加取消设置按钮事件监听
  const cancelSettingsBtn = document.getElementById('cancel-settings');
  if (cancelSettingsBtn) {
    cancelSettingsBtn.addEventListener('click', () => {
      const settingsSection = document.getElementById('settings-section');
      if (settingsSection) {
        settingsSection.classList.add('hidden');
      }
    });
  }
  
  // 初始化快捷键输入框和清除按钮
  initShortcutInputs();
  initClearButtons();
  
  // 加载快捷键设置
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
    } else {
      // 网络已断开
      statusDot.className = 'status-dot disconnected';
      statusText.textContent = status.message || '网络已断开';
      toggleButton.textContent = '恢复网络';
      toggleButton.className = 'action-button success';
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

// 显示网络修复界面
function showNetworkRepair() {
  // 已删除
}

// 隐藏网络修复界面
function hideNetworkRepair() {
  // 已删除
}

// 显示修复状态
function showRepairStatus(message) {
  // 已删除
}

// 隐藏修复状态
function hideRepairStatus() {
  // 已删除
}

// 显示修复结果
function showRepairResult(success, message) {
  // 已删除
}

// 隐藏修复结果
function hideRepairResult() {
  // 已删除
}

// 显示诊断结果
function showDiagnostics() {
  // 已删除
}

// 隐藏诊断结果
function hideDiagnostics() {
  // 已删除
}

// 执行网络修复
async function performNetworkRepair(repairType) {
  // 已删除
}

// 添加按钮波纹效果
function addRippleEffect() {
  // 已删除
}

// 运行网络诊断
async function runNetworkDiagnostics() {
  // 已删除
}

// 初始化颜色选择器
function initColorPickers() {
  const colorPicker1 = document.getElementById('gradient-color-1');
  const colorPicker2 = document.getElementById('gradient-color-2');
  const resetColor1 = document.getElementById('reset-color-1');
  const resetColor2 = document.getElementById('reset-color-2');
  const gradientPreview = document.getElementById('gradient-preview');
  
  if (colorPicker1 && colorPicker2) {
    // 更新颜色选择器的初始值
    updateColorPickers();
    
    // 添加变更事件
    colorPicker1.addEventListener('input', function() {
      const currentTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
      themeSettings.backgroundColors[currentTheme].color1 = this.value;
      updateGradientPreview();
    });
    
    colorPicker2.addEventListener('input', function() {
      const currentTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
      themeSettings.backgroundColors[currentTheme].color2 = this.value;
      updateGradientPreview();
    });
    
    // 重置按钮事件
    resetColor1?.addEventListener('click', function() {
      const currentTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
      const defaultColor = currentTheme === 'dark' ? '#1f2937' : '#667eea';
      themeSettings.backgroundColors[currentTheme].color1 = defaultColor;
      colorPicker1.value = defaultColor;
      updateGradientPreview();
    });
    
    resetColor2?.addEventListener('click', function() {
      const currentTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
      const defaultColor = currentTheme === 'dark' ? '#111827' : '#764ba2';
      themeSettings.backgroundColors[currentTheme].color2 = defaultColor;
      colorPicker2.value = defaultColor;
      updateGradientPreview();
    });
  }
}

// 更新颜色选择器的值
function updateColorPickers() {
  const colorPicker1 = document.getElementById('gradient-color-1');
  const colorPicker2 = document.getElementById('gradient-color-2');
  
  if (colorPicker1 && colorPicker2) {
    const currentTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    colorPicker1.value = themeSettings.backgroundColors[currentTheme].color1;
    colorPicker2.value = themeSettings.backgroundColors[currentTheme].color2;
    updateGradientPreview();
  }
}

// 更新渐变预览
function updateGradientPreview() {
  const gradientPreview = document.getElementById('gradient-preview');
  const currentTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  const color1 = themeSettings.backgroundColors[currentTheme].color1;
  const color2 = themeSettings.backgroundColors[currentTheme].color2;
  
  if (gradientPreview) {
    gradientPreview.style.background = `linear-gradient(135deg, ${color1} 0%, ${color2} 100%)`;
  }
}

// 应用背景颜色
function applyBackgroundColors() {
  const currentTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  const color1 = themeSettings.backgroundColors[currentTheme].color1;
  const color2 = themeSettings.backgroundColors[currentTheme].color2;
  
  // 更新CSS变量
  document.documentElement.style.setProperty('--gradient-color-1', color1);
  document.documentElement.style.setProperty('--gradient-color-2', color2);
  
  // 更新颜色选择器
  updateColorPickers();
}
