export const DEFAULT_SYNC_OPTIONS = {
  config: './secrets.config.yaml',
  repos: [],
  secrets: [],
  envPrefix: '',
  dry: false,
  strict: true,
} as const

export const GITHUB_API_VERSION = '2022-11-28'
