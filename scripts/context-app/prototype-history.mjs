/**
 * Change history of a prototype for Context App's History page.
 *
 * Not the git log: commits say what moved in the code, and the History page
 * is for designers, product and business — what changed for the person looking
 * at the prototype and why. So the source is a journal kept in the prototype's
 * repo, `docs/changes.md`, written in plain language by the designer or their
 * agent (skill template: skills/changes/SKILL.md in this repo).
 *
 * Format (dates as level-2 headings, entries as level-3; any order, the page
 * shows newest first):
 *
 *   # Changes
 *
 *   ## 2026-11-06
 *
 *   ### Payment button moved above the methods list
 *   Feature: checkout · Screen: checkout/methods-list · Type: design · By: Anna · Why: H-2
 *
 *   Players missed the button under a long list of methods in the sessions…
 *   [Figma](https://figma.com/…) · [PR](https://github.com/…/pull/12)
 *
 * The meta line is optional; its keys (any order, separated by " · "):
 *   Feature / Features — feature ids (or titles) from the registry, comma-separated
 *   Screen / Screens   — `<featureId>/<nodeId>` of the screen map, or `<nodeId>` when the entry has one feature
 *   Type               — design | business | content | research | fix (free text is kept)
 *   By                 — who made the change
 *   Why                — the reason: a hypothesis (H-2), a piece of feedback, a ticket
 * Everything after the meta line is the entry's body, in Markdown.
 *
 * The exporter writes the result to <out>/history.json and marks it in
 * manifest.history.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';

export const HISTORY_FILE = 'history.json';
export const CHANGES_FILE = 'changes.md';

const META_KEYS = new Map([
  ['feature', 'features'],
  ['features', 'features'],
  ['screen', 'screens'],
  ['screens', 'screens'],
  ['type', 'type'],
  ['by', 'author'],
  ['author', 'author'],
  ['why', 'why'],
]);

const splitList = (v) => v.split(',').map((s) => s.trim()).filter(Boolean);

/** Parse a meta line into fields, or null if it isn't one (then it stays in the body). */
function parseMeta(line) {
  const parts = line.split(/\s+·\s+|\s+\|\s+/);
  const meta = {};
  for (const part of parts) {
    const m = part.match(/^\s*\*{0,2}([A-Za-z]+)\*{0,2}\s*:\s*(.+?)\s*$/);
    if (!m) return null;
    const key = META_KEYS.get(m[1].toLowerCase());
    if (!key) return null;
    meta[key] = m[2];
  }
  return Object.keys(meta).length ? meta : null;
}

/**
 * docs/changes.md text -> { entries, problems }. `features` (registry entries)
 * resolve feature titles to ids and check screen references. Exported for tests.
 */
export function parseChanges(src, { features = [] } = {}) {
  const problems = [];
  const entries = [];
  const byId = new Map(features.map((f) => [f.id, f]));
  const byTitle = new Map(features.map((f) => [String(f.title ?? '').toLowerCase(), f]));
  const resolveFeature = (ref) => byId.get(ref) ?? byTitle.get(ref.toLowerCase()) ?? null;

  let date = null;
  let cur = null;
  let bodyLines = [];
  let metaDone = false;

  const flush = () => {
    if (!cur) return;
    cur.body = bodyLines.join('\n').trim();
    entries.push(cur);
    cur = null;
    bodyLines = [];
  };

  src.replace(/\r\n/g, '\n').split('\n').forEach((line, i) => {
    const h2 = line.match(/^##\s+(\d{4}-\d{2}-\d{2})\b/);
    if (h2) {
      flush();
      date = h2[1];
      return;
    }
    if (/^##\s/.test(line)) {
      flush();
      date = null;
      problems.push(`line ${i + 1}: date heading must be "## YYYY-MM-DD"`);
      return;
    }
    const h3 = line.match(/^###\s+(.+?)\s*$/);
    if (h3) {
      flush();
      if (!date) {
        problems.push(`line ${i + 1}: entry "${h3[1]}" has no date heading above it`);
        return;
      }
      cur = { date, title: h3[1], features: [], screens: [], type: null, author: null, why: null, body: '' };
      metaDone = false;
      return;
    }
    if (!cur) return;
    if (!metaDone && line.trim()) {
      metaDone = true;
      const meta = parseMeta(line.trim());
      if (meta) {
        for (const ref of meta.features ? splitList(meta.features) : []) {
          const f = resolveFeature(ref);
          if (f) cur.features.push(f.id);
          else problems.push(`line ${i + 1}: unknown feature "${ref}" in "${cur.title}"`);
        }
        for (const ref of meta.screens ? splitList(meta.screens) : []) {
          const [a, b] = ref.includes('/') ? ref.split('/', 2) : [cur.features.length === 1 ? cur.features[0] : null, ref];
          if (!a) {
            problems.push(`line ${i + 1}: screen "${ref}" needs "<featureId>/<nodeId>" when the entry has no single feature`);
            continue;
          }
          const f = resolveFeature(a);
          const node = f?.flowMap?.nodes?.find((n) => n.id === b);
          if (!f || (f.flowMap && !node)) {
            problems.push(`line ${i + 1}: unknown screen "${ref}" in "${cur.title}"`);
            continue;
          }
          cur.screens.push({ featureId: f.id, nodeId: b, label: node?.label ?? b });
          if (!cur.features.includes(f.id)) cur.features.push(f.id);
        }
        cur.type = meta.type ? meta.type.toLowerCase() : null;
        cur.author = meta.author ?? null;
        cur.why = meta.why ?? null;
        return;
      }
    }
    bodyLines.push(line);
  });
  flush();

  // Newest day first, whatever order the file was written in (stable within a day).
  entries.sort((x, y) => (x.date < y.date ? 1 : x.date > y.date ? -1 : 0));
  return { entries, problems };
}

/** Read <docs>/changes.md -> { history, problems }, or null when the file is absent. */
export function buildHistory({ docs, features = [], file }) {
  const p = file ?? path.join(docs, CHANGES_FILE);
  let src;
  try {
    src = readFileSync(p, 'utf8');
  } catch {
    return null;
  }
  const { entries, problems } = parseChanges(src, { features });
  return { history: { generatedAt: new Date().toISOString(), source: CHANGES_FILE, entries }, problems };
}

/** Shape check for history.json. -> list of problems (empty = valid). */
export function validateHistory(h) {
  const problems = [];
  if (h === null || typeof h !== 'object' || Array.isArray(h)) return ['history: must be a JSON object'];
  if (typeof h.generatedAt !== 'string') problems.push('history.generatedAt: must be a string');
  if (!Array.isArray(h.entries)) return [...problems, 'history.entries: must be an array'];
  h.entries.forEach((e, i) => {
    const at = `history.entries[${i}]`;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(e?.date ?? '')) problems.push(`${at}.date: must be YYYY-MM-DD`);
    if (typeof e?.title !== 'string' || !e.title) problems.push(`${at}.title: must be a non-empty string`);
    if (typeof e?.body !== 'string') problems.push(`${at}.body: must be a string`);
    if (!Array.isArray(e?.features)) problems.push(`${at}.features: must be an array`);
    if (!Array.isArray(e?.screens)) problems.push(`${at}.screens: must be an array`);
  });
  return problems;
}
