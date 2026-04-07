// Add this to packages/stage-ui/src/stores/providers.ts
// In the providerMetadata object, add 'openclaw-cn-speech' entry:

'openclaw-cn-speech': {
  id: 'openclaw-cn-speech',
  category: 'speech',
  tasks: ['text-to-speech'],
  nameKey: 'settings.pages.providers.provider.openclaw-cn-speech.title',
  name: 'OpenClaw-CN TTS',
  descriptionKey: 'settings.pages.providers.provider.openclaw-cn-speech.description',
  description: 'Edge TTS Chinese voice synthesis via OpenClaw-CN bridge.',
  icon: 'i-solar:skull-bold-duotone',
  defaultOptions: () => ({
    bridgeUrl: 'http://localhost:5007',
    apiKey: 'openclaw-token',
  }),
  createProvider: async (config) => {
    const baseUrl = (config.bridgeUrl as string) || 'http://localhost:5007'
    const apiKey = (config.apiKey as string) || 'openclaw-token'
    return createOpenAI(apiKey, baseUrl + '/v1')
  },
  capabilities: {
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
  validators: {
    chatPingCheckAvailable: false,
    validateProviderConfig: async (config) => {
      const errors: Error[] = []
      const baseUrl = (config.bridgeUrl as string)?.trim() || ''
      if (!baseUrl) {
        errors.push(new Error('Bridge URL is required'))
      }
      return { errors, reason: errors.map(e => e.message).join(', '), valid: errors.length === 0 }
    },
  },
},
