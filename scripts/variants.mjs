#!/usr/bin/env node
//
//  variants — the prototype's settings: variants of a screen, ideas being tested, conditions
//  ─────────────────────────────────────────────────────────────────────────────────────────
//
//  WHY THIS EXISTS
//  "What if the payment methods were a grid?" used to mean a copy of the screen, or of the
//  whole prototype. Now it is a setting: one screen, one line in src/variants.json, and the
//  Context button switches it. The choice lives in the address, so a link shows exactly what
//  its author saw — and a test link (ui=0) shows it to a respondent with no button at all.
//
//  THREE THINGS, NOT TO BE CONFUSED
//    setting      one place with alternatives: "Payment methods: list / grid". Named for what
//                 it changes, options named for what they are — never v1, v2.
//    hypothesis   an idea being tested, H-N in the feature's 00_context/hypotheses.md. A
//                 setting that illustrates one names it; its default is the control (what
//                 ships today), the other option the variant. Most settings have none: a
//                 region, a partner, a signed-in user — conditions, not ideas.
//    preset       a named set of choices. On the app level it is a version — "MVP 0.75",
//                 "Dream"; below, a named combination of a feature, a scenario, a screen.
//                 The designer saves them from the Context button too.
//
//  COMMANDS
//    node scripts/variants.mjs                         what is declared
//    node scripts/variants.mjs add <id> --label "…" --options list="Vertical list",grid="Tile grid"
//         [--default list] [--feature f] [--screens a,b] [--level app|feature|scenario|screen]
//         [--hypothesis H-1] [--group "…"] [--when axis=opt|opt] [--quick]
//         [--behaviour]   for a setting that changes what happens, not what is drawn
//                         ("the bank declines" after Pay): the screen check then does not
//                         expect the page itself to look different
//    node scripts/variants.mjs hypothesis <feature> "Title" [--belief "…"] [--test "…"] [--signal "…"]
//    node scripts/variants.mjs preset <id> --label "…" --choices a=x,b=y [--level app] [--scope f]
//    node scripts/variants.mjs link <screen> [state] [setting=option …] [--test]
//    node scripts/variants.mjs check                   every declaration adds up
//
//  In a screen: `const layout = useSetting('layout')` and, to another screen keeping the
//  settings, `go('success')` — both from src/kit/settings.ts.
//
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { where } from './where.mjs'

const root = process.cwd()
const NL = String.fromCharCode(10)
const FILE = path.join(root, 'src', 'variants.json')
const LEVELS = ['app', 'feature', 'scenario', 'screen']
const ID = /^[a-z0-9][a-z0-9-]{0,63}$/
const place = where(root)

function load() {
  if (!fs.existsSync(FILE)) return { url: { style: 'params', version: 'preset' }, defaultVersion: '', axes: {}, presets: {} }
  try {
    return JSON.parse(fs.readFileSync(FILE, 'utf8'))
  } catch (e) {
    fail('src/variants.json is not valid JSON (' + e.message + ') — fix it before anything else')
  }
}
function save(reg) {
  fs.mkdirSync(path.dirname(FILE), { recursive: true })
  fs.writeFileSync(FILE, JSON.stringify(reg, null, 2) + NL)
}
function fail(msg) {
  console.error(msg)
  process.exit(1)
}

// --name value pairs and the words before them.
function parse(argv) {
  const words = []
  const flags = {}
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i]
    if (a.startsWith('--')) {
      const next = argv[i + 1]
      if (next === undefined || next.startsWith('--')) flags[a.slice(2)] = true
      else { flags[a.slice(2)] = next; i += 1 }
    } else words.push(a)
  }
  return { words, flags }
}

