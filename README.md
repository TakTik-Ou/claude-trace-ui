# Claude Trace UI

A desktop application for viewing and browsing Claude Code session files from `~/.claude/projects`.

![Claude Trace UI Screenshot](docs/images/screenshot.png)

## Features

- **Session Browser**: View all Claude Code sessions grouped by project
- **Session Detail**: Read full conversation history with markdown rendering
- **Code Highlighting**: Syntax highlighting for code blocks
- **Search & Filter**: Keyword search, project filter, date range, and sort options
- **In-Session Navigation**: Find in session (⌘F), outline sidebar, message type filters
- **HTML Export**: Export sessions as standalone HTML files with embedded styles
- **Project Grouping**: Collapsible project groups with session counts

## Status

**Current Phase**: Phase 6 Complete (Export)
**Bundle Size**: ~205KB (target: 200-300KB)
**Sessions Tested**: 412 sessions loaded successfully

### Completed Features

| User Story | Status | Description |
|------------|--------|-------------|
| US1 - View Sessions | ✅ Complete | Browse and view session conversations |
| US2 - Search & Filter | ✅ Complete | Keyword search, project/date filters, sorting |
| US3 - Export | ✅ Complete | Export to standalone HTML files |
| US4 - In-Session Navigation | ✅ Complete | ⌘F search, outline sidebar, message filters |
| US5 - Metadata | 🔲 Pending | Token usage, session statistics |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop Runtime | Electron 28+ |
| UI | Vanilla JavaScript + Tailwind CSS |
| Markdown | marked 11.x |
| Syntax Highlighting | highlight.js 11.x |
| Build | Vite 5.x + esbuild |

## Quick Start

```bash
# Install dependencies
npm install

# Start development
npm run dev:electron

# Build for production
npm run build
```

### Running from Claude Code

If running from within Claude Code (which sets `ELECTRON_RUN_AS_NODE=1`):

```bash
env -u ELECTRON_RUN_AS_NODE npm run dev:electron
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `⌘K` | Global search |
| `⌘F` | Find in session |
| `⌘G` | Next match |
| `⇧⌘G` | Previous match |
| `⌘R` | Refresh sessions |
| `Escape` | Close search/clear |

## Project Structure

```
claude-trace-ui/
├── electron/              # Main process (Node.js)
│   ├── main.ts           # Entry, window management, IPC handlers
│   ├── preload.ts        # Secure IPC bridge
│   └── services/         # Session scanning, JSONL parsing
├── src/                   # Renderer (Vanilla JS)
│   ├── components/       # UI components (SessionList, SessionDetail, etc.)
│   ├── services/         # IPC client, markdown renderer, HTML exporter
│   └── lib/              # EventEmitter, SessionStore, SearchIndex
├── specs/                 # Feature specifications
└── .specify/             # Project memory
```

## Development

```bash
# Type checking
npm run typecheck

# Linting
npm run lint

# Format code
npm run format
```

## Roadmap

### Completed

- [x] Phase 1-2: Project setup and foundational infrastructure
- [x] Phase 3 (US1): Session browsing MVP
- [x] Phase 4 (US4): In-session navigation
- [x] Phase 5 (US2): Search & filtering
- [x] Phase 6 (US3): HTML export

### Remaining

- [ ] Phase 7 (US5): Session metadata and token usage
- [ ] Phase 8: Polish (keyboard nav, preferences, error handling)
- [ ] Phase 9: macOS packaging (DMG distribution)
- [ ] Phase 10: Cross-platform packaging (Windows/Linux)

## License

MIT
