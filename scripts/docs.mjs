#!/usr/bin/env node
//
//  docs — product documentation for a feature
//  ──────────────────────────────────────────
//
//  WHY THIS EXISTS
//  When the work runs as a full cycle, documents come before the screen: context, scenarios,
//  screen states, contracts. Each one leans on the previous, and they share one numbering —
//  rule BR-3 shows up in scenario HP-2, the scenario shows up in the state matrix. This script
//  creates them, shows where you stopped, and checks that the links did not break.
//
//  WHEN IT RUNS
//  The agent calls it. By hand, if you want to see where you are:
//    node scripts/docs.mjs                     where we are and what is next
//    node scripts/docs.mjs start promo-codes   create the documents for a feature
//    node scripts/docs.mjs screen checkout     add the documents for one screen
//    node scripts/docs.mjs check               check that nothing came apart
//
//  WHAT APPEARS
//    docs/product/PRD.md                   one per project, not per feature
//    docs/features/<feature>/00_context/   and a folder for every other stage — or wherever
//                                          the project keeps its features, see where.mjs
//  Inside a chosen stage is not emptiness but a skeleton: headings, tables and a hint about
//  what to write. Inside a stage nobody chose — one file saying it is empty and why.
//
//  WHAT IT DOES NOT DO
//  It does not write the content for you, and it does not create documents for stages you did
//  not choose in the questionnaire: the set lives in state.json and can change at any time. It
//  never touches a file that already exists — your edits are safe.
//
//  IF SOMETHING GOES WRONG
//  'no feature selected' — tell the agent which feature you are working on.
//  The check complains about a dangling reference: the text mentions HP-4 and no HP-4 exists.
//  Either describe it or drop the mention.
//
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { where, oldMethodology } from './where.mjs'

const root = process.cwd()
// The folder this script sits in. Read through fileURLToPath rather than off the URL's own
// path: a URL keeps a space as %20 and a Cyrillic letter as six characters of percent-escape,
// and a project living in "Мои прототипы" then looked for its files under a name that does
// not exist. Windows drive letters come out right through the same door.
const here = path.dirname(fileURLToPath(import.meta.url))
const NL = String.fromCharCode(10)

const catalog = JSON.parse(fs.readFileSync(path.join(here, 'stages.json'), 'utf8'))
// state.json is hand-editable and sometimes hand-broken — a trailing comma is enough. Parsed
// without care it killed this script with a stack trace addressed to nobody: a designer who
// does not use a terminal cannot read "Expected double-quoted property name at position 48",
// and the line does not even name the file.
function readState(file) {
  if (!fs.existsSync(file)) return {}
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch (e) {
    console.error('state.json cannot be read: ' + String(e.message || e))
    console.error('It holds the mode, the design system and the current feature, so nothing here')
    console.error('can run until it is valid JSON again. Usually a stray comma or a missing quote.')
    process.exit(1)
  }
}

const statePath = path.join(root, 'state.json')
const state = readState(statePath)
// Where the features live is asked once, and every command below reads the same answer.
const place = where(root, state)
const featureBase = (feature) => place.features.dir + '/' + feature

const today = new Date().toISOString().slice(0, 10)
const created = []
const skipped = []

// ——— which stages we run at all ———

function chosenStages() {
  const ids = Array.isArray(state.stages) && state.stages.length
    ? state.stages
    : catalog.stages.filter((s) => s.default).map((s) => s.id)
  return catalog.stages.filter((s) => ids.includes(s.id))
}

function saveState(patch) {
  const next = { ...state, ...patch }
  fs.writeFileSync(statePath, JSON.stringify(next, null, 2) + NL)
}

// ——— the artefact skeleton ———

function tableBlock(cols, rows) {
  const out = ['| ' + cols.join(' | ') + ' |', '|' + cols.map(() => ' --- ').join('|') + '|']
  const body = rows && rows.length ? rows : ['']
  for (const first of body) {
    out.push('| ' + [first, ...cols.slice(1).map(() => '')].join(' | ') + ' |')
  }
  return out.join(NL)
}

function sectionBlock(sec) {
  const out = ['## ' + sec.h, '']
  if (sec.hint) out.push('> ' + sec.hint, '')
  if (sec.ids) out.push('> One item per line, an id like ' + sec.ids + '-1 — other stages refer to it.', '')
  if (sec.fields) out.push(...sec.fields.map((name) => '**' + name + ':**'), '')
  if (sec.table) out.push(tableBlock(sec.table, sec.rows), '')
  return out.join(NL)
}

