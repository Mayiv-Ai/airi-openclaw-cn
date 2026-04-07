import { createOpenAI } from '@xsai-ext/providers/create'
import { z } from 'zod'

import { ProviderValidationCheck } from '../../types'
import { createOpenAICompatibleValidators } from '../../validators'
import { defineProvider } from '../registry'

const openClawConfigSchema = z.object({
  bridgeUrl: z
    .string('Bridge URL')
    .optional()
    .default('http://localhost:3003'),
  apiKey: z
    .string('API Key')
    .optional()
    .default('openclaw-token'),
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
