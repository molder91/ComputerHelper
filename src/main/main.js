const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, globalShortcut } = require('electron');
const path = require('node:path');
const os = require('node:os');
const { exec } = require('node:child_process');
const util = require('node:util');
const execPromise = util.promisify(exec);
const isDev = process.env.NODE_ENV === 'development' || process.argv.includes('--dev');

// 保持对window对象的全局引用，如果不这么做的话，当JavaScript对象被
// 垃圾回收的时候，window对象将会自动的关闭
let mainWindow;
// 保持对tray对象的全局引用，避免被垃圾回收
let tray = null;

function createWindow() {
  // 创建浏览器窗口
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: path.join(__dirname, '../assets/icon.png')
  });

  // 加载应用的index.html
  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  // 打开开发者工具
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }

  // 当window被关闭，这个事件会被触发
  mainWindow.on('closed', () => {
    // 取消引用window对象，如果你的应用支持多窗口的话，
    // 通常会把多个window对象存放在一个数组里面，
    // 与此同时，你应该删除相应的元素。
    mainWindow = null;
  });
}

// 创建托盘图标
function createTray() {
  try {
    // 创建一个默认的图标
    let icon;
    // 创建一个16x16的空白图标
    icon = nativeImage.createEmpty();
    // 尝试使用应用程序图标
    try {
      const appIcon = nativeImage.createFromPath(path.join(__dirname, '../assets/icon.png'));
      if (!appIcon.isEmpty()) {
        icon = appIcon.resize({ width: 16, height: 16 });
      }
    } catch (e) {
      console.log('使用默认图标');
    }
    
    tray = new Tray(icon);
    const contextMenu = Menu.buildFromTemplate([
    { 
      label: '显示应用', 
      click: () => {
        if (mainWindow) {
          mainWindow.show();
        }
      } 
    },
    { 
      label: '断开网络', 
      click: async () => {
        try {
          await toggleNetwork(false);
        } catch (error) {
          console.error('从托盘断开网络失败:', error);
        }
      } 
    },
    { 
      label: '恢复网络', 
      click: async () => {
        try {
          await toggleNetwork(true);
        } catch (error) {
          console.error('从托盘恢复网络失败:', error);
        }
      } 
    },
    { type: 'separator' },
    { 
      label: '退出', 
      click: () => {
        app.quit();
      } 
    }
  ]);
  tray.setToolTip('网络控制工具');
  tray.setContextMenu(contextMenu);
  
  // 点击托盘图标显示/隐藏主窗口
  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
      }
    }
  });
  } catch (error) {
    console.error('创建托盘图标失败:', error);
    // 如果创建托盘图标失败，不会阻止应用的启动
  }
}

// 封装网络切换功能，以便在托盘菜单中使用
async function toggleNetwork(enable) {
  const platform = process.platform;
  let result = { success: false, message: '不支持的操作系统' };

  try {
    if (platform === 'darwin') {
      // macOS 系统
      if (enable) {
        // 开启网络
        await execPromise('networksetup -setairportpower en0 on');
        await execPromise('networksetup -setnetworkserviceenabled Wi-Fi on');
        await execPromise('networksetup -setnetworkserviceenabled Ethernet on');
        result = { success: true, message: '网络已恢复' };
      } else {
        // 关闭网络
        await execPromise('networksetup -setairportpower en0 off');
        await execPromise('networksetup -setnetworkserviceenabled Wi-Fi off');
        await execPromise('networksetup -setnetworkserviceenabled Ethernet off');
        result = { success: true, message: '网络已断开' };
      }
    } else if (platform === 'win32') {
      // Windows 系统
      if (enable) {
        // 开启网络
        await execPromise('netsh interface set interface "Wi-Fi" enable');
        await execPromise('netsh interface set interface "Ethernet" enable');
        result = { success: true, message: '网络已恢复' };
      } else {
        // 关闭网络
        await execPromise('netsh interface set interface "Wi-Fi" disable');
        await execPromise('netsh interface set interface "Ethernet" disable');
        result = { success: true, message: '网络已断开' };
      }
    } else if (platform === 'linux') {
      // Linux 系统
      if (enable) {
        // 开启网络
        await execPromise('nmcli networking on');
        result = { success: true, message: '网络已恢复' };
      } else {
        // 关闭网络
        await execPromise('nmcli networking off');
        result = { success: true, message: '网络已断开' };
      }
    }
  } catch (error) {
    result = { 
      success: false, 
      message: `操作失败: ${error.message}`,
      error: error.toString()
    };
    console.error('网络操作失败:', error);
  }

  return result;
}

