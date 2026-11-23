/*
 * Frontend Interview Lab — sandbox harness.
 *
 * This page is loaded in an <iframe sandbox="allow-scripts"> WITHOUT allow-same-origin,
 * so it runs in an opaque origin: it cannot read the app's IndexedDB, localStorage or
 * cookies, and the app only talks to it through postMessage.
 *
 * Responsibilities:
 *  - a tiny CommonJS module loader for code the app has already transpiled
 *  - a Jest-like test API (describe/it/expect/fn/fake timers) with DOM + React helpers
 *  - console capture and error reporting
 *  - a loop guard (`__lg`) that the compiler injects into every loop body
 */
(function () {
  'use strict';

  var realSetTimeout = window.setTimeout.bind(window);
  var realClearTimeout = window.clearTimeout.bind(window);
  var realSetInterval = window.setInterval.bind(window);
  var realClearInterval = window.clearInterval.bind(window);
  var realDateNow = Date.now;
  var realPerfNow = performance.now.bind(performance);

  var currentRunId = null;
  function post(msg) {
    msg.__fil = true;
    msg.runId = currentRunId;
    try { window.parent.postMessage(msg, '*'); } catch (e) { /* ignore */ }
  }

  /* ------------------------------------------------------------------ */
  /* Loop guard: throws if the event loop has been blocked for too long  */
  /* ------------------------------------------------------------------ */
  var LOOP_BLOCK_LIMIT_MS = 3000;
  var lastHeartbeat = realPerfNow();
  realSetInterval(function () { lastHeartbeat = realPerfNow(); }, 100);
  var lgTicks = 0;
  var loopGuardTripped = false;
  function __lg() {
    if (++lgTicks % 20000 === 0) {
      if (realPerfNow() - lastHeartbeat > LOOP_BLOCK_LIMIT_MS) {
        lastHeartbeat = realPerfNow();
        loopGuardTripped = true;
        throw new RangeError('Loop guard: a loop blocked the thread for more than ' + (LOOP_BLOCK_LIMIT_MS / 1000) + 's — possible infinite loop.');
      }
    }
  }

  /* ------------------------------------------------------------------ */
  /* Value formatting (console + assertion messages)                     */
  /* ------------------------------------------------------------------ */
  function fmt(value, depth, seen) {
    depth = depth || 0;
    seen = seen || [];
    if (value === null) return 'null';
    var t = typeof value;
    if (t === 'undefined') return 'undefined';
    if (t === 'string') return depth === 0 ? value : JSON.stringify(value);
    if (t === 'number') return Object.is(value, -0) ? '-0' : String(value);
    if (t === 'bigint') return value + 'n';
    if (t === 'boolean') return String(value);
    if (t === 'symbol') return value.toString();
    if (t === 'function') return '[Function: ' + (value.name || 'anonymous') + ']';
    if (seen.indexOf(value) !== -1) return '[Circular]';
    if (value instanceof Error) return value.name + ': ' + value.message;
    if (typeof Node !== 'undefined' && value instanceof Node) {
      if (value.nodeType === 1) return '<' + value.tagName.toLowerCase() + (value.id ? '#' + value.id : '') + '>';
      return '[' + value.nodeName + ']';
    }
    if (depth > 4) return Array.isArray(value) ? '[Array]' : '[Object]';
    seen = seen.concat([value]);
    if (Array.isArray(value)) {
      var items = [];
      for (var i = 0; i < value.length; i++) items.push(i in value ? fmt(value[i], depth + 1, seen) : '<empty>');
      return '[' + items.join(', ') + ']';
    }
    if (value instanceof Map) {
      var m = [];
      value.forEach(function (v, k) { m.push(fmt(k, depth + 1, seen) + ' => ' + fmt(v, depth + 1, seen)); });
      return 'Map(' + value.size + ') {' + m.join(', ') + '}';
    }
    if (value instanceof Set) {
      var s = [];
      value.forEach(function (v) { s.push(fmt(v, depth + 1, seen)); });
      return 'Set(' + value.size + ') {' + s.join(', ') + '}';
    }
    if (value instanceof Promise) return 'Promise {}';
    if (value instanceof Date) return value.toISOString();
    if (value instanceof RegExp) return String(value);
    var keys = Object.keys(value);
    var ctor = value.constructor && value.constructor !== Object ? value.constructor.name + ' ' : '';
    return ctor + '{' + keys.map(function (k) { return k + ': ' + fmt(value[k], depth + 1, seen); }).join(', ') + '}';
  }

  /* ------------------------------------------------------------------ */
  /* Console capture                                                     */
  /* ------------------------------------------------------------------ */
  var MAX_CONSOLE = 500;
  var consoleCount = 0;
  ['log', 'info', 'warn', 'error', 'debug'].forEach(function (level) {
    var orig = console[level] ? console[level].bind(console) : function () {};
    console[level] = function () {
      var args = Array.prototype.slice.call(arguments);
      orig.apply(null, args);
      if (consoleCount++ > MAX_CONSOLE) return;
      if (consoleCount === MAX_CONSOLE) { post({ type: 'console', level: 'warn', text: 'Console output truncated after ' + MAX_CONSOLE + ' entries.' }); return; }
      var text = args.map(function (a) { return fmt(a, 0); }).join(' ');
      post({ type: 'console', level: level === 'debug' ? 'log' : level, text: text });
    };
  });

  function serializeError(err) {
    if (err && typeof err === 'object') {
      var stack = String(err.stack || '');
      // keep only frames from user modules
      var frames = stack.split('\n').filter(function (l) { return /\/(?:[\w.-]+\/)*[\w.-]+\.(tsx?|jsx?)/.test(l) && l.indexOf('harness.js') === -1 && l.indexOf('/vendor/') === -1; }).slice(0, 6);
      return { name: err.name || 'Error', message: String(err.message !== undefined ? err.message : err), stack: frames.join('\n') };
    }
    return { name: 'Error', message: String(err), stack: '' };
  }

  window.addEventListener('error', function (e) {
    post({ type: 'runtime-error', error: serializeError(e.error || e.message) });
  });
  window.addEventListener('unhandledrejection', function (e) {
    post({ type: 'runtime-error', error: serializeError(e.reason) });
  });

  /* ------------------------------------------------------------------ */
  /* Module loader                                                       */
  /* ------------------------------------------------------------------ */
  var React = window.React;
  var ReactDOM = window.ReactDOM;
  var TL = window.TestingLibraryDom;

  function jsxImpl(isStatic) {
    return function (type, props, key) {
      var p = {};
      for (var k in props) if (k !== 'children') p[k] = props[k];
      if (key !== undefined) p.key = key;
      var children = props ? props.children : undefined;
      if (children === undefined) return React.createElement(type, p);
      // Static children (jsxs) are spread as arguments so React does not expect keys on them.
      if (isStatic && Array.isArray(children)) return React.createElement.apply(null, [type, p].concat(children));
      return React.createElement(type, p, children);
    };
  }
  var jsxRuntime = { Fragment: React.Fragment, jsx: jsxImpl(false), jsxs: jsxImpl(true) };
  jsxRuntime.jsxDEV = jsxRuntime.jsx;

  function dirname(p) { var i = p.lastIndexOf('/'); return i <= 0 ? '/' : p.slice(0, i); }
  function normalize(p) {
    var out = [];
    p.split('/').forEach(function (seg) {
      if (!seg || seg === '.') return;
      if (seg === '..') out.pop(); else out.push(seg);
    });
    return '/' + out.join('/');
  }
  var EXTS = ['', '.tsx', '.ts', '.jsx', '.js', '/index.tsx', '/index.ts', '/index.js'];

  function createModuleSystem(modules, styles, opts) {
    var cache = {};
    var builtins = {
      'fil:test': testApi,
    };
    if (opts.allowReact) {
      builtins['react'] = React;
      builtins['react-dom'] = ReactDOM;
      builtins['react-dom/client'] = { createRoot: ReactDOM.createRoot, hydrateRoot: ReactDOM.hydrateRoot };
      builtins['react/jsx-runtime'] = jsxRuntime;
      builtins['react/jsx-dev-runtime'] = jsxRuntime;
    }
    function resolve(from, spec) {
      if (Object.prototype.hasOwnProperty.call(builtins, spec)) return { builtin: spec };
      if (spec.charAt(0) !== '.' && spec.charAt(0) !== '/') {
        var hint = opts.allowReact ? '' : ' (this track is framework-free: only relative imports are allowed)';
        throw new Error('Cannot find module "' + spec + '"' + hint + '. Only local files' + (opts.allowReact ? ', react and react-dom' : '') + ' can be imported in the sandbox.');
      }
      var base = spec.charAt(0) === '/' ? normalize(spec) : normalize(dirname(from) + '/' + spec);
      for (var i = 0; i < EXTS.length; i++) {
        var candidate = base + EXTS[i];
        if (Object.prototype.hasOwnProperty.call(modules, candidate) || Object.prototype.hasOwnProperty.call(styles, candidate)) return { path: candidate };
      }
      throw new Error('Cannot find module "' + spec + '" imported from ' + from);
    }
    var injectedStyles = {};
    function load(path) {
      if (cache[path]) return cache[path].exports;
      if (Object.prototype.hasOwnProperty.call(styles, path)) {
        if (!injectedStyles[path]) {
          var el = document.createElement('style');
          el.setAttribute('data-file', path);
          el.textContent = styles[path];
          document.head.appendChild(el);
          injectedStyles[path] = true;
        }
        return {};
      }
      var module = { exports: {} };
      cache[path] = module;
      var code = modules[path];
      var fn;
      try {
        fn = new Function('require', 'module', 'exports', '__lg', code + '\n//# sourceURL=sandbox:' + path);
      } catch (e) {
        delete cache[path];
        throw e;
      }
      var req = function (spec) {
        var r = resolve(path, spec);
        return r.builtin ? builtins[r.builtin] : load(r.path);
      };
      fn(req, module, module.exports, __lg);
      return module.exports;
    }
    return { load: load, require: function (spec) { var r = resolve('/', spec); return r.builtin ? builtins[r.builtin] : load(r.path); } };
  }

  /* ------------------------------------------------------------------ */
  /* Fake timers                                                         */
  /* ------------------------------------------------------------------ */
  var fake = null; // { now, queue: [], nextId }
  function installFakeTimers() {
    if (fake) return;
    fake = { now: 0, queue: [], nextId: 1, baseDate: realDateNow() };
    window.setTimeout = function (fn, ms) {
      var args = Array.prototype.slice.call(arguments, 2);
      var id = fake.nextId++;
      fake.queue.push({ id: id, at: fake.now + Math.max(0, Number(ms) || 0), fn: fn, args: args, interval: null, seq: id });
      return id;
    };
    window.setInterval = function (fn, ms) {
      var args = Array.prototype.slice.call(arguments, 2);
      var id = fake.nextId++;
      var every = Math.max(1, Number(ms) || 0);
      fake.queue.push({ id: id, at: fake.now + every, fn: fn, args: args, interval: every, seq: id });
      return id;
    };
    window.clearTimeout = window.clearInterval = function (id) {
      if (!fake) return;
      fake.queue = fake.queue.filter(function (t) { return t.id !== id; });
    };
    Date.now = function () { return fake.baseDate + fake.now; };
  }
  function uninstallFakeTimers() {
    if (!fake) return;
    window.setTimeout = realSetTimeout;
    window.setInterval = realSetInterval;
    window.clearTimeout = realClearTimeout;
    window.clearInterval = realClearInterval;
    Date.now = realDateNow;
    fake = null;
  }
  function advanceTimersByTimeRaw(ms) {
    if (!fake) throw new Error('timers.advance() requires timers.useFake() first');
    var target = fake.now + ms;
    var guard = 0;
    while (true) {
      if (++guard > 100000) throw new Error('Fake timers: more than 100000 timers fired — likely an infinite timer loop.');
      var next = null;
      for (var i = 0; i < fake.queue.length; i++) {
        var t = fake.queue[i];
        if (t.at <= target && (!next || t.at < next.at || (t.at === next.at && t.seq < next.seq))) next = t;
      }
      if (!next) break;
      fake.now = next.at;
      if (next.interval) { next.at += next.interval; next.seq = fake.nextId++; }
      else fake.queue.splice(fake.queue.indexOf(next), 1);
      next.fn.apply(null, next.args);
    }
    fake.now = target;
  }
  function runAllTimersRaw() {
    if (!fake) throw new Error('timers.runAll() requires timers.useFake() first');
    var guard = 0;
    while (fake.queue.length) {
      if (++guard > 10000) throw new Error('Fake timers: runAll() exceeded 10000 iterations — an interval or self-rescheduling timer?');
      var next = fake.queue.reduce(function (a, b) { return a.at < b.at || (a.at === b.at && a.seq < b.seq) ? a : b; });
      advanceTimersByTimeRaw(Math.max(0, next.at - fake.now));
    }
  }

  /* ------------------------------------------------------------------ */
  /* Test API                                                            */
  /* ------------------------------------------------------------------ */
  var reactMode = false;
  function withAct(cb) {
    if (!reactMode) return cb();
    var result;
    React.act(function () { result = cb(); });
    return result;
  }
  function realDelay(ms) { return new Promise(function (r) { realSetTimeout(r, ms); }); }

  function isDeepEqual(a, b, seen) {
    if (Object.is(a, b)) return true;
    if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
    seen = seen || [];
    for (var s = 0; s < seen.length; s++) if (seen[s][0] === a && seen[s][1] === b) return true;
    seen = seen.concat([[a, b]]);
    if (Array.isArray(a) !== Array.isArray(b)) return false;
    if (Object.getPrototypeOf(a) !== Object.getPrototypeOf(b)) return false;
    if (a instanceof Date) return a.getTime() === b.getTime();
    if (a instanceof RegExp) return String(a) === String(b);
    if (a instanceof Map) {
      if (a.size !== b.size) return false;
      var okM = true;
      a.forEach(function (v, k) { if (!b.has(k) || !isDeepEqual(v, b.get(k), seen)) okM = false; });
      return okM;
    }
    if (a instanceof Set) {
      if (a.size !== b.size) return false;
      var okS = true;
      a.forEach(function (v) { if (!b.has(v)) okS = false; });
      return okS;
    }
    if (Array.isArray(a)) {
      if (a.length !== b.length) return false;
      for (var i = 0; i < a.length; i++) if (!isDeepEqual(a[i], b[i], seen)) return false;
      return true;
    }
    var ka = Object.keys(a).filter(function (k) { return a[k] !== undefined; });
    var kb = Object.keys(b).filter(function (k) { return b[k] !== undefined; });
    if (ka.length !== kb.length) return false;
    for (var j = 0; j < ka.length; j++) {
      if (!Object.prototype.hasOwnProperty.call(b, ka[j]) || !isDeepEqual(a[ka[j]], b[ka[j]], seen)) return false;
    }
    return true;
  }

  function AssertionError(message) { var e = new Error(message); e.name = 'AssertionError'; return e; }

  function isMock(f) { return typeof f === 'function' && f._isMock === true; }
  function fn(impl) {
    var mock = function () {
      var args = Array.prototype.slice.call(arguments);
      mock.mock.calls.push(args);
      mock.mock.contexts.push(this);
      var r;
      var useImpl = mock._onceImpls.length ? mock._onceImpls.shift() : mock._impl;
      try {
        r = useImpl ? useImpl.apply(this, args) : undefined;
        mock.mock.results.push({ type: 'return', value: r });
      } catch (e) {
        mock.mock.results.push({ type: 'throw', value: e });
        throw e;
      }
      return r;
    };
    mock._isMock = true;
    mock._impl = impl || null;
    mock._onceImpls = [];
    mock.mock = { calls: [], results: [], contexts: [] };
    mock.mockImplementation = function (f) { mock._impl = f; return mock; };
    mock.mockImplementationOnce = function (f) { mock._onceImpls.push(f); return mock; };
    mock.mockReturnValue = function (v) { mock._impl = function () { return v; }; return mock; };
    mock.mockResolvedValue = function (v) { mock._impl = function () { return Promise.resolve(v); }; return mock; };
    mock.mockRejectedValue = function (v) { mock._impl = function () { return Promise.reject(v); }; return mock; };
    mock.mockClear = function () { mock.mock.calls = []; mock.mock.results = []; mock.mock.contexts = []; return mock; };
    return mock;
  }

  function isVisible(el) {
    var node = el;
    while (node && node.nodeType === 1) {
      if (node.hidden) return false;
      var cs = window.getComputedStyle(node);
      if (cs.display === 'none' || cs.visibility === 'hidden') return false;
      if (node.tagName === 'DETAILS' && !node.open && node !== el) {
        // content inside a closed <details> (except its <summary>) is not rendered
        var summary = node.querySelector(':scope > summary');
        if (!summary || !summary.contains(el)) return false;
      }
      node = node.parentElement;
    }
    return !!el.isConnected;
  }

  function makeMatchers(actual, negate, label) {
    function check(pass, msg) {
      if (negate ? pass : !pass) throw AssertionError((negate ? 'Expected NOT: ' : 'Expected: ') + msg);
    }
    var m = {
      toBe: function (exp) { check(Object.is(actual, exp), fmt(actual, 1) + ' to be ' + fmt(exp, 1)); },
      toEqual: function (exp) { check(isDeepEqual(actual, exp), fmt(actual, 1) + ' to equal ' + fmt(exp, 1)); },
      toStrictEqual: function (exp) { check(isDeepEqual(actual, exp), fmt(actual, 1) + ' to strictly equal ' + fmt(exp, 1)); },
      toBeTruthy: function () { check(!!actual, fmt(actual, 1) + ' to be truthy'); },
      toBeFalsy: function () { check(!actual, fmt(actual, 1) + ' to be falsy'); },
      toBeNull: function () { check(actual === null, fmt(actual, 1) + ' to be null'); },
      toBeUndefined: function () { check(actual === undefined, fmt(actual, 1) + ' to be undefined'); },
      toBeDefined: function () { check(actual !== undefined, 'value to be defined'); },
      toBeInstanceOf: function (C) { check(actual instanceof C, fmt(actual, 1) + ' to be instance of ' + (C && C.name)); },
      toBeGreaterThan: function (n) { check(actual > n, fmt(actual, 1) + ' > ' + n); },
      toBeGreaterThanOrEqual: function (n) { check(actual >= n, fmt(actual, 1) + ' >= ' + n); },
      toBeLessThan: function (n) { check(actual < n, fmt(actual, 1) + ' < ' + n); },
      toBeLessThanOrEqual: function (n) { check(actual <= n, fmt(actual, 1) + ' <= ' + n); },
      toContain: function (item) {
        var has = typeof actual === 'string' ? actual.indexOf(item) !== -1 : Array.prototype.some.call(actual || [], function (x) { return Object.is(x, item); });
        check(has, fmt(actual, 1) + ' to contain ' + fmt(item, 1));
      },
      toHaveLength: function (n) { check(actual != null && actual.length === n, 'length ' + (actual && actual.length) + ' to be ' + n); },
      toMatch: function (re) { check(typeof re === 'string' ? String(actual).indexOf(re) !== -1 : re.test(String(actual)), fmt(actual, 1) + ' to match ' + re); },
      toThrow: function (expected) {
        var threw = false, err;
        try { actual(); } catch (e) { threw = true; err = e; }
        var ok = threw;
        if (threw && expected !== undefined) {
          var msg = err && err.message !== undefined ? err.message : String(err);
          if (typeof expected === 'string') ok = msg.indexOf(expected) !== -1;
          else if (expected instanceof RegExp) ok = expected.test(msg);
          else if (typeof expected === 'function') ok = err instanceof expected;
        }
        check(ok, 'function to throw' + (expected !== undefined ? ' ' + fmt(expected, 1) : '') + (threw ? ' (threw ' + fmt(err, 1) + ')' : ' (did not throw)'));
      },
      toHaveBeenCalled: function () { assertMock(); check(actual.mock.calls.length > 0, 'mock to have been called'); },
      toHaveBeenCalledTimes: function (n) { assertMock(); check(actual.mock.calls.length === n, 'mock to be called ' + n + ' times, but it was called ' + actual.mock.calls.length + ' times'); },
      toHaveBeenCalledWith: function () {
        assertMock();
        var args = Array.prototype.slice.call(arguments);
        check(actual.mock.calls.some(function (c) { return isDeepEqual(c, args); }), 'mock to have been called with ' + fmt(args, 1) + '; calls: ' + fmt(actual.mock.calls, 1));
      },
      toHaveBeenLastCalledWith: function () {
        assertMock();
        var args = Array.prototype.slice.call(arguments);
        var last = actual.mock.calls[actual.mock.calls.length - 1];
        check(!!last && isDeepEqual(last, args), 'last call to be ' + fmt(args, 1) + ' but was ' + fmt(last, 1));
      },
      // DOM matchers
      toBeInTheDocument: function () { check(!!actual && actual.ownerDocument && actual.ownerDocument.contains(actual), 'element to be in the document'); },
      toBeVisible: function () { assertEl(); check(isVisible(actual), fmt(actual, 1) + ' to be visible'); },
      toHaveTextContent: function (t) {
        assertEl();
        var txt = (actual.textContent || '').replace(/\s+/g, ' ').trim();
        check(t instanceof RegExp ? t.test(txt) : txt.indexOf(t) !== -1, 'text ' + JSON.stringify(txt) + ' to contain ' + fmt(t, 1));
      },
      toHaveAttribute: function (name, value) {
        assertEl();
        var has = actual.hasAttribute(name);
        if (arguments.length < 2) check(has, fmt(actual, 1) + ' to have attribute ' + name);
        else check(has && actual.getAttribute(name) === String(value), fmt(actual, 1) + ' to have ' + name + '=' + JSON.stringify(String(value)) + ' (got ' + JSON.stringify(actual.getAttribute(name)) + ')');
      },
      toHaveFocus: function () { assertEl(); check(actual.ownerDocument.activeElement === actual, fmt(actual, 1) + ' to have focus (active element: ' + fmt(document.activeElement, 1) + ')'); },
      toBeDisabled: function () { assertEl(); check(!!actual.disabled || actual.getAttribute('aria-disabled') === 'true', fmt(actual, 1) + ' to be disabled'); },
      toHaveClass: function (c) { assertEl(); check(actual.classList.contains(c), fmt(actual, 1) + ' to have class ' + c); },
      toHaveValue: function (v) { assertEl(); check(actual.value === v, 'value ' + JSON.stringify(actual.value) + ' to be ' + JSON.stringify(v)); },
    };
    function assertMock() { if (!isMock(actual)) throw AssertionError('Expected a mock function created with fn()'); }
    function assertEl() { if (!actual || actual.nodeType !== 1) throw AssertionError('Expected a DOM element but got ' + fmt(actual, 1)); }
    return m;
  }

  function expect(actual) {
    var api = makeMatchers(actual, false);
    api.not = makeMatchers(actual, true);
    api.resolves = asyncMatchers(function () { return Promise.resolve(actual); }, false);
    api.rejects = asyncMatchers(function () {
      return Promise.resolve(actual).then(
        function (v) { throw AssertionError('Expected promise to reject but it resolved with ' + fmt(v, 1)); },
        function (e) { return e; }
      );
    }, true);
    return api;
  }
  function asyncMatchers(getValue, isReject) {
    var proxy = {};
    var names = Object.keys(makeMatchers(null, false));
    names.forEach(function (name) {
      proxy[name] = function () {
        var args = arguments;
        return getValue().then(function (v) {
          if (isReject && name === 'toThrow') {
            var expected = args[0];
            var msg = v && v.message !== undefined ? v.message : String(v);
            var ok = expected === undefined || (typeof expected === 'string' ? msg.indexOf(expected) !== -1 : expected instanceof RegExp ? expected.test(msg) : v instanceof expected);
            if (!ok) throw AssertionError('Expected rejection matching ' + fmt(expected, 1) + ' but got ' + fmt(v, 1));
            return;
          }
          makeMatchers(v, false)[name].apply(null, args);
        });
      };
    });
    return proxy;
  }

  // Suite registry
  var rootSuite, currentSuite;
  function newSuite(name, parent) { return { name: name, parent: parent, tests: [], suites: [], before: [], after: [], children: [] }; }
  function describe(name, body) {
    var s = newSuite(name, currentSuite);
    currentSuite.children.push({ suite: s });
    var prev = currentSuite;
    currentSuite = s;
    try { body(); } finally { currentSuite = prev; }
  }
  function it(name, body) { currentSuite.children.push({ test: { name: name, body: body } }); }
  function beforeEach(f) { currentSuite.before.push(f); }
  function afterEach(f) { currentSuite.after.push(f); }

  // React helpers
  var mountedRoots = [];
  function render(element) {
    var container = document.createElement('div');
    document.body.appendChild(container);
    var root = ReactDOM.createRoot(container);
    React.act(function () { root.render(element); });
    var handle = {
      container: container,
      rerender: function (el) { React.act(function () { root.render(el); }); },
      unmount: function () { React.act(function () { root.unmount(); }); container.remove(); },
    };
    mountedRoots.push(handle);
    return handle;
  }
  function cleanupReact() {
    while (mountedRoots.length) {
      var h = mountedRoots.pop();
      try { h.unmount(); } catch (e) { /* already unmounted */ }
    }
  }

  // DOM (vanilla) mounting
  var domProject = null; // { html, styles, modules, entry }
  function mount() {
    if (!domProject) throw new Error('mount() is only available in the vanilla DOM runner');
    document.body.innerHTML = domProject.bodyHtml;
    Array.prototype.forEach.call(document.querySelectorAll('style[data-file]'), function (s) { s.remove(); });
    var ms = createModuleSystem(domProject.modules, domProject.styles, { allowReact: false });
    Object.keys(domProject.styles).forEach(function (p) { ms.load(p); });
    if (domProject.entry) ms.load(domProject.entry);
    document.dispatchEvent(new Event('DOMContentLoaded'));
    return document.body;
  }

  var timers = {
    useFake: installFakeTimers,
    useReal: uninstallFakeTimers,
    advance: function (ms) { withAct(function () { advanceTimersByTimeRaw(ms); }); },
    runAll: function () { withAct(runAllTimersRaw); },
    pendingCount: function () { return fake ? fake.queue.length : 0; },
  };

  // Flush pending promise callbacks (and React effects/updates in React mode).
  function flush() {
    if (reactMode) {
      return React.act(function () { return realDelay(0); });
    }
    return realDelay(0);
  }

  function deferred() {
    var d = {};
    d.promise = new Promise(function (res, rej) { d.resolve = res; d.reject = rej; });
    return d;
  }

  var fireEventProxy = function () { var a = arguments; return withAct(function () { return TL.fireEvent.apply(null, a); }); };
  Object.keys(TL.fireEvent).forEach(function (k) {
    fireEventProxy[k] = function () { var a = arguments; return withAct(function () { return TL.fireEvent[k].apply(null, a); }); };
  });

  var testApi = {
    describe: describe, it: it, test: it, beforeEach: beforeEach, afterEach: afterEach,
    expect: expect, fn: fn, timers: timers, flush: flush, deferred: deferred,
    render: render, mount: mount, act: function (cb) { return React.act(cb); },
    screen: null, within: TL.within, fireEvent: fireEventProxy, waitFor: TL.waitFor,
  };
  // expose as globals too, so test files can use them without importing
  Object.keys(testApi).forEach(function (k) { window[k] = testApi[k]; });

  /* ------------------------------------------------------------------ */
  /* Test execution                                                      */
  /* ------------------------------------------------------------------ */
  var TEST_TIMEOUT_MS = 5000;
  function withTimeout(p, ms, name) {
    return new Promise(function (resolve, reject) {
      var t = realSetTimeout(function () { reject(new Error('Test "' + name + '" timed out after ' + ms + 'ms (unresolved promise or real timer?)')); }, ms);
      Promise.resolve(p).then(function (v) { realClearTimeout(t); resolve(v); }, function (e) { realClearTimeout(t); reject(e); });
    });
  }

  function collectTests(suite, prefix, befores, afters, out) {
    var allBefore = befores.concat(suite.before);
    var allAfter = suite.after.concat(afters);
    suite.children.forEach(function (c) {
      if (c.test) out.push({ name: (prefix ? prefix + ' › ' : '') + c.test.name, body: c.test.body, before: allBefore, after: allAfter });
      else collectTests(c.suite, (prefix ? prefix + ' › ' : '') + c.suite.name, allBefore, allAfter, out);
    });
    return out;
  }

  async function runTestFile(file, payload) {
    rootSuite = newSuite('', null);
    currentSuite = rootSuite;
    var ms = createModuleSystem(payload.modules, payload.styles || {}, { allowReact: payload.mode === 'react' });
    try {
      ms.load(file.path);
    } catch (e) {
      post({ type: 'test-result', file: file.path, visibility: file.visibility, name: '(loading test file)', status: 'error', error: serializeError(e), durationMs: 0 });
      return;
    }
    var tests = collectTests(rootSuite, '', [], [], []);
    for (var i = 0; i < tests.length; i++) {
      var t = tests[i];
      if (loopGuardTripped) {
        // Each blocked test would cost several seconds; report the rest as not run instead of timing out.
        post({ type: 'test-result', file: file.path, visibility: file.visibility, name: t.name, status: 'error', error: { name: 'Skipped', message: 'Not run: an earlier test was stopped by the loop guard (possible infinite loop). Fix that first.', stack: '' }, durationMs: 0 });
        continue;
      }
      var start = realPerfNow();
      var status = 'pass', error = null;
      lastHeartbeat = realPerfNow();
      try {
        for (var b = 0; b < t.before.length; b++) await withTimeout(t.before[b](), TEST_TIMEOUT_MS, t.name);
        await withTimeout(t.body(), TEST_TIMEOUT_MS, t.name);
      } catch (e) {
        status = e && e.name === 'AssertionError' ? 'fail' : 'error';
        error = serializeError(e);
      }
      try {
        for (var a = 0; a < t.after.length; a++) await withTimeout(t.after[a](), TEST_TIMEOUT_MS, t.name);
      } catch (e) {
        if (status === 'pass') { status = 'error'; error = serializeError(e); }
      }
      if (reactMode) cleanupReact();
      uninstallFakeTimers();
      if (payload.mode !== 'react') document.body.innerHTML = '';
      post({ type: 'test-result', file: file.path, visibility: file.visibility, name: t.name, status: status, error: error, durationMs: Math.round(realPerfNow() - start) });
      await realDelay(0);
    }
  }

  function bodyFromHtml(html) {
    var doc = new DOMParser().parseFromString(html || '', 'text/html');
    // <script> tags in index.html are ignored: the runner executes the project's JS entry itself.
    Array.prototype.forEach.call(doc.body.querySelectorAll('script'), function (s) { s.remove(); });
    return doc.body.innerHTML;
  }

  async function handleRun(payload) {
    currentRunId = payload.runId;
    // Bind Testing Library queries to <body> now that it exists (window.screen is [Replaceable]).
    testApi.screen = TL.getQueriesForElement(document.body);
    testApi.screen.debug = function () { console.log(document.body.innerHTML); };
    window.screen = testApi.screen;
    reactMode = payload.mode === 'react';
    consoleCount = 0;
    if (reactMode) {
      window.IS_REACT_ACT_ENVIRONMENT = payload.action === 'test';
      TL.configure({ asyncUtilTimeout: 2000 });
    }
    var styles = payload.styles || {};
    if (payload.mode === 'dom') {
      domProject = { bodyHtml: bodyFromHtml(payload.html), styles: styles, modules: payload.modules, entry: payload.entry };
    }
    try {
      if (payload.action === 'preview') {
        if (payload.mode === 'dom') {
          mount();
        } else if (payload.mode === 'react') {
          var ms = createModuleSystem(payload.modules, styles, { allowReact: true });
          Object.keys(styles).forEach(function (p) { ms.load(p); });
          var mod = ms.load(payload.entry);
          var Comp = mod && (mod.default || mod.App);
          if (typeof Comp !== 'function') throw new Error(payload.entry + ' must export a default React component.');
          var root = document.getElementById('root');
          ReactDOM.createRoot(root).render(React.createElement(PreviewBoundary, null, React.createElement(Comp)));
        } else {
          var msj = createModuleSystem(payload.modules, styles, { allowReact: false });
          msj.load(payload.entry);
        }
        post({ type: 'done', summary: { preview: true } });
        return;
      }
      for (var i = 0; i < payload.testFiles.length; i++) {
        await runTestFile(payload.testFiles[i], payload);
      }
      post({ type: 'done', summary: {} });
    } catch (e) {
      var err = serializeError(e);
      if (payload.action === 'preview') showOverlay(err);
      post({ type: 'runtime-error', error: err });
      post({ type: 'done', summary: { failed: true } });
    }
  }

  function showOverlay(err) {
    var el = document.getElementById('__fil_overlay') || document.createElement('div');
    el.id = '__fil_overlay';
    el.textContent = err.name + ': ' + err.message + (err.stack ? '\n\n' + err.stack : '');
    document.body.appendChild(el);
  }

  var PreviewBoundary = (function () {
    function B(props) { React.Component.call(this, props); this.state = { error: null }; }
    B.prototype = Object.create(React.Component.prototype);
    B.prototype.constructor = B;
    B.getDerivedStateFromError = function (error) { return { error: error }; };
    B.prototype.componentDidCatch = function (error) { post({ type: 'runtime-error', error: serializeError(error) }); };
    B.prototype.render = function () {
      if (this.state.error) {
        var e = serializeError(this.state.error);
        return React.createElement('div', { id: '__fil_overlay' }, e.name + ': ' + e.message + (e.stack ? '\n\n' + e.stack : ''));
      }
      return this.props.children;
    };
    return B;
  })();

  window.addEventListener('message', function (event) {
    if (event.source !== window.parent) return;
    var data = event.data;
    if (!data || data.__filHost !== true || data.type !== 'run') return;
    handleRun(data.payload);
  });

  currentRunId = null;
  post({ type: 'ready' });
})();
