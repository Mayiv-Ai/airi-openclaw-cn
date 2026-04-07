import { createOpenAI } from '@xsai-ext/providers/create'
import { z } from 'zod'

import { ProviderValidationCheck } from '../../types'
import { createOpenAICompatibleValidators } from '../../validators'
import { defineProvider } from '../registry'

const openClawSpeechConfigSchema = z.object({
  bridgeUrl: z
    .string('Bridge URL')
    .optional()
    .default('http://localhost:5007'),
  apiKey: z
    .string('API Key')
    .optional()
    .default('openclaw-token'),
})

type OpenClawSpeechConfig = z.input<typeof openClawSpeechConfigSchema>

export const providerOpenClawCNSpeech = defineProvider<OpenClawSpeechConfig>({
  id: 'openclaw-cn-speech',
  order: 51,
  name: 'OpenClaw-CN TTS',
  nameLocalize: ({ t }) => `${t('settings.pages.providers.provider.openclaw-cn-speech.name') || 'OpenClaw-CN TTS'}`,
  description: 'Edge TTS Chinese voice synthesis via OpenClaw-CN bridge.',
  descriptionLocalize: ({ t }) => t('settings.pages.providers.provider.openclaw-cn-speech.description') || 'Connect to OpenClaw-CN Edge TTS bridge for Chinese text-to-speech',
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
    listModels: async (_config: Record<string, unknown>) => {
      return [
        {
          id: 'openclaw-tts',
          name: 'OpenClaw TTS',
          provider: 'openclaw-cn-speech',
          description: 'Edge TTS Chinese voice synthesis',
          contextLength: 0,
          deprecated: false,
        },
      ]
    },
    listVoices: async (_config: Record<string, unknown>, _provider: unknown) => {
      // Return Chinese TTS voices from Edge TTS
      return [
        {
          id: 'zh-CN-XiaoxiaoNeural',
          name: 'Chinese Xiaoxiao (Female)',
          provider: 'openclaw-cn-speech',
          languages: [{ code: 'zh-CN', title: 'Chinese (Mandarin)' }],
          gender: 'female',
        },
        {
          id: 'zh-CN-XiaoyiNeural',
          name: 'Chinese Xiaoyi (Female)',
          provider: 'openclaw-cn-speech',
          languages: [{ code: 'zh-CN', title: 'Chinese (Mandarin)' }],
          gender: 'female',
        },
        {
          id: 'zh-CN-YunxiNeural',
          name: 'Chinese Yunxi (Male)',
          provider: 'openclaw-cn-speech',
          languages: [{ code: 'zh-CN', title: 'Chinese (Mandarin)' }],
          gender: 'male',
        },
        {
          id: 'zh-CN-YunxiaNeural',
          name: 'Chinese Yunxia (Male)',
          provider: 'openclaw-cn-speech',
          languages: [{ code: 'zh-CN', title: 'Chinese (Mandarin)' }],
          gender: 'male',
        },
        {
          id: 'zh-CN-YunyangNeural',
          name: 'Chinese Yunyang (Male)',
          provider: 'openclaw-cn-speech',
          languages: [{ code: 'zh-CN', title: 'Chinese (Mandarin)' }],
          gender: 'male',
        },
        {
          id: 'zh-CN-YunjianNeural',
          name: 'Chinese Yunjian (Male)',
          provider: 'openclaw-cn-speech',
          languages: [{ code: 'zh-CN', title: 'Chinese (Mandarin)' }],
          gender: 'male',
        },
        {
          id: 'en-US-JennyNeural',
          name: 'US English Jenny (Female)',
          provider: 'openclaw-cn-speech',
          languages: [{ code: 'en-US', title: 'English (US)' }],
          gender: 'female',
        },
        {
          id: 'en-US-GuyNeural',
          name: 'US English Guy (Male)',
          provider: 'openclaw-cn-speech',
          languages: [{ code: 'en-US', title: 'English (US)' }],
          gender: 'male',
        },
        {
          id: 'en-GB-SoniaNeural',
          name: 'UK English Sonia (Female)',
          provider: 'openclaw-cn-speech',
          languages: [{ code: 'en-GB', title: 'English (UK)' }],
          gender: 'female',
        },
        {
          id: 'en-GB-RyanNeural',
          name: 'UK English Ryan (Male)',
          provider: 'openclaw-cn-speech',
          languages: [{ code: 'en-GB', title: 'English (UK)' }],
          gender: 'male',
        },
        {
          id: 'ja-JP-NanamiNeural',
          name: 'Japanese Nanami (Female)',
          provider: 'openclaw-cn-speech',
          languages: [{ code: 'ja-JP', title: 'Japanese' }],
          gender: 'female',
        },
        {
          id: 'ja-JP-KeitaNeural',
          name: 'Japanese Keita (Male)',
          provider: 'openclaw-cn-speech',
          languages: [{ code: 'ja-JP', title: 'Japanese' }],
          gender: 'male',
        },
      ]
    },
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
