# Session State: Claude Trace UI Project

**Last Updated**: 2025-11-29
**Branch**: `001-session-browser`
**Current Phase**: Planning Complete, Ready for Implementation

---

## Project Overview

**Goal**: Build a local desktop application for viewing and browsing Claude Code session files from `~/.claude/projects`

**Key Decision**: Using **Basecoat UI + Tailwind CSS + Vanilla JavaScript** (NOT React) for superior performance and bundle size.

---

## Completed Work

### ✅ Phase 0: Specification (speckit.specify)

**Branch Created**: `001-session-browser`

**Files Created**:
1. `specs/001-session-browser/spec.md` - Feature specification
   - 5 prioritized user stories (P1-P3)
   - 20 functional requirements
   - 10 success criteria
   - Key entities defined

2. `specs/001-session-browser/checklists/requirements.md` - Quality checklist
   - All items passed ✅
   - No clarifications needed

3. `.specify/memory/constitution.md` - Project principles
   - 5 core principles (Real-Time Performance, Data Integrity, Developer-Centric, File Format Agnostic, Progressive Enhancement)
   - Technical constraints and performance standards
   - Governance rules

### ✅ Phase 1: Planning (speckit.plan)

**Files Created**:

1. **`specs/001-session-browser/plan.md`** - Implementation plan
   - Technical context with revised targets
   - Constitutional gates (all passing)
   - Project structure (Electron + Basecoat UI architecture)
   - Complexity tracking

2. **`specs/001-session-browser/research.md`** - Research findings
   - **UI Framework**: Basecoat UI + Vanilla JS chosen (50-80KB baseline vs React 144KB)
   - **Bundle**: 200-300KB target (achievable)
   - **Memory**: 250-300MB target (realistic)
   - **CPU**: <2% idle, 15-25% active (with worker threads)
   - All unknowns resolved with evidence

3. **`specs/001-session-browser/data-model.md`** - Entity definitions
   - Session, Message, ToolCall, Event, ProjectDirectory entities
   - IndexedDB schema
   - Data flow diagrams
   - TypeScript type definitions

4. **`specs/001-session-browser/contracts/`** - API contracts
   - `ipc-protocol.json` - Electron main ↔ renderer communication
   - `export-format.json` - HTML export specification
   - `jsonl-events.json` - Claude Code JSONL event schemas

5. **`specs/001-session-browser/quickstart.md`** - Developer guide
   - Setup instructions
   - Development workflow
   - Architecture overview
   - Common tasks

---

## Technology Stack (Finalized)

| Layer | Technology | Why |
|-------|-----------|-----|
| Desktop Runtime | Electron 28+ | Cross-platform, file system access |
| UI Framework | **Basecoat UI + Vanilla JS** | 50-80KB baseline, no framework overhead |
| Styling | Tailwind CSS 4.0 | Built-in purging → 2-5KB gzipped |
| JavaScript | Vanilla ES6+ | Zero runtime overhead |
| Type Safety | JSDoc + TS types-only | No compilation, 0KB runtime |
| Markdown | marked 7.x | ~12KB gzipped |
| Syntax Highlighting | highlight.js | ~10KB gzipped (selective imports) |
| Parsing | Piscina worker threads | Offload CPU-intensive JSONL parsing |
| Build | Vite 5.x | Fast dev, optimized builds |
| Testing | Vitest + Playwright | Unit + E2E |

**Total Bundle**: 200-300KB minified / 80-120KB gzipped ✅

---

## Performance Targets (Evidence-Based)

| Metric | Target | Status |
|--------|--------|---------|
| **Bundle Size** | 200-300KB minified | ✅ Basecoat UI achieves this |
| **Memory (Idle)** | <150MB | ✅ Minimal overhead |
| **Memory (Active)** | 250-300MB | ✅ With virtual scrolling |
| **CPU (Idle)** | <2% | ✅ No background work |
| **CPU (Parsing)** | 15-25% | ✅ Worker threads |
| **Load Time** | <2s (1000 sessions) | ✅ IndexedDB cache |
| **Session Open** | <1s | ✅ Lazy loading |
| **Search** | <50ms | ✅ In-memory index |

---

## Key Architectural Decisions

### 1. Why Basecoat UI + Vanilla JS (Not React)?

**Problem**: React baseline is 144KB minified, violates <500KB bundle target

**Solution**: Basecoat UI + Vanilla JavaScript
- Baseline: 50-80KB (vs React 144KB)
- No virtual DOM overhead
- Direct DOM manipulation (faster)
- Lower memory footprint
- Meets all constitutional requirements

**Evidence**: See `specs/001-session-browser/research.md` Decision 1

### 2. Worker Thread Architecture

**Pattern**:
```
Main Process (Electron)
  ↓
Piscina Worker Pool (4-8 workers)
  ↓
Parse JSONL in batches (1000 lines)
  ↓
Send results to Renderer via IPC
```

**Why**: Offload CPU-intensive JSON.parse, prevent blocking main thread

### 3. Virtual Scrolling

**Library**: `virtual-list-element` (~3KB web component) or vanilla Intersection Observer

**Why**: Render only visible items (~20-30 DOM nodes) for 1000+ sessions

### 4. IndexedDB Caching

**Strategy**:
- On launch: Load lightweight SessionSummary objects
- On demand: Load full Session when detail view opened
- Incremental: Update when new sessions detected

**Why**: <2s load time for 1000 sessions

---

## Project Structure