// list="Vertical list",grid="Tile grid" → { list: 'Vertical list', grid: 'Tile grid' }
function pairs(text) {
  const out = {}
  for (const part of String(text).match(/[^,=]+=(?:"[^"]*"|[^,]*)/g) ?? []) {
    const at = part.indexOf('=')
    out[part.slice(0, at).trim()] = part.slice(at + 1).trim().replace(/^"|"$/g, '')
  }
  return out
}

const an = (word) => (/^[aeiou]/.test(word) ? 'an ' : 'a ') + word

// The level a setting shows on in Context, as the Context App reads it: set, or screen when it
// names screens, feature when it names only a feature, else the whole app.
const levelOf = (a) => a.level ?? (a.screens?.length ? 'screen' : a.feature ? 'feature' : 'app')

// A preset picks the settings of its own level only — a version (app) sets app settings, a
// screen preset that screen's. Context applies it that way; a choice of another level is
// silently ignored there, so it is refused here.
function misplaced(preset, axisId, a) {
  const level = preset.level ?? 'app'
  if (levelOf(a) !== level) return 'is ' + an(levelOf(a)) + ' setting, and this is ' + an(level) + ' preset — save it on that level'
  if ((level === 'feature' || level === 'scenario') && preset.scope && a.feature && a.feature !== preset.scope) return 'belongs to feature "' + a.feature + '"'
  if (level === 'screen' && preset.scope && a.screens?.length && !a.screens.includes(preset.scope)) return 'is not shown on screen "' + preset.scope + '"'
  return null
}

const hypothesesFile = (feature) => path.join(place.features.abs, feature, '00_context', 'hypotheses.md')

function hypothesisIds(feature) {
  const f = hypothesesFile(feature)
  if (!fs.existsSync(f)) return []
  return [...fs.readFileSync(f, 'utf8').matchAll(/^## (H-\d+)\./gm)].map((m) => m[1])
}

// ——— commands ———

function cmdList() {
  const reg = load()
  const axes = Object.entries(reg.axes ?? {})
  const presets = Object.entries(reg.presets ?? {})
  if (!axes.length) {
    console.log('No settings yet. Add one: node scripts/variants.mjs add <id> --label "…" --options a="…",b="…"')
    return
  }
  console.log('Settings: ' + axes.length)
  for (const [id, a] of axes) {
    const where = [a.level ?? (a.screens ? 'screen' : a.feature ? 'feature' : 'app'), a.feature, a.screens?.join(',')].filter(Boolean).join(' · ')
    console.log('  ' + id + ' — ' + a.label + ' [' + Object.keys(a.options ?? {}).join(' | ') + '] default ' + a.default
      + ' · ' + where + (a.hypothesis ? ' · tests ' + a.hypothesis : ''))
  }
  if (presets.length) {
    console.log('Presets: ' + presets.length)
    for (const [id, p] of presets) console.log('  ' + id + ' — ' + p.label + ' (' + (p.level ?? 'app') + ') ' + JSON.stringify(p.choices ?? {}))
  }
}

function cmdAdd(words, flags) {
  const [id] = words
  if (!id || !ID.test(id)) fail('A setting needs an id: lower case, digits, dashes — node scripts/variants.mjs add payment-layout --label "…" --options …')
  if (!flags.label || flags.label === true) fail('A setting needs a name the designer reads: --label "Payment methods layout"')
  const options = pairs(flags.options ?? '')
  const ids = Object.keys(options)
  if (ids.length < 2) fail('A setting needs at least two options: --options list="Vertical list",grid="Tile grid"')
  if (ids.some((o) => !ID.test(o))) fail('Option ids are lower case, digits and dashes: ' + ids.join(', '))
  const def = flags.default && flags.default !== true ? flags.default : ids[0]
  if (!ids.includes(def)) fail('The default "' + def + '" is not one of the options: ' + ids.join(', '))
  if (flags.level && !LEVELS.includes(flags.level)) fail('The level is one of: ' + LEVELS.join(', '))
  if (flags.feature && !place.features.list.includes(flags.feature)) {
    console.log('Note: no documents for feature "' + flags.feature + '" yet — ' + place.features.dir + '/' + flags.feature)
  }
  const screens = flags.screens && flags.screens !== true ? flags.screens.split(',').map((s) => s.trim()) : null
  for (const s of screens ?? []) if (!place.screens.list.includes(s)) console.log('Note: no screen "' + s + '" in ' + place.screens.dir)

  const reg = load()
  const prev = reg.axes[id]
  const axis = {
    label: flags.label,
    ...(flags.level ? { level: flags.level } : {}),
    ...(flags.feature && flags.feature !== true ? { feature: flags.feature } : {}),
    ...(screens ? { screens } : {}),
    ...(flags.group && flags.group !== true ? { group: flags.group } : {}),
    ...(flags.hypothesis && flags.hypothesis !== true ? { hypothesis: flags.hypothesis } : {}),
    ...(flags.quick ? { quick: true } : {}),
    ...(flags.behaviour ? { behaviour: true } : {}),
    options,
    default: def,
  }
  if (flags.when && flags.when !== true) {
    axis.when = flags.when.split(';').map((c) => {
      const [axisId, values] = c.split('=')
      return { axis: axisId.trim(), is: values.split('|').map((v) => v.trim()) }
    })
  }
  reg.axes[id] = axis
  save(reg)
  console.log((prev ? 'Updated' : 'Added') + ' setting "' + id + '": ' + ids.join(' | ') + ', default ' + def)
  console.log("In the screen: const " + camel(id) + " = useSetting('" + id + "')   — from src/kit/settings.ts")
  if (axis.hypothesis && axis.feature && !hypothesisIds(axis.feature).includes(axis.hypothesis)) {
    console.log('Note: ' + axis.hypothesis + ' has no card yet — node scripts/variants.mjs hypothesis ' + axis.feature + ' "…"')
  }
}

const camel = (id) => id.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase())

function cmdHypothesis(words, flags) {
  const [feature, title] = words
  if (!feature || !title) fail('node scripts/variants.mjs hypothesis <feature> "What we believe, in a few words"')
  const file = hypothesesFile(feature)
  const ids = hypothesisIds(feature)
  const id = 'H-' + (ids.reduce((n, h) => Math.max(n, Number(h.slice(2))), 0) + 1)
  const text = (v) => (v && v !== true ? ' ' + v : '')
  const card = [
    '## ' + id + '. ' + title,
    '',
    '**Status:** Open',
    '**We believe:**' + text(flags.belief),
    '**How we test:**' + text(flags.test),
    '**Signal:**' + text(flags.signal),
    '**Result:**',
    '',
  ].join(NL)
  if (!fs.existsSync(file)) {
    fs.mkdirSync(path.dirname(file), { recursive: true })
    fs.writeFileSync(file, [
      '# Hypotheses — ' + feature, '',
      '> One card per idea being tested. A setting in src/variants.json that illustrates it names',
      '> the id; its default is the control, what ships today. Status: Open, Testing, Confirmed,',
      '> Rejected. Result — what was learned and what was decided.', '', '---', '', card,
    ].join(NL))
  } else {
    const body = fs.readFileSync(file, 'utf8').replace(/\s*$/, '')
    fs.writeFileSync(file, body + NL + NL + card)
  }
  console.log('Added ' + id + ' to ' + path.relative(root, file).split(path.sep).join('/'))
  console.log('Link the setting that shows it: --hypothesis ' + id + ' on node scripts/variants.mjs add')
}

function cmdPreset(words, flags) {
  const [id] = words
  if (!id || !ID.test(id)) fail('A preset needs an id: node scripts/variants.mjs preset mvp --label "MVP 0.75" --choices a=x')
  if (!flags.label || flags.label === true) fail('A preset needs a name: --label "MVP 0.75"')
  const level = flags.level && flags.level !== true ? flags.level : 'app'
  if (!LEVELS.includes(level)) fail('The level is one of: ' + LEVELS.join(', '))
  const reg = load()
  const choices = pairs(flags.choices ?? '')
  for (const [axis, option] of Object.entries(choices)) {
    const a = reg.axes[axis]
    if (!a) fail('No setting "' + axis + '" — node scripts/variants.mjs')
    if (a.kind !== 'many' && !(option in (a.options ?? {}))) fail('Setting "' + axis + '" has no option "' + option + '": ' + Object.keys(a.options).join(', '))
    const wrong = misplaced({ level, scope: flags.scope }, axis, a)
    if (wrong) fail('Setting "' + axis + '" ' + wrong + '.')
  }
  reg.presets ??= {}
  reg.presets[id] = {
    level,
    ...(flags.scope && flags.scope !== true ? { scope: flags.scope } : {}),
    label: flags.label,
    ...(flags.note && flags.note !== true ? { note: flags.note } : {}),
    choices,
  }
  save(reg)
  console.log('Saved preset "' + id + '" (' + level + '): ' + (Object.entries(choices).map(([a, o]) => a + '=' + o).join(', ') || 'all defaults'))
}

// The port the prototype is open on. Vite takes the next free one when 5173 is busy, and a
// participant with two projects open got a link to the other one — or to nothing. The running
// server is found by asking each likely port for its page and matching this project's title.
async function localOrigin() {
  let title = null
  try { title = fs.readFileSync(path.join(root, 'index.html'), 'utf8').match(/<title>([^<]*)<\/title>/)?.[1] ?? null } catch {}
  if (title) {
    for (let port = 5173; port <= 5199; port += 1) {
      try {
        const res = await fetch('http://localhost:' + port + '/', { signal: AbortSignal.timeout(400) })
        if ((await res.text()).includes('<title>' + title + '</title>')) return 'http://localhost:' + port + '/'
      } catch {}
    }
  }
  return null
}

async function cmdLink(words, flags) {
  const [screen, maybeState, ...rest] = words
  if (!screen) fail('node scripts/variants.mjs link <screen> [state] [setting=option …] [--test]')
  const reg = load()
  const picks = [maybeState, ...rest].filter(Boolean)
  const state = maybeState && !maybeState.includes('=') ? maybeState : null
  const q = new URLSearchParams()
  if (state) q.set('state', state)
  for (const p of picks.filter((x) => x.includes('='))) {
    const [axis, option] = p.split('=')
    const a = reg.axes[axis]
    if (!a) fail('No setting "' + axis + '" — node scripts/variants.mjs')
    // The default is what an address without the setting shows; asked twice, the last wins.
    if (option === a.default) q.delete(a.param ?? axis)
    else q.set(a.param ?? axis, a.values?.[option] ?? option)
  }
  if (flags.test) q.set('ui', '0')
  const hash = '#' + screen + (q.toString() ? '?' + q.toString().replace(/%2C/gi, ',') : '')
  if (!place.screens.list.includes(screen)) console.log('Note: no screen "' + screen + '" in ' + place.screens.dir)
  const origin = await localOrigin()
  if (origin) console.log('Locally:  ' + origin + hash)
  else console.log('Locally:  the prototype is not running — start it (npm run dev) and add ' + hash + ' to its address')
  let proto = null
  try { proto = JSON.parse(fs.readFileSync(path.join(root, 'state.json'), 'utf8')).contextApp?.proto } catch {}
  if (proto) console.log('Stand:    https://prototype.xsolla.dev' + proto + hash)
  if (flags.test) console.log('A test link: no Context button — give it to a respondent as it is.')
}

// What does not add up, as a list; empty when all is well. Exported for preflight.
export function problemsOf(reg = load()) {
  const out = []
  const axes = reg.axes ?? {}
  for (const [id, a] of Object.entries(axes)) {
    const ids = Object.keys(a.options ?? {})
    if (!a.label) out.push('setting "' + id + '" has no name')
    if (a.kind !== 'many' && a.kind !== 'text' && ids.length < 2) out.push('setting "' + id + '" has fewer than two options')
    if (a.kind !== 'many' && a.kind !== 'text' && !ids.includes(a.default)) out.push('setting "' + id + '": the default "' + a.default + '" is not one of its options')
    if (a.level && !LEVELS.includes(a.level)) out.push('setting "' + id + '": unknown level "' + a.level + '"')
    if (a.feature && !place.features.list.includes(a.feature) && place.features.list.length) out.push('setting "' + id + '": no feature "' + a.feature + '" in ' + place.features.dir)
    for (const s of a.screens ?? []) if (!place.screens.list.includes(s)) out.push('setting "' + id + '": no screen "' + s + '" in ' + place.screens.dir)
    for (const w of a.when ?? []) {
      const dep = axes[w.axis]
      if (!dep) out.push('setting "' + id + '" depends on "' + w.axis + '", which is not declared')
      else for (const v of w.is ?? []) if (!(v in (dep.options ?? {}))) out.push('setting "' + id + '" depends on "' + w.axis + '" being "' + v + '", which is not one of its options')
    }
    if (a.refines && !axes[a.refines]) out.push('setting "' + id + '" refines "' + a.refines + '", which is not declared')
    if (a.hypothesis && a.feature && !hypothesisIds(a.feature).includes(a.hypothesis)) {
      out.push('setting "' + id + '" tests ' + a.hypothesis + ', which has no card in ' + a.feature + '/00_context/hypotheses.md')
    }
    if (a.hypothesis && !a.feature) out.push('setting "' + id + '" tests ' + a.hypothesis + ' but names no feature — hypotheses live in a feature')
  }
  for (const [id, p] of Object.entries(reg.presets ?? {})) {
    if (p.level && !LEVELS.includes(p.level)) out.push('preset "' + id + '": unknown level "' + p.level + '"')
    for (const [axis, option] of Object.entries(p.choices ?? {})) {
      const a = axes[axis]
      if (!a) out.push('preset "' + id + '" picks "' + axis + '", which is not declared')
      else if (a.kind !== 'many' && a.kind !== 'text' && !(option in (a.options ?? {}))) out.push('preset "' + id + '": "' + axis + '" has no option "' + option + '"')
      else if (misplaced(p, axis, a)) out.push('preset "' + id + '": "' + axis + '" ' + misplaced(p, axis, a) + ' — Context ignores that choice')
    }
  }
  if (reg.defaultVersion && !(reg.presets ?? {})[reg.defaultVersion]) out.push('the default version "' + reg.defaultVersion + '" is not a preset')
  // A declared setting nothing reads changes nothing: the switch in the Context button lies.
  const used = usedSettings()
  for (const id of Object.keys(axes)) {
    if (!axes[id].unbuilt && !axes[id].archived && !used.has(id)) out.push('setting "' + id + '" is declared but no screen reads it — useSetting(\'' + id + '\')')
  }
  return out
}

// Ids passed to useSetting / settingIn / setSetting anywhere in src. A screen calling
// useSettings() reads every one at once, and which it then looks at cannot be told from the
// text — so with one of those nothing is reported.
function usedSettings() {
  const out = new Set()
  let all = false
  const walk = (dir) => {
    let entries
    try { entries = fs.readdirSync(dir, { withFileTypes: true }) } catch { return }
    for (const e of entries) {
      if (e.name === 'node_modules' || e.name.startsWith('.')) continue
      const p = path.join(dir, e.name)
      if (e.isDirectory()) walk(p)
      else if (/\.(tsx?|jsx?)$/.test(e.name) && !p.endsWith(path.join('kit', 'settings.ts'))) {
        const text = fs.readFileSync(p, 'utf8')
        for (const m of text.matchAll(/\b(?:useSetting|settingIn|setSetting)\(\s*(?:[\w.]+\s*,\s*)?['"]([a-z0-9-]+)['"]/g)) out.add(m[1])
        if (/\buseSettings\(\)/.test(text)) all = true
      }
    }
  }
  walk(path.join(root, 'src'))
  return all ? new Set(Object.keys(load().axes ?? {})) : out
}

function cmdCheck() {
  const reg = load()
  const n = Object.keys(reg.axes ?? {}).length
  const problems = problemsOf(reg)
  console.log('Settings: ' + n + ', presets: ' + Object.keys(reg.presets ?? {}).length)
  if (!problems.length) { console.log('  everything adds up'); return }
  for (const p of problems) console.log('  ✗ ' + p)
  process.exit(1)
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isMain) {
  const [cmd, ...rest] = process.argv.slice(2)
  const { words, flags } = parse(rest)
  if (!cmd || cmd === 'list') cmdList()
  else if (cmd === 'add') cmdAdd(words, flags)
  else if (cmd === 'hypothesis') cmdHypothesis(words, flags)
  else if (cmd === 'preset') cmdPreset(words, flags)
  else if (cmd === 'link') cmdLink(words, flags)
  else if (cmd === 'check') cmdCheck()
  else fail('Unknown command "' + cmd + '". node scripts/variants.mjs — the list is in the file header.')
}
