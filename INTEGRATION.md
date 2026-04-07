# AIRI × OpenClaw-CN 集成实现文档

> 版本：v1.1
> 日期：2026-04-07
> 状态：✅ 已完成

---

## 🔄 快速复刻指南

### 前置条件

```bash
# 1. 安装依赖
pip install edge-tts

# 2. 克隆 AIRI（如果还没有）
git clone https://github.com/moeru-ai/airi.git
cd airi
pnpm install
```

### 步骤 1：创建 TTS Bridge 服务

创建文件 `openclaw-tts-bridge.py`：

```python
"""
OpenClaw-CN TTS Bridge - OpenAI Compatible API
"""
import http.server
import socketserver
import json
import asyncio
from concurrent.futures import ThreadPoolExecutor

PORT = 5007

VOICES = [
    {"id": "zh-CN-XiaoxiaoNeural", "name": "Chinese Xiaoxiao", "languages": ["zh-CN"], "gender": "female"},
    {"id": "zh-CN-YunxiNeural", "name": "Chinese Yunxi", "languages": ["zh-CN"], "gender": "male"},
]

def format_rate(speed):
    if speed == 1.0:
        return "+0%"
    elif speed > 1.0:
        return f"+{int((speed - 1.0) * 100)}%"
    else:
        return f"{int((speed - 1.0) * 100)}%"

async def generate_async(text, voice, speed):
    from edge_tts import Communicate
    rate = format_rate(speed)
    comm = Communicate(text=text, voice=voice, rate=rate)
    audio = b""
    async for chunk in comm.stream():
        if chunk["type"] == "audio":
            audio += chunk["data"]
    return audio

class TTSHandler(http.server.BaseHTTPRequestHandler):
    executor = ThreadPoolExecutor(max_workers=4)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.end_headers()

    def do_GET(self):
        if self.path == "/health":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"status": "ok", "provider": "openclaw-tts"}).encode())
        elif self.path == "/v1/audio/voices":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"object": "list", "data": VOICES}).encode())

    def do_POST(self):
        if self.path != "/v1/audio/speech":
            self.send_response(404)
            self.end_headers()
            return

        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length)
        request = json.loads(body.decode("utf-8"))

        text = request.get("input", "")
        voice = request.get("voice", "zh-CN-XiaoxiaoNeural")
        speed = float(request.get("speed", 1.0))

        try:
            audio_data = self.executor.submit(asyncio.run, generate_async(text, voice, speed))
            audio_bytes = audio_data.result()
            self.send_response(200)
            self.send_header("Content-Type", "audio/mpeg")
            self.send_header("Content-Length", len(audio_bytes))
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(audio_bytes)
        except Exception as e:
            self.send_response(500)
            self.end_headers()
            self.wfile.write(json.dumps({"error": {"message": str(e)}}).encode())

class ReuseAddrTCPServer(socketserver.TCPServer):
    allow_reuse_address = True

if __name__ == "__main__":
    print(f"OpenClaw-CN TTS Bridge running on port {PORT}")
    with ReuseAddrTCPServer(("", PORT), TTSHandler) as httpd:
        httpd.serve_forever()
```

### 步骤 2：创建 Chat Provider

创建目录 `packages/stage-ui/src/libs/providers/providers/openclaw-cn/`

创建文件 `index.ts`：

