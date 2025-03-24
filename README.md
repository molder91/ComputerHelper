# ComputerHelper

一个基于Electron的跨平台电脑助手应用，支持macOS和Windows系统。

## 功能特点

- 显示系统信息（操作系统、架构、主机名等）
- 显示CPU详细信息
- 显示内存使用情况
- 跨平台支持（macOS和Windows）
- 现代化UI界面

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
ComputerHelper/
├── src/
│   ├── main/        # 主进程代码
│   ├── renderer/    # 渲染进程代码（前端UI）
│   └── preload/     # 预加载脚本（安全地暴露API）
├── package.json     # 项目配置
└── README.md        # 项目说明
```

## 技术栈

- Electron - 跨平台桌面应用框架
- HTML/CSS/JavaScript - 前端界面
- Node.js - 后端功能

## 许可证

MIT
