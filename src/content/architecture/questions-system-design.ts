import type { DesignQuestion } from '../schema';

/**
 * Frontend system design: recruitment portal (ATS) and public job listing platform.
 * Longer, 45-minute discussions. Graded MCQs + a self-assessed answer compared against the outline.
 * Framework/browser facts were checked against the linked docs on 2026-11-26.
 */

const VERIFIED = '2026-11-26';

const SD_NOTE =
  'An original system design exercise. No public interview report was collected for it, so frequency is LOW_CONFIDENCE and no company is claimed to ask it. The topic list comes from a prep plan the learner wrote with an AI assistant, based on a referral contact\'s unpublished recollection of a senior frontend loop (October 2026); that account is not used as evidence. Evidence below is the documentation each design decision relies on.';

export const ARCH_QUESTIONS_SYSTEM_DESIGN: DesignQuestion[] = [
  // ---------------------------------------------------------------------------------------------
  // 1. Recruitment portal (ATS)
  // ---------------------------------------------------------------------------------------------
  {
    schemaVersion: 1,
    kind: 'design',
    execution: 'quiz',
    track: 'architecture',
    id: 'arch-sd-recruitment-portal',
    slug: 'system-design-recruitment-portal',
    title: 'System design: a multi-tenant recruitment portal (ATS)',
    difficulty: 'hard',
    priority: 'P0',
    seniority: ['Senior', 'SDE-3', 'MTS'],
    topics: ['frontend system design', 'rendering strategy', 'RBAC', 'multi-tenancy', 'optimistic updates', 'concurrent edits', 'file uploads', 'observability'],
    estimatedMinutes: 45,
    conceptIds: ['rendering-strategies', 'react-context', 'csrf-cookies', 'xss-prevention', 'react-performance'],
    research: {
      provenance: 'ORIGINAL_VARIATION',
      frequencyConfidence: 'LOW_CONFIDENCE',
      verificationStatus: 'SOURCES_VERIFIED',
      lastVerified: VERIFIED,
      variationOf: 'Generic "design an application" frontend system design rounds, applied to a recruitment product (candidates, recruiters, admins, hiring pipeline).',
      evidence: [
        { sourceId: 'webdev-rendering', url: 'https://web.dev/articles/rendering-on-the-web', originalTitle: 'Rendering on the Web', note: 'SSR/SSG/CSR trade-offs used for public vs authenticated surfaces.' },
        { sourceId: 'react-useoptimistic', url: 'https://react.dev/reference/react/useOptimistic', originalTitle: 'useOptimistic', note: 'Optimistic stage moves.' },
        { sourceId: 'owasp-file-upload', url: 'https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html', originalTitle: 'File Upload Cheat Sheet', note: 'Resume upload decisions.' },
        { sourceId: 'owasp-csrf', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html', originalTitle: 'Cross-Site Request Forgery Prevention Cheat Sheet', note: 'Session and CSRF design.' },
      ],
      researchNotes: SD_NOTE,
    },
    scenario: `Design the frontend of a recruitment portal used by many companies (tenants):

- **Candidates** browse public job pages, apply with a resume, and track their applications.
- **Recruiters** manage jobs, search and filter candidates, move them through pipeline stages (Applied → Screen → Interview → Offer → Hired/Rejected) on a board, leave notes, and schedule interviews.
- **Admins** manage users, roles and company settings.

You have 45 minutes. Cover requirements, the high-level architecture, rendering strategy per surface, the data and state model, the key interactions (board moves, search, uploads), permissions and multi-tenancy, performance, accessibility, security and how you would monitor it in production. Justify every choice; do not just name technologies.`,
    constraints: [
      'Up to 5,000 candidates per job; recruiters keep the app open all day.',
      'Public job pages need good SEO and fast first load on mobile.',
      'Candidate data is PII; the company is audited (SOC 2-style controls).',
      'A REST/JSON API exists; you may propose new endpoints.',
    ],
    answerOutline: [
      'Clarify requirements and scale first: roles, core flows, non-functional needs (SEO, PII, real-time, devices, a11y).',
      'Split surfaces: public careers site (SSR/SSG + ISR for SEO) vs authenticated recruiter app (client-heavy SPA or SSR shell + client data) vs candidate portal.',
      'State model: server state in a query cache keyed by tenant + params; URL state for filters/selection; local UI state colocated; small context for session/permissions.',
      'Pipeline board: optimistic stage moves with rollback, conflict handling via version/updatedAt (409), real-time updates via SSE/WebSocket, keyboard-accessible drag and drop.',
      'Candidate search: debounced, abortable, server-side filtering, cursor pagination, virtualized list, filters in URL.',
      'Permissions: server is the authority; frontend gets a permissions object to hide UI; route guards; tenant derived from session; caches cleared on logout/tenant switch.',
      'Resumes: presigned direct uploads, server validation and scanning, previews from an isolated cookieless domain with short-lived signed URLs.',
      'Security: HttpOnly/Secure/SameSite session cookie + CSRF defences, sanitized rich text (notes, job descriptions), strict CSP, audit log for PII access.',
      'Performance: route-level code splitting, virtualization, memoization where measured, Core Web Vitals budgets on public pages.',
      'Observability: error monitoring with source maps, RUM web vitals, API latency, feature flags and safe rollouts.',
    ],
    modelAnswer: `**1. Clarify (about 5 minutes).** Who the users are and which flows matter most: recruiters triaging candidates daily, candidates applying on phones. Scale: tens of thousands of candidates per tenant, 5,000 per job. Non-functional needs: SEO for job pages, PII compliance, near-real-time updates when teammates move candidates, WCAG 2.2 AA, and modern browsers plus mobile Safari.

**2. Surfaces and rendering.**

| Surface | Rendering | Why |
|---|---|---|
| Careers site and job pages | SSG/ISR or SSR, minimal JS | SEO, fast LCP on mobile, mostly static content |
| Apply flow | SSR shell + client form | Fast start, then a rich client-side form with upload |
| Recruiter app | SSR or static shell + client data | Behind login (no SEO), highly interactive, long-lived |
| Admin | Same app, lazy-loaded routes | Rarely used, so it should not cost recruiters bundle size |

One React/Next.js codebase with a shared design system, with route groups per surface. The public site and the app are deployed on different hostnames so their cookies and CSP can differ.

**3. Architecture.** Browser → CDN (static assets, cached public pages) → app server (SSR, BFF that aggregates API calls and holds the session) → REST services. Files go to object storage. Real-time events come through SSE or WebSocket from a notifications service.

**4. State model.**
- **Server state** (jobs, candidates, notes) lives in a query cache keyed by \`[tenantId, resource, params]\`, which handles staleTime, dedupe, background refetch and invalidation after mutations.
- **URL state**: filters, sort, selected candidate (\`/jobs/42/pipeline?stage=interview&candidate=981\`). This survives refresh and can be shared with a teammate.
- **Local state**: open drawers, form drafts, colocated with the component that uses it.
- **Context**: session user, tenant and permissions only. These change rarely.

**5. Key interactions.**
- **Pipeline board.** Columns are virtualized when large. Moving a card updates the cache **optimistically** (\`useOptimistic\` or the query library's \`onMutate\`), sends \`PATCH /applications/:id { stage, version }\`, rolls back with a toast on failure, and invalidates on settle. **Concurrent edits**: every application carries a \`version\` or \`updatedAt\`. The server returns 409 if it changed, and the UI refetches and shows "Moved to Offer by Priya a moment ago". Teammates' moves arrive over SSE and patch the cache. Drag and drop has a keyboard alternative (pick up with Space, move with arrows, announce via a live region).
- **Candidate search.** Debounced input, abortable requests keyed by query so stale responses never win, server-side filtering, **cursor pagination** (stable under inserts), virtualized results, and loading/empty/error states.
- **Resume upload.** Presigned direct-to-storage upload with progress and cancel. The server validates file signatures, scans for malware and generates names. Previews come from a separate cookieless domain through short-lived signed URLs, inside a sandboxed iframe.
- **Notes.** Rich text stored as a JSON document, rendered to React elements or sanitized HTML. Mentions notify teammates.

**6. Permissions and multi-tenancy.** The **server is the authority**. Every API call is checked against the session's tenant and role, and the tenant is never trusted from the URL alone. The frontend receives \`permissions: { canMoveStage, canViewSalary, … }\` from a session endpoint and uses it to hide or disable UI and guard routes. That is UX, not security. Query keys include \`tenantId\`, and caches are cleared on logout or tenant switch so data cannot leak between companies.

**7. Security.** Session cookie: \`__Host-\`, HttpOnly, Secure, SameSite, with a short idle timeout. CSRF protection via Fetch Metadata plus a token on mutations. Sanitize all rich text. Strict nonce-based CSP and \`frame-ancestors 'none'\`. Audit-log PII views and exports, and require re-authentication for bulk export.

**8. Performance.** Route-level code splitting (admin and analytics are lazy), virtualized lists and boards, memoization only where the Profiler shows it helps, images through a CDN, and a performance budget with Core Web Vitals targets on public pages. Heavy CSV imports run in a Web Worker.

**9. Observability and delivery.** Error monitoring with source maps and tenant and release tags (no PII in logs). Real-user monitoring for LCP, INP and CLS by route. API latency and error-rate dashboards. Feature flags for gradual rollouts. E2E tests for apply, move-stage and upload. Unit tests for permission-gated UI.

**10. Trade-offs to say out loud.** Polling is simpler than SSE but adds load and latency. Optimistic updates feel instant but need conflict handling. A BFF adds a hop but hides service sprawl and keeps tokens off the client.`,
    pitfalls: [
      'Jumping to libraries before clarifying users, scale and non-functional requirements.',
      'Using one rendering strategy for both the SEO-critical job pages and the authenticated dashboard.',
      'Treating frontend permission checks as security.',
      'Forgetting concurrent edits when describing optimistic updates.',
      'Ignoring tenant isolation in caches and cookies.',
    ],
    versionNotes:
      'Checked against web.dev Rendering on the Web, react.dev useOptimistic, OWASP File Upload and CSRF Prevention cheat sheets on 2026-11-26. Library choices (TanStack Query, Next.js) are examples, not requirements.',
    docSourceIds: ['webdev-rendering', 'react-useoptimistic', 'owasp-file-upload', 'owasp-csrf'],
    mcqs: [
      {
        id: 'm1',
        question: 'Which rendering approach best fits public job detail pages?',
        options: [
          { id: 'a', text: 'Client-side rendering with a loading spinner', explanation: 'Hurts SEO and LCP on mobile.' },
          { id: 'b', text: 'Static generation or SSR with periodic revalidation and minimal client JS', explanation: 'Correct — crawlable HTML, fast first paint, fresh enough.' },
          { id: 'c', text: 'Rendering the whole app in a Web Worker', explanation: 'Workers cannot render DOM.' },
          { id: 'd', text: 'An iframe of the recruiter app', explanation: 'Leaks the authenticated surface and hurts SEO.' },
        ],
        correctOptionId: 'b',
        explanation: 'Public, mostly static, SEO-critical content benefits from server-generated HTML; interactivity is limited to the apply flow.',
        sourceIds: ['webdev-rendering'],
      },
      {
        id: 'm2',
        question: 'Two recruiters move the same candidate to different stages within a second. What is the most robust design?',
        options: [
          { id: 'a', text: 'Last write wins silently', explanation: 'One recruiter\'s action disappears without feedback.' },
          { id: 'b', text: 'Send a version with each mutation; the server rejects stale versions with 409, the client refetches and explains what changed', explanation: 'Correct — optimistic concurrency control.' },
          { id: 'c', text: 'Lock the candidate for 5 minutes when a recruiter opens it', explanation: 'Pessimistic locks block collaborators and leak when tabs close.' },
          { id: 'd', text: 'Disable the board while any request is pending', explanation: 'Kills responsiveness and does not solve cross-user conflicts.' },
        ],
        correctOptionId: 'b',
        explanation: 'Version checks detect conflicts on the server; the client rolls back its optimistic change and shows the authoritative state.',
        sourceIds: ['react-useoptimistic'],
      },
      {
        id: 'm3',
        question: 'Where should tenant isolation be enforced?',
        options: [
          { id: 'a', text: 'In the frontend router, by hiding other tenants\' routes', explanation: 'UI hiding is not access control.' },
          { id: 'b', text: 'On the server for every request, from the session — with the frontend also scoping caches by tenant and clearing them on switch/logout', explanation: 'Correct.' },
          { id: 'c', text: 'In localStorage, by namespacing keys', explanation: 'Client storage is not a security boundary.' },
          { id: 'd', text: 'By using a different subdomain per tenant only', explanation: 'Helps cookie scoping but the API must still check tenancy.' },
        ],
        correctOptionId: 'b',
        explanation: 'Authorization is a server responsibility; the frontend avoids accidental leaks through caches and stale state.',
        sourceIds: ['owasp-csrf'],
      },
    ],
    followUps: [
      { id: 'f1', level: 'application', question: 'How do you preserve search filters across refresh and navigation?', expectedConcepts: ['URL search params', 'replace vs push', 'parse/validate', 'query key derived from params'], sourceIds: ['webdev-rendering'] },
      { id: 'f2', level: 'edge-cases', question: 'The SSE connection drops while a recruiter is offline for 10 minutes. How do you resync?', expectedConcepts: ['reconnect with backoff', 'last event id', 'refetch on reconnect / focus', 'invalidate caches'], sourceIds: ['react-useoptimistic'] },
      { id: 'f3', level: 'production', question: 'How do you monitor frontend performance and errors per tenant without logging PII?', expectedConcepts: ['RUM web vitals by route', 'error monitoring with release + tenant id', 'scrub PII', 'alerts on regressions'], sourceIds: ['webdev-rendering'] },
      { id: 'f4', level: 'architecture', question: 'Would you add a BFF (backend-for-frontend)? What does it buy you?', expectedConcepts: ['aggregate calls', 'hold session/tokens server-side', 'shape data for UI', 'extra hop and ownership cost'], sourceIds: ['owasp-csrf'] },
      { id: 'f5', level: 'architecture', question: 'How would you structure the codebase so three teams (careers site, recruiter app, admin) can ship independently?', expectedConcepts: ['shared design system package', 'route groups or separate apps', 'feature flags', 'micro-frontends only if org needs it'], sourceIds: ['webdev-rendering'] },
    ],
  },

  // ---------------------------------------------------------------------------------------------
  // 2. Job listing platform
  // ---------------------------------------------------------------------------------------------
  {
    schemaVersion: 1,
    kind: 'design',
    execution: 'quiz',
    track: 'architecture',
    id: 'arch-sd-job-listing',
    slug: 'system-design-job-listing',
    title: 'System design: a job search and listing platform',
    difficulty: 'hard',
    priority: 'P0',
    seniority: ['Senior', 'SDE-2', 'SDE-3', 'MTS'],
    topics: ['frontend system design', 'search', 'pagination', 'caching', 'SEO', 'virtualization', 'URL state', 'accessibility'],
    estimatedMinutes: 45,
    conceptIds: ['race-conditions', 'debouncing', 'abort-controller', 'rendering-strategies', 'xss-prevention'],
    research: {
      provenance: 'ORIGINAL_VARIATION',
      frequencyConfidence: 'LOW_CONFIDENCE',
      verificationStatus: 'SOURCES_VERIFIED',
      lastVerified: VERIFIED,
      variationOf: 'Generic search/listing-page frontend system design (autocomplete, news feed, e-commerce listing) applied to job search.',
      evidence: [
        { sourceId: 'webdev-rendering', url: 'https://web.dev/articles/rendering-on-the-web', originalTitle: 'Rendering on the Web' },
        { sourceId: 'webdev-virtualize', url: 'https://web.dev/articles/virtualize-long-lists-react-window', originalTitle: 'Virtualize large lists with react-window' },
        { sourceId: 'mdn-abortcontroller', url: 'https://developer.mozilla.org/en-US/docs/Web/API/AbortController', originalTitle: 'AbortController' },
        { sourceId: 'owasp-xss', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html', originalTitle: 'Cross Site Scripting Prevention Cheat Sheet', note: 'Safe rendering of job descriptions.' },
      ],
      researchNotes: SD_NOTE,
    },
    scenario: `Design the frontend of a job search platform: a search page with keyword input, filters (location, remote, experience, salary range, company), a result list, and a job detail page with an Apply button.

- 2 million active jobs; search results come from a search API.
- Most traffic arrives from Google onto job detail pages and search pages like "/jobs/react-developer-bengaluru".
- Users on mid-range Android phones and desktop.

Cover the page architecture, rendering and SEO, search interaction (including what happens when a user types "React" and quickly changes it to "Angular" and the React response arrives last), pagination, caching, state, failure states, security of job descriptions and accessibility.`,
    constraints: [
      'The search API supports keyword, filters, sort, and either page numbers or a cursor.',
      'Job descriptions are HTML written by employers.',
      'Target Core Web Vitals: LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1 at p75.',
    ],
    answerOutline: [
      'Requirements: search, filter, sort, paginate, view detail, apply, save; SEO for detail and landing pages; mobile performance; a11y.',
      'Rendering: SSR the first page of results and job detail (crawlable HTML, metadata, JobPosting structured data); client navigation afterwards; cache at CDN with revalidation.',
      'URL is the source of truth for query/filters/sort/page — shareable, back/forward, SSR-able; canonical URLs to avoid duplicate content.',
      'Search: debounce input, abort or ignore stale requests (key results by query) so React-then-Angular cannot show stale results; dedupe identical requests.',
      'Pagination: cursor for infinite/"load more" (stable under inserts), numbered pages for SEO landing pages; trade-offs of offset (deep pages slow, shifting results).',
      'Large lists: server-side filtering, page size ~20, virtualization if infinite scroll grows long; keep scroll position on back.',
      'Caching: query cache with staleTime per query key, prefetch next page / detail on hover; HTTP caching for SSR pages.',
      'Failure handling: skeletons sized to avoid CLS, empty state with suggestions, error with retry, keep previous results while refetching.',
      'Security: sanitize employer HTML with an allowlist (DOMPurify), validate apply URLs, rel="noopener noreferrer".',
      'Accessibility: labelled filters, results count in a polite live region, focus management after filtering/paging, keyboard-operable cards and pagination.',
    ],
    modelAnswer: `**1. Requirements.** *Functional*: keyword search, filters, sort, pagination, job detail, apply (on-site or external link), save a job. *Non-functional*: SEO for detail pages and landing pages, LCP ≤ 2.5 s and INP ≤ 200 ms on mid-range Android, accessibility, and resilience to slow networks.

**2. Pages and rendering.**
- **Job detail** (\`/jobs/:slug-:id\`): SSR or ISR with CDN caching, a short revalidation window, and on-demand revalidation when a job is edited or closed. Include \`<title>\`, a meta description, a canonical URL and **JobPosting structured data** so search engines can show rich results. Ship almost no JavaScript except the Apply and Save islands.
- **Search** (\`/jobs?q=react&loc=bengaluru&remote=1\`) and **landing pages** (\`/jobs/react-developer-bengaluru\`): SSR the first page of results so crawlers and users get HTML immediately, then hydrate and handle further searches on the client.

**3. State: the URL is the source of truth.** Query, filters, sort and page or cursor live in search params. Refresh, back/forward and sharing all work, and the server can render the same state. The input keeps local state for responsiveness, and the URL updates (with \`replace\`) after debounce. Filter changes \`push\` so Back undoes them.

**4. Search interaction.** Debounce typing by about 300 ms. Each request carries an \`AbortController\` signal, and the previous request is aborted when the query changes. Results are cached **per query key**, so even if a "React" response arrives after "Angular", it fills the "React" entry and never replaces what the user is looking at. Debounce alone does not fix ordering. Identical in-flight requests are deduplicated. While new results load, the previous results stay visible with a pending indicator rather than a blank list.

**5. Pagination.**

| | Offset/page numbers | Cursor |
|---|---|---|
| Deep pages | Slow on the server (skip N) | Constant cost |
| New jobs inserted | Items shift and can duplicate or skip | Stable |
| Jump to page 7 / SEO links | Easy | Not natural |

I would use **cursor-based "Load more" or infinite scroll** in the app, and **numbered pages** on SEO landing pages, where crawlable links matter and depth is capped. With infinite scroll, virtualize once the list grows past a few hundred items. Restore the scroll position and loaded pages on Back, and always provide a footer-reachable path.

**6. Caching and prefetching.** Query cache with \`staleTime\` of about 30–60 s for search and longer for job detail. Prefetch the job detail on hover or focus of a card and the next page when near the end. HTTP and CDN caching cover SSR pages, and the browser caches immutable assets with hashed filenames.

**7. Performance.** Server-side filtering with a page size of about 20. Skeletons with fixed dimensions to avoid CLS. Responsive images for company logos with explicit width and height. Code-split the filter drawer and apply flow. Avoid re-rendering the whole list on every keystroke (memoized cards, deferred results).

**8. Failure states.** Empty results get suggestions (remove a filter, check spelling). Errors show retry with backoff and keep stale results. Offline shows a clear banner. A closed job shows "No longer accepting applications" with similar jobs, returns the right HTTP status and updates structured data.

**9. Security.** Employer descriptions are HTML: sanitize with an allowlist sanitizer (OWASP recommends DOMPurify) inside one \`SafeHtml\` component, on both server and client. External apply URLs are validated (\`https:\` only) and rendered with \`rel="noopener noreferrer"\`. Add a strict CSP.

**10. Accessibility.** Every filter has a visible label. The result count ("124 jobs") goes to a polite live region after each search. After paging, focus moves to the results heading. Cards are links with descriptive text, the pagination is a \`<nav>\` with \`aria-current\`, and everything is keyboard-operable.

**11. Metrics.** RUM for Core Web Vitals by page type, search latency, zero-result rate, and the click-through funnel from search to apply.`,
    pitfalls: [
      'Client-rendering job pages that need to rank in search.',
      'Relying on debounce alone for correctness of search results.',
      'Keeping filters only in component state.',
      'Using offset pagination for infinite scroll on a feed with frequent inserts.',
      'Rendering employer HTML with dangerouslySetInnerHTML without sanitizing.',
    ],
    versionNotes:
      'Checked against web.dev Rendering on the Web and Virtualize large lists, MDN AbortController and the OWASP XSS Prevention Cheat Sheet on 2026-11-26. Core Web Vitals thresholds as listed in the lab\'s existing web.dev sources.',
    docSourceIds: ['webdev-rendering', 'webdev-virtualize', 'mdn-abortcontroller', 'owasp-xss', 'webdev-vitals'],
    mcqs: [
      {
        id: 'm1',
        question: 'A user searches "React" then quickly "Angular"; the React response arrives last. Which design guarantees the Angular results stay on screen?',
        options: [
          { id: 'a', text: 'Debounce the input by 500 ms', explanation: 'Reduces overlap but cannot guarantee ordering.' },
          { id: 'b', text: 'Abort or ignore stale requests and key cached results by query, rendering only the current query\'s entry', explanation: 'Correct.' },
          { id: 'c', text: 'Disable the input until each request returns', explanation: 'Harms UX and still races with filters.' },
          { id: 'd', text: 'Sort responses by timestamp on arrival', explanation: 'Arrival time is the problem, not the solution.' },
        ],
        correctOptionId: 'b',
        explanation: 'Correctness comes from tying each response to its query; debounce is an efficiency optimisation.',
        sourceIds: ['mdn-abortcontroller'],
      },
      {
        id: 'm2',
        question: 'Why is cursor pagination preferred for an infinite job feed?',
        options: [
          { id: 'a', text: 'It allows jumping to any page number', explanation: 'That is the strength of offset pagination.' },
          { id: 'b', text: 'Results stay stable when new jobs are inserted, and deep pages are cheap for the server', explanation: 'Correct.' },
          { id: 'c', text: 'It removes the need for sorting', explanation: 'Cursors depend on a stable sort.' },
          { id: 'd', text: 'Search engines prefer it', explanation: 'Crawlers prefer plain numbered links.' },
        ],
        correctOptionId: 'b',
        explanation: 'Offset pagination shifts when rows are inserted (duplicates/skips) and gets slower for deep offsets; a cursor continues from the last seen item.',
        sourceIds: ['webdev-virtualize'],
      },
      {
        id: 'm3',
        question: 'Which state should live in the URL on the search page?',
        options: [
          { id: 'a', text: 'Keyword, filters, sort and page/cursor', explanation: 'Correct — shareable, restorable, server-renderable.' },
          { id: 'b', text: 'Whether the filter drawer is open', explanation: 'Ephemeral UI state — local.' },
          { id: 'c', text: 'The raw API response', explanation: 'Server state belongs in a cache.' },
          { id: 'd', text: 'The user\'s auth token', explanation: 'Never put credentials in URLs.' },
        ],
        correctOptionId: 'a',
        explanation: 'What the user is looking at belongs in the URL; transient UI belongs in components; data belongs in a cache.',
        sourceIds: ['webdev-rendering'],
      },
    ],
    followUps: [
      { id: 'f1', level: 'application', question: 'Implement the search box: debounce, abort, loading and empty states.', expectedConcepts: ['debounced value', 'AbortController in effect cleanup', 'keep previous results', 'live region for count'], sourceIds: ['mdn-abortcontroller'] },
      { id: 'f2', level: 'edge-cases', question: 'The user scrolls 300 jobs deep, opens one, and presses Back. What should happen?', expectedConcepts: ['restore loaded pages from cache', 'restore scroll position', 'virtualized list offset', 'bfcache'], sourceIds: ['webdev-virtualize'] },
      { id: 'f3', level: 'production', question: 'How do you make job pages rank well and stay fresh when a job closes?', expectedConcepts: ['SSR/ISR', 'canonical URLs', 'JobPosting structured data', 'on-demand revalidation', 'status codes for closed jobs'], sourceIds: ['webdev-rendering'] },
      { id: 'f4', level: 'architecture', question: 'Would you build typeahead suggestions differently from full search?', expectedConcepts: ['separate lightweight endpoint', 'shorter debounce', 'client cache of prefixes', 'combobox ARIA pattern'], sourceIds: ['apg-combobox'] },
    ],
  },
];
