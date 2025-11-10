import { defineConfig, mergeCatalogRules } from 'pncat'

export default defineConfig({
  catalogRules: mergeCatalogRules([
    {
      name: 'node',
      match: ['yaml', 'yocto-spinner'],
    },
    {
      name: 'utils',
      match: ['@octokit/core', 'libsodium-wrappers'],
    },
  ]),
  postRun: 'eslint --fix "**/package.json" "**/pnpm-workspace.yaml"',
})