// 注册全局快捷键
function registerGlobalShortcuts() {
  // 注册显示窗口的快捷键 (默认为 Alt+Shift+S)
  try {
    globalShortcut.register('Alt+Shift+S', () => {
      if (mainWindow) {
        mainWindow.show();
        mainWindow.focus();
        console.log('通过全局快捷键显示窗口');
      } else {
        createWindow();
        console.log('通过全局快捷键创建并显示窗口');
      }
    });
    console.log('全局快捷键注册成功');
  } catch (error) {
    console.error('注册全局快捷键失败:', error);
  }
}

// 注册自定义全局快捷键
function registerCustomShortcuts(shortcut) {
  if (!shortcut || shortcut.trim() === '') return false;
  
  try {
    // 先清除之前的显示窗口快捷键
    globalShortcut.unregisterAll();
    
    // 注册新的快捷键
    globalShortcut.register(shortcut, () => {
      if (mainWindow) {
        mainWindow.show();
        mainWindow.focus();
        console.log(`通过自定义快捷键 ${shortcut} 显示窗口`);
      } else {
        createWindow();
        console.log(`通过自定义快捷键 ${shortcut} 创建并显示窗口`);
      }
    });
    console.log(`自定义快捷键 ${shortcut} 注册成功`);
    return true;
  } catch (error) {
    console.error(`注册自定义快捷键 ${shortcut} 失败:`, error);
    // 如果注册失败，恢复默认快捷键
    registerGlobalShortcuts();
    return false;
  }
}

// 当Electron完成初始化并准备创建浏览器窗口的时候
// 这个方法会被调用。部分API在ready事件触发后才能使用。
app.whenReady().then(() => {
  createWindow();
  createTray();
  registerGlobalShortcuts();

  app.on('activate', () => {
    // 在macOS上，当点击dock图标并且没有其他窗口打开的时候，
    // 通常在应用程序中重新创建一个窗口。
    if (mainWindow === null) createWindow();
  });
});

// 当全部窗口关闭时退出
app.on('window-all-closed', () => {
  // 在macOS上，除非用户用Cmd + Q确定地退出，
  // 否则绝大部分应用及其菜单栏会保持激活。
  if (process.platform !== 'darwin') app.quit();
});

// 当应用退出前注销所有快捷键
app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

// 添加关闭窗口事件处理，改为隐藏窗口而不是关闭
ipcMain.handle('hide-window', () => {
  if (mainWindow) {
    mainWindow.hide();
    return { success: true };
  }
  return { success: false, message: '窗口不存在' };
});

// 设置开机自启动
ipcMain.handle('set-auto-launch', (event, enable) => {
  try {
    if (!isDev) { // 开发模式下不设置自启动
      app.setLoginItemSettings({
        openAtLogin: enable,
        openAsHidden: true, // 以隐藏状态启动
        path: process.execPath
      });
    }
    return { success: true };
  } catch (error) {
    console.error('设置自启动失败:', error);
    return { success: false, message: error.message };
  }
});

// 在这个文件中，你可以续写应用剩下主进程代码。
// 也可以拆分成几个文件，然后用require导入。

// 获取系统信息的IPC处理器
ipcMain.handle('get-system-info', () => {
  return {
    platform: process.platform,
    arch: process.arch,
    hostname: os.hostname(),
    cpus: os.cpus(),
    totalMemory: os.totalmem(),
    freeMemory: os.freemem(),
    uptime: os.uptime(),
    userInfo: os.userInfo(),
  };
});