function statesBlock() {
  const out = ['> A screen is designed in all nine states. Whatever does not apply is marked',
    '> explicitly: N/A and the reason. Silently skipping one is not allowed.', '']
  catalog.nineStates.forEach(([name, ru], i) => {
    out.push('## ' + (i + 1) + '. ' + name + ' — ' + ru, '',
      '**Applies:** yes / N/A — why', '',
      '**What the user sees:**', '',
      '**What is available:**', '')
  })
  out.push('> What permissions forbid is hidden, not greyed out, unless a business rule',
    '> says otherwise.', '')
  return out.join(NL)
}

function skeleton(stage, artifact, feature, screen) {
  const title = artifact.title + ' — ' + (screen ? screen : feature)
  const head = ['# ' + title, '',
    '**Stage:** ' + stage.id + ' · ' + stage.title,
    '**Updated:** ' + today, '', '---', '', '']
  const body = artifact.states
    ? statesBlock()
    : (artifact.sections || []).map(sectionBlock).join(NL)
  return head.join(NL) + body
}

function write(rel, body) {
  const file = path.join(root, rel)
  if (fs.existsSync(file)) { skipped.push(rel); return }
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, body)
  created.push(rel)
}

// ——— a folder for every stage, even the ones nobody chose ———
//
// Only the chosen stages used to appear on disk, so a feature folder showed 00, 04, 06, 07 and
// read as a numbering with holes in it — as if the missing stages had been lost rather than
// declined. Every stage gets its folder now, and a folder with no documents in it says in a
// file why it is empty. Fill the stage later and the note goes by itself.

// Two different silences, and one name for both read as the same accusation. A stage nobody
// took is not filled in; a stage that was taken and keeps its documents per screen is simply
// waiting for the first screen — and calling that "not filled in" made a chosen stage look
// skipped in every project, which two runs reported as reading like a mistake.
const PLACEHOLDER = 'not-taken.md'
const WAITING = 'waiting-for-the-first-screen.md'
const PLACEHOLDERS = new Set([PLACEHOLDER, WAITING, 'not-filled-in.md'])

function placeholderFor(stage, chosen) {
  const body = chosen
    ? ['This stage is part of the project. Its documents are written one per screen, so the folder',
       'stays empty until the first one: `node scripts/docs.mjs screen <screen-name>`. Nothing has',
       'been skipped here.']
    : ['This stage was not chosen for the project, so it holds no documents. The folder is here so',
       'the ladder of stages stays visible: a missing folder reads as "there is no such stage".', '',
       'To take it, tell the agent: it adds "' + stage.id + '" to `stages` in state.json and runs',
       '`node scripts/docs.mjs start <feature>` again. The documents appear here, this file goes.']
  return ['# ' + stage.id + ' ' + stage.title + (chosen ? ' — waiting for the first screen' : ' — not taken'), '',
    ...body, '',
    '**What this stage is for:** ' + stage.why, '',
  ].join(NL)
}

function markEmptyStages(base) {
  const chosen = new Set(chosenStages().map((s) => s.id))
  for (const stage of catalog.stages) {
    const dir = path.join(root, base, stage.dir)
    const taken = chosen.has(stage.id)
    const name = taken ? WAITING : PLACEHOLDER
    const mark = path.join(dir, name)
    // Real documents arrived — the note has nothing left to explain. The older name is cleared
    // away too, so a project that already has one does not keep both.
    if (mdFiles(dir).length) {
      for (const old of PLACEHOLDERS) fs.rmSync(path.join(dir, old), { force: true })
      continue
    }
    fs.mkdirSync(dir, { recursive: true })
    for (const old of PLACEHOLDERS) if (old !== name) fs.rmSync(path.join(dir, old), { force: true })
    if (fs.existsSync(mark)) continue
    fs.writeFileSync(mark, placeholderFor(stage, taken))
    created.push(base + '/' + stage.dir + '/' + name)
  }
}

// ——— command: create the documents for a feature ———

