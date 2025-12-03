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
- **Resizable Panels**: Drag to resize the metadata sidebar
- **Token Usage**: View token counts, cache usage, and cost estimates per session

## Installation on macOS

### Prerequisites

- **Node.js 20+**: Required for building and running
- **npm**: Comes with Node.js
- **Claude Code sessions**: The app reads from `~/.claude/projects/`

### Install Node.js (if not installed)

```bash
# Using Homebrew (recommended)
brew install node

# Or download from https://nodejs.org/
```

### Clone and Install

```bash
# Clone the repository
git clone <repository-url> claude-trace-ui
cd claude-trace-ui

# Install dependencies
npm install
```

### Run in Development Mode

```bash
# Standard development mode
npm run dev:electron

# If running from within Claude Code terminal (which sets ELECTRON_RUN_AS_NODE=1)
env -u ELECTRON_RUN_AS_NODE npm run dev:electron
```

### Build for Production

```bash
# Build all components
npm run build

# Build distributable (creates .app in dist/)
npm run build:electron
```

### Build Distributable Package

```bash
# Build macOS .app and .dmg
npm run build:electron

# Output will be in dist/ folder:
# - Claude Trace UI.app (macOS application)
# - Claude Trace UI-x.x.x.dmg (installer)
```

## Installing on Another Mac

### Option 1: From Source (Recommended)

```bash
# 1. Install Node.js 20+
brew install node

# 2. Clone the repository
git clone <repository-url> claude-trace-ui
cd claude-trace-ui

# 3. Install dependencies
npm install

# 4. Build the app
npm run build:electron

# 5. Copy the app to Applications
cp -r "dist/mac-arm64/Claude Trace UI.app" /Applications/
# Note: Use "dist/mac/" for Intel Macs
```

### Option 2: From Pre-built DMG

If a DMG is available:

1. Download the `.dmg` file
2. Double-click to mount
3. Drag "Claude Trace UI" to Applications
4. Open from Applications (right-click > Open on first launch to bypass Gatekeeper)

### Option 3: Direct App Copy

If you have the built `.app` bundle:

```bash
# Copy from source Mac to target Mac
# Via AirDrop, USB drive, or network share

# Then move to Applications
mv "Claude Trace UI.app" /Applications/

# Or run from anywhere
open "Claude Trace UI.app"
```

## Troubleshooting

### "App is damaged" or Gatekeeper Warning

Since the app isn't signed with an Apple Developer certificate:

```bash
# Remove quarantine attribute
xattr -cr "/Applications/Claude Trace UI.app"

# Then open normally
open "/Applications/Claude Trace UI.app"
```

### No Sessions Found

The app looks for Claude Code sessions in `~/.claude/projects/`. Ensure:

1. Claude Code has been used at least once
2. Session files exist in `~/.claude/projects/<project-path>/`
3. Session files are `.jsonl` format

### Electron Won't Start from Claude Code Terminal

Claude Code sets `ELECTRON_RUN_AS_NODE=1` which interferes with Electron. Use:

```bash
env -u ELECTRON_RUN_AS_NODE npm run dev:electron
```

### Build Fails on Apple Silicon

Ensure you're using the correct Node.js architecture:

```bash
# Check Node architecture
node -p "process.arch"  # Should be "arm64" on M1/M2/M3

# If using Rosetta Node, reinstall native version
brew uninstall node
brew install node
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
├── dist/                  # Built output
└── specs/                 # Feature specifications
```

## Development

```bash
# Type checking
npm run typecheck

# Linting
npm run lint

# Format code
npm run format

# Run tests
npm test
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop Runtime | Electron 28+ |
| UI | Vanilla JavaScript + Tailwind CSS |
| Markdown | marked 11.x |
| Syntax Highlighting | highlight.js 11.x |
| Build | Vite 5.x + esbuild |

## Status

**Version**: 0.1.0
**Platform**: macOS (arm64, x64)

### Completed Features

| Feature | Status |
|---------|--------|
| Session browsing | ✅ |
| Search & filtering | ✅ |
| HTML export | ✅ |
| In-session navigation | ✅ |
| Token usage & metadata | ✅ |
| Resizable panels | ✅ |

### Planned

- [ ] macOS code signing
- [ ] Cross-platform builds (Windows, Linux)
- [ ] Session comparison view
- [ ] Dark/light theme toggle

## License

MIT