```typescript
import { createOpenAI } from '@xsai-ext/providers/create'
import { z } from 'zod'
import { ProviderValidationCheck } from '../../types'
import { createOpenAICompatibleValidators } from '../../validators'
import { defineProvider } from '../registry'

const openClawConfigSchema = z.object({
  bridgeUrl: z.string('Bridge URL').optional().default('http://localhost:3003'),
  apiKey: z.string('API Key').optional().default('openclaw-token'),
})

type OpenClawConfig = z.input<typeof openClawConfigSchema>

export const providerOpenClawCN = defineProvider<OpenClawConfig>({
  id: 'openclaw-cn',
  order: 50,
  name: 'OpenClaw-CN',
  nameLocalize: ({ t }) => `${t('settings.pages.providers.provider.openclaw-cn.name') || 'OpenClaw-CN'}`,
  description: 'OpenClaw-CN as AI brain for AIRI. Uses local HTTP bridge.',
  descriptionLocalize: ({ t }) => t('settings.pages.providers.provider.openclaw-cn.description') || 'Connect to OpenClaw-CN via local HTTP bridge',
  tasks: ['chat'],
  icon: 'i-solar:skull-bold-duotone',
  createProviderConfig: ({ t }) => openClawConfigSchema.extend({
    bridgeUrl: openClawConfigSchema.shape.bridgeUrl.meta({
      labelLocalized: t('settings.pages.providers.catalog.edit.config.common.fields.field.base-url.label') || 'Bridge URL',
      descriptionLocalized: 'URL of the OpenClaw-CN HTTP bridge (default: http://localhost:3003)',
      placeholderLocalized: 'http://localhost:3003',
    }),
    apiKey: openClawConfigSchema.shape.apiKey.meta({
      labelLocalized: t('settings.pages.providers.catalog.edit.config.common.fields.field.api-key.label') || 'API Key',
      descriptionLocalized: 'API Key for the bridge (default: openclaw-token)',
      placeholderLocalized: 'openclaw-token',
      type: 'password',
    }),
  }),
  createProvider(config) {
    const baseUrl = config.bridgeUrl || 'http://localhost:3003'
    const apiKey = config.apiKey || 'openclaw-token'
    return createOpenAI(apiKey, baseUrl + '/v1')
  },
  validationRequiredWhen() {
    return true
  },
  validators: {
    ...createOpenAICompatibleValidators({
      checks: [ProviderValidationCheck.Connectivity, ProviderValidationCheck.ModelList, ProviderValidationCheck.ChatCompletions],
    }),
  },
})
```

### 步骤 3：创建 Speech Provider

创建目录 `packages/stage-ui/src/libs/providers/providers/openclaw-cn-speech/`

创建文件 `index.ts`：

```typescript
import { createOpenAI } from '@xsai-ext/providers/create'
import { z } from 'zod'
import { ProviderValidationCheck } from '../../types'
import { createOpenAICompatibleValidators } from '../../validators'
import { defineProvider } from '../registry'

const openClawSpeechConfigSchema = z.object({
  bridgeUrl: z.string('Bridge URL').optional().default('http://localhost:5007'),
  apiKey: z.string('API Key').optional().default('openclaw-token'),
})

type OpenClawSpeechConfig = z.input<typeof openClawSpeechConfigSchema>

export const providerOpenClawCNSpeech = defineProvider<OpenClawSpeechConfig>({
  id: 'openclaw-cn-speech',
  order: 51,
  name: 'OpenClaw-CN TTS',
  nameLocalize: ({ t }) => `${t('settings.pages.providers.provider.openclaw-cn-speech.name') || 'OpenClaw-CN TTS'}`,
  description: 'Edge TTS Chinese voice synthesis via OpenClaw-CN bridge.',
  descriptionLocalize: ({ t }) => t('settings.pages.providers.provider.openclaw-cn-speech.description') || 'Connect to OpenClaw-CN Edge TTS bridge',
  tasks: ['text-to-speech'],
  icon: 'i-solar:skull-bold-duotone',
  createProviderConfig: ({ t }) => openClawSpeechConfigSchema.extend({
    bridgeUrl: openClawSpeechConfigSchema.shape.bridgeUrl.meta({
      labelLocalized: t('settings.pages.providers.catalog.edit.config.common.fields.field.base-url.label') || 'Bridge URL',
      descriptionLocalized: 'URL of the OpenClaw-CN TTS bridge (default: http://localhost:5007)',
      placeholderLocalized: 'http://localhost:5007',
    }),
    apiKey: openClawSpeechConfigSchema.shape.apiKey.meta({
      labelLocalized: t('settings.pages.providers.catalog.edit.config.common.fields.field.api-key.label') || 'API Key',
      descriptionLocalized: 'API Key for the bridge (default: openclaw-token)',
      placeholderLocalized: 'openclaw-token',
      type: 'password',
    }),
  }),
  createProvider(config) {
    const baseUrl = config.bridgeUrl || 'http://localhost:5007'
    const apiKey = config.apiKey || 'openclaw-token'
    return createOpenAI(apiKey, baseUrl + '/v1')
  },
  extraMethods: {
    listModels: async () => [{
      id: 'openclaw-tts',
      name: 'OpenClaw TTS',
      provider: 'openclaw-cn-speech',
      description: 'Edge TTS Chinese voice synthesis',
      contextLength: 0,
      deprecated: false,
    }],
    listVoices: async () => [
      { id: 'zh-CN-XiaoxiaoNeural', name: 'Chinese Xiaoxiao (Female)', provider: 'openclaw-cn-speech', languages: [{ code: 'zh-CN', title: 'Chinese (Mandarin)' }], gender: 'female' },
      { id: 'zh-CN-YunxiNeural', name: 'Chinese Yunxi (Male)', provider: 'openclaw-cn-speech', languages: [{ code: 'zh-CN', title: 'Chinese (Mandarin)' }], gender: 'male' },
    ],
  },
  validationRequiredWhen() {
    return true
  },
  validators: {
    ...createOpenAICompatibleValidators({
      checks: [ProviderValidationCheck.Connectivity],
    }),
  },
})
```

