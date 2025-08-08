import type { PublicKey, Repo, SyncOptions } from './types'
import process from 'node:process'
import { Octokit } from '@octokit/core'
import c from 'ansis'
import Spinner from 'yocto-spinner'
import { encrypt } from './encrypt'
import { formatToken, parseRepo } from './utils'

export async function readTokenFromGitHubCli() {
  try {
    return await execCommand('gh', ['auth', 'token'])
  }
  catch {
    return ''
  }
}

export async function getGitHubRepo(baseUrl: string) {
  const url = await execCommand('git', ['config', '--get', 'remote.origin.url'])
  const escapedBaseUrl = baseUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`${escapedBaseUrl}[\/:]([\\w\\d._-]+?)\\/([\\w\\d._-]+?)(\\.git)?$`, 'i')
  const match = regex.exec(url)
  if (!match)
    throw new Error(`Can not parse GitHub repo from url ${url}`)
  return `${match[1]}/${match[2]}`
}

async function execCommand(cmd: string, args: string[]) {
  const { execa } = await import('execa')
  const res = await execa(cmd, args)
  return res.stdout.trim()
}

// https://docs.github.com/en/rest/actions/secrets?apiVersion=2022-11-28#get-a-repository-public-key
export async function getRepoPublicKey(repoPath: string, config: SyncOptions): Promise<PublicKey> {
  const octokit = createOctokit(config)
  const { owner, repo } = parseRepo(repoPath)
  const url = `GET /repos/${owner}/${repo}/actions/secrets/public-key`

  return withSpinner<PublicKey>(
    `Fetching public key for ${repoPath}`,
    `Public key fetched successfully for ${repoPath}`,
    `Failed to fetch public key for ${repoPath}`,
    `Fetch Public Key: ${c.yellow(url)}`,
    { key: '', key_id: '' },
    config,
    async () => {
      const { status, data } = await octokit.request(
        url,
        {
          owner,
          repo,
          headers: {
            'X-GitHub-Api-Version': config.apiVersion,
          },
        },
      )
      if (status !== 200) {
        throw new Error(`HTTP ${status}: ${JSON.stringify(data)}`)
      }
      return data as PublicKey
    },
  )
}

// https://docs.github.com/en/rest/actions/secrets?apiVersion=2022-11-28#create-or-update-a-repository-secret
export async function createOrUpdateRepoSecret(
  secretName: string,
  secretValue: string,
  publicKey: PublicKey,
  repoPath: string,
  config: SyncOptions,
) {
  const octokit = createOctokit(config)
  secretName = `${config.envPrefix}${secretName}`
  const { owner, repo } = parseRepo(repoPath)
  const url = `PUT /repos/${owner}/${repo}/actions/secrets/${secretName}`

  return withSpinner(
    `Create or update ${secretName} for ${repoPath}`,
    `${secretName} created/updated successfully for ${repoPath}`,
    `Failed to create or update ${secretName} for ${repoPath}`,
    `Create or Update Secret: ${c.yellow(url)}`,
    undefined,
    config,
    async () => {
      const { status, data } = await octokit.request(
        url,
        {
          owner,
          repo,
          secret_name: secretName,
          encrypted_value: await encrypt(secretValue, publicKey),
          key_id: publicKey.key_id,
          headers: {
            'X-GitHub-Api-Version': config.apiVersion,
          },
        },
      )

      if (status !== 201 && status !== 204) {
        throw new Error(`HTTP ${status}: ${JSON.stringify(data)}`)
      }

      return data
    },
  )
}

// https://docs.github.com/rest/repos/repos#list-repositories-for-the-authenticated-user
export async function getRepos(config: SyncOptions): Promise<Repo[]> {
  const octokit = createOctokit(config)
  const url = 'GET /user/repos'

  return withSpinner<Repo[]>(
    'Fetching repositories',
    'Repositories fetched successfully',
    'Failed to fetch repositories',
    `Fetch Repositories: ${c.yellow(url)}`,
    [],
    config,
    async () => {
      const { status, data } = await octokit.request(url, {
        headers: {
          'X-GitHub-Api-Version': config.apiVersion,
        },
      })
      if (status !== 200) {
        throw new Error(`HTTP ${status}: ${JSON.stringify(data)}`)
      }
      return data as Repo[]
    },
  )
}

function createOctokit(config: SyncOptions) {
  return new Octokit({ auth: formatToken(config.token) })
}

async function withSpinner<T>(
  loadingText: string,
  successText: string,
  failedText: string,
  dryText: string,
  defaultValue: T,
  config: SyncOptions,
  request: () => Promise<T>,
): Promise<T> {
  const spinner = Spinner({ text: c.blue(loadingText) }).start()

  let result: T
  if (!config.dry) {
    try {
      result = await request()
      spinner.success(c.green(successText))
    }
    catch (error) {
      spinner.error(c.red(failedText))
      console.error(c.red(JSON.stringify(error, null, 2)))
      process.exit(1)
    }
  }
  else {
    console.log()
    console.log(c.yellow(dryText))
    result = defaultValue
  }

  return result
}
