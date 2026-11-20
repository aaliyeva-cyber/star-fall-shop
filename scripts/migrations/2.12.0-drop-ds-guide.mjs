//
//  2.12.0 — the design system team's guide leaves the project
//  ──────────────────────────────────────────────────────────
//
//  Up to 2.11 the kit fetched a skill from another team's repository into
//  .claude/skills/xui-toolkit-v2 whenever a project picked XUI. It moved at that team's pace and
//  kept describing an older library: it refused real b2c packages and did not know the table.
//  The kit no longer fetches it. What the agent leans on now is the catalogue (`ds.mjs`), the
//  package types and the design system's public documentation (llms.txt, linked from the rules).
//
//  The folder was never in the kit's manifest — the fetch wrote it after the install — so the
//  ordinary "removed" list cannot take it: that list deletes only files the kit recorded writing.
//  The fetch left its own fingerprint instead: a note it put at the top of every page. A page
//  carrying it is the fetched guide and goes; a page without it was written or edited by someone
//  here and stays, named in the report. Harmless to run twice: the second time there is nothing.
//
import fs from 'node:fs'
import path from 'node:path'

const FOLDER = path.join('.claude', 'skills', 'xui-toolkit-v2')
const PRINT = 'This guide belongs to the design system team and can describe an older library'

export function run(target) {
  const dir = path.join(target, FOLDER)
  if (!fs.existsSync(dir)) return null
  const gone = []
  const kept = []
  const walk = (abs, rel) => {
    for (const e of fs.readdirSync(abs, { withFileTypes: true })) {
      const a = path.join(abs, e.name)
      const r = rel ? rel + '/' + e.name : e.name
      if (e.isDirectory()) { walk(a, r); continue }
      let text = ''
      try { text = fs.readFileSync(a, 'utf8') } catch {}
      if (e.name.endsWith('.md') && text.includes(PRINT)) { fs.rmSync(a, { force: true }); gone.push(r) }
      else kept.push(r)
    }
  }
  walk(dir, '')
  const prune = (abs) => {
    for (const e of fs.readdirSync(abs, { withFileTypes: true })) if (e.isDirectory()) prune(path.join(abs, e.name))
    if (!fs.readdirSync(abs).length) fs.rmdirSync(abs)
  }
  prune(dir)
  const said = []
  if (gone.length) said.push('the design system team\'s guide (.claude/skills/xui-toolkit-v2, ' + gone.length + ' pages) is gone — the agent works from the catalogue, the types and the public llms.txt')
  if (kept.length) said.push('left in .claude/skills/xui-toolkit-v2, not written by the kit: ' + kept.join(', '))
  return said.join('; ') || null
}
