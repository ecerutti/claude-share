// Paths a guest's tool call touches, checked against the host's project.

// The paths a read tool's call names, absolute, with `.` and `..` worked out
// as written, or null when one is outside the project as written: absolute
// elsewhere, climbing out, or `~`. A Glob's pattern counts up to its first
// wildcard, from the folder it's given, and one that climbs (`..`) after a
// wildcard is outside: `**` can stand for no folder at all. Every other path
// is a name as it is, whatever characters it holds. Links are the caller's
// to follow (`readsInsideReally`): as written, a link in the project names a
// place in it, and a path climbing back out of one (`notes/../x`) goes on
// from where the link points, so that one is given as written too.
export function readTargets(tool: string, input: Record<string, unknown>, cwd: string): string[] | null {
  // Windows (a project at `C:\…`): its paths taken with `/` between names,
  // the drive as the first name, and compared without case, as the file
  // system does. A path with no drive (`\x`, `C:x`, `\\server\share`) asks.
  const win = isWinPath(cwd)
  const slashed = (p: string) => (win ? p.replace(/\\/g, '/') : p)
  const root = slashed(cwd).replace(/\/+$/, '')
  const named = (p: unknown): p is string => typeof p === 'string' && p.length > 0
  const absolute = (p: string) => (win ? /^[A-Za-z]:\//.test(p) : p.startsWith('/'))
  // A path's names as written, absolute: a pattern's up to its first wildcard.
  const names = (p: string, from: string, pattern: boolean): string[] | null => {
    if (win && (p.startsWith('/') || /^[A-Za-z]:(?!\/)/.test(p))) return null
    const all = (absolute(p) ? p : `${from}/${p}`).split('/').filter(part => part && part !== '.')
    const first = pattern ? all.findIndex(part => /[*?[{]/.test(part)) : -1
    if (first < 0) return all
    return all.slice(first).some(part => part.includes('..')) ? null : all.slice(0, first)
  }
  // Worked out as written: `..` takes the name before it.
  const lexical = (list: readonly string[]) => {
    const parts: string[] = []
    for (const part of list) {
      if (part === '..') parts.pop()
      else parts.push(part)
    }
    return win ? parts.join('/') : `/${parts.join('/')}`
  }
  const fold = (p: string) => (win ? p.toLowerCase() : p)
  const inside = (full: string) => fold(full) === fold(root) || fold(full).startsWith(`${fold(root)}/`)
  const given: { path: string; from: string; pattern: boolean }[] = [input.file_path, input.notebook_path, input.path]
    .filter(named)
    .map(path => ({ path, from: root, pattern: false }))
  if (tool === 'Glob' && named(input.pattern))
    given.push({ path: input.pattern, from: named(input.path) ? lexical(names(slashed(input.path), root, false) ?? []) : root, pattern: true })
  const out: string[] = []
  for (const { path: written, from, pattern } of given) {
    if (written.startsWith('~') || written.includes('\n')) return null
    const path = slashed(written)
    const list = names(path, from, pattern)
    if (!list || !inside(lexical(list))) return null
    out.push(lexical(list))
    if (list.includes('..')) out.push(win ? list.join('/') : `/${list.join('/')}`)
  }
  return out
}

// A guest's read runs without asking only inside this project: a share link
// can be forwarded, and ~/.ssh is one Read away. Paths are the ones the read
// tools take; anything relative climbing out, or absolute elsewhere, asks.
export const readsInside = (tool: string, input: Record<string, unknown>, cwd: string): boolean => readTargets(tool, input, cwd) !== null

// Whether every real path (links followed) is the project's real folder or in it.
export const realInside = (root: string, paths: readonly string[]): boolean => {
  // On Windows realpath answers `C:/…` (or `C:\…`): compared with `/` and without case.
  const win = isWinPath(root)
  const norm = (p: string) => (win ? p.replace(/\\/g, '/').toLowerCase() : p)
  const top = norm(root).replace(/\/+$/, '')
  return paths.map(norm).every(p => p === top || p.startsWith(`${top}/`) || (top === '' && p.startsWith('/')))
}

// A Windows path with its drive: `C:\…` or `C:/…`.
export const isWinPath = (p: string): boolean => /^[A-Za-z]:[\\/]/.test(p)
