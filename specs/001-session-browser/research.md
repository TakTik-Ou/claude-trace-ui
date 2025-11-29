# Research Findings: Claude Code Session Browser

**Date**: 2025-11-29
**Feature**: 001-session-browser
**Purpose**: Resolve Technical Context unknowns and establish technology decisions

---

## Executive Summary

This research resolves three performance unknowns from the Constitutional Check and establishes the UI framework decision. Key findings:

1. **Bundle Size**: Original 500KB target unrealistic for React stack; **revised to 200-300KB with Basecoat UI + vanilla JS**
2. **Memory**: 200MB target achievable with virtual scrolling and lazy loading; **250-300MB recommended for headroom**
3. **CPU**: Original targets (<10% idle, <30% active) are realistic and achievable with worker threads + proper scheduling
4. **UI Framework**: **Basecoat UI + Tailwind CSS + vanilla JavaScript chosen** over React for better bundle size, performance, and alignment with constitutional requirements

---

## Decision 1: UI Framework & Styling

### Decision
**Basecoat UI + Tailwind CSS 4.0 + Vanilla JavaScript** (no React/Vue/Angular)

### Rationale

**Bundle Size Victory**:
- Basecoat UI: Minimal overhead (~20-30KB for used components)
- Tailwind CSS: 2-10KB with PurgeCSS (vs 186KB unpurged)
- Vanilla JS: Zero framework overhead
- **Total baseline: ~50-80KB** vs React's 144KB minified baseline
- Achieves constitutional requirement of <500KB easily, target 200-300KB realistic

**Performance Benefits**:
- No virtual DOM overhead (direct DOM manipulation)
- No reconciliation/diffing algorithms
- Faster initial render (no framework bootstrap)
- Lower memory footprint (no component tree in memory)
- Aligns with constitution: "No heavyweight frameworks (keep bundle <500KB)"

**Accessibility Built-in**:
- Basecoat provides WCAG 2.1 AA compliant components out of the box
- Pre-built: forms, dialogs, dropdowns, toggles, modals
- Proper ARIA attributes and keyboard navigation included
- Meets constitutional requirement: "Keyboard navigation for all primary actions"

**Developer Experience**:
- Modern ES6+ JavaScript (classes, modules, async/await)
- Web Components architecture (custom elements, shadow DOM optional)
- Event-driven patterns (native CustomEvent, EventTarget)
- No build complexity (Vite handles ES modules natively)

**Maintenance**:
- Fewer dependencies to update
- No framework version migrations
- Direct browser APIs (long-term stable)
- Clear upgrade path (Basecoat follows web standards)

### Alternatives Considered

| Framework | Pros | Cons | Verdict |
|-----------|------|------|---------|
| **React 18+** | Mature ecosystem, concurrent features | 144KB baseline, virtual DOM overhead | ❌ Rejected |
| **Preact** | 10KB only, React-compatible API | Ecosystem gaps, compatibility layer | ⚠️ Viable fallback |
| **Vue 3** | Good performance, composition API | 90KB runtime, adds framework overhead | ❌ Rejected |
| **Basecoat + Vanilla JS** | Minimal, accessible, web standards | Manual state management | ✅ **Selected** |

### Implementation Approach

**Secure Component Pattern**:
```javascript
// Custom element with secure DOM manipulation
class SessionList extends HTMLElement {
  constructor() {
    super();
    this.sessions = [];
  }

  connectedCallback() {
    this.render();
    this.attachEventListeners();
  }

  render() {
    // SECURE: Use DOM APIs, not innerHTML with untrusted data
    const container = document.createElement('div');
    container.className = 'session-list h-full overflow-auto';
    
    this.sessions.forEach(session => {
      container.appendChild(this.createSessionCard(session));
    });
    
    this.replaceChildren(container);
  }

  createSessionCard(session) {
    const card = document.createElement('div');
    card.className = 'p-4 border rounded hover:bg-gray-50';
    
    const title = document.createElement('h3');
    title.textContent = session.summary; // Safe: auto-escapes
    card.appendChild(title);
    
    return card;
  }
}

customElements.define('session-list', SessionList);
```

