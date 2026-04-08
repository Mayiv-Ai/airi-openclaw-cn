# AIRI × OpenClaw-CN 集成

> 🎯 AIRI Web 版 + OpenClaw-CN 中文语音合成 + Chat 对话

[![GitHub Repo](https://img.shields.io/badge/GitHub-Mayiv--Ai%2Fairi--openclaw--cn-24292e?style=flat-square&logo=github)](https://github.com/Mayiv-Ai/airi-openclaw-cn)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

## ✨ 功能

- ✅ **Chat Provider** — 通过 HTTP Bridge 连接 OpenClaw-CN Gateway
- ✅ **Edge TTS** — 基于微软 Edge TTS 的多语言语音合成
- ✅ **MiMo TTS** — 小米 MiMo-V2-TTS 语音合成（限时免费）
- ✅ **专用配置页面** — 独立的 Provider 设置通道
- ✅ **自动配置** — 首次访问自动初始化

## 🏗️ 架构

```
┌──────────────────────────────────────────────────┐
│                AIRI Web 前端 (:5173)              │
│  ┌──────────────────┐  ┌───────────────────────┐  │
│  │ openclaw-cn      │  │ openclaw-cn-speech    │  │
│  │ (Chat Provider)  │  │ (TTS Provider)        │  │
│  └────────┬─────────┘  └───────────┬───────────┘  │
└───────────┼────────────────────────┼──────────────┘
            │                        │
     ┌──────┴──────┐         ┌──────┴──────┐
     ▼             │         ▼             │
┌─────────┐        │   ┌──────────┐  ┌─────┴──────┐
│ Chat    │ (:3003)│   │ Edge TTS │  │ MiMo TTS   │
│ Bridge  │        │   │ (:5007)  │  │ (:5007)    │
└────┬────┘        │   └────┬─────┘  └────┬───────┘
     │             │        │              │
     ▼             │        ▼              ▼
┌─────────┐        │   ┌──────────────────────┐
│ OpenClaw│ (:18789)   │   TTS 后端           │
│ Gateway │        │   │ Edge TTS / MiMo-TTS  │
└─────────┘        │   └──────────────────────┘
```

## 🚀 快速开始

### 前置条件

- Python 3.8+
- Node.js 18+
- pnpm 10+
- OpenClaw-CN 已运行

### 步骤 1：安装依赖

```bash
# 安装 Python TTS 依赖
pip install edge-tts aiohttp

# 克隆 AIRI
git clone https://github.com/moeru-ai/airi.git
cd airi
pnpm install
```

### 步骤 2：复制集成文件

根据 `INTEGRATION.md` 文档，将以下文件复制到 AIRI 项目中：

```
airi/
├── apps/stage-web/index.html                          # 自动配置脚本
├── packages/stage-ui/src/libs/providers/providers/
│   ├── openclaw-cn/                                   # Chat Provider
│   │   └── index.ts
│   └── openclaw-cn-speech/                            # Speech Provider
│       └── index.ts
└── packages/stage-ui/src/stores/
    └── providers.ts                                   # Provider metadata
```

### 步骤 3：启动 TTS Bridge

```bash
# Edge TTS（默认）
python openclaw-tts-bridge.py

# 或 MiMo TTS
python mimo-tts-bridge.py
```

### 步骤 4：启动 AIRI

```bash
cd airi
pnpm dev:web
```

### 步骤 5：访问

- Chat 设置：http://localhost:5173/settings/providers/chat/openclaw-cn
- Speech 设置：http://localhost:5173/settings/providers/speech/openclaw-cn-speech
- Provider 列表：http://localhost:5173/settings/providers

## 📁 文件说明

| 文件 | 说明 |
|------|------|
| `openclaw-tts-bridge.py` | Edge TTS Bridge 服务 (:5007) |
| `mimo-tts-bridge.py` | MiMo-V2-TTS Bridge 服务 (:5007) |
| `providers/openclaw-cn/index.ts` | Chat Provider 源码 |
| `providers/openclaw-cn-speech/index.ts` | Speech Provider 源码 |
| `INTEGRATION.md` | 详细集成指南 |
| `AIRI-OPENCLAW-PLAN.md` | 技术方案文档 |

## 🔊 可用语音

### Edge TTS

| 语音 ID | 语言 | 性别 |
|---------|------|------|
| zh-CN-XiaoxiaoNeural | 中文 | 女 |
| zh-CN-YunxiNeural | 中文 | 男 |
| en-US-JennyNeural | 英文 | 女 |
| ja-JP-NanamiNeural | 日文 | 女 |

### MiMo-V2-TTS

| 特性 | 说明 |
|------|------|
| 模型 | mimo-v2-tts |
| 接口 | OpenAI 兼容 |
| 状态 | 限时免费 |
| 平台 | token-plan-cn.xiaomimimo.com |

## 🔧 配置

### Chat Bridge

| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| URL | `http://localhost:3003` | OpenClaw HTTP Bridge |
| API Key | `openclaw-token` | Gateway 认证 |

### TTS Bridge

| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| URL | `http://localhost:5007` | TTS Bridge 端口 |
| 后端 | `edge-tts` | 可选: edge-tts / mimo-tts |
| 默认语音 | `zh-CN-XiaoxiaoNeural` | 中文女声 |

## 📈 支持的模型

### OpenClaw-CN 可用模型

| 模型 | 提供商 | 用途 |
|------|--------|------|
| mimo-v2-pro | 小米 | 文本对话（旗舰） |
| mimo-v2-omni | 小米 | 文本+图像 |
| mimo-v2-tts | 小米 | 语音合成 |
| MiniMax-M2.7 | MiniMax | 文本对话 |
| MiniMax-M2.7-highspeed | MiniMax | 文本对话（高速） |

## 📝 相关项目

- [moeru-ai/airi](https://github.com/moeru-ai/airi) — AIRI 主仓库
- [openclaw/openclaw](https://github.com/openclaw/openclaw) — OpenClaw 原版
- [Mayiv-Ai/feishu-voice](https://github.com/Mayiv-Ai/feishu-voice) — 飞书语音工具

## 📄 License

MIT License — 详见 [LICENSE](LICENSE)
