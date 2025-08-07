# GitHub Secrets Sync

A CLI tool to batch sync GitHub Actions secrets across multiple repositories. Sync secrets from a central repository to target repositories using GitHub CI.

## Why Use This Tool?

Managing GitHub Actions secrets across multiple repositories can be tedious:

- **Manual repetition**: You need to manually add the same secret to each repository
- **Time-consuming**: Updating a secret across many repos requires visiting each one individually
- **Error-prone**: Easy to forget to update a secret in one of the repositories

This tool automates the process, allowing you to sync secrets across multiple repositories with a single command.

## Usage

1. **Create a configuration file** (`secrets.config.yaml`) in your central repository:

```yaml
repos:
  - owner/vscode-extension1
  - owner/vscode-extension2

envs:
  - VSCE_PAT
  - OVSX_PAT
```

2. **Set up GitHub CI** in your central repository:

```yaml
# .github/workflows/sync-secrets.yml
name: Sync Secrets

permissions:
  contents: write

on:
  push:
    branches:
      - main

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
        run: npx gh-secrets-sync
        env:
          GITHUB_PAT: ${{secrets.GITHUB_PAT}}
          VSCE_PAT: ${{secrets.VSCE_PAT}}
          OVSX_PAT: ${{secrets.OVSX_PAT}}
```

3. **Configure secrets in your central repository**:
   - Go to your central repository Settings > Secrets and variables > Actions
   - Add `GITHUB_PAT` as a repository secret (this is your GitHub Personal Access Token)
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
6. Add the token as a repository secret named `GITHUB_PAT` in your central repository

## License

[MIT](./LICENSE) License © [jinghaihan](https://github.com/jinghaihan)
