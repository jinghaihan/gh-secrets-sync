export interface CommonOptions {
  cwd?: string
  /**
   * Dry run
   */
  dry?: boolean
}

export interface CommandOptions extends CommonOptions {
  /**
   * Secrets config file
   */
  config?: string
  /**
   * Repos to sync
   */
  repos?: string[]
  /**
   * Secrets name to sync
   */
  secrets?: string[]
  /**
   * GitHub token
   * https://github.com/settings/personal-access-tokens
   */
  token?: string
  /**
   * GitHub API version
   */
  apiVersion?: string
  /**
   * Detect private repositories
   */
  private?: boolean
  /**
   * Environment variable prefix
   */
  envPrefix?: string
  /**
   * Throw error if secret is not found in the environment variables
   */
  strict?: boolean
}

export type SyncOptions = Required<CommandOptions>

export interface PublicKey {
  key_id: string
  key: string
}

export interface Repo {
  name: string
  full_name: string
  private: boolean
}
