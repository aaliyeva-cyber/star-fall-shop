//
//  settings-export — what the Context button needs beyond the map: settings, ideas, scenarios
//  ─────────────────────────────────────────────────────────────────────────────────────────
//
//  WHY THIS EXISTS
//  The Context App shows a prototype's settings in its Settings tab (level by level, with
//  presets), the ideas being tested on its Hypotheses tab, and the product's scenarios drawn on
//  the screen map. None of it is invented here: it is read from the project's own files and
//  added to the manifest that context-app.mjs export builds.
//
//  WHERE EACH PART COMES FROM
//    src/variants.json                              settings and presets
//    docs/features/<f>/00_context/hypotheses.md     H-N cards
//    docs/features/<f>/03_jobs-and-tasks/job-stories.md   JS-N — a scenario's reason
//    docs/features/<f>/04_scenarios/scenario-matrix.md    the scenarios (HP-N), names, status
//    docs/features/<f>/04_scenarios/happy-paths.md        "**Map:**" — the map points a path
//                                                         walks; "**Map deviations:**" — EC/FR
//    the git remote and branch                      the Open repo link
//
//  Formats differ between teams, so the reading is forgiving: HP-1 or HP-01, "—", "–" or ":",
//  job stories in a table or as "**JS-PUB-1.** When…" paragraphs, EC/FR as headings or rows.
//
import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'

const cells = (line) => line.split('|').slice(1, -1).map((c) => c.trim())

/** The first table of a text, its rows keyed by the header words in lower case. */
function tableRows(text) {
  const lines = text.split(/\r?\n/)
  const start = lines.findIndex((l) => l.trim().startsWith('|'))
  if (start === -1) return []
  const block = []
  for (const l of lines.slice(start)) {
    if (!l.trim().startsWith('|')) break
    block.push(l)
  }
  const head = cells(block[0]).map((h) => h.toLowerCase())
  return block.slice(2).map((l) => Object.fromEntries(cells(l).map((v, i) => [head[i], v])))
}