// 断网功能的IPC处理器
ipcMain.handle('toggle-network', async (event, enable) => {
  const platform = process.platform;
  let result = { success: false, message: '不支持的操作系统' };

  try {
    if (platform === 'darwin') {
      // macOS 系统
      if (enable) {
        // 开启网络
        await execPromise('networksetup -setairportpower en0 on');
        await execPromise('networksetup -setnetworkserviceenabled Wi-Fi on');
        await execPromise('networksetup -setnetworkserviceenabled Ethernet on');
        result = { success: true, message: '网络已恢复' };
      } else {
        // 关闭网络
        await execPromise('networksetup -setairportpower en0 off');
        await execPromise('networksetup -setnetworkserviceenabled Wi-Fi off');
        await execPromise('networksetup -setnetworkserviceenabled Ethernet off');
        result = { success: true, message: '网络已断开' };
      }
    } else if (platform === 'win32') {
      // Windows 系统
      if (enable) {
        // 开启网络
        await execPromise('netsh interface set interface "Wi-Fi" enable');
        await execPromise('netsh interface set interface "Ethernet" enable');
        result = { success: true, message: '网络已恢复' };
      } else {
        // 关闭网络
        await execPromise('netsh interface set interface "Wi-Fi" disable');
        await execPromise('netsh interface set interface "Ethernet" disable');
        result = { success: true, message: '网络已断开' };
      }
    } else if (platform === 'linux') {
      // Linux 系统
      if (enable) {
        // 开启网络
        await execPromise('nmcli networking on');
        result = { success: true, message: '网络已恢复' };
      } else {
        // 关闭网络
        await execPromise('nmcli networking off');
        result = { success: true, message: '网络已断开' };
      }
    }
  } catch (error) {
    result = { 
      success: false, 
      message: `操作失败: ${error.message}`,
      error: error.toString()
    };
    console.error('网络操作失败:', error);
  }

  return result;
});

// 获取网络状态的IPC处理器
ipcMain.handle('get-network-status', async () => {
  const platform = process.platform;
  let result = { connected: false, message: '不支持的操作系统' };

  console.log('正在获取网络状态，平台:', platform);
  
  try {
    if (platform === 'darwin') {
      // macOS 系统
      try {
        console.log('执行 macOS 网络状态检查命令');
        const { stdout } = await execPromise('networksetup -getairportpower en0');
        console.log('macOS 网络状态输出:', stdout);
        result.connected = stdout.includes('On');
        result.message = result.connected ? '网络已连接' : '网络已断开';
      } catch (macError) {
        console.error('macOS 网络检查失败，尝试备用方法:', macError);
        // 备用方法：检查是否可以 ping 通 DNS 服务器
        try {
          await execPromise('ping -c 1 -W 1 8.8.8.8');
          result.connected = true;
          result.message = '网络已连接 (备用检测)';
        } catch (pingError) {
          result.connected = false;
          result.message = '网络已断开 (备用检测)';
        }
      }
    } else if (platform === 'win32') {
      // Windows 系统
      console.log('执行 Windows 网络状态检查命令');
      const { stdout } = await execPromise('netsh interface show interface');
      console.log('Windows 网络状态输出:', stdout);
      result.connected = stdout.includes('Connected');
      result.message = result.connected ? '网络已连接' : '网络已断开';
    } else if (platform === 'linux') {
      // Linux 系统
      console.log('执行 Linux 网络状态检查命令');
      const { stdout } = await execPromise('nmcli networking');
      console.log('Linux 网络状态输出:', stdout);
      result.connected = stdout.trim() === 'enabled';
      result.message = result.connected ? '网络已连接' : '网络已断开';
    }
  } catch (error) {
    console.error('获取网络状态失败 (详细):', error);
    result = { 
      connected: false, 
      message: `获取网络状态失败: ${error.message}`,
      error: error.toString()
    };
  }

  console.log('返回网络状态结果:', result);
  return result;
});

// 最小化窗口的IPC处理器
ipcMain.handle('minimize-window', () => {
  if (mainWindow) {
    mainWindow.minimize();
    return { success: true };
  }
  return { success: false, message: '窗口不存在' };
});
