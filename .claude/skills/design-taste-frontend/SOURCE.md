# Vendored skill: design-taste-frontend (Taste Skill)

- Upstream: https://github.com/Leonxlnx/taste-skill (MIT, see LICENSE) — https://www.tasteskill.dev/
- Version: 2.5.1, commit 6c0b5c78f5d31776e2210305abaa210cdc0030bf (vendored 2026-11-23)
- Copied unchanged from `skills/taste-skill/`; equivalent to `npx skills add Leonxlnx/taste-skill` at project scope.
- Update: re-copy `skills/taste-skill/` from a newer upstream commit into this folder.

Notes for this repo:
- Needs Node 22+ and Chrome/Chromium. In Claude Code cloud sessions set `CHROME_PATH=/opt/pw-browsers/chromium`.
- Its Stop hook (`scripts/gate.mjs --hook claude`) does nothing unless a build has been armed with
  `gate.mjs --start` / `start.mjs` (marker in `.taste-skill/`, which is git-ignored).
- The skill targets marketing/company websites. Version 2.5.1 has no separate app-screen route, so for this app's
  dashboard/workspace screens treat its rules as guidance rather than running its finish gate.
