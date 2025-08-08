import type { CommandOptions, Repo, SyncOptions } from './types'
import { readFile } from 'node:fs/promises'
import process from 'node:process'
import c from 'ansis'
import { join } from 'pathe'
import { parse } from 'yaml'
import { DEFAULT_SYNC_OPTIONS } from './constants'
import { createRegexFilter } from './filter'
import { getRepos, readTokenFromGitHubCli } from './git'

async function normalizeConfig(options: CommandOptions): Promise<SyncOptions> {
  const cwd = options.cwd || process.cwd()

  if (typeof options.repos === 'string')
    options.repos = [options.repos]

  if (typeof options.secrets === 'string')
    options.secrets = [options.secrets]

  const config = { ...DEFAULT_SYNC_OPTIONS, ...options }
  config.token = config.token || process.env.GITHUB_PAT || process.env.GITHUB_TOKEN || await readTokenFromGitHubCli()

  // ignore secrets config file if repos and secrets are provided
  if (config.repos.length && config.secrets.length) {
    return config as SyncOptions
  }

  const configContent = parse(await readFile(join(cwd, config.config), 'utf-8'))
  config.repos = Array.isArray(configContent.repos) ? configContent.repos : []
  config.secrets = Array.isArray(configContent.envs) ? configContent.envs : []

  return config as SyncOptions
}

export async function resolveConfig(options: CommandOptions): Promise<SyncOptions> {
  const config = await normalizeConfig(options)

  // resolve repos with regex
  if (config.repos.some(r => r.includes('*'))) {
    await resolveRepoPatterns(config)
  }

  if (!config.token)
    throw new Error(c.red('Please provide a GitHub token'))
  if (!config.repos)
    throw new Error(c.red('Please provide repos to sync'))
  if (!config.secrets)
    throw new Error(c.red('Please provide secrets to sync'))

  return config
}

async function resolveRepoPatterns(options: SyncOptions) {
  const filter = createRegexFilter<'full_name', Repo>(options.repos, 'full_name')

  const repos = (await getRepos(options))
    .filter(i => filter(i) && (options.private || !i.private))
    .map(i => i.full_name)

  if (repos.length) {
    options.repos = [...new Set([...options.repos, ...repos])]
  }
  options.repos = options.repos.filter(i => !i.includes('*'))
}
