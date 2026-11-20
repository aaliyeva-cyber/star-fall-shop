//
//  presets-plugin — "Save preset" in the Context App writes into src/variants.json
//  ───────────────────────────────────────────────────────────────────────────────
//
//  Kit file, wired into vite.config.ts by context-app.mjs connect / wire.
//
// The dev server only (`npm run dev`): Context asks `GET /__context/presets` whether the
// prototype takes presets, and posts the change to the same address:
//   { op: 'save', preset: { id, label, level, scope?, note?, choices } }   new or updated
//   { op: 'rename', id, label }
//   { op: 'delete', id }
// After the file is written the Context data is exported again, so the column reads the new
// list at once. A built stand has no such address — there presets are only picked.
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'

const ROUTE = '/__context/presets'
const LEVELS = ['app', 'feature', 'scenario', 'screen']
const ID = /^[a-z0-9][a-z0-9-]{0,63}$/

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', (c) => (data += c))
    req.on('end', () => resolve(data))
    req.on('error', reject)
  })
}

function apply(reg, change) {
  const presets = (reg.presets ??= {})
  if (change.op === 'save') {
    const p = change.preset ?? {}
    if (!ID.test(p.id ?? '')) throw new Error('bad preset id')
    if (!String(p.label ?? '').trim()) throw new Error('a preset needs a name')
    if (!LEVELS.includes(p.level)) throw new Error('bad level')
    const known = new Set(Object.keys(reg.axes ?? {}))
    const choices = {}
    for (const [axis, value] of Object.entries(p.choices ?? {})) {
      if (!known.has(axis)) throw new Error(`unknown setting ${axis}`)
      choices[axis] = String(value)
    }
    const prev = presets[p.id] ?? {}
    presets[p.id] = {
      ...prev,
      level: p.level,
      ...(p.scope ? { scope: p.scope } : {}),
      label: String(p.label).trim(),
      ...(p.note ? { note: p.note } : {}),
      choices,
    }
    return
  }
  const p = presets[change.id]
  if (!p) throw new Error(`no preset ${change.id}`)
  if (change.op === 'rename') {
    if (!String(change.label ?? '').trim()) throw new Error('a preset needs a name')
    p.label = String(change.label).trim()
  } else if (change.op === 'delete') {
    delete presets[change.id]
  } else {
    throw new Error('unknown operation')
  }
}

export default function contextPresets() {
  return {
    name: 'context-presets',
    apply: 'serve',
    configureServer(server) {
      const root = server.config.root
      const file = path.join(root, 'src', 'variants.json')
      server.middlewares.use(ROUTE, async (req, res) => {
        const send = (code, body) => {
          res.statusCode = code
          res.setHeader('content-type', 'application/json')
          res.end(JSON.stringify(body))
        }
        if (req.method === 'GET') return send(200, { presets: true })
        if (req.method !== 'POST') return send(405, { error: 'GET or POST' })
        try {
          const change = JSON.parse(await readBody(req))
          const reg = JSON.parse(fs.readFileSync(file, 'utf8'))
          apply(reg, change)
          fs.writeFileSync(file, JSON.stringify(reg, null, 2) + '\n')
          execFileSync(process.execPath, ['scripts/context-app.mjs', 'export'], { cwd: root, stdio: 'ignore' })
          send(200, { ok: true })
        } catch (e) {
          res.statusCode = 400
          res.end(e instanceof Error ? e.message : String(e))
        }
      })
    },
  }
}