function cmdStart(feature) {
  if (!feature || !/^[a-z0-9][a-z0-9-]*$/i.test(feature)) {
    console.error('Feature name: letters, digits and dashes. For example: node scripts/docs.mjs start promo-codes')
    process.exit(1)
  }
  write('docs/product/PRD.md', ['# PRD — ' + path.basename(root), '',
    '**Updated:** ' + today, '', '---', '',
    '> One PRD per project, not per feature. A feature brief in 00_context points here.', '',
    '## The task', '', '## Users', '', '## Requirements', '', '## Out of scope', '',
  ].join(NL))

  const base = featureBase(feature)
  for (const stage of chosenStages()) {
    if (stage.perScreen) continue          // those are created per screen
    for (const art of stage.artifacts) {
      write(base + '/' + stage.dir + '/' + art.file, skeleton(stage, art, feature))
    }
  }
  markEmptyStages(base)
  saveState({ feature, stages: chosenStages().map((s) => s.id) })
  report()
  // A stage stands on the one before it — jobs and tasks refer to the rules of the domain, a
  // state matrix refers to the scenarios. The catalogue has said so all along and nothing read
  // it, so a project that took 03 without 01 wrote job stories that could point at no BR at
  // all, and the agent noticed only at the end. Said once, here, where the folders appear.
  const taken = new Set(chosenStages().map((s) => s.id))
  const leaning = chosenStages()
    .flatMap((s) => (s.needs || []).filter((n) => !taken.has(n)).map((n) => [s, n]))
  if (leaning.length) {
    const nameOf = (id) => {
      const stage = catalog.stages.find((s) => s.id === id)
      return stage ? stage.id + ' ' + stage.title : id
    }
    console.log(NL + 'These stages lean on one the project did not take:')
    for (const [stage, need] of leaning) {
      console.log('  ' + stage.id + ' ' + stage.title + ' refers to ' + nameOf(need))
    }
    console.log('Nothing is broken by it — there is simply nowhere to put what the missing stage')
    console.log('holds, so it ends up as prose instead of ids other documents can point at. Take')
    console.log('it by adding the id to `stages` in state.json, or carry on knowingly.')
  }
  const perScreen = chosenStages().filter((s) => s.perScreen).map((s) => s.id + ' ' + s.title)
  if (perScreen.length) {
    console.log(NL + 'Per-screen documents (' + perScreen.join(', ') + ') are created separately,')
    console.log('one screen at a time: node scripts/docs.mjs screen <screen-name>')
  }
}

// ——— command: documents for one screen ———

function cmdScreen(screen) {
  const feature = state.feature
  if (!feature) { console.error('Create the feature first: node scripts/docs.mjs start <feature>'); process.exit(1) }
  if (!screen || !/^[a-z][a-z0-9-]*$/.test(screen)) {
    console.error('Screen name: lowercase letters and dashes. For example: node scripts/docs.mjs screen checkout')
    process.exit(1)
  }
  const base = featureBase(feature)
  let any = false
  for (const stage of chosenStages()) {
    if (!stage.perScreen) continue
    any = true
    for (const art of stage.artifacts) {
      write(base + '/' + stage.dir + '/' + art.file.replace('<screen>', screen), skeleton(stage, art, feature, screen))
    }
  }
  if (!any) { console.log('None of the chosen stages keeps per-screen documents — nothing to create.'); return }
  markEmptyStages(base)
  report()
}

// ——— reading what has been written ———

// The note left in an empty stage is not a document: it must not count towards progress, and
// the check has nothing to look for in it.
function mdFiles(dir) {
  const out = []
  if (!fs.existsSync(dir)) return out
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name)
    if (fs.statSync(p).isDirectory()) out.push(...mdFiles(p))
    else if (name.endsWith('.md') && !PLACEHOLDERS.has(name)) out.push(p)
  }
  return out
}

