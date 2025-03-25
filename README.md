# Computer Helper

一个基于Electron的跨平台桌面应用，提供网络控制和系统工具功能，支持macOS和Windows系统。

## 功能特点

- 网络控制：快速断开和恢复网络连接
- 网络修复：提供基本、DNS、IP和高级网络修复工具
- 应用管理：隐藏和恢复其他应用程序
- 全局快捷键：支持自定义快捷键操作
- 系统集成：支持开机自启动和托盘模式
- 跨平台支持：macOS、Windows和Linux
- 现代化UI界面：简洁易用的用户界面

## 开发环境设置

### 前提条件

- Node.js (推荐v16+)
- pnpm 或 yarn

### 安装依赖

使用pnpm:

```bash
pnpm install
```

或使用yarn:

```bash
yarn
```

### 开发模式运行

使用pnpm:

```bash
pnpm dev
```

或使用yarn:

```bash
yarn dev
```

### 构建应用

构建所有平台:

```bash
pnpm build
```

仅构建macOS版本:

```bash
pnpm build:mac
```

仅构建Windows版本:

```bash
pnpm build:win
```

## 项目结构

```
Computer Helper/
├── src/
│   ├── assets/      # 图标和资源文件
│   │   ├── icon.png
│   │   ├── icon.svg
│   │   ├── tray-icon.png
│   │   └── tray-icon.svg
│   ├── main/        # 主进程代码
│   │   └── main.js
│   ├── preload/     # 预加载脚本（安全地暴露API）
│   │   └── preload.js
│   ├── renderer/    # 渲染进程代码（前端UI）
│   │   ├── index.html
│   │   ├── index.js
│   │   └── styles.css
│   └── scripts/     # 系统脚本
│       ├── hide_app.scpt
│       ├── restore_app.scpt
│       ├── restore_network.scpt
│       ├── restore_network.sh
│       └── wifi_on.sh
├── package.json     # 项目配置
├── pnpm-lock.yaml   # 依赖锁定文件
└── README.md        # 项目说明
```

## 技术栈

- Electron - 跨平台桌面应用框架
- HTML/CSS/JavaScript - 前端界面
- Node.js - 后端功能

## 许可证

MIT
