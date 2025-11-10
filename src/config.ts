import type { CommandOptions, Repo, Secret, SyncOptions } from './types'
import { readFile } from 'node:fs/promises'
import process from 'node:process'
import * as p from '@clack/prompts'
import c from 'ansis'
import { join } from 'pathe'
import { parse } from 'yaml'
import { DEFAULT_SYNC_OPTIONS } from './constants'
import { createRegexFilter } from './filter'
import { getRepos, getRepoSecrets, readTokenFromGitHubCli } from './git'

async function normalizeConfig(options: CommandOptions): Promise<SyncOptions> {
  const cwd = options.cwd || process.cwd()

  if (typeof options.repos === 'string')
    options.repos = [options.repos]

  if (typeof options.secrets === 'string')
    options.secrets = [options.secrets]

  const config = { ...DEFAULT_SYNC_OPTIONS, ...options }
  config.token = config.token || process.env.GH_PAT || process.env.GITHUB_TOKEN || await readTokenFromGitHubCli()

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

  // resolve repos with regex patterns
  if (config.repos.some(r => r.includes('*'))) {
    await resolveRepoPatterns(config)
  }

  // resolve secrets with regex patterns
  if (config.secrets.some(s => s.includes('*'))) {
    await resolveSecretPatterns(config)
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

  const repositories = await getRepos(options)
  let repos = (repositories)
    .filter(i => filter(i) && (options.private || !i.private))
    .filter(i => options.fork || !i.fork)
    .map(i => i.full_name)

  if (repos.length) {
    repos = [...new Set([...options.repos, ...repos])]
  }
  repos = repos.filter(i => !i.includes('*'))

  if (!repos.length) {
    p.outro(c.red('No repos found'))
    process.exit(1)
  }

  if (options.yes) {
    options.repos = repos
    return
  }

  const result = await p.multiselect<string>({
    message: 'Select repos to sync',
    options: repos.map(i => ({ label: i, value: i })),
    initialValues: repos,
  })

  if (p.isCancel(result)) {
    console.error(c.red('aborting'))
    process.exit(1)
  }

  if (typeof result === 'symbol') {
    console.error(c.red('invalid repo selection'))
    process.exit(1)
  }

  options.repos = result
}

async function resolveSecretPatterns(options: SyncOptions) {
  const filter = createRegexFilter<'name', Secret>(options.secrets, 'name')

  let secrets = (await getRepoSecrets(options))
    .filter(i => filter(i))
    .map(i => i.name)

  if (secrets.length) {
    secrets = [...new Set([...options.secrets, ...secrets])]
  }
  secrets = secrets.filter(i => !i.includes('*'))

  if (options.yes || !secrets.length) {
    options.secrets = secrets
    return
  }

  const result = await p.multiselect<string>({
    message: 'Select secrets to sync',
    options: secrets.map(i => ({ label: i, value: i })),
    initialValues: secrets,
  })

  if (p.isCancel(result)) {
    console.error(c.red('aborting'))
    process.exit(1)
  }

  if (typeof result === 'symbol') {
    console.error(c.red('invalid secret selection'))
    process.exit(1)
  }

  options.secrets = result
}
