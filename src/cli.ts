import type { CAC } from 'cac'
import type { CommandOptions } from './types'
import process from 'node:process'
import c from 'ansis'
import { cac } from 'cac'
import { name, version } from '../package.json'
import { resolveConfig } from './config'
import { createOrUpdateRepoSecret, getRepoPublicKey } from './git'

try {
  const cli: CAC = cac('gh-secrets-sync')

  cli
    .command('')
    .option('--config <config>', 'secrets config file', { default: './secrets.config.yaml' })
    .option('--secrets <secrets...>', 'secrets name to sync', { default: [] })
    .option('--token <token>', 'GitHub token')
    .option('--env-prefix <prefix>', 'environment variable prefix', { default: '' })
    .option('--strict', 'Throw error if secret is not found in the environment variables', { default: true })
    .option('--dry', 'Dry run', { default: false })
    .allowUnknownOptions()
    .action(async (options: CommandOptions) => {
      console.log(`${c.yellow(name)} ${c.dim(`v${version}`)}`)
      console.log()

      const config = await resolveConfig(options)

      for (const repo of config.repos) {
        const publicKey = await getRepoPublicKey(repo, config)
        for (const secretKey of config.secrets) {
          const secretValue = getEnv(secretKey, config.strict)
          if (!secretValue)
            continue
          await createOrUpdateRepoSecret(secretKey, secretValue, publicKey, repo, config)
        }
      }

      console.log(c.green('Done'))
    })

  cli.help()
  cli.version(version)
  cli.parse()
}
catch (error) {
  console.error(error)
  process.exit(1)
}

function getEnv(name: string, strict: boolean) {
  const value = process.env[name]
  if (!value) {
    const error = c.red(`Secret ${name} not found in environment variables`)
    if (strict)
      throw new Error(error)
    else
      console.warn(c.yellow(error))
  }
  return value
}
