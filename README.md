# GitHub Secrets Sync

[![npm version][npm-version-src]][npm-version-href]
[![bundle][bundle-src]][bundle-href]
[![JSDocs][jsdocs-src]][jsdocs-href]
[![License][license-src]][license-href]

A CLI tool to batch sync GitHub Actions secrets across multiple repositories. Sync secrets from a central repository to target repositories using GitHub CI.

## Why?

Managing GitHub Actions secrets across multiple repositories can be tedious:

- **Manual repetition**: You need to manually add the same secret to each repository
- **Error-prone**: Easy to forget to update a secret in one of the repositories

This tool automates the process, allowing you to sync secrets across multiple repositories with a single command.

## Usage

**Create a configuration file** (`secrets.config.yaml`) in your central repository or local directory:

```yaml
repos:
  - owner/vscode-*

envs:
  - VSCE_PAT
  - OVSX_PAT
```

> [!NOTE]
> Both `repos` and `envs` support `*` wildcards. For `repos`, the tool lists all repositories accessible by your token and filters by the pattern (e.g., `owner/vscode-*`). For `envs`, wildcards are expanded by listing secrets from the central repository and matching by name. The central repository is auto-detected in GitHub Actions (from the checked-out repo); for local runs, pass `--repo <owner/repo>`.

### Local usage

If GitHub CI feels too complex, you can simply run it locally:

```bash
# Set your token and secret values in env
export GH_PAT=...
export VSCE_PAT=...
export OVSX_PAT=...

npx gh-secrets-sync
```

### GitHub CI usage

**Set up GitHub CI** in your central repository:

```yaml
# .github/workflows/sync-secrets.yml
name: Sync Secrets

permissions:
  contents: write

on:
  push:
    branches: [main]
  schedule:
    - cron: '0 0 * * *'
  workflow_dispatch:

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Set node
        uses: actions/setup-node@v4
        with:
          node-version: lts/*

      - name: Sync Secrets
        # if regex patterns are used in `repos` or `secrets` must set `--yes` in GitHub Actions
        run: npx gh-secrets-sync --yes
        env:
          GH_PAT: ${{secrets.GH_PAT}}
          VSCE_PAT: ${{secrets.VSCE_PAT}}
          OVSX_PAT: ${{secrets.OVSX_PAT}}
```

**Configure secrets in your central repository**:
   - Go to your central repository Settings > Secrets and variables > Actions
   - Add `GH_PAT` as a repository secret (this is your GitHub Personal Access Token)
   - Add `VSCE_PAT` and `OVSX_PAT` as repository secrets

### How to Get Your GitHub Token

1. Go to [GitHub Personal Access Tokens](https://github.com/settings/personal-access-tokens)
2. Click "Generate new token"
3. Give it a descriptive name like "Secrets Sync Tool"
4. Select the required scopes:
   - Repository permissions > Secrets: Read and write
   - Repository permissions > Actions: Read and write
   - Metadata
5. Click "Generate token"
6. Add the token as a repository secret named `GH_PAT` in your central repository

## License

[MIT](./LICENSE) License © [jinghaihan](https://github.com/jinghaihan)

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/gh-secrets-sync?style=flat&colorA=080f12&colorB=1fa669
[npm-version-href]: https://npmjs.com/package/gh-secrets-sync
[npm-downloads-src]: https://img.shields.io/npm/dm/gh-secrets-sync?style=flat&colorA=080f12&colorB=1fa669
[npm-downloads-href]: https://npmjs.com/package/gh-secrets-sync
[bundle-src]: https://img.shields.io/bundlephobia/minzip/gh-secrets-sync?style=flat&colorA=080f12&colorB=1fa669&label=minzip
[bundle-href]: https://bundlephobia.com/result?p=gh-secrets-sync
[license-src]: https://img.shields.io/badge/license-MIT-blue.svg?style=flat&colorA=080f12&colorB=1fa669
[license-href]: https://github.com/jinghaihan/gh-secrets-sync/LICENSE
[jsdocs-src]: https://img.shields.io/badge/jsdocs-reference-080f12?style=flat&colorA=080f12&colorB=1fa669
[jsdocs-href]: https://www.jsdocs.io/package/gh-secrets-sync
