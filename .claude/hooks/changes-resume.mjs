#!/usr/bin/env node
//
//  changes-resume — unfinished work from last time gets its line in the journal
//  ────────────────────────────────────────────────────────────────────────────
//
//  WHY THIS EXISTS
//  A designer often closes a conversation without pushing and opens a new one the next day.
//  The new agent starts blank: it sees changed files and has no idea what they were for, and
//  by the time the work is pushed nobody remembers why. The earlier conversation still knows —
//  Claude Code keeps it on this machine — so this is the moment to write it down.
//
//  WHEN IT RUNS
//  On its own, at session start, and only when the prototype has uncommitted changes (screens,
//  pictures, documents) and the journal has none.
//
//  WHAT YOU SEE
//  Nothing until the agent asks: here is what the previous session changed, worth a line on
//  the History page? Skipping is fine.
//
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { flush, input, rootOf, say } from './lib/dialect.mjs'
import { JOURNAL, noticeable, uncommittedFiles } from './lib/changes.mjs'

const root = rootOf(process.cwd())
const changed = uncommittedFiles(root)
if (!changed) process.exit(0)                     // not a repository
if (changed.includes(JOURNAL)) process.exit(0)    // the journal is already being written
const seen = noticeable(changed)
if (!seen.length) process.exit(0)

// Claude Code keeps each conversation as a JSONL file under ~/.claude/projects/, in a folder
// named after the project path with every character that is not a letter or a digit turned
// into a dash. The newest one that is not this session is the conversation that left the work.
// Cursor keeps its own elsewhere and in its own shape: there, the diff is all there is.
function previousTranscript() {
  const dir = path.join(os.homedir(), '.claude', 'projects', path.resolve(root).replace(/[^a-zA-Z0-9]/g, '-'))
  let files
  try { files = fs.readdirSync(dir).filter((f) => f.endsWith('.jsonl')) } catch { return null }
  const current = input.session_id ? input.session_id + '.jsonl' : null
  const dated = files
    .filter((f) => f !== current)
    .map((f) => ({ f, t: fs.statSync(path.join(dir, f)).mtimeMs }))
    .sort((a, b) => b.t - a.t)
  return dated.length ? path.join(dir, dated[0].f) : null
}

const transcript = previousTranscript()
const shown = seen.slice(0, 5).join(', ') + (seen.length > 5 ? ` and ${seen.length - 5} more` : '')
say(
  `[changes] Uncommitted changes to the prototype from an earlier session: ${shown}. ` +
  (transcript ? `That conversation is ${transcript}. ` : '') +
  `Before new work, offer the designer one entry for ${JOURNAL} (the History page) that sums up ` +
  `what it changed and why — .claude/skills/changes/SKILL.md says how. One question; "skip" ends ` +
  `it for this conversation. Not a word if the changes are nothing a person would notice.`,
)
flush('SessionStart')
