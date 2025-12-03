# CLAUDE.md - Project Instructions for Claude Code

## Project Overview

**Claude Trace UI** is an Electron desktop application for viewing and browsing Claude Code session files from `~/.claude/projects`.

**Status**: Phase 3 Complete (US1 MVP) - App fully functional
**Branch**: `001-session-browser`
**Bundle Size**: ~180KB (target: 200-300KB)

## Quick Start (New Machine Installation)

### Prerequisites

- Node.js >= 20.0.0
- npm >= 10.0.0
- macOS, Windows, or Linux

### Installation Steps

```bash
# 1. Clone the repository
git clone https://github.com/TakTik-Ou/claude-trace-ui.git
cd claude-trace-ui

# 2. Checkout the feature branch
git checkout 001-session-browser

# 3. Install dependencies
npm install

# 4. Start development
npm run dev:electron
```

### CRITICAL: Running from Claude Code

When running Electron from within Claude Code, **you MUST unset the `ELECTRON_RUN_AS_NODE` environment variable**:

```bash
env -u ELECTRON_RUN_AS_NODE npm run dev:electron
```

**Why?** Claude Code sets `ELECTRON_RUN_AS_NODE=1` which makes Electron run as plain Node.js, disabling the `electron` module APIs (`app`, `BrowserWindow`, etc.).

## Project Architecture

```
claude-trace-ui/
├── electron/              # Main process (Node.js)
│   ├── main.ts           # Entry, window management, IPC handlers
│   ├── preload.ts        # IPC bridge (contextBridge)
│   └── services/
│       ├── session-scanner.ts  # Scan ~/.claude/projects
│       ├── jsonl-parser.ts     # Parse JSONL session files
│       └── index-manager.ts    # In-memory session cache
│
├── src/                   # Renderer process (Vanilla JS)
│   ├── main.js           # Entry point
│   ├── app.js            # App initialization
│   ├── components/       # UI components
│   │   ├── SessionList.js     # Session browser with grouping
│   │   ├── SessionDetail.js   # Conversation view
│   │   ├── MessageView.js     # Message rendering
│   │   └── ToolCallView.js    # Tool call display
│   ├── services/
│   │   ├── ipc-client.js      # IPC communication
│   │   ├── markdown-renderer.js
│   │   └── syntax-highlighter.js
│   └── types/            # TypeScript definitions (JSDoc)
│
├── specs/001-session-browser/  # Feature specifications
│   ├── spec.md           # Requirements
│   ├── plan.md           # Implementation plan
│   ├── tasks.md          # Task breakdown
│   └── quickstart.md     # Developer guide
│
└── .specify/memory/
    └── session-state.md  # Session continuity notes
```

## Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Runtime | Electron 28+ | Cross-platform desktop |
| UI | Vanilla JS + Tailwind CSS | No framework overhead |
| Build | Vite 5.x + esbuild | Fast builds |
| Markdown | marked 11.x | ~12KB |
| Syntax | highlight.js 11.x | ~10KB |
| Types | JSDoc + TypeScript | No runtime cost |

## Commands Reference

```bash
# Development
npm run dev:electron      # Start Electron with hot reload
npm run dev              # Vite dev server only

# Building
npm run build            # Build for production
npm run build:electron   # Package with electron-builder

# Quality
npm run typecheck        # TypeScript type checking
npm run lint             # ESLint
npm run format           # Prettier
```

## Key Technical Decisions

### 1. Vanilla JS over React

**Why**: React baseline is 144KB, violates <500KB bundle target. Vanilla JS with Basecoat UI patterns achieves 50-80KB baseline.

### 2. esbuild for Main Process

**Why**: Using `tsc` can cause issues with `require('electron')` resolving to `node_modules/electron` which returns a path string, not the API.

```bash
# Correct (in package.json)
esbuild electron/main.ts --external:electron --external:piscina
```

### 3. JSONL Event Structure

Claude Code JSONL events have this structure:

```javascript
{
  type: "user" | "assistant" | "tool_use" | "tool_result",
  timestamp: "2025-11-29T12:39:23.473Z",  // ISO string, NOT numeric
  data: {
    uuid: "...",
    message: {
      content: "..." | [{type: "text", text: "..."}]
    }
  }
}
```

**Important**:
- Timestamps are ISO 8601 strings, not milliseconds
- Content path is `event.data.message.content`, not `event.data.content`

## Common Issues & Solutions

### Electron Won't Start

**Error**: `Cannot read properties of undefined (reading 'isPackaged')`

**Solution**: Unset `ELECTRON_RUN_AS_NODE`:
```bash
env -u ELECTRON_RUN_AS_NODE npm run dev:electron
```

### Port 5173 Already in Use

```bash
lsof -ti:5173 | xargs kill -9
```

### PostCSS/Tailwind Errors

Ensure `postcss.config.js` uses CommonJS:
```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}
  }
};
```

## Development Guidelines

### DO:
- Use Vanilla JS with web component patterns
- Use JSDoc for type annotations (no runtime TS)
- Parse JSONL in batches (performance)
- Use virtual scrolling for large lists
- Keep bundle under 300KB

### DON'T:
- Don't use React/Vue/Angular
- Don't compile TypeScript to runtime (use `noEmit: true`)
- Don't use `innerHTML` with untrusted data
- Don't parse JSONL in main thread (use workers)
- Don't render all sessions at once

## Session Continuity

For detailed project state and lessons learned, see:
- `.specify/memory/session-state.md` - Current status and history
- `specs/001-session-browser/quickstart.md` - Developer guide
- `specs/001-session-browser/tasks.md` - Implementation tasks

## Next Steps (Phase 4+)

1. Search & filtering (US2)
2. Keyboard navigation (US3)
3. Session export to HTML (US4)
4. Preferences persistence (US5)

## Repository

https://github.com/TakTik-Ou/claude-trace-ui