### 步骤 4：注册 Provider

编辑 `packages/stage-ui/src/libs/providers/providers/index.ts`，添加 import：

```typescript
import './openclaw-cn'
import './openclaw-cn-speech'
```

### 步骤 5：在 stores/providers.ts 添加手写 metadata

在 `providerMetadata` 对象中添加 `'openclaw-cn-speech'` 条目（详见文档第五节）

### 步骤 6：创建 Speech 设置页面

创建 `packages/stage-pages/src/pages/settings/providers/speech/openclaw-cn-speech.vue`

### 步骤 7：更新 index.html

在 `apps/stage-web/index.html` 添加自动配置脚本和 CSS

### 步骤 8：启动服务

```bash
# 终端 1: 启动 TTS Bridge
python openclaw-tts-bridge.py

# 终端 2: 启动 AIRI Web
cd airi
pnpm dev:web
```

### 步骤 9：访问

- http://localhost:5173/settings/providers/speech/openclaw-cn-speech

---

## 一、实现概述

### 1.1 完成目标

成功将 **OpenClaw-CN** 集成到 AIRI Web 版，实现：
- ✅ Chat 对话功能（通过 Bridge HTTP API）
- ✅ 中文 TTS 语音合成（通过 Edge TTS Bridge）
- ✅ 专用 Provider 配置通道

### 1.2 服务架构

```
┌─────────────────────────────────────────────────────┐
│                  AIRI Web 前端                       │
│  http://localhost:5173                             │
│  ├── Chat Provider: openclaw-cn                    │
│  └── Speech Provider: openclaw-cn-speech           │
└─────────────────────┬───────────────────────────────┘
                      │
          ┌───────────┴───────────┐
          ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│  Chat Bridge    │     │  TTS Bridge     │
│  localhost:3003 │     │  localhost:5007 │
└────────┬────────┘     └────────┬────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│ OpenClaw Gateway│     │   Edge TTS      │
│  localhost:18789│     │ (中文语音)      │
└─────────────────┘     └─────────────────┘
```

---

## 二、新增/修改文件清单

### 2.1 新增文件

