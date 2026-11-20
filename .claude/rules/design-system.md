---
paths:
  - "src/**/*.tsx"
  - "src/**/*.ts"
---
# Building on a design system

How this project works with the design system it stands on — `state.json` says which one.
Nothing here names a component, a prop or a token. Those move with the library, a page that
names them goes stale without anybody noticing, and this project already has three answers
that are always about the version installed right now.

How hard these hold depends on the mode in `state.json` — strict, or relaxed, where they are
advice. `kit.md` says which is which; this page is the same in both.

## Where the truth is

**A component exists only if `ds.mjs` knows it.** Not because a page, a mockup layer or a
memory names it.

- `node scripts/ds.mjs <what you need>` — the catalogue, built from the packages actually in
  this project. It says what exists, whether it is installed, what parts it carries and what
  it takes.
- The package's own types. The screen check runs the type checker, so a prop that does not
  exist is an error you are shown, not a guess you carry around.
- `.claude/ds/findings.md` — what turned out to be true in practice and is written nowhere
  else. A line above the last version divider was noticed on an older library: a lead to
  re-check, not a fact.

## How to use it well — XUI's public documentation

https://xsolla-ui-toolkit-v2.web.app/llms.txt — the XUI team's own index for agents: the
principles (the provider, the theme, tokens over values), the common pitfalls, and a link to a
page per component with its API. Read it when the question is *how* — which component fits,
how theming works — not *whether* something exists; that is the catalogue's answer.

It is read from the site, not kept here: a copy goes stale the way the old fetched guide did.
And it is known to be uneven:

- **The index is incomplete.** The table and most b2c packages are not in it. Missing from
  the index is not missing from the library — ask `ds.mjs`.
- **A dead page answers 200 with an HTML page**, not a 404. A link that returns HTML instead
  of markdown is dead: do not read the HTML, go to the package types.
- **`llms-full.txt` is a Storybook page, not text.** Do not use it.

Where the documentation and the types disagree, the types are what compiles.

## What does not move with the library

- **Take the component from the system and set what it declares.** Do not bend it, do not put
  markup of your own inside it, do not press a shape onto it from outside. The whole of that
  boundary, and the way out of it, is in `kit.md`.
- **Values come from the theme**, never invented: colour, spacing, radius, type. The mockup
  shows a shade the theme has no token for — that is a question for the designer and for the
  design system team, not a number to make up.
- **Icons and logos come from the icon packages**, never exported from a mockup. Only content
  leaves a mockup as an image — covers, art, screenshots — and it is downloaded, never
  approximated.
- **No CSS files, no CSS modules, no Tailwind.** The project draws with styled-components and
  the theme; a system that hands its values out another way is followed its own way.
- **The layout is yours**: the page frame, the grid, the row that spaces two things apart.
  Everything standing inside them comes from the library. Arranging is free — display, flex,
  grid, gap, padding, margin, width, position. The moment a box of yours also paints — a
  background, a border, a radius, a shadow, type — it counts as an element you drew, and the
  screen check says so unless the file still takes more from the library than it draws.