// A section counts as empty when between its heading and the next there is nothing but the
// hint, a table header and empty table rows.
function emptySections(text) {
  const lines = text.split(NL)
  const empty = []
  let current = null
  let filled = false
  const close = () => { if (current && !filled) empty.push(current) }
  // The header row of a table is the template's own writing, not an answer. Read as content it
  // made every section that holds a table count as filled — a contract with its Blocks, Actions
  // and Data tables wholly empty passed the check without a word, which is three quarters of a
  // screen contract. A header is the row with the dashes under it.
  const separator = (s) => /^\|[\s|:-]*\|$/.test(s)
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i]
    if (line.startsWith('## ')) { close(); current = line.slice(3).trim(); filled = false; continue }
    if (!current) continue
    const t = line.trim()
    if (t.startsWith('|') && separator((lines[i + 1] || '').trim())) { i += 1; continue }
    if (!t) continue
    if (t.startsWith('>')) continue                       // a hint
    if (/^\|[\s|:-]*\|$/.test(t)) continue                // a separator or an empty table row
    if (t.startsWith('|') && t.split('|').slice(1, -1).every((c) => !c.trim())) continue
    if (/^\*\*[^*]+:\*\*$/.test(t)) continue              // a bold label with no answer
    if (t.indexOf('yes / N/A — why') !== -1) continue      // the untouched Applies placeholder
    if (t === '---') continue
    if (t.startsWith('<!--')) continue
    filled = true
  }
  close()
  return empty
}

// H — a hypothesis card in 00_context/hypotheses.md, written by scripts/variants.mjs.
const ID_RE = /\b(BR|JS|HP|EC|FR|OQ|PP|G|H)-(\d+)\b/g

// A document marked "index" in stages.json lists what other documents define — the scenario
// matrix gathers HP, EC and FR in one table. Its rows open with the id, which is exactly how a
// definition looks, so the check used to report every scenario as described twice the moment
// the documents were generated, before anyone had written a line.
const indexFiles = new Set(
  catalog.stages.flatMap((s) => s.artifacts.filter((a) => a.index).map((a) => path.basename(a.file))),
)

// Where each family of ids is written down, taken from the catalogue: EC in the edge cases, BR
// in the business rules. A line that looks like a definition anywhere else is a reference —
// "EC-9, a game with one edition, is state 4" in a contract was being read as a second
// definition of EC-9 and reported as described twice, which is what the rules ask for in the
// first place. When the stage that owns a family was not taken at all, the old reading stands:
// there is nowhere else for it to live.
const homeOf = new Map()
for (const s of catalog.stages) {
  for (const a of s.artifacts) {
    for (const sec of a.sections || []) if (sec.ids) homeOf.set(sec.ids, path.basename(a.file))
  }
}

function collectIds(text, isIndex, file, present) {
  const defined = new Set()
  const used = new Set()
  for (const line of text.split(NL)) {
    const t = line.trim()
    if (t.startsWith('>') || t.startsWith('<!--')) continue   // a hint, not content
    let m
    ID_RE.lastIndex = 0
    while ((m = ID_RE.exec(line))) {
      const id = m[0]
      const shaped =
        new RegExp('^#{1,6}\\s*' + id + '\\b').test(t) ||          // a heading like ## HP-1
        new RegExp('^\\|\\s*(\\*\\*)?' + id + '\\b').test(t) ||    // the first cell of a table row
        new RegExp('^[-*]\\s*(\\*\\*)?' + id + '\\b').test(t)      // a bullet item
      const home = homeOf.get(m[1])
      const athome = !home || !present.has(home) || home === file
      if (shaped && athome && !isIndex) defined.add(id); else used.add(id)
    }
  }
  return { defined, used }
}

// ——— command: the check ———

// Every feature the project has, not only the one being worked on today. The check used to
// read state.json and look at that one — so the moment a second feature started, the first
// stopped being checked by anything, while the run before a handoff still reported green.
function cmdCheck() {
  const features = place.features.list
  for (const note of place.notes) console.log('Note: ' + note)
  if (!features.length) {
    console.error(state.feature
      ? 'No documents yet: node scripts/docs.mjs start ' + state.feature
      : 'No feature selected — nothing to check.')
    console.error(lookedIn())
    process.exit(1)
  }
  let bad = 0
  for (const feature of features) bad += checkFeature(feature) ? 0 : 1
  process.exit(bad ? 1 : 0)
}