const col = (row, ...names) => {
  for (const [k, v] of Object.entries(row)) if (names.some((n) => k.startsWith(n))) return v
  return ''
}
const plain = (s) => s.replace(/\*\*/g, '').replace(/`/g, '').trim()
/** Job story ids: JS-1, JS-3b, and the role-scoped JS-PUB-1 some teams use. */
const STORY = /JS-(?:[A-Z]+-)*\d+[a-z]?/g
const isStory = (id) => /^JS-(?:[A-Z]+-)*\d+[a-z]?$/.test(id)
/** "HP-1 — Title", "HP-01 - Title" or "HP-01: Title". */
const SEP = '\\s*[—–:-]\\s*'

function reader(docsRoot, feature) {
  return (rel) => {
    const f = path.join(docsRoot, feature, rel)
    return fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : ''
  }
}

export function hypothesesOf(read) {
  const out = []
  for (const block of read('00_context/hypotheses.md').split(/^## /m).slice(1)) {
    const head = block.match(/^(H-\d+)\.\s*(.+)$/m)
    if (!head) continue
    const field = (name) => block.match(new RegExp('\\*\\*' + name + ':\\*\\*\\s*(.+)'))?.[1].trim() ?? null
    out.push({
      id: head[1], title: head[2].trim(), status: field('Status'), belief: field('We believe'),
      test: field('How we test'), signal: field('Signal'), result: field('Result'), doc: '00_context/hypotheses.md',
    })
  }
  return out
}

/** Job stories with their scenarios, each scenario's steps on the map; and what did not add up. */
export function scenariosOf(read, feature, map) {
  const nodes = new Set((map?.nodes ?? []).map((n) => n.id))
  const edgeLabel = (from, to) => map?.edges?.find((e) => e.from === from && e.to === to)?.label ?? ''
  const problems = []

  const deviations = {}
  for (const [file, kind] of [['04_scenarios/edge-cases.md', 'edge'], ['04_scenarios/failure-and-recovery.md', 'failure']]) {
    for (const m of read(file).matchAll(new RegExp(`^#{2,4} ((?:EC|FR)-\\d+)${SEP}(.+)$`, 'gm'))) {
      deviations[m[1]] = { kind, title: plain(m[2]), recover: null }
    }
  }
  for (const r of tableRows(read('04_scenarios/edge-cases.md'))) {
    const id = col(r, 'id')
    if (id) deviations[id] = { kind: 'edge', title: plain(col(r, 'name', 'situation', 'edge case')), recover: null }
  }
  for (const r of tableRows(read('04_scenarios/failure-and-recovery.md'))) {
    const id = col(r, 'id')
    if (id) deviations[id] = { kind: 'failure', title: plain(col(r, 'what breaks', 'failure')), recover: plain(col(r, 'recovery', 'how they recover')) || null }
  }

  const paths = []
  for (const block of read('04_scenarios/happy-paths.md').split(/^## /m).slice(1)) {
    const head = block.match(new RegExp(`^(HP-\\d+)${SEP}(.+)$`, 'm'))
    if (!head) continue
    const mapLine = block.match(/\*\*Map:\*\*\s*(.+)/)
    const ids = mapLine ? [...mapLine[1].matchAll(/`([^`]+)`/g)].map((m) => m[1]) : []
    for (const id of ids) if (!nodes.has(id)) problems.push(`${feature} ${head[1]}: the Map line names "${id}", which is not a point on the map`)
    const steps = ids.map((node, i) => ({ n: i + 1, node, action: i ? edgeLabel(ids[i - 1], node) : 'Starts here' }))
    const branches = []
    const devLine = block.match(/\*\*Map deviations:\*\*\s*(.+)/)
    for (const part of devLine ? devLine[1].split('·') : []) {
      const m = part.match(/((?:EC|FR)-\d+)\s*`([^`]+)`\s*→\s*`([^`]+)`/)
      if (!m) continue
      const [, id, from, to] = m
      const at = ids.indexOf(from)
      if (at === -1 || !nodes.has(to)) {
        problems.push(`${feature} ${head[1]} ${id}: ${from} → ${to} does not leave from this path's own points`)
        continue
      }
      const d = deviations[id] ?? { kind: id.startsWith('FR') ? 'failure' : 'edge', title: id, recover: null }
      branches.push({ id, ...d, atStep: Math.min(at + 2, ids.length), node: to })
    }
    const stories = block.match(/\*\*Job Story:\*\*\s*([^\n]+)/)?.[1].match(STORY) ?? []
    paths.push({ id: head[1], title: plain(head[2].replace(/—\s*DEFERRED/i, '')), stories, steps, branches })
  }

  // The matrix is the list: its happy paths in its order, with its names and statuses, tied to
  // job stories by "Related JS". A path the matrix does not list still shows.
  const matrix = tableRows(read('04_scenarios/scenario-matrix.md')).filter((r) => /^HP-\d+$/.test(col(r, 'id')))
  const list = matrix.map((r) => {
    const id = col(r, 'id')
    const p = paths.find((x) => x.id === id)
    const related = col(r, 'related js').match(STORY) ?? []
    return {
      id,
      title: plain(col(r, 'name', 'scenario')) || p?.title || id,
      status: plain(col(r, 'status')).split(/[.—(]/)[0].trim() || null,
      stories: related.length ? related : p?.stories ?? [],
      steps: p?.steps ?? [],
      branches: p?.branches ?? [],
    }
  })
  for (const p of paths) if (!list.some((s) => s.id === p.id)) list.push({ ...p, status: null })

  // Some products split the stories by role into a file of that name.
  const storiesText = read('03_jobs-and-tasks/job-stories.md') || read('03_jobs-and-tasks/job-stories-by-role.md')
  let jobs = tableRows(storiesText).filter((r) => isStory(col(r, 'id')))
  if (!jobs.length) {
    jobs = [...storiesText.matchAll(/^\*\*(JS-(?:[A-Z]+-)*\d+[a-z]?)\.\*\*\s*(.+)$/gm)].map((m) => ({
      id: m[1],
      'job story': m[2].replace(/\s*\*\([^)]*\)\*\s*$/, ''),
    }))
  }
  const out = jobs.map((r) => {
    const sentence = plain(col(r, 'job story')).replace(/^(?:\[[^\]]+\]\s*)+/, '')
    const part = (re) => sentence.match(re)?.[1].trim() ?? ''
    const want = plain(col(r, 'i want to', 'i want')) || part(/(?:^|[,—–]\s*)I want (?:to )?(.+?)(?:,? so (?:that )?|\.?$)/i)
    return {
      id: col(r, 'id'),
      title: want.charAt(0).toUpperCase() + want.slice(1),
      when: plain(col(r, 'when')) || part(/^When (.+?)\s*[,—–]\s*I want/i),
      want,
      soThat: plain(col(r, 'so that')) || part(/(?:^|[,—–]\s*)I want .+?,? so (?:that )?(.+?)\.?$/i),
      role: plain(col(r, 'role')),
      scenarios: list.filter((s) => s.stories[0] === col(r, 'id')).map(({ stories, ...s }) => s),
    }
  })

  // The Context App lists scenarios only under a job story. Job stories live in stage 03, which
  // the recommended minimum leaves out — so a project that took the minimum described its happy
  // paths, drew them on the map, and saw no scenario switcher at all, with nothing saying why.
  // A path no listed story claims is gathered under one group of its own instead of dropped.
  const claimed = new Set(out.flatMap((j) => j.scenarios.map((s) => s.id)))
  const loose = list.filter((s) => !claimed.has(s.id)).map(({ stories, ...s }) => s)
  if (loose.length) out.push({ id: 'no-job-story', title: 'Scenarios without a job story', when: '', want: '', soThat: '', role: '', scenarios: loose })
  return { out, problems }
}

