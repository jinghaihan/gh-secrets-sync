export const DEFAULT_SYNC_OPTIONS = {
  config: './secrets.config.yaml',
  repos: [],
  secrets: [],
  envPrefix: '',
  apiVersion: '2022-11-28',
  private: false,
  dry: false,
  strict: true,
} as const