**State Management**: Custom EventEmitter, localStorage, IndexedDB
**Virtual Scrolling**: vanilla-virtual-list (~5KB) or Intersection Observer API

---

## Decision 2: Bundle Size Optimization

### Decision
**Target: 200-300KB minified / 80-120KB gzipped**

### Component Analysis

| Component | Minified | Gzipped | Notes |
|-----------|----------|---------|-------|
| Basecoat UI (selective) | 20-30KB | 8-12KB | Only used components |
| Tailwind CSS (purged) | 8-15KB | 2-5KB | Aggressive PurgeCSS |
| marked (markdown) | 37KB | 12KB | Lightweight parser |
| highlight.js (selective) | 30KB | 10KB | Core + 8 languages |
| Application code | 80-120KB | 30-50KB | Session logic, UI, utils |
| **Total** | **175-232KB** | **62-89KB** | ✅ Well under 500KB |

**Achievable Ranges**:
- Aggressive: 150-200KB minified / 50-80KB gzipped
- **Realistic: 200-300KB minified / 80-120KB gzipped** ✅ Recommended
- Comfortable: 300-400KB minified / 120-150KB gzipped

### Optimization Strategies

**1. Tailwind PurgeCSS** (Critical - saves 180KB)
```javascript
// tailwind.config.js
export default {
  content: ['./src/**/*.{html,js}', './electron/**/*.{html,js}']
}
```

**2. Highlight.js Selective Import** (saves 260KB)
```javascript
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
// Register only 8 common languages
hljs.registerLanguage('javascript', javascript);
```

**3. Code Splitting**
```javascript
// Lazy load export dialog
const loadExport = () => import('./components/export-dialog.js');
button.addEventListener('click', async () => {
  const { ExportDialog } = await loadExport();
  new ExportDialog().show();
});
```

### Bundle Analysis Tool

**rollup-plugin-visualizer** (for Vite/Rollup)
```javascript
// vite.config.js
import { visualizer } from 'rollup-plugin-visualizer';
export default {
  plugins: [visualizer({ gzipSize: true })]
}
```

---

## Decision 3: Memory Profiling & Budget

### Decision
**Target: 250-300MB for production** (200MB achievable but tight)

### Rationale

**Baseline Breakdown**:
- Electron base: 100-120MB (Chromium + Node.js)
- Application code: 20-40MB (lighter without React)
- Virtual scrolled list: 10-20MB (visible items only)
- IndexedDB cache: 20-30MB (in-memory index)
- Active session data: 30-50MB (current + recent)
- **Total: 180-260MB** ✓ Within 250-300MB target

**200MB Hard Limit** (if required):
- Aggressive lazy loading (1 session max in memory)
- IndexedDB-only caching (no in-memory layer)
- Minimal application state
- **Achievable but zero headroom**

### Monitoring Strategy

