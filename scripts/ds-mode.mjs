#!/usr/bin/env node
//
//  ds-mode — how strictly the project holds to its design system
//  ──────────────────────────────────────────────────────────────
//
//  WHY THIS EXISTS
//  The kit can hold the screens to the design system: a homemade button, a colour picked by
//  hand, a forced style on a library component — each is refused at the moment it is written,
//  and the screen check counts what was drawn by hand. Some designers want exactly that. Others
//  take the library as a starting point and want to change things on purpose, and for them the
//  same checks are a wall around their own edits.
//
//  So it is a choice, asked once in the entry questionnaire and changeable later with this.
//
//  WHEN IT RUNS
//  When the designer says so — "I don't need strict XUI", "hold me to the system again":
//    node scripts/ds-mode.mjs            which mode this project is in
//    node scripts/ds-mode.mjs relaxed    the design system becomes advice, its checks are off
//    node scripts/ds-mode.mjs strict     the checks are back, exactly as before
//
//  Never to get past a refusal: the mode is the designer's word, not the agent's way round.
//
//  WHAT STAYS EITHER WAY
//  The Context button and its map, the change journal, the documents and their checks, the
//  kit's own files. Only the design-system checks follow the mode.
//
import fs from 'node:fs'
import path from 'node:path'

const NL = String.fromCharCode(10)
const file = path.join(process.cwd(), 'state.json')
const want = process.argv[2]

if (want && !['strict', 'relaxed'].includes(want)) {
  console.error('node scripts/ds-mode.mjs [strict|relaxed]')
  process.exit(1)
}

let state
try {
  state = JSON.parse(fs.readFileSync(file, 'utf8'))
} catch (e) {
  console.error(fs.existsSync(file)
    ? 'state.json cannot be read: ' + String(e.message || e) + NL + 'Usually a stray comma or a missing quote. Until it is valid JSON the mode reads as strict.'
    : 'No state.json here — this is not a project of the kit, or it has not started.')
  process.exit(1)
}

const ds = state.designSystem || {}
const kind = ds.kind || 'not chosen yet'
const said = (strict) => (strict
  ? 'strict — the design-system checks run: a homemade element, a hand-picked colour, a forced' + NL +
    '  style on a library component are refused, and the screen check counts what was drawn by hand.'
  : 'relaxed — the design system is a base, not a rule. Its checks are off; the agent still' + NL +
    '  offers what the library has. The Context button, the journal and the documents work as before.')

if (!want) {
  const strict = ds.strict !== false
  console.log('design system: ' + kind)
  console.log('mode: ' + said(strict) + (ds.strict === undefined || ds.strict === null ? NL + '  (never answered, so strict)' : ''))
  process.exit(0)
}

const strict = want === 'strict'
if ((ds.strict !== false) === strict && typeof ds.strict === 'boolean') {
  console.log('already ' + want + '. ' + 'design system: ' + kind)
  process.exit(0)
}
state.designSystem = { ...ds, kind: ds.kind ?? null, url: ds.url ?? null, strict }
fs.writeFileSync(file, JSON.stringify(state, null, 2) + NL)
console.log('design system: ' + kind)
console.log('mode: ' + said(strict))
console.log('Applies from the next edit; nothing else needs restarting.')
