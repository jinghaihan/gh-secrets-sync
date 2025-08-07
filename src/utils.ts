export function formatToken(token: string) {
  return `Bearer ${token}`
}

export function parseRepo(repoPath: string) {
  const [owner, repo] = repoPath.split('/')
  return { owner, repo }
}
