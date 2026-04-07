# AIRI × OpenClaw 完整技术方案

> 版本：v1.1
> 日期：2026-04-06
> 更新：2026-04-07（实现 Chat + Speech Provider）
> 制定人：小龙虾 🦞
> 定位：开源 AI 伴侣 × OpenClaw Agent 平台

---

## ✅ 实现进度

### 2026-04-07 已完成

| 功能 | 状态 | 说明 |
|------|------|------|
| OpenClaw-CN Chat Provider | ✅ | `openclaw-cn` on port 3003 |
| OpenClaw-CN Speech Provider | ✅ | `openclaw-cn-speech` on port 5007 |
| Edge TTS 中文语音 | ✅ | 6种中文语音 |
| 专用设置页面 | ✅ | `/settings/providers/speech/openclaw-cn-speech` |
| 自动配置脚本 | ✅ | 首次访问自动配置 |

**访问地址：**
- Chat: http://localhost:5173/settings/providers/chat/openclaw-cn
- Speech: http://localhost:5173/settings/providers/speech/openclaw-cn-speech

**详细实现文档：** `AIRI-OPENCLAW-IMPLEMENTATION.md`

---

## 一、项目背景

### 1.1 目标
基于开源 AIRI（moeru-ai/airi，31k+ Stars），二次开发一个：
- **Web 版** AI 虚拟伴侣（可浏览器访问）
- 对接 **OpenClaw** 作为 Agent 后端（大脑）
- 接入多 LLM（DeepSeek/Claude/Ollama 本地）
- 支持多渠道分发（微信/飞书/Telegram/Discord）

### 1.2 参考产品
| 产品 | 技术栈 | 说明 |
|------|--------|------|
| **AIRI 原版** | Vue 3 + Electron + WebGPU | 开源数字人平台 |
| **Aira Connector** | .NET 8 WPF + OpenClaw | 闭源桥接器，sessionKey=digital-human |
| **OpenClaw** | Python + Node.js | 自主进化型 AI Agent |

### 1.3 许可证
AIRI 使用 **MIT 许可证**，可自由 fork 和二次开发。

---

## 二、AIRI 源码分析

### 2.1 项目架构（重要修正）

**AIRI 不是传统的 Electron 应用，而是 Web 原生的 monorepo：**

```
moeru-ai/airi/
├── apps/
│   ├── stage-web/           ← Web 版（已存在！直接可用）
│   ├── stage-tamagotchi/    ← Electron 桌面版
│   └── stage-pocket/        ← iOS/Android 移动版
├── packages/                ← 共享核心包
│   ├── stage-ui-three/      ← 3D 渲染（VRM/Live2D）
│   ├── stage-ui/           ← UI 组件库
│   ├── stage-ui-core/       ← 核心组件
│   └── ...
├── plugins/                 ← 插件系统（WIP）
├── services/
│   ├── server-runtime/      ← 后端服务运行时
│   └── ui-server-auth/      ← 认证服务
├── docs/                    ← 文档站
├── examples/                ← 示例
└── package.json             ← pnpm workspaces
```

**关键命令：**
```bash
pnpm install          # 安装依赖
pnpm dev:web         # 启动 Web 版
pnpm dev              # 启动所有开发服务
```

### 2.2 已验证能力

| 能力 | 状态 | 说明 |
|------|------|------|
| Minecraft 游戏 | ✅ | 已集成，可自主游玩 |
| Factorio 游戏 | ✅ | PoC 已完成 |
| Telegram 对话 | ✅ | 已集成 |
| Discord 对话 | ✅ | 已集成 |
| 3D VRM 模型 | ✅ | Three.js + TresJS |
| Live2D 支持 | ✅ | 独立包 |
| PWA 移动端 | ✅ | 已支持 |
| WebGPU 加速 | ✅ | 桌面版原生支持 |
| CUDA/Metal | ✅ | candle 加速 |
| RAG 记忆 | ✅ | @proj-airi 组织独立项目 |

### 2.3 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| 前端框架 | Vue 3 + TypeScript | ^3.x |
| 构建工具 | Vite + Turbo | ^8.x |
| 包管理 | pnpm | 10.32.1 |
| 样式方案 | UnoCSS | ^66.6.7 |
| 3D 渲染 | Three.js + TresJS | 最新 |
| 状态管理 | Pinia | - |
| 后端服务 | Node.js | - |
| LLM | OpenAI/Claude/本地 | 多模型 |

---

## 三、OpenClaw Agent 能力分析

### 3.1 核心架构

