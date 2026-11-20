<div align="center">

# 🎨 Xsolla Product Design Starter Pack

### Talk to an agent — get a clickable prototype and the documents under it.

*React · Vite · the Xsolla design system · the agent works, you decide.*

</div>

---

This is not an application. There are no screens here, no React, no configuration — only the
working setup a designer needs: the checks that keep a screen on the design system, the product
documents and how they hold together, the Context button, and the search over the component
catalogue. The prototype appears when the work starts, shaped by the task at hand.

## Start a project

**A repository of your own.** Press **Use this template** on
[the starter pack](https://github.com/xsolla/product-design-starter), name your copy, and clone
it to your machine. Nothing has to be installed: the files are already there, and the kit
writes down what version it is the first time it is asked, so updates work from day one.

**A folder that already exists.** Open it in Claude Code or Cursor and ask in your own words:

> Put the design starter pack into this folder:
> https://github.com/xsolla/product-design-starter

It fetches the kit and installs it.

If you would rather install it by hand:

```bash
git clone --depth 1 https://github.com/xsolla/product-design-starter /tmp/starter
node /tmp/starter/scripts/kit.mjs install .
```

Either way, open the folder with the agent and say hello. It asks how you want to work, which
design system to build on, and which documents this project needs. Three answers, all as buttons:

- **How you work.** Full product work — a PRD first, then the documents stage by stage, then the
  screens. Prototype now, documents later — the screens come first and the skipped documents are
  written down as owed. Screens from Figma — existing mockups turned into screens, no product
  work. Or your own way, in your own words.
- **Which design system, and how strictly.** The Xsolla design system held strictly — the checks
  below refuse a homemade element; the Xsolla design system as a base — offered first, but nothing
  is refused and you can change things on purpose; another one (give a link to it); or none. Only
  the strict choice turns the design-system checks on. Change it later just by telling the agent.
- **Which documents.** Four are ticked by default and any of them can be unticked: context,
  scenarios, screen states and screen contracts. Domain rules, job stories, navigation and
  permissions, validation and review can be added. Only what you pick is created, and the choice
  can change later.

A product that already keeps its documents in `docs/<feature>/` and its screens in `src/pages/`
is read where it is — nothing is moved to suit the kit. With several features on disk, the agent
asks which one the work is on.

## After that, no terminal

Everything else happens in conversation. Ask for the prototype and it runs; ask what is left and
it looks. Six routines have a shortcut, and the palette shows what each one is for:

- `/check` before showing the work: documents, screens and the map, in one answer — plus what was
  decided for you, what the design system was missing, ideas still waiting for a verdict, and
  every option of every setting tried against its default. Where work goes through pull
  requests, the same preflight runs on each one without installing anything
  (`.github/workflows/verify.yml`, the check named `verify`); a browser pass over the screens
  is an opt-in advisory job (repository variable `KIT_VERIFY_BROWSER=on`). Pushing
  straight to main triggers nothing.
- `/update` pulls a newer kit. Decisions, findings, documents and screens stay where they are.
- `/deps` pulls newer packages: the design system, the catalogue, the Context button, the copy
  rulebook, the team gallery.
- `/review` compares a screen with its Figma frame and closes the differences until a judge
  scores it nine.
- `/uxw` writes or checks the words on a screen against the Xsolla copy rulebook.
- `/prune` trims the instruction files: cuts what any agent knows already.

Two clocks, on purpose. The kit changes when the checks change, and updating it cannot break a
screen. The packages change when the design system ships, and that can. A step that moves the
library to a new generation is named in the report and left alone until you say yes.

An update never runs the code it is replacing: it fetches the newest kit and lets that copy do
the work, so a project untouched for half a year updates the way today's kit expects. Files the
kit wrote into the prototype — the screen router, the page shell, the build config, the preview
image — are refreshed only where you have not edited them. A file the kit did not put there is
never deleted: a file of your own in one of the kit's folders stops the update before anything
changes, and the report names it. The report also quotes what changed in the kit since your
version, from `CHANGELOG.md`.

A few more things are a question away, no shortcut needed:

- *"What did you decide for me?"* — while working, the agent does not stop at every gap in the
  mockup or the documents: it picks, and leaves a note in the file where it picked. The list is
  collected from those notes, so it cannot go stale.
- *"What was the design system missing?"* — every component the agent had to build itself, with
  the reason, ready to send to the design system team.
- *"Check the screens"* — the same screen check `/check` runs, on its own.
- *"Which half of the library are the screens written in?"* — a count of primitives against
  composed components, for the argument about which to use. It reports and judges nothing.

## What it holds a screen to

The rules are not prose the agent reads when it feels like it. Each one is a check. The
design-system ones — the first five — run when you chose the design system strictly; otherwise
they are advice the agent follows where you have not asked for something else:

- **A component is looked for before it is drawn, in a fixed order.** First the design system —
  the search forgives inexact names and knows what designers call things, so "chip" finds the
  tag and "banner" the notification. Then the team gallery, the components colleagues have
  already written, said plainly to be a colleague's work. Only when both are empty does the
  agent build one of its own.
- **A component comes from the design system.** A name the system already uses cannot be
  redefined, a system component cannot be bent with a style or a class, and your own markup does
  not go inside one — a card takes what it declares, and what it cannot say becomes a question
  for you rather than a fork of the card.
- **Values come from the theme.** A colour written by hand is refused, with the token named.
- **Icons and logos come from the icon packages**, never exported from a mockup.
- **What the library was missing is written down.** A component of your own is created with the
  reason in the same line, the reason lands in the file, and `node scripts/debt.mjs` collects
  the list the design system team asks for.
- **A screen does what the documents promise.** Every state a matrix marks as applying is opened
  in a browser and compared with its neighbours; a state described and never built is named. The
  browser is fetched once, the first time it is needed; until then the check reads the code only
  and says so.
- **Nothing is reported green that was not looked at.** When the check could only read the code,
  it says so instead of implying more.

## The team gallery

The design system does not cover everything, and designers keep writing the same missing piece
over and over. The team gallery is the shared shelf for those components: once connected, its
components show up in the same search as the design system's. A component of yours that worked
out can be sent there — the agent checks it duplicates neither the system nor the shelf, and
puts it on a branch of its own, so nothing reaches the gallery until someone reviews it.

## Variants without copies

"What if the payment methods were a grid?" is not a copy of the screen or of the prototype. Ask
in your own words and it becomes a **setting** of that screen, switched from the Context button.
Settings sit on four levels — the whole app, a feature, the conditions a scenario runs in, one
screen — and a setting that only matters under another one (a recently played row only for a
signed-in player) stays hidden until it does.

- **An idea being tested** is a hypothesis card, H-1, H-2…, in the feature's documents: what we
  believe, how we test it, the signal, the result. The setting that shows it names it, and its
  default is what ships today. A region or a partner is a condition, not an idea, and needs no card.
- **A named set of choices** is a preset, saved from the Context button straight into the
  prototype while it runs on your machine. On the app level a preset is a version — "MVP 0.75",
  "Dream".
- **Every choice lives in the address**, so a link shows exactly what its author saw. A test link
  opens the prototype with no Context button at all, ready for a respondent.

Before a handoff, every option is opened next to the default: one that changes nothing on its
screens, or breaks them, fails the check.

## The Context button

The Context button sits in the corner of a running prototype and opens the wiki behind it: the
feature catalogue, the documents, the team's shared comments and the map of screen states. The
map is built from the documents — every state marked as applying becomes a node that opens the
prototype in that state, and arrows come from what each action on a screen leads to — so it
cannot fall behind them. Happy paths are drawn on it step by step, with their edge cases and
failures branching off where they happen. The agent connects the button once the prototype is
worth showing, and the map is rebuilt as the documents change.

## Claude Code or Cursor

Both. The checks are one set of files that answer to whichever asked, and the kit writes the
Cursor-shaped wrapping itself: `.cursor/hooks.json`, the rules as `.mdc`, the commands and the
entry questionnaire. `AGENTS.md` is read by both and stays where it is.

Everything under `.cursor/` is generated on install and update, and the kit carries no copy of
it: there is one set of files to maintain, `.claude/`, and the Cursor shape is written from it
every time. Change the originals, never the projection.

## What it needs

- Node 20 or newer, and git.
- The Xsolla design system lives in a private registry: `@xsolla/xui-*` installs only with
  access to it. Without that the kit still works, just without the catalogue. The team gallery
  and the copy rulebook are private repositories too: without access to them everything else
  keeps working.
- The Context button fetches its copy of the app from an internal address, so it only appears on
  the corporate network.

## Where things are

```
AGENTS.md          what the product is — the project's own file, filled as the agent learns
state.json         your answers to the first questions: how you work, which system, which documents
docs/features/     the product documents, one folder per feature and per stage
src/screens/       the screens, once the prototype exists
src/variants.json  the settings, presets and the ideas they test
.claude/hooks/     the checks that run while the agent works
.claude/rules/     what the agent knows about this project, and the decisions you made
.claude/ds/        the component catalogue and the findings about it
scripts/           everything you can run by hand — each file opens with why it exists
CHANGELOG.md       what changed in the kit, release by release
```

A prototype built with this can be served to the team through the internal preview: the image
and its ignore list are written into the project, and the build config knows the two settings
the container needs and a laptop must not have.

## Coming from the previous starter pack

The one before this is not gone: it lives on the `starter-pack-v1-old` branch, whole, with its
own README, its own scripts and the pipeline that came with it. A project built on it keeps
working, and nothing about it has to move today.

Moving one across is a move, not an update — the older pack keeps its own scripts and its own
npm entries, and installing over it would replace the scripts folder whole. Open the project and
ask:

> Move this project onto the current starter pack:
> https://github.com/xsolla/product-design-starter

The agent follows `MIGRATION.md`: it commits what you have first, keeps the old files instead of
deleting them, and tells you afterwards what changed and what is left for you to decide.