/** The Open repo link: the git remote at the branch being built. */
export function repositoryOf(root) {
  try {
    const git = (args) => execSync('git ' + args, { cwd: root, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
    const remote = git('remote get-url origin').replace(/^git@([^:]+):/, 'https://$1/').replace(/\.git$/, '')
    // symbolic-ref, not rev-parse: a repository with no commit yet still has a branch.
    let branch = ''
    try { branch = git('symbolic-ref --short HEAD') } catch {}
    return branch && branch !== 'HEAD' ? { url: `${remote}/tree/${branch}`, label: branch } : { url: remote }
  } catch {
    return null
  }
}

/** The settings file as the Context App reads it; null when the project declares none. */
export function variantsOf(root) {
  const file = path.join(root, 'src', 'variants.json')
  if (!fs.existsSync(file)) return null
  let reg
  try {
    reg = JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch (e) {
    throw new Error('src/variants.json is not valid JSON (' + e.message + ') — the settings cannot be read until it is fixed')
  }
  const axes = Object.entries(reg.axes ?? {})
  if (!axes.length) return null
  return {
    defaultVersion: reg.defaultVersion ?? '',
    url: reg.url ?? { style: 'params', version: 'preset' },
    versions: Object.entries(reg.presets ?? {}).map(([id, p]) => ({ id, ...p })),
    axes: axes.map(([id, a]) => ({
      id,
      // The address parameter is the setting's id unless it says otherwise (src/kit/settings.ts).
      param: a.param ?? id,
      ...a,
      options: Object.entries(a.options ?? {}).map(([oid, label]) => ({ id: oid, label })),
    })),
  }
}

/** Map lines naming points the built map does not have — for the check before a deploy. */
export function scenarioProblems(manifest, { docsRoot }) {
  return (manifest.features ?? []).flatMap((f) => scenariosOf(reader(docsRoot, f.id), f.id, f.flowMap).problems)
}

/**
 * Adds settings, hypotheses, scenarios and the repository to a written manifest, in place.
 * Returns what did not add up (Map lines naming points the map does not have).
 */
export function addSettings(manifestFile, { root, docsRoot }) {
  const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'))
  const problems = []
  const variants = variantsOf(root)
  if (variants) manifest.variants = variants
  else delete manifest.variants
  const repo = repositoryOf(root)
  if (repo) manifest.repository = repo
  for (const f of manifest.features ?? []) {
    const read = reader(docsRoot, f.id)
    const h = hypothesesOf(read)
    if (h.length) f.hypotheses = h
    const s = scenariosOf(read, f.id, f.flowMap)
    if (s.out.some((x) => x.scenarios.some((sc) => sc.steps.length))) f.jobStories = s.out
    problems.push(...s.problems)
  }
  fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 2) + '\n')
  return {
    problems,
    settings: variants?.axes.length ?? 0,
    presets: variants?.versions.length ?? 0,
    hypotheses: (manifest.features ?? []).reduce((n, f) => n + (f.hypotheses?.length ?? 0), 0),
    scenarios: (manifest.features ?? []).reduce((n, f) => n + (f.jobStories ?? []).reduce((m, j) => m + j.scenarios.length, 0), 0),
  }
}
