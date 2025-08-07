import type { PublicKey, SyncOptions } from './types'
import process from 'node:process'
import { Octokit } from '@octokit/core'
import c from 'ansis'
import Spinner from 'yocto-spinner'
import { GITHUB_API_VERSION } from './constants'
import { encrypt } from './encrypt'
import { formatToken } from './utils'

// https://docs.github.com/en/rest/actions/secrets?apiVersion=2022-11-28#get-a-repository-public-key
export async function getRepoPublicKey(repoPath: string, config: SyncOptions): Promise<PublicKey> {
  const octokit = new Octokit({
    auth: formatToken(config.token),
  })

  const spinner = Spinner({ text: c.blue(`Fetching public key for ${repoPath}`) }).start()
  const { owner, repo } = parseRepo(repoPath)
  const url = `GET /repos/${owner}/${repo}/actions/secrets/public-key`

  let res: PublicKey = { key: '', key_id: '' }
  if (!config.dry) {
    const { status, data } = await octokit.request(
      url,
      {
        owner,
        repo,
        headers: {
          'X-GitHub-Api-Version': GITHUB_API_VERSION,
        },
      },
    )
    if (status !== 200) {
      spinner.error(c.red(`Failed to fetch public key for ${repoPath}: ${status}`))
      console.error(c.red(JSON.stringify(data, null, 2)))
      process.exit(1)
    }
    res = data
  }
  else {
    console.log()
    console.log(c.yellow(`Get a repository public key: ${repoPath}`))
  }

  spinner.success(c.green(`Public key fetched successfully for ${repoPath}`))
  return res
}

// https://docs.github.com/en/rest/actions/secrets?apiVersion=2022-11-28#create-or-update-a-repository-secret
export async function createOrUpdateRepoSecret(
  secretName: string,
  secretValue: string,
  publicKey: PublicKey,
  repoPath: string,
  config: SyncOptions,
) {
  const octokit = new Octokit({
    auth: formatToken(config.token),
  })

  const spinner = Spinner({ text: c.blue(`Create or update ${secretName} for ${repoPath}`) }).start()
  const { owner, repo } = parseRepo(repoPath)
  const url = `PUT /repos/${owner}/${repo}/actions/secrets/${secretName}`

  let res
  let operation = 'create or update'

  if (!config.dry) {
    const { status, data } = await octokit.request(
      url,
      {
        owner,
        repo,
        secret_name: secretName,
        encrypted_value: await encrypt(secretValue, publicKey),
        key_id: publicKey.key_id,
        headers: {
          'X-GitHub-Api-Version': GITHUB_API_VERSION,
        },
      },
    )

    if (status !== 201 && status !== 204) {
      spinner.error(c.red(`Failed to create or update ${secretName} for ${repoPath}`))
      console.error(c.red(JSON.stringify(data, null, 2)))
      process.exit(1)
    }

    operation = status === 201 ? 'created' : 'updated'
    res = data
  }
  else {
    console.log()
    console.log(c.yellow(`Create or update ${secretName} for ${repoPath}`))
  }

  spinner.success(c.green(`${secretName} ${operation} successfully for ${repoPath}`))
  return res
}

function parseRepo(repoPath: string) {
  const [owner, repo] = repoPath.split('/')
  return { owner, repo }
}
