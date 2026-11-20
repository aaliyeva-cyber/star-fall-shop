#!/usr/bin/env node
//
//  changes-gate — the journal gets a line before the work goes out
//  ────────────────────────────────────────────────────────────────
//
//  WHY THIS EXISTS
//  The Context App shows a History page: what changed in the prototype and why, written for
//  the people who look at it rather than for the people who code it. It reads docs/changes.md.
//  A journal nobody is reminded of stays empty, and writing after every edit turns it into a
//  commit log. The moment that matters is when the work leaves the designer's machine: from
//  then on other people see the change and will ask what it was.
//
//  WHEN IT RUNS
//  On its own, when the agent pushes or opens a pull request, and only if the commits going
//  out change the prototype itself (screens, pictures, documents) while the journal stays
//  untouched. Once per conversation: the second push goes through whatever the answer was.
//
//  WHAT YOU SEE
//  The push waits for one question: here is the line for the History page — write it, change
//  it, or skip this time. "Skip" is a fine answer.
//
//  WHERE IT GOES
//  docs/changes.md — plain text, yours to read and edit. The changes skill says how a line
//  looks (.claude/skills/changes/SKILL.md).
//
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { commandOf, deny, rootOf, sessionOf } from './lib/dialect.mjs'
import { JOURNAL, noticeable, outgoingFiles } from './lib/changes.mjs'

const cmd = commandOf() || ''
const outward = /\bgit\s+push\b/.test(cmd) || /\bgh\s+pr\s+create\b/.test(cmd)
if (!outward) process.exit(0)

// Asked once in this conversation — the designer has answered; do not stop them twice.
const flag = path.join(os.tmpdir(), `changes-gate-${sessionOf()}`)
if (fs.existsSync(flag)) process.exit(0)

const root = rootOf(process.cwd())
const going = outgoingFiles(root)
if (!going) process.exit(0)                    // not a repository, or git is missing: stay out

if (going.includes(JOURNAL)) process.exit(0)   // the journal is going out with the work
const seen = noticeable(going)
if (!seen.length) process.exit(0)              // plumbing only: nothing for the History page

fs.writeFileSync(flag, '1')

const shown = seen.slice(0, 5).join(', ') + (seen.length > 5 ? ` and ${seen.length - 5} more` : '')
deny(
  `Not yet: the commits going out change the prototype (${shown}) and ${JOURNAL} — the ` +
  `History page in the Context App — says nothing about them. Follow .claude/skills/changes/SKILL.md: ` +
  `draft one entry from what is going out (git log and git diff --stat for the same range; extend ` +
  `today's entry instead if it is the same change), show it to the designer in one question — ` +
  `write it / change it / skip this time — and commit it if they agree. Then run the same command ` +
  `again: this check stops a push only once per conversation. Nothing worth a line for a ` +
  `designer or a manager (it was a fix nobody would see) — run the command again without asking.`,
)