// One feature: returns whether it came out clean. Ids are numbered inside a feature, so each
// one is read on its own — a BR-1 in two features is two different rules, not a repeat.
function checkFeature(feature) {
  const base = path.join(place.features.abs, feature)
  const files = mdFiles(base)
  if (!files.length) {
    console.log('Feature "' + feature + '": no documents yet — node scripts/docs.mjs start ' + feature)
    return true
  }

  const present = new Set(files.map((f) => path.basename(f)))
  const problems = []
  const owed = []
  // Documents brought over from the previous kit repeat an id across files on purpose, and
  // rewriting someone's finished documents to satisfy a check is not on. Those repeats become
  // a note here, so a migrated project can still reach a green run. Told apart by what the
  // documents are, not by whether an empty folder of the right name exists.
  const fromOldKit = oldMethodology(root, base)
  const repeats = []
  const allDefined = new Set()
  const allUsed = new Map()
  const seen = new Map()

  for (const file of files) {
    const rel = path.relative(root, file).split(path.sep).join('/')
    const text = fs.readFileSync(file, 'utf8')
    // Prototype first means the designer asked for a brief, not research: the rest of the
    // context stage — pain points, competitors, platform — is owed later, not a fault. A
    // rehearsal went red on a correct prototype over exactly that. The brief itself still counts.
    const later = state.mode === 'prototype-first' && rel.split('/').includes('00_context')
      && path.basename(file) !== 'brief.md'
    for (const sec of emptySections(text)) (later ? owed : problems).push([rel, 'section "' + sec + '" is empty'])
    const { defined, used } = collectIds(text, indexFiles.has(path.basename(file)), path.basename(file), present)
    for (const id of defined) {
      if (seen.has(id) && seen.get(id) !== rel) {
        const line = [rel, id + ' is described twice — also in ' + seen.get(id)]
        if (fromOldKit) repeats.push(line)
        else problems.push(line)
      }
      seen.set(id, rel)
      allDefined.add(id)
    }
    for (const id of used) { if (!allUsed.has(id)) allUsed.set(id, rel) }
  }
  for (const [id, rel] of allUsed) {
    if (!allDefined.has(id)) problems.push([rel, 'a reference to ' + id + ', but ' + id + ' is nowhere described'])
  }
  // A setting of this feature that illustrates a hypothesis (src/variants.json) needs its card.
  for (const [axis, hyp] of settingHypotheses(feature)) {
    if (!allDefined.has(hyp)) problems.push(['src/variants.json', 'setting "' + axis + '" tests ' + hyp + ', but ' + hyp + ' is nowhere described — node scripts/variants.mjs hypothesis'])
  }
  const hypotheses = openHypotheses(base)

  const open = []
  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8')
    for (const line of text.split(NL)) {
      // A decision mark mentioning the question it is waiting on is not the question itself:
      // listing it here shows the designer the same OQ twice, once as a comment.
      if (line.trim().startsWith('<!--')) continue
      // The register is a table — id, question, status — so a question is read from
      // its cells and not from the sentence. Looking for the word "open" anywhere on the
      // line counted a settled rule that said "while the window is still open", and a line
      // about a manager who can open the list: eleven questions where there were nine.
      const cells = line.split('|').map((c) => c.trim())
      if (cells.length < 4) continue
      if (!/^OQ-\d+$/.test(cells[1])) continue
      if (!cells.slice(2).some((c) => /^open$/i.test(c))) continue
      open.push(line.trim().slice(0, 100))
    }
  }

  console.log('Checking the documents of feature "' + feature + '", files: ' + files.length)
  if (!problems.length) console.log(owed.length ? '  all linked up' : '  all linked up, no empty sections')
  if (place.screens.list.length) {
    console.log('  the documents were checked on their own; whether they match the screens: node scripts/screens.mjs')
  }
  for (const [rel, what] of problems) console.log('  ' + rel + ' — ' + what)
  if (owed.length) {
    console.log(NL + 'Owed later (prototype first): ' + owed.length + ' empty context sections, not counted')
    for (const [rel, what] of owed.slice(0, 10)) console.log('  ' + rel + ' — ' + what)
  }
  if (repeats.length) {
    console.log(NL + 'Repeated ids: ' + repeats.length + ' — documents written under the previous')
    console.log('methodology, where an id appears in several files on purpose. Not counted, and not')
    console.log('worth rewriting the documents over. Told apart by this: ' + fromOldKit + '.')
  }
  if (open.length) {
    console.log(NL + 'Open questions for the designer: ' + open.length)
    for (const q of open.slice(0, 10)) console.log('  ' + q)
  }
  if (hypotheses.length) {
    console.log(NL + 'Hypotheses not decided yet: ' + hypotheses.length)
    for (const h of hypotheses.slice(0, 10)) console.log('  ' + h)
  }
  console.log('')
  return problems.length === 0
}