```
OpenClaw Agent
├── Agent 编排引擎（多轮对话、工具调用）
├── 记忆系统（Auto-Dream consolidation）
├── MCP 集成（外部工具扩展协议）
├── 多渠道路由（微信/飞书/Telegram/Discord/QQ）
├── WebSocket 实时通信
├── 权限/钩子/插件系统
├── 工具注册表（50+ 工具）
└── 频道集成层
```

### 3.2 已集成模块（DeerFlow-Plus 验证）

| 模块 | 路径 | 状态 |
|------|------|------|
| 差异编辑 | `src/tools/edit.py` | ✅ |
| Bash 验证 | `src/tools/bash_validator.py` | ✅ |
| 权限系统 | `src/permissions/claude_style.py` | ✅ |
| 钩子系统 | `src/hooks/claude_hooks.py` | ✅ |
| 状态机 | `src/state_machine.py` | ✅ |
| MCP 客户端 | `src/mcp/claude_mcp.py` | ✅ |
| LSP 客户端 | `src/lsp_client.py` | ✅ |
| 插件系统 | `src/plugins/claude_plugins.py` | ✅ |

### 3.3 工具生态

| 类别 | 工具数 | 示例 |
|------|--------|------|
| 文件操作 | 8+ | Read/Write/Grep/Glob |
| Shell 执行 | 1 | Bash/PowerShell |
| 网络工具 | 5+ | WebFetch/WebSearch |
| Git 操作 | 4+ | Git Clone/Pull/Push |
| 容器管理 | 2 | Docker |
| 包管理 | 3 | npm/pip/brew |
| AI 工具 | 6+ | Tavily/DeerFlow |

---

## 四、OpenClaw 作为 AIRI 大脑 - 可行性分析

### 4.1 需求对比

| AIRI Brain 需求 | OpenClaw Agent | 状态 |
|----------------|----------------|------|
| LLM API 调用 | ✅ 多模型支持 | 可行 |
| Agent 编排 | ✅ 完整 | 可行 |
| 工具执行 | ✅ 50+ 工具 | 可行 |
| 记忆管理 | ✅ Auto-Dream | 可行 |
| MCP 扩展 | ✅ 支持 | 可行 |
| 多渠道 | ✅ 10+ 渠道 | **强项** |
| WebSocket | ✅ 支持 | 可行 |
| 游戏工具 | ⚠️ 需插件 | 需开发 |
| 3D 渲染 | ❌ 无 | AIRI 独立 |

### 4.2 结论

| 问题 | 答案 |
|------|------|
| OpenClaw 能做 Agent 核心吗？ | ✅ **完全可行** |
| OpenClaw 能替代 AIRI 的 LLM 层吗？ | ✅ 可以 |
| OpenClaw 能管理 AIRI 的记忆吗？ | ✅ 互补 |
| OpenClaw 能做多渠道分发吗？ | ✅ **是强项** |
| OpenClaw 能控制游戏吗？ | ⚠️ 需开发 MCP 插件 |

**结论：OpenClaw Agent 作为 AIRI 的大脑完全可行，采用互补架构。**

---

## 五、架构设计

### 5.1 推荐方案：分层互补架构 ⭐

```
┌─────────────────────────────────────────────────────┐
│                    用户界面层                         │
│  Web 浏览器 / 微信 / 飞书 / AIRI 3D 形象            │
└─────────────────────┬───────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────┐
│              AIRI 前端 (Vue 3)                      │
│  - 3D 虚拟形象（VRM/Live2D）                       │
│  - 角色人格管理                                     │
│  - 语音 TTS/ASR                                    │
│  - WebSocket 通信                                  │
└─────────────────────┬───────────────────────────────┘
                      │ WebSocket
┌─────────────────────▼───────────────────────────────┐
│            OpenClaw Agent（大脑）⭐                 │
│  - Agent 推理与决策                                │
│  - 工具编排与执行                                  │
│  - 记忆管理（Auto-Dream）                          │
│  - MCP 扩展（游戏工具/工程工具）                   │
│  - 多渠道消息路由                                  │
└─────────────────────┬───────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────┐
│                 LLM 层                              │
│  DeepSeek / Claude / Ollama 本地模型               │
└─────────────────────────────────────────────────────┘
```

### 5.2 职责划分

| 层 | 负责 | 不负责 |
|----|------|--------|
| **AIRI 前端** | 视觉呈现、语音、角色人格、3D 渲染 | Agent 决策、工具调用 |
| **OpenClaw** | Agent 推理、工具编排、记忆、多渠道 | 3D 渲染、游戏引擎 |

### 5.3 数据流

```
用户输入 → AIRI Web → WebSocket → OpenClaw Agent
                                         │
                    ┌─────────────────────┼─────────────────────┐
                    ▼                     ▼                     ▼
               LLM 推理              工具执行              记忆存取
                    │                     │                     │
                    └─────────────────────┼─────────────────────┘
                                         ▼
                              OpenClaw Agent 响应
                                         │
                                         ▼
                        WebSocket → AIRI Web → 3D 形象 / 语音输出
```

