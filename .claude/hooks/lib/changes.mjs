//
//  changes — what counts as a change someone would notice, for the journal checks
//  ──────────────────────────────────────────────────────────────────────────────
//
//  Two checks look at the change journal (docs/changes.md): one when work goes out, one when a
//  session starts on top of unfinished work. Both need the same answer to "did the prototype
//  change, or only its plumbing?", so it lives here once.
//
import { execFileSync } from 'node:child_process'

export const JOURNAL = 'docs/changes.md'

// What a person looking at the prototype could notice: screens and components, their pictures,
// the product documents. The kit's own files, packages, generated data and settings are not.
const NOTICEABLE = /^(src|public|docs)\//
const PLUMBING = /^(src\/kit\/|public\/context-app-data\/|docs\/changes\.md$)/

export function noticeable(files) {
  return files.filter((f) => NOTICEABLE.test(f) && !PLUMBING.test(f))
}

/** git, quietly: the output as text, or null when git is missing or the folder is not a repo. */
export function git(root, args) {
  try {
    return execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
  } catch {
    return null
  }
}

/** Files touched by the commits that a push would send: ahead of the upstream, or of every
 *  remote branch when there is no upstream yet (a branch's first push). */
export function outgoingFiles(root) {
  const upstream = git(root, ['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}'])
  const range = upstream ? ['@{u}..HEAD'] : ['HEAD', '--not', '--remotes']
  const out = git(root, ['log', '--name-only', '--format=', ...range])
  return out == null ? null : [...new Set(out.split('\n').map((l) => l.trim()).filter(Boolean))]
}

/** Files changed on disk and not committed, staged or not, new files included. */
export function uncommittedFiles(root) {
  const out = git(root, ['status', '--porcelain', '--untracked-files=all'])
  if (out == null) return null
  return out.split('\n').filter(Boolean).map((l) => l.slice(3).replace(/^.* -> /, '').replace(/^"|"$/g, ''))
}