// The settings declared for a feature that name a hypothesis: [setting, H-N].
function settingHypotheses(feature) {
  let reg
  try { reg = JSON.parse(fs.readFileSync(path.join(root, 'src', 'variants.json'), 'utf8')) } catch { return [] }
  return Object.entries(reg.axes ?? {})
    .filter(([, a]) => a.hypothesis && a.feature === feature && !a.archived)
    .map(([id, a]) => [id, a.hypothesis])
}

// Hypothesis cards whose status is not a verdict yet — Open or Testing.
function openHypotheses(base) {
  const file = path.join(base, '00_context', 'hypotheses.md')
  if (!fs.existsSync(file)) return []
  const out = []
  for (const block of fs.readFileSync(file, 'utf8').split(/^## /m).slice(1)) {
    const head = block.match(/^(H-\d+)\.\s*(.+)$/m)
    const status = block.match(/\*\*Status:\*\*\s*(.+)/)?.[1].trim() ?? ''
    if (head && (!status || /^(open|testing)/i.test(status))) out.push(head[1] + ' ' + head[2].trim() + (status ? ' — ' + status : ''))
  }
  return out
}

// ——— the default command: where are we ———

function cmdWhere() {
  const stages = chosenStages()
  for (const note of place.notes) console.log('Note: ' + note)
  const found = place.features.list
  if (!state.feature) {
    // Features on disk and none chosen is not "no feature yet": a documented product read as
    // empty, and the agent started its documents over from scratch.
    if (found.length) {
      console.log('No feature chosen, and ' + found.length + ' found in ' + place.features.dir + '/: '
        + found.slice(0, 12).join(', ') + (found.length > 12 ? ' and ' + (found.length - 12) + ' more' : ''))
      console.log('Ask the designer which one the work is on, then set "feature" in state.json.')
      return
    }
    console.log('No feature yet. Chosen stages: ' + stages.map((s) => s.id + ' ' + s.title).join(', '))
    console.log(lookedIn())
    console.log('Create one: node scripts/docs.mjs start <feature-name>')
    return
  }
  const base = path.join(place.features.abs, state.feature)
  if (!fs.existsSync(base)) {
    console.log('Feature "' + state.feature + '" is chosen in state.json, but there is no ' + featureBase(state.feature) + '/.')
    if (found.length) console.log('Features found in ' + place.features.dir + '/: ' + found.slice(0, 12).join(', '))
    else console.log(lookedIn())
    console.log('Create it: node scripts/docs.mjs start ' + state.feature)
    return
  }
  console.log('Feature: ' + state.feature)
  let next = null
  for (const stage of stages) {
    const dir = path.join(base, stage.dir)
    const files = mdFiles(dir)
    let doneFiles = 0
    for (const f of files) if (!emptySections(fs.readFileSync(f, 'utf8')).length) doneFiles++
    let mark
    if (!files.length) mark = stage.perScreen ? 'no screens yet' : 'not created'
    else if (doneFiles === files.length) mark = 'done'
    else mark = doneFiles + ' of ' + files.length
    if (!next && mark !== 'done' && mark !== 'no screens yet') next = stage
    console.log('  ' + stage.id + ' ' + stage.title + ' — ' + mark)
  }
  if (next) {
    console.log(NL + 'Next: ' + next.id + ' ' + next.title + ' (' + next.why + ')')
    console.log('Stage files: ' + featureBase(state.feature) + '/' + next.dir + '/')
  } else {
    console.log(NL + 'Every chosen stage is filled in. Check the links: node scripts/docs.mjs check')
  }
}

// Said whenever nothing was found, so "no feature" always comes with where it was looked for.
function lookedIn() {
  return place.features.how === 'state'
    ? 'Looked in ' + place.features.dir + '/, as "paths" in state.json says.'
    : 'Looked in docs/features/<feature>/ and docs/<feature>/. Kept somewhere else: "paths": { "features": "<folder>" } in state.json.'
}

function report() {
  if (created.length) { console.log('Created:'); for (const f of created) console.log('  ' + f) }
  if (skipped.length) console.log('Already there, untouched: ' + skipped.length + ' files')
}

const [cmd, arg] = process.argv.slice(2)
if (cmd === 'start') cmdStart(arg)
else if (cmd === 'screen') cmdScreen(arg)
else if (cmd === 'check') cmdCheck()
else cmdWhere()
