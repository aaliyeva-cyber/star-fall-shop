# How this kit works

Prototype workspace for a designer, not an engineer. They lead; you build screens and
product documents.

Talk to them in their own language, in plain words. No package names or prop names in
questions — save those for files.

**They do not use the terminal.** Every command below is yours to run, and what comes back
is yours to translate. Never end a message with a line for them to paste, and never wait for
them to run something: do it and report what happened.

## Language

**Everything you write into the repository is English.** Documents, instructions, code
comments, commit messages, script output, notes in memory — all of it. No exceptions, not
even a header comment addressed to the designer.

**You speak to the designer in whatever language they write in** — Russian, English, Chinese,
anything. Match their language in every message, question, option label and report, for the
whole session.

That includes search: the catalogue is indexed in English, so turn what the designer said into
the English term yourself before calling `ds.mjs` — "карточка", "卡片" and "card" are one query.

## Commands

| What | Command |
|---|---|
| Create the prototype | `node scripts/init.mjs <screen> <screen>` |
| Run the prototype | `npm run dev` — restart it after installing a package, or the page can go blank |
| Find a component | `node scripts/ds.mjs <what you need>` |
| Strict or relaxed design system | `node scripts/ds-mode.mjs` · `strict` · `relaxed` — only on the designer's word |
| New own component | `node scripts/new-component.mjs <Name> "what was missing"` |
| Product documents | `node scripts/docs.mjs` · `start <feature>` · `screen <name>` · `check` |
| Screens vs documents | `node scripts/screens.mjs` · `--install` once, and the states are opened in a browser instead of read in the code |
| Settings, hypotheses, presets, links | `node scripts/variants.mjs` · `add` · `hypothesis` · `preset` · `link [--test]` · `check` |
| Everything before a handoff | `node scripts/preflight.mjs` |
| Update the kit | `node scripts/kit.mjs update` · `check` |
| Update the packages | `node scripts/deps.mjs` · `--check` · `--majors` |
| Refresh the Cursor side | `node scripts/cursor.mjs` |
| What you decided for them | `node scripts/debt.mjs` |
| Which half of the library the screens use | `node scripts/vocabulary.mjs` |
| Context button, map, docs | `node scripts/context-app.mjs connect` · `export` · `check` |
| Team gallery | `node scripts/vibe.mjs connect` · `update` · `promote <Name>` |
| Compare a screen to its mockup | `/review <screen>` |
| Interface copy | `/uxw` — only when they ask |

## Strict or relaxed

The next two sections hold in full when the design system is **strict** — `designSystem.strict`
in `state.json` is anything but `false`, which includes every project that never answered. The
checks enforce them there.

When the designer chose **relaxed** — XUI as a base, another design system, or none — they are
advice, and no check enforces them. Still search `ds.mjs` first and offer what the library has;
then build what the designer asks for, their way. No `// gap:` mark is required, and nothing is
refused. The first lines of the session say which mode this is.

The mode is the designer's to change: "I don't need strict XUI" → `node scripts/ds-mode.mjs
relaxed`, "hold me to the system" → `strict`. Never switch it to get past a refusal.

## Picking a component — in this order, no skipping

1. **Design system.** `node scripts/ds.mjs` — it forgives inexact names.
   Found and installed: use it. Found but not installed: install it, do not draw your own.
2. **Team gallery** `@xui-vibe` — components other designers already wrote. The search shows
   them in the same output. Say plainly that it is a colleague's work, not the design system.
3. **Your own** — only when the first two are empty:
   `node scripts/new-component.mjs <Name> "what the library was missing"`. That sentence lands
   in the file as a `// gap:` mark — the list goes to the design system team, and `screens.mjs`
   fails a hand-made interface without it.

A layer name in a mockup is not a package name: `Progress` lives as `progress-bar`, a game
card as `b2c-game-card`. Search shorter before concluding it does not exist.

## Hard boundaries

- **A system component takes only what it declares.** Set the parameters it offers — a title,
  a size, a state, an icon where it asks for one. Never put your own markup inside it, and
  never put another component inside it that it did not ask for. A prop the library itself
  calls "custom content" is not an invitation: filling it rebuilds the component from the
  outside, where the design system team can never see what you changed. Never bend one into
  shape, and never hide a wrapper for it in another folder. Its padding, its type, its border
  and its background are the library's answer, not yours: no inline style and no class name
  reaching into them. Where it sits and how much room it takes is the screen's business, and
  that part is yours. And the way to lay out what is inside one is the component's own layout
  props — a row spaces its parts with the `gap` and `justifyContent` it declares, not by having
  a `div` of yours wrapped around them. A handful of components are the exception because
  holding your content is their whole job: a modal, a drawer, a sheet, a popover, a tooltip, a
  portal, a page or layout wrapper, and a table, whose own types call it structural. Everything
  else — a card, a cell, a row, a bar — has its own slots, and those are not an invitation.
  Your own means anything you wrote, a plain `<div>` or `<span>` included: that is the likeliest
  way to trip this on a first attempt, and the answer is the component's own props, not a
  wrapper.
- **Icons and logos come from the icon packages**, never exported from Figma. Only content —
  covers, art, screenshots — comes as images.
- Hit the limit of a system component — change the idea, not the component. The library has
  no place for the thing the mockup shows: say so plainly, put it to the designer, and leave
  it an `OQ-N`. Not permission to build your own next to it, and not permission to stuff it
  in through a slot.
- **A screen or a component is written with the editing tool, never through the shell.** A
  heredoc, a redirect or a `sed -i` into `src/` puts a file down that no check has read, and the
  check refuses it — the content is the same either way, the reading is not.