---

## 六、开发路线图

### 阶段 0：环境验证（1-2 天）

| 步骤 | 内容 | 产出 |
|------|------|------|
| 0.1 | 克隆 moeru-ai/airi 源码 | 完整源码 |
| 0.2 | pnpm install 安装依赖 | 可用环境 |
| 0.3 | pnpm dev:web 启动 Web 版 | 验证基础功能 |
| 0.4 | 分析 LLM 集成层代码 | 接口文档 |
| 0.5 | 部署 OpenClaw Gateway | Agent 服务 |

### 阶段 1：LLM 对接（2-3 天）★ 最关键

| 步骤 | 内容 | 产出 |
|------|------|------|
| 1.1 | 分析 AIRI 现有 LLM 接入方式 | 源码分析 |
| 1.2 | 接入 DeepSeek API | 模型切换 |
| 1.3 | 接入 Claude API | 多模型 |
| 1.4 | 接入 Ollama 本地模型 | 本地部署 |
| 1.5 | 实现多模型动态切换 | 配置界面 |

### 阶段 2：OpenClaw 桥接（3-5 天）

| 步骤 | 内容 | 产出 |
|------|------|------|
| 2.1 | 开发 WebSocket 桥接服务 | AIRI ↔ OpenClaw |
| 2.2 | 开发 MCP 适配器 | 协议转换 |
| 2.3 | 集成 OpenClaw 工具到 AIRI | 扩展能力 |
| 2.4 | 集成记忆系统 | 持久化对话 |
| 2.5 | 测试完整对话流程 | 端到端验证 |

### 阶段 3：定制增强（3-5 天）

| 步骤 | 内容 | 产出 |
|------|------|------|
| 3.1 | 角色自定义（工程场景） | 土木工程专家角色 |
| 3.2 | 中文优化 | 本地化 |
| 3.3 | 工程专业能力注入 | 工具集定制 |
| 3.4 | 3D 形象定制 | 虚拟形象 |
| 3.5 | 语音合成优化 | TTS 配置 |

### 阶段 4：部署与分发（2-3 天）

| 步骤 | 内容 | 产出 |
|------|------|------|
| 4.1 | Docker 镜像打包 | 一键部署 |
| 4.2 | Nginx 反向代理配置 | HTTPS 访问 |
| 4.3 | 微信/飞书渠道对接 | 多渠道分发 |
| 4.4 | 监控与日志 | 运维体系 |
| 4.5 | 压力测试 | 性能优化 |

---

## 七、MVP 定义

### 7.1 MVP（最小可行产品）

| 功能 | 优先级 | 说明 |
|------|--------|------|
| Web 版 AIRI 可访问 | P0 | 基础运行 |
| DeepSeek 模型对接 | P0 | 核心能力 |
| 基础对话功能 | P0 | 端到端 |
| Docker 部署 | P0 | 可分发 |
| OpenClaw Agent 桥接 | P1 | 扩展能力 |
| 微信渠道 | P2 | 多渠道 |

### 7.2 后续迭代

| 功能 | 优先级 | 说明 |
|------|--------|------|
| Claude/本地模型 | P1 | 多模型 |
| OpenClaw 工具集成 | P1 | 能力扩展 |
| 3D 虚拟形象 | P2 | 视觉增强 |
| 语音交互 | P2 | 语音能力 |
| 多渠道分发 | P2 | 飞书/Telegram |
| 游戏控制（Minecraft） | P3 | 高阶功能 |

---

## 八、风险评估

| 风险 | 等级 | 概率 | 应对措施 |
|------|------|------|----------|
| monorepo 依赖安装失败 | 🟡 中 | 40% | 使用 pnpm 10+，检查 Node 版本 |
| Web 版功能缺失 | 🟡 中 | 30% | 验证桌面版 > Web 版，需对比 |
| 3D 渲染兼容性 | 🟢 低 | 20% | WebGPU 支持度有限，优雅降级 |
| 插件系统不稳定 | 🟡 中 | 50% | AIRI 官方标注 WIP，需回退方案 |
| 中文支持不足 | 🟢 低 | 20% | 有中文文档/社区，可贡献 |
| WebSocket 延迟 | 🟡 中 | 30% | 优化桥接层，本地部署 |
| LLM API 成本 | 🟡 中 | 40% | 优先本地模型（Ollama） |
| 许可证合规 | 🟢 低 | 5% | MIT 许可，无风险 |

---

## 九、技术选型