| 文件路径 | 说明 |
|----------|------|
| `packages/stage-ui/src/libs/providers/providers/openclaw-cn/` | OpenClaw-CN Chat Provider |
| `packages/stage-ui/src/libs/providers/providers/openclaw-cn-speech/` | OpenClaw-CN Speech Provider |
| `packages/stage-pages/src/pages/settings/providers/speech/openclaw-cn-speech.vue` | Speech Provider 设置页面 |

### 2.2 修改文件

| 文件路径 | 修改内容 |
|----------|----------|
| `packages/stage-ui/src/libs/providers/providers/index.ts` | 添加 openclaw-cn 和 openclaw-cn-speech import |
| `packages/stage-ui/src/stores/providers.ts` | 添加 openclaw-cn-speech 手写 metadata |
| `apps/stage-web/index.html` | 添加自动配置脚本 + CSS 样式 |

### 2.3 核心代码变更

#### Chat Provider (`openclaw-cn/index.ts`)
```typescript
export const providerOpenClawCN = defineProvider<OpenClawConfig>({
  id: 'openclaw-cn',
  order: 50,
  name: 'OpenClaw-CN',
  tasks: ['chat'],
  icon: 'i-solar:skull-bold-duotone',
  createProvider(config) {
    const baseUrl = config.bridgeUrl || 'http://localhost:3003'
    const apiKey = config.apiKey || 'openclaw-token'
    return createOpenAI(apiKey, baseUrl + '/v1')
  },
})
```

#### Speech Provider (`openclaw-cn-speech/index.ts`)
```typescript
export const providerOpenClawCNSpeech = defineProvider<OpenClawSpeechConfig>({
  id: 'openclaw-cn-speech',
  order: 51,
  name: 'OpenClaw-CN TTS',
  tasks: ['text-to-speech'],
  icon: 'i-solar:skull-bold-duotone',
  createProvider(config) {
    const baseUrl = config.bridgeUrl || 'http://localhost:5007'
    const apiKey = config.apiKey || 'openclaw-token'
    return createOpenAI(apiKey, baseUrl + '/v1')
  },
})
```

#### 自动配置脚本 (`index.html`)
```javascript
(function() {
  const CHAT_PROVIDER_ID = 'openclaw-cn';
  const CHAT_BRIDGE_URL = 'http://localhost:3003';
  const SPEECH_PROVIDER_ID = 'openclaw-cn-speech';
  const SPEECH_BRIDGE_URL = 'http://localhost:5007';
  // 自动配置 Provider 和凭证
})();
```

---

## 三、服务配置

### 3.1 Chat Bridge

| 配置项 | 值 |
|--------|-----|
| 端口 | 3003 |
| 默认 URL | http://localhost:3003 |
| API Key | openclaw-token |
| Provider ID | openclaw-cn |
| 用途 | AI 对话 |

**健康检查：**
```bash
curl -s -H "x-api-key: openclaw-token" http://localhost:3003/health
# 返回: {"status":"ok"}
```

### 3.2 TTS Bridge

| 配置项 | 值 |
|--------|-----|
| 端口 | 5007 |
| 默认 URL | http://localhost:5007 |
| API Key | openclaw-token |
| Provider ID | openclaw-cn-speech |
| 用途 | 中文语音合成 |

**可用语音：**
| 语音 ID | 语言 | 性别 |
|---------|------|------|
| zh-CN-XiaoxiaoNeural | 中文 | 女 |
| zh-CN-XiaoyiNeural | 中文 | 女 |
| zh-CN-YunxiNeural | 中文 | 男 |
| zh-CN-YunxiaNeural | 中文 | 男 |
| zh-CN-YunyangNeural | 中文 | 男 |
| zh-CN-YunjianNeural | 中文 | 男 |
| en-US-JennyNeural | 英语(美) | 女 |
| en-US-GuyNeural | 英语(美) | 男 |

**健康检查：**
```bash
curl -s http://localhost:5007/health
# 返回: {"status":"ok","provider":"openclaw-tts"}
```