```
claude-trace-ui/
├── electron/              # Main process (Node.js)
│   ├── main.ts           # Entry, window management
│   ├── preload.ts        # IPC bridge
│   ├── services/
│   │   ├── session-scanner.ts
│   │   ├── jsonl-parser.ts
│   │   └── index-manager.ts
│   └── workers/
│       └── parse-worker.ts  # Piscina worker
│
├── src/                  # Renderer (Vanilla JS + Basecoat UI)
│   ├── main.js           # Entry
│   ├── app.js            # Init
│   ├── components/       # Custom elements
│   │   ├── SessionList/
│   │   ├── SessionDetail/
│   │   ├── MessageView/
│   │   ├── ToolCallView/
│   │   ├── SearchBar/
│   │   └── ExportDialog/
│   ├── lib/
│   │   ├── EventEmitter.js
│   │   ├── VirtualList.js
│   │   └── SessionStore.js
│   ├── services/
│   │   ├── ipc-client.js
│   │   ├── markdown-renderer.js
│   │   ├── syntax-highlighter.js
│   │   └── html-exporter.js
│   ├── types/            # TypeScript definitions
│   └── utils/
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── specs/001-session-browser/  # Current feature
│   ├── spec.md
│   ├── plan.md
│   ├── research.md
│   ├── data-model.md
│   ├── quickstart.md
│   ├── contracts/
│   └── checklists/
│
└── .specify/
    ├── memory/
    │   ├── constitution.md
    │   └── session-state.md  # This file
    └── templates/
```

---

## Next Steps (In Order)

### Immediate: Generate Implementation Tasks

```bash
/speckit.tasks
```

This will:
1. Read `specs/001-session-browser/plan.md`
2. Read `specs/001-session-browser/data-model.md`
3. Generate `specs/001-session-browser/tasks.md` with:
   - Dependency-ordered implementation tasks
   - Mapped to user stories (P1 → P2 → P3)
   - Estimated effort
   - Acceptance criteria per task

### Then: Begin Implementation (P1 First)

**Priority 1 (MVP - View Sessions)**:
1. Set up Electron + Vite project structure
2. Implement session scanner (main process)
3. Implement JSONL parser with Piscina workers
4. Create SessionList component (Basecoat UI + virtual scrolling)
5. Create SessionDetail component (markdown + syntax highlighting)
6. Build IPC communication layer
7. Implement IndexedDB caching
8. Basic styling with Tailwind CSS

**Priority 2 (Search & Navigation)**:
9. Add search/filter UI (Basecoat dropdown)
10. Implement in-memory SearchIndex
11. Add keyboard navigation
12. Implement preferences persistence

**Priority 3 (Export & Metrics)**:
13. Build HTML exporter
14. Add batch export
15. Display session metadata/stats

---

## Important Reminders for Next Session

### 🚫 Don't Do This:
1. **Don't use React/Vue/Angular** - We chose Basecoat UI + Vanilla JS for performance
2. **Don't use innerHTML with untrusted data** - Security issue (use textContent or createElement)
3. **Don't compile TypeScript to runtime** - Use JSDoc for type checking only (noEmit: true)
4. **Don't parse JSONL in main thread** - Use Piscina worker threads
5. **Don't render all sessions at once** - Use virtual scrolling

### ✅ Do This:
1. **Use Basecoat UI components** for accessible dialogs, dropdowns, forms
2. **Use custom elements** (web components) for UI modularity
3. **Batch JSONL parsing** (1000 lines per worker task)
4. **Throttle UI updates** with requestAnimationFrame (60fps max)
5. **Monitor performance** with process.memoryUsage() and process.getCPUUsage()

---

## Quick Reference

### Key Files to Review
- `specs/001-session-browser/spec.md` - Feature requirements
- `specs/001-session-browser/plan.md` - Implementation blueprint
- `specs/001-session-browser/research.md` - Technology decisions
- `.specify/memory/constitution.md` - Project principles

### Commands to Run
```bash
# Generate tasks
/speckit.tasks

# Start development (after tasks generated)
npm run dev

# Analyze bundle
npm run analyze

# Monitor memory
npm run dev:memory
```

### Git Status
```bash
# Current branch
git branch  # 001-session-browser

# Files staged/modified
git status

# Commit message format (when ready)
git commit -m "feat(session-browser): implement P1 viewing features

- Add session scanner with IndexedDB caching
- Build SessionList with virtual scrolling
- Implement JSONL parser with worker threads
- Create SessionDetail with markdown rendering

🤖 Generated with Claude Code
via Happy

Co-Authored-By: Claude <noreply@anthropic.com>
Co-Authored-By: Happy <yesreply@happy.engineering>"
```

---

## Constitutional Principles (Quick Ref)

1. **Real-Time Performance**: UI <100ms, virtual scrolling >100 items, no blocking operations
2. **Data Integrity**: Read-only, graceful error handling, preserve metadata
3. **Developer-Centric**: Keyboard nav, search <50ms, persistent state
4. **File Format Agnostic**: Support multiple formats, extensible parsers
5. **Progressive Enhancement**: Core first (P1), then advanced (P2/P3), YAGNI

**Priority Order**: Data Integrity > Real-Time Performance > Developer-Centric > Progressive Enhancement > File Format Agnostic

---

## Session Continuation Checklist

When starting next session, say:

> "Continue implementing Claude Trace UI. Last session completed speckit.plan.
> Review `.specify/memory/session-state.md` for context.
> Next step: Run `/speckit.tasks` to generate implementation tasks."

Then:
1. ✅ Read session-state.md (this file)
2. ✅ Review plan.md for architecture
3. ✅ Run `/speckit.tasks`
4. ✅ Start implementing P1 tasks
5. ✅ Use quickstart.md for setup guidance

---

**Status**: 🟢 Ready for task generation and implementation
**Phase**: Planning Complete → Task Generation Next
**Branch**: `001-session-browser`
**Last Updated**: 2025-11-29