| 模块 | 技术 | 说明 |
|------|------|------|
| **前端** | Vue 3 + Vite | AIRI 原版 |
| **后端** | Node.js | AIRI server-runtime |
| **Agent** | OpenClaw | Agent 编排核心 |
| **LLM** | DeepSeek/Claude/Ollama | 多模型切换 |
| **语音** | edge-tts | TTS（已安装） |
| **数据库** | SQLite / PostgreSQL | 用户/会话存储 |
| **部署** | Docker + Nginx | Web 部署 |
| **缓存** | Redis | 会话/状态管理 |

---

## 十、资源需求

| 资源 | 需求 | 备注 |
|------|------|------|
| 开发时间 | 2-3 周（业余） | 含调试 |
| 服务器 | 1台（2核4G 起步） | 可用现有资源 |
| LLM API | DeepSeek API Key | 优先 DeepSeek 性价比 |
| 域名 | 1个（可选） | 可用内网访问 |
| Node.js | 18+ | AIRI 要求 |
| pnpm | 10.32.1+ | AIRI 要求 |

---

## 十一、项目结构（待创建）

```
airi-openclaw/
├── README.md
├── docker-compose.yml
├── .env.example
├── packages/
│   ├── airi-web/              # AIRI Web 版（fork 自 moeru-ai/airi）
│   │   ├── apps/
│   │   │   └── stage-web/
│   │   ├── packages/
│   │   └── services/
│   └── airi-openclaw-bridge/  # OpenClaw 桥接服务
│       ├── src/
│       │   ├── websocket.ts    # WebSocket 桥接
│       │   ├── mcp-adapter.ts # MCP 适配器
│       │   └── memory.ts      # 记忆管理
│       └── package.json
├── docs/
│   └── ARCHITECTURE.md        # 架构文档
└── scripts/
    └── deploy.sh              # 部署脚本
```

---

## 十二、与原方案对比

| 维度 | 原方案 | 修正版 |
|------|--------|--------|
| Web 改造 | 需从 Electron 抽离 | ✅ 已有 stage-web |
| 工期估算 | 2-3 周 | **1-2 周（MVP）** |
| 后端 | 需从零搭建 | ✅ server-runtime 已有 |
| 扩展方式 | 不明 | ✅ 插件 + MCP |
| 风险分析 | 无 | ✅ 8 项风险 + 应对 |
| MVP | 无 | ✅ 明确定义 |
| OpenClaw 定位 | 不明确 | ✅ **互补架构** |
| 架构图 | 臆想 | ✅ 基于源码分析 |

---

## 十三、下一步行动

### 立即执行（今天）

| 步骤 | 命令 | 说明 |
|------|------|------|
| 1 | `git clone https://github.com/moeru-ai/airi.git` | 克隆源码 |
| 2 | `cd airi && pnpm install` | 安装依赖 |
| 3 | `pnpm dev:web` | 启动 Web 版 |
| 4 | 访问 http://localhost:5173 | 验证运行 |

### 验证通过后

| 步骤 | 内容 | 产出 |
|------|------|------|
| 1 | 分析 `packages/llm*` 或 `services/server-runtime` | LLM 接口 |
| 2 | 启动 OpenClaw Gateway | Agent 服务 |
| 3 | 开发 WebSocket 桥接 | 端到端测试 |

---

## 附录 A：AIRA × OpenClaw 技术对照

| 能力 | AIRI | OpenClaw | 整合方式 |
|------|------|----------|----------|
| LLM 调用 | ✅ | ✅ | 共享 API |
| Agent 编排 | ❌ | ✅ | OpenClaw 主导 |
| 3D 渲染 | ✅ | ❌ | AIRI 主导 |
| 语音合成 | ✅ | ✅ | 共享 edge-tts |
| 语音识别 | ✅ | ⚠️ | 可整合 |
| 记忆系统 | ✅ RAG | ✅ Auto-Dream | 互补 |
| 多渠道 | ⚠️ | ✅ | OpenClaw 主导 |
| 游戏控制 | ✅ Minecraft | ❌ | MCP 插件 |
| 文件操作 | ❌ | ✅ | OpenClaw 提供 |
| Web 界面 | ✅ | ⚠️ | AIRI 提供 |
| 插件系统 | WIP | ✅ | 桥接 |

---

## 附录 B：关键资源

| 资源 | 链接 |
|------|------|
| AIRI 源码 | https://github.com/moeru-ai/airi |
| AIRI 文档 | https://airi.moeru.ai/docs/en/ |
| AIRI Discord | https://discord.gg/TgQ3Cu2F7A |
| OpenClaw | 内置 DeerFlow-Plus |
| DeepWiki | https://deepwiki.com/moeru-ai/airi |

---

> 📝 本文档由小龙虾 🦞 基于源码分析生成
> 如有疑问，欢迎交流！
