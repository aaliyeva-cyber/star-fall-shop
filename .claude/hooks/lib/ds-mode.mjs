// ds-mode — how strictly this project holds to its design system
//
// The kit's design-system checks — the write-time guard, the hand-drawn count in the screen
// check, the hard boundaries in the rules — are one promise: the screens are the library, not a
// look-alike of it. Some designers want that promise; some want the library as a starting point
// and the freedom to bend it, and for them the same checks are a wall around their own edits.
// So the promise is a choice, recorded in state.json as `designSystem.strict`.
//
// Only an explicit `false` relaxes it. A missing field, a missing state file, a state file
// broken by hand — none of those is an answer, and reading them as "relaxed" would switch every
// check off in exactly the projects that never asked: everything made before the choice existed.
// The base the kit needs whatever the answer — the Context button, the map, the change journal,
// the kit's own files — never reads this.
import fs from 'node:fs'
import path from 'node:path'

export function dsMode(root) {
  let ds = null
  try {
    ds = JSON.parse(fs.readFileSync(path.join(root, 'state.json'), 'utf8')).designSystem || null
  } catch { /* no file, or hand-broken: not an answer */ }
  return {
    kind: (ds && ds.kind) || null,
    strict: !(ds && ds.strict === false),
  }
}
