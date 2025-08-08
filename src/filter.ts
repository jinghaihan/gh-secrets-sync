export function createRegexFilter<K extends string, T extends Record<K, string> = Record<K, string>>(
  options: string[],
  field: K,
) {
  const list = options.filter(i => i.includes('*'))

  if (list.length === 0 || list.includes('*'))
    return () => true

  const regexes = list.map(r => new RegExp(r))
  return (i: T) => regexes.some(regex => regex.test(i[field]))
}
