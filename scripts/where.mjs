//
//  where — where this project keeps its features and its screens
//  ──────────────────────────────────────────────────────────────
//
//  WHY THIS EXISTS
//  Every check used to carry its own copy of two paths, docs/features and src/screens, and a
//  project laid out any other way got no complaint — just different behaviour. A product with
//  twenty documented features in docs/<feature>/ was told "No feature yet"; screens in src/pages
//  were "no screens". Nothing said which assumption failed, so a designer lost a day finding it.
//
//  So the answer lives here, once, and it always says how it was reached:
//    1. state.json "paths": { "features": "...", "screens": "..." } — the project's own word;
//    2. the kit's layout, when the project has it;
//    3. the layout the previous kit and older products used — docs/<feature>/, src/pages/ —
//       taken only when it holds something, and named in a note so nobody is left guessing.
//
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const stageDirs = new Set(
  JSON.parse(fs.readFileSync(path.join(here, 'stages.json'), 'utf8')).stages.map((s) => s.dir),
)

const FEATURES = 'docs/features'
const SCREENS = 'src/screens'
// docs/ also holds the product file, the kit's own specs and old templates — none is a feature.
const NOT_FEATURES = new Set(['features', 'product', 'specs', 'talks'])

const subdirs = (abs) => {
  try {
    return fs.readdirSync(abs, { withFileTypes: true })
      .filter((e) => e.isDirectory() && !e.name.startsWith('.') && !e.name.startsWith('_'))
      .map((e) => e.name).sort()
  } catch { return [] }
}
const holdsStages = (abs) => subdirs(abs).some((d) => stageDirs.has(d))

function stateOf(root) {
  try { return JSON.parse(fs.readFileSync(path.join(root, 'state.json'), 'utf8')) } catch { return {} }
}

const clean = (p) => String(p).replace(/\\/g, '/').replace(/\/+$/, '')

// A folder dedicated to features counts every folder in it; a shared one like docs/ counts
// only the folders that hold a stage of the work.
function featuresIn(root, dir) {
  const abs = path.join(root, dir)
  const all = subdirs(abs)
  if (dir === FEATURES) return all
  return all.filter((d) => !NOT_FEATURES.has(d) && holdsStages(path.join(abs, d)))
}

function resolveFeatures(root, state) {
  const own = state.paths && state.paths.features
  if (own) {
    const dir = clean(own)
    return { dir, list: featuresIn(root, dir), how: 'state', note: null }
  }
  const list = featuresIn(root, FEATURES)
  if (list.length) return { dir: FEATURES, list, how: 'default', note: null }
  const old = featuresIn(root, 'docs')
  if (old.length) {
    return {
      dir: 'docs', list: old, how: 'found',
      note: 'features are read from docs/<feature>/ — there is no ' + FEATURES + '/ here. '
        + 'To say so for good: "paths": { "features": "docs" } in state.json',
    }
  }
  return { dir: FEATURES, list: [], how: 'default', note: null }
}

function resolveScreens(root, state) {
  const own = state.paths && state.paths.screens
  if (own) {
    const dir = clean(own)
    return { dir, list: subdirs(path.join(root, dir)), how: 'state', note: null }
  }
  const list = subdirs(path.join(root, SCREENS))
  if (list.length) return { dir: SCREENS, list, how: 'default', note: null }
  const old = subdirs(path.join(root, 'src', 'pages'))
  if (old.length) {
    return {
      dir: 'src/pages', list: old, how: 'found',
      note: 'screens are read from src/pages/ — there is no ' + SCREENS + '/ here. '
        + 'To say so for good: "paths": { "screens": "src/pages" } in state.json',
    }
  }
  return { dir: SCREENS, list: [], how: 'default', note: null }
}

export function where(root, state = stateOf(root)) {
  const features = resolveFeatures(root, state || {})
  const screens = resolveScreens(root, state || {})
  return {
    features: { ...features, abs: path.join(root, features.dir) },
    screens: { ...screens, abs: path.join(root, screens.dir) },
    notes: [features.note, screens.note].filter(Boolean),
  }
}

// Documents written under the previous methodology repeat an id across files on purpose, and a
// check is lenient about that. Decided by what the documents are, not by an empty folder that
// happens to exist: the previous kit kept a STATE.md and a sync-manifest.md beside every
// feature, and this one never writes either. Returns the reason, or null.
export function oldMethodology(root, featureAbs) {
  for (const name of ['STATE.md', 'sync-manifest.md']) {
    if (fs.existsSync(path.join(featureAbs, name))) return 'the feature holds ' + name + ', which only the previous kit wrote'
  }
  if (fs.existsSync(path.join(root, '.migrated-v1', '.xsolla-design-pack.json'))) {
    return 'the project was moved from the previous kit (.migrated-v1/ holds its marker)'
  }
  return null
}