- Never write "agreed with the designer" unless they actually agreed.

## The project's own file

`AGENTS.md` at the root belongs to the project, not to this kit. It ships empty on purpose.
Fill it as you learn what the product is — from the conversation, a PRD or a mockup: who
uses it, what it is for, what matters visually, which decisions are already made. Only what
cannot be read off the code; commands and folder layout are not worth a line there. A few
sentences, extended as you learn more.

## Memory — ask first, write after

You do not fill the project memory on your own. Found something about the library that the
documentation does not say — ask whether it is worth keeping, and write the line only then.

The designer will also reject or redirect something in passing — "not the dark theme",
"always ask me before X". That is a standing rule, not a one-off edit: ask whether to remember
it, and write it into the decision file that matches the scope. A rule already enforced by a
check needs no line anywhere.

Details, findings and the component catalogue live in `.claude/ds/` — the search reaches them;
do not read them wholesale. The design system's public documentation is linked from
`design-system.md`; it can describe an older library than the one installed, and where it and
the package types disagree, the types are what compiles.

## When you decide for them

You will hit gaps: the mockup lacks a state, the contract offers two options, there is no
data. Do not stop on every one — choose, keep going, and leave the mark where you chose:

```
// debt: took tabs for the filter, OQ-7 was never answered
```

`node scripts/debt.mjs` collects these before a handoff.

## Variants, hypotheses, presets

"What if the methods were a grid?" is a **setting**, never a copy of the screen or of the
prototype. One screen, one entry in `src/variants.json`, and the Context button switches it.

- **Setting** — one place with alternatives, named for what it changes; options named for
  what they are, never v1/v2. In the screen: `useSetting('<id>')`; to another screen keeping
  the choice: `go('<screen>')` — both from `src/kit/settings.ts`. A plain `location.hash`
  drops the choice. A small difference stays inline; a large one is a file next to the screen.
  A setting that changes what happens rather than what is drawn — the bank declines after
  Pay — is added with `--behaviour`, or the screen check expects the page itself to differ.
- **Hypothesis** — only when the designer is testing an idea: an `H-N` card
  (`variants.mjs hypothesis`), and the setting names it. Its default is the control, what
  ships today. Region, partner, signed-in or not — conditions, not ideas: no card, no warning.
- **Level** — where it shows in Context: `app` (the whole product), `feature`, `scenario` (the
  conditions a scenario runs in), `screen`. A setting that only matters under another gets
  `when` and is hidden otherwise.
- **Preset** — a named set of choices; on the app level it is a version ("MVP 0.75").
  The designer saves them from Context too; they land in the same file.
- **Links** — `variants.mjs link <screen> [state] a=x --test`: the test link (`ui=0`) shows the
  prototype with no Context button, ready for a respondent. Every choice lives in the address,
  never in the browser's storage.
- A happy path is drawn on the map by its `**Map:**` line — the map points it walks, in order;
  `**Map deviations:**` says where an EC or FR leaves it.

## Documents

Product work lives in `docs/features/<feature>/`, one folder per stage — or in `docs/<feature>/`
and `src/pages/` on an older product, which every check reads and names in a note. A project
that keeps them anywhere else says so once, in `state.json`: `"paths": { "features": "...",
"screens": "..." }`. Never move the designer's folders to suit a check. The designer picks
which stages to run in the entry questionnaire; `docs.mjs` creates only those. Numbering is
what ties them together: rules BR-N, job stories JS-N, happy paths HP-N, edge cases EC-N,
failures FR-N, open questions OQ-N. Reference by id, never by retelling.

Each family lives in the stage that defines it — BR in `01`, JS in `03`, HP, EC and FR in `04`.
A stage the project did not take has no ids to give: write what it would have held as plain
words in the document you do have, and do not invent a `BR-3` with nowhere to point. The check
reads a reference to an id nobody defined as a fault, and it is right to.

Unresolved question — mark it `OQ-N` with status Open instead of inventing an answer.

A feature's folder name is its id, not its name. What people read in the Context App comes
from `state.json`: `"title"` for the prototype and `"titles": { "<feature>": "..." }` for its
features. Set them the first time the designer names the product or a feature in words.

Two places are read by a program rather than by a person, so they are written to the letter.
A state applies when its line opens with the word yes — `**Applies:** yes`, and anything else,
`N/A` first of all, takes it off the map with the reason kept. An arrow between screens comes
from the last column of a contract's Actions table, and only when that cell names exactly one
screen of this feature: "home or the portal" names none, "back to the list and the offer"
names two, and both are dropped without a word. The address of a state is the first word of
its heading in lower case — `## 6. Error — ...` opens at `#<screen>?state=error` — and two
states of one screen that draw the same thing are reported as one: if they truly are the same,
one of them is N/A with a reason.

The design system ships far more than the project installs — a search answering "in the system
but not installed" is the normal answer, not a miss. Install it and re-index; that is the
second line the search prints.

## The change journal

`docs/changes.md` is what the Context App shows on its History page: what changed in the
prototype for the people looking at it, and why. Not a commit log, and not after every edit —
two checks bring it up at the right moments: before a push or a pull request that changes the
prototype, and at the start of a session that finds uncommitted work from an earlier one. Then
draft the entry, ask the designer once, and write only what they agreed to. How a line looks:
the `changes` skill.

## Before showing the work

`node scripts/preflight.mjs` — documents, screens, map, and what was decided for them, in one
answer. Run it after the changes, not from memory: a green result from ten minutes ago may
already be false.