---

## 四、访问地址

### 4.1 Chat Provider 设置
```
http://localhost:5173/settings/providers/chat/openclaw-cn
```

### 4.2 Speech Provider 设置
```
http://localhost:5173/settings/providers/speech/openclaw-cn-speech
```

### 4.3 Provider 列表页
```
http://localhost:5173/settings/providers
```

---

## 五、TTS Bridge 服务实现

### 5.1 服务脚本 (`openclaw-tts-bridge.py`)

```python
"""
OpenClaw-CN TTS Bridge - OpenAI Compatible API
"""

import http.server
import socketserver
import json
import asyncio
from concurrent.futures import ThreadPoolExecutor

PORT = 5007

VOICES = [
    {"id": "zh-CN-XiaoxiaoNeural", "name": "Chinese Xiaoxiao", "languages": ["zh-CN"], "gender": "female"},
    {"id": "zh-CN-YunxiNeural", "name": "Chinese Yunxi", "languages": ["zh-CN"], "gender": "male"},
    # ... 更多语音
]

async def generate_async(text, voice, speed):
    from edge_tts import Communicate
    rate = format_rate(speed)
    comm = Communicate(text=text, voice=voice, rate=rate)
    audio = b""
    async for chunk in comm.stream():
        if chunk["type"] == "audio":
            audio += chunk["data"]
    return audio

class TTSHandler(http.server.BaseHTTPRequestHandler):
    def do_POST(self):
        if self.path != "/v1/audio/speech":
            self.send_response(404)
            return
        # 处理 TTS 请求
        ...
```

### 5.2 启动命令

```bash
cd F:\AIasMe-AI
python openclaw-tts-bridge.py
```

---

## 六、问题排查

### 6.1 常见错误

| 错误 | 原因 | 解决方案 |
|------|------|----------|
| Provider metadata not found | Provider 未在 stores/providers.ts 注册 | 添加手写 metadata |
| CORS error | 缺少 CORS 头 | 添加 Access-Control-Allow-Origin |
| Invalid API key | API Key 不匹配 | 使用 openclaw-token |
| Connection refused | Bridge 服务未启动 | 启动 python openclaw-tts-bridge.py |

### 6.2 调试命令

```bash
# 检查 Chat Bridge
curl -s -H "x-api-key: openclaw-token" http://localhost:3003/health

# 检查 TTS Bridge
curl -s http://localhost:5007/health

# 检查 Provider 列表
curl -s http://localhost:5007/v1/audio/voices

# 测试 TTS 生成
curl -X POST http://localhost:5007/v1/audio/speech \
  -H "Content-Type: application/json" \
  -H "x-api-key: openclaw-token" \
  -d '{"input": "你好", "voice": "zh-CN-XiaoxiaoNeural"}' \
  --output test.mp3
```

---

## 七、下一步计划

### 7.1 已完成 ✅
- [x] Chat Provider 集成
- [x] Speech Provider 集成
- [x] TTS Bridge 服务
- [x] 专用设置页面

### 7.2 待优化
- [ ] 红色字体样式（需修改 IconStatusItem 组件）
- [ ] 模型选择器（当前使用固定模型）
- [ ] 语音预览功能
- [ ] 性能优化

### 7.3 长期规划
- [ ] 多语言支持
- [ ] 自定义语音克隆
- [ ] 实时语音对话（ASR）
- [ ] OpenClaw MCP 插件

---

## 八、相关文档

| 文档 | 说明 |
|------|------|
| `AIRI-OPENCLAW-PLAN.md` | 完整技术方案 |
| `airi-openclaw-projects-complete.md` | 项目汇总 |
| `INTEGRATION_GUIDE.md` | OpenClaw-CN 集成指南 |
| `feishu-voice/README.md` | 飞书语音工具文档 |

---

> 📝 本文档由 Claude Code 自动生成
> 实现日期: 2026-04-07
