import type { CommandOptions, SyncOptions } from './types'
import { readFileSync } from 'node:fs'
import process from 'node:process'
import c from 'ansis'
import { join } from 'pathe'
import { parse } from 'yaml'
import { DEFAULT_SYNC_OPTIONS } from './constants'

export function resolveConfig(options: CommandOptions): SyncOptions {
  const getConfig = () => {
    const cwd = options.cwd || process.cwd()

    if (typeof options.repos === 'string')
      options.repos = [options.repos]

    if (typeof options.secrets === 'string')
      options.secrets = [options.secrets]

    const config = { ...DEFAULT_SYNC_OPTIONS, ...options }
    config.token = config.token || process.env.GITHUB_PAT || process.env.GITHUB_TOKEN || ''

    // ignore secrets config file if repos and secrets are provided
    if (config.repos.length && config.secrets.length) {
      return config as SyncOptions
    }

    const configContent = parse(readFileSync(join(cwd, config.config), 'utf-8'))
    config.repos = Array.isArray(configContent.repos) ? configContent.repos : []
    config.secrets = Array.isArray(configContent.envs) ? configContent.envs : []

    return config as SyncOptions
  }

  const config = getConfig()

  if (!config.token)
    throw new Error(c.red('Please provide a GitHub token'))
  if (!config.repos)
    throw new Error(c.red('Please provide repos to sync'))
  if (!config.secrets)
    throw new Error(c.red('Please provide secrets to sync'))

  return config
}