**Chrome DevTools Memory Panel**: Heap snapshots, leak detection
**process.memoryUsage()**: Continuous monitoring
```javascript
export const logMemory = () => {
  const usage = process.memoryUsage();
  console.log({
    rss: `${Math.round(usage.rss / 1024 / 1024)}MB`,
    heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)}MB`
  });
};
```

### Common Vanilla JS Memory Leaks

**1. Event Listeners Not Removed**
```javascript
class Component {
  connectedCallback() {
    this.handler = () => { /* */ };
    window.addEventListener('resize', this.handler);
  }
  disconnectedCallback() {
    window.removeEventListener('resize', this.handler);
  }
}
```

**2. IPC Listeners**: Always pair `on()` with `removeListener()`

**3. Detached DOM**: Clear references to removed DOM nodes

**Virtual Scrolling Library**: `virtual-list-element` (~3KB, web component)

---

## Decision 4: CPU Monitoring & Performance

### Decision
**Targets: <2% idle, 15-25% active**

### Architecture

1. **Piscina Worker Thread Pool** (main process) for JSONL parsing
2. **requestAnimationFrame** for UI throttling (60fps max)
3. **requestIdleCallback** for non-critical work
4. **process.getCPUUsage()** for monitoring

**Why Worker Threads**: Offload CPU-intensive JSON.parse, batch 100-1000 lines

**Why Vanilla JS Helps**: No virtual DOM reconciliation overhead

### Monitoring

```javascript
setInterval(() => {
  const cpu = process.getCPUUsage();
  console.log(`CPU: ${cpu.percentCPUUsage.toFixed(2)}%`);
}, 1000);
```

**Tools**: Chrome DevTools Performance tab, Electron contentTracing API

**Optimization Checklist**:
- Batch JSONL parsing (100-1000 lines per worker)
- Throttle UI to 60fps via rAF
- Use rIC for analytics/logging
- Virtual scroll (render visible only)

---

## Decision 5: Technology Stack Summary

| Layer | Technology | Bundle | Rationale |
|-------|-----------|--------|-----------|
| **Desktop** | Electron 28+ | N/A | Cross-platform, file access |
| **UI** | Basecoat UI | ~8-12KB gz | Accessible, minimal |
| **Styling** | Tailwind CSS 4.0 | ~2-5KB gz | Purging, rapid iteration |
| **JavaScript** | Vanilla ES6+ | 0KB | No framework overhead |
| **Markdown** | marked 7.x | ~12KB gz | Lightweight, CommonMark |
| **Syntax** | highlight.js | ~10KB gz | Selective import |
| **Build** | Vite 5.x | Dev only | Fast, Rollup-based |
| **Testing** | Vitest + Playwright | Dev only | Unit + E2E |
| **Types** | JSDoc + TS (types only) | 0KB | Type safety, no runtime |

---

## Decision 6: Type Safety Without Runtime Cost

**JSDoc for Type Checking**:
```javascript
/**
 * @typedef {Object} Session
 * @property {string} uuid
 * @property {string} summary
 * @property {Message[]} messages
 */

/**
 * @param {string} filePath
 * @returns {Promise<Session>}
 */
export async function parseSession(filePath) { }
```

**tsconfig.json** (check-only, no emit):
```json
{
  "compilerOptions": {
    "allowJs": true,
    "checkJs": true,
    "noEmit": true,
    "target": "ES2022"
  }
}
```

---

## Performance Baseline Targets

| Metric | Target | Tool |
|--------|--------|------|
| **Bundle** | 200-300KB / 80-120KB gz | visualizer |
| **Memory (Idle)** | <150MB | process.memoryUsage() |
| **Memory (Active)** | 200-250MB | Chrome DevTools |
| **Memory (Peak)** | <300MB | Heap snapshots |
| **CPU (Idle)** | <2% | process.getCPUUsage() |
| **CPU (Parsing)** | 15-25% | Performance profiler |
| **CPU (Peak)** | <40% | Chrome DevTools |
| **Load Time** | <2s | User-facing timer |
| **Session Open** | <1s | Click to view |
| **Search** | <50ms | performance.now() |

---

## References

### Research Sources
1. Electron Performance: https://www.electronjs.org/docs/latest/tutorial/performance
2. Basecoat UI: https://basecoat.io
3. Tailwind Production: https://v4.tailwindcss.com/docs/optimizing-for-production
4. Highlight.js: https://highlightjs.org/download
5. Bundle Analysis: rollup-plugin-visualizer
6. Memory Profiling: Chrome DevTools documentation
7. CPU Monitoring: Electron process.getCPUUsage() API

### Key Findings
- Bundle: React (144KB) exceeds target; Basecoat + vanilla JS achieves 50-80KB baseline
- Memory: 200MB achievable with virtual scrolling, 250-300MB recommended
- CPU: <2% idle realistic, 15-25% active with worker threads
- UI: Basecoat UI + vanilla JS preferred for bundle size and performance

---

**Phase 0 Status**: ✅ COMPLETE
**Next**: Phase 1 - Design & Contracts (data model, API contracts, quickstart)
