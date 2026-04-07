# AIRI × OpenClaw-CN 集成

> 🎯 AIRI Web 版 + OpenClaw-CN 中文语音合成 + Chat 对话

[![GitHub Repo](https://img.shields.io/badge/GitHub-Mayiv--Ai%2Fairi--openclaw--cn-24292e?style=flat-square&logo=github)](https://github.com/Mayiv-Ai/airi-openclaw-cn)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

## ✨ 功能

- ✅ **Chat Provider** - 通过 HTTP Bridge 连接 OpenClaw-CN Gateway
- ✅ **中文 TTS** - 基于 Edge TTS 的中文语音合成
- ✅ **专用配置页面** - 独立的 Provider 设置通道
- ✅ **自动配置** - 首次访问自动初始化

## 🏗️ 架构

```
┌─────────────────────────────────────────────┐
│              AIRI Web 前端                   │
│    http://localhost:5173                   │
│    ├── Chat: openclaw-cn (port 3003)       │
│    └── Speech: openclaw-cn-speech (5007)   │
└─────────────────────┬───────────────────────┘
                      │
          ┌───────────┴───────────┐
          ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│  Chat Bridge    │     │  TTS Bridge     │
│  localhost:3003  │     │  localhost:5007 │
└────────┬────────┘     └────────┬────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│ OpenClaw Gateway│     │   Edge TTS      │
│  localhost:18789│     │ (中文语音)       │
└─────────────────┘     └─────────────────┘
```

## 🚀 快速开始

### 前置条件

- Python 3.8+
- Node.js 18+
- pnpm 10+

### 步骤 1：安装依赖

```bash
# 安装 Python 依赖
pip install edge-tts

# 克隆 AIRI
git clone https://github.com/moeru-ai/airi.git
cd airi
pnpm install
```

### 步骤 2：复制集成文件

根据 `INTEGRATION.md` 文档，将以下文件复制到 AIRI 项目中：

```
airi/
├── apps/stage-web/index.html          # 添加自动配置脚本
├── packages/stage-ui/src/libs/providers/providers/
│   ├── openclaw-cn/                  # Chat Provider
│   └── openclaw-cn-speech/           # Speech Provider
├── packages/stage-pages/src/pages/settings/providers/speech/
│   └── openclaw-cn-speech.vue        # 设置页面
└── packages/stage-ui/src/stores/
    └── providers.ts                   # 添加 metadata
```

### 步骤 3：启动 TTS Bridge

```bash
# 新终端
python openclaw-tts-bridge.py
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
| `openclaw-tts-bridge.py` | TTS Bridge 服务（Edge TTS） |
| `INTEGRATION.md` | 详细集成指南（含完整代码） |
| `AIRI-OPENCLAW-PLAN.md` | 技术方案文档 |
| `openclaw-cn/` | Provider 源码 |

## 🔊 可用语音

| 语音 ID | 语言 | 性别 |
|---------|------|------|
| zh-CN-XiaoxiaoNeural | 中文 | 女 |
| zh-CN-XiaoyiNeural | 中文 | 女 |
| zh-CN-YunxiNeural | 中文 | 男 |
| zh-CN-YunxiaNeural | 中文 | 男 |
| zh-CN-YunyangNeural | 中文 | 男 |
| zh-CN-YunjianNeural | 中文 | 男 |

## 🔧 配置

### Chat Bridge

| 配置项 | 默认值 |
|--------|--------|
| URL | http://localhost:3003 |
| API Key | openclaw-token |

### TTS Bridge

| 配置项 | 默认值 |
|--------|--------|
| URL | http://localhost:5007 |
| API Key | openclaw-token |

## 📝 相关项目

- [moeru-ai/airi](https://github.com/moeru-ai/airi) - AIRI 主仓库
- [Mayiv-Ai/feishu-voice](https://github.com/Mayiv-Ai/feishu-voice) - 飞书语音工具

## 📄 License

MIT License - 详见 [LICENSE](LICENSE)

---

> 🤖 Generated with Claude Code
