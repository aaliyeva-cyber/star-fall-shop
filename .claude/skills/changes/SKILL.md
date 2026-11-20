---
name: changes
description: Use when the prototype is about to leave the designer's machine (git push, a pull request) or when a session starts with uncommitted work from an earlier one, and the work changed something a designer, product manager or partner would notice — a new or reworked screen, a changed flow, new copy, a business rule, a reported fix, a research result. Adds an entry to docs/changes.md, the journal the Context App shows on its History page. Not for refactoring, dependency bumps, tooling or anything nobody would see in the prototype.
---

# Changes — the prototype's journal

`docs/changes.md` says what changed in the prototype **for the people looking at it**:
designers, product, business, partners. The Context App shows it on the History page, newest
first, with links to the features and screens it names. It is not a commit log: nobody reading
it cares which files moved.

## When

Not after every edit. Two moments, and a check reminds you of both:

- **Before the work goes out** — `git push` or a pull request. The push check stops the first
  push of a conversation that changed the prototype without touching the journal.
- **At the start of a session** that finds uncommitted work from an earlier one. The session
  check names the earlier conversation's transcript, when there is one.

In both cases: draft the entry, show it to the designer, write it only after they agree.

## What goes in

- a new screen, state or step, or a reworked one;
- a changed flow, rule or default;
- new or rewritten copy;
- a fix that someone reported or that changes what people see;
- a research or test result that changed the prototype, or a hypothesis that got a verdict.

Skip refactoring, renames, dependency or tooling changes and code-only fixes. One entry per
noticeable change, not per commit. Several pushes in one day that add up to one change make one
entry: if today's heading already has an entry for the same change, extend it instead of adding
a second one.

## Where the facts come from

- **The work going out:** `git log --oneline @{u}..HEAD` (or `git log --oneline HEAD --not
  --remotes` on a branch with no upstream) and `git diff --stat` for the same range.
- **An earlier session:** its transcript, a JSONL file. Read the designer's messages and your own
  closing replies, not the tool output: they say what was asked and why. Then `git status` and
  `git diff --stat` for what is actually on disk.
- **The why:** the hypothesis card (H-1, H-2…), the ticket, the feedback the designer mentioned.
  If none of these says why, ask the designer in the same question as the draft; do not invent
  a reason.

## Asking

One question, the draft shown in full, three answers: write it as is · let me change it ·
skip this time. "Skip" is a real answer: drop it and go on, do not ask again in this
conversation. The question tool unavailable (a headless run) — write nothing and say so in one
line.

## Format

Dates are level-2 headings (`## YYYY-MM-DD`), newest on top. Entries are level-3 headings under
their date. The file starts with `# Changes`; create it with that line if it does not exist.

```markdown
# Changes

## 2026-11-06

### Payment button moved above the methods list
Feature: checkout · Screen: methods-list · Type: design · By: Anna Grinberg · Why: H-2 — players missed the button in sessions

Players scrolled past the button under a long list of methods. It now sits above the list and stays visible on a phone.
[Figma](https://figma.com/…)
```

- **Title:** what changed, as the person sees it, in one line. "Payment button moved above the
  methods list", not "refactor CheckoutButton".
- **Meta line** (optional, the first line under the title; keys in any order, separated by ` · `):
  - `Feature:` feature ids as the Context App knows them, comma-separated.
  - `Screen:` the screen-map node id, or `<featureId>/<nodeId>` when the entry has more than one
    feature. The History page opens that screen on the map.
  - `Type:` one of `design`, `business`, `content`, `research`, `fix`.
  - `By:` the designer who asked for or made the change — never the agent.
  - `Why:` the reason: a hypothesis (H-2), feedback, a ticket (DSD-12409).
- **Body:** one to three short sentences. What changed and what it means for the user or the
  business. Links to Figma, the ticket or the pull request where useful.

## After writing

Commit the journal with the work it describes (`docs: changes — <title>`), then push. The
Context App export (`node scripts/context-app.mjs`) turns the file into the History page and
warns about a feature or screen id it does not know: fix the meta line rather than ignore it.
