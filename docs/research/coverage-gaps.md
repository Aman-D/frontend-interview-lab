# Coverage gaps (2026-11-23)

## Evidence gaps
- **No first-person interview reports** were collected, so no question carries `VERIFIED_INTERVIEW_REPORT`. Next step: gather public reports (e.g. dated blog posts, forum write-ups) and attach them per question, without company inference beyond what the report states.
- **GreatFrontEnd** pages were inaccessible (HTTP 429 bot checkpoint). Its titles are cited only through the Front End Interview Handbook.
- React candidates #23, #25, #26, #29, #30 (spreadsheet, JSON editor, resizable panels, multi-camera dashboard, video scrubber) have **no public evidence** in the sources reviewed. They remain `UNKNOWN`; the catalog lists better-evidenced replacements.
- Rich Text Editor, Date Picker, Virtualized List and Command Palette appear in sources as *system design* topics. Machine-coding versions must be scoped down (e.g. a 60-minute subset) and that is stated in the problem.

## Content gaps (implemented vs. targets)
| Track | Target | Implemented (full content + verified solution) |
|---|---|---|
| React machine coding | 30 | 18 |
| Vanilla JS / DOM | 20 | 2 |
| JS coding & polyfills | 30 | 4 |
| TypeScript | 20 | 2 |
| Output prediction | 50+ | 19 |

This was intentional for Phase 1: the brief asks to validate the architecture before mass content creation.

## Runtime gaps
- React runner supports TSX/JSX/TS/JS files and CSS files; npm packages other than `react`/`react-dom` are not available offline.
- Runaway synchronous loops are interrupted by a compile-time loop guard; deep recursion surfaces as a stack-overflow error. A tight loop that the guard cannot see (e.g. inside a library) can still freeze the sandbox iframe until the run times out.
- No visual regression or automated accessibility (axe) checks yet; accessibility is covered by role/ARIA assertions in tests plus manual checklists.

## Concept pages added for the second React batch
Added: controlled vs uncontrolled, derived state, React context, portals (incl. scroll locking), ARIA live regions, modal dialog pattern, tabs pattern (roving tabindex), radio group pattern, carousel pattern (incl. reduced motion). Concept total: 42.
