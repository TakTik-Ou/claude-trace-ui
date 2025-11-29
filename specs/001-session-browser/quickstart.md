# Quickstart Guide: Claude Code Session Browser

**Feature**: 001-session-browser
**Last Updated**: 2025-11-29
**Target Audience**: Developers setting up the project

---

## Prerequisites

- **Node.js**: 20+ (LTS recommended)
- **npm**: 9+ or **pnpm**: 8+ (pnpm recommended for faster installs)
- **OS**: macOS, Windows, or Linux
- **Git**: For version control
- **VS Code**: Recommended editor (optional)

---

## Initial Setup

### 1. Clone Repository

```bash
git clone <repository-url> claude-trace-ui
cd claude-trace-ui
```

### 2. Install Dependencies

```bash
# Using npm
npm install

# Or using pnpm (recommended)
pnpm install
```

**Installed Dependencies**:
- electron (28+)
- vite (5+)
- @basecoat/dialog, @basecoat/dropdown
- tailwindcss (4+)
- marked (markdown parser)
- highlight.js (syntax highlighting)
- piscina (worker thread pool)

**Dev Dependencies**:
- vitest, playwright (testing)
- eslint, prettier (code quality)
- typescript (type checking, no compilation)
- rollup-plugin-visualizer (bundle analysis)

### 3. Configure Environment

```bash
# Copy example env file
cp .env.example .env

# Edit .env for local settings
```

**Environment Variables**:
```bash
# Development mode
NODE_ENV=development

# Session directory (default: ~/.claude/projects)
SESSION_DIR=~/.claude/projects

# Enable performance monitoring
ENABLE_CPU_MONITORING=true
ENABLE_MEMORY_MONITORING=true

# Log level
LOG_LEVEL=info
```

---

## Development Workflow

### Start Development Server

```bash
npm run dev
```

This starts:
1. Vite dev server for renderer process (hot reload)
2. Electron main process with auto-restart
3. Opens DevTools automatically

**Available at**: Electron window opens automatically

### Project Structure

```
claude-trace-ui/
├── electron/              # Main process
│   ├── main.ts           # Entry point
│   ├── preload.ts        # IPC bridge
│   ├── services/         # Business logic
│   └── workers/          # Parsing workers
├── src/                  # Renderer process
│   ├── main.js           # React entry
│   ├── components/       # UI components
│   ├── services/         # IPC client
│   └── types/            # TypeScript definitions
├── tests/                # Test files
├── specs/                # Feature specs
└── .specify/             # Speckit templates
```

### Key Commands

```bash
# Development
npm run dev              # Start dev server
npm run dev:memory       # With memory monitoring

# Build
npm run build            # Build renderer + main
npm run build:renderer   # Build renderer only
npm run build:main       # Build main only

# Testing
npm run test             # Run all tests
npm run test:unit        # Unit tests only
npm run test:e2e         # E2E tests with Playwright

# Code Quality
npm run lint             # ESLint
npm run format           # Prettier
npm run type-check       # TypeScript checking

# Bundle Analysis
npm run analyze          # Generate bundle report

# Packaging
npm run package          # Create distributable
npm run package:mac      # macOS only
npm run package:win      # Windows only
npm run package:linux    # Linux only
```

---

## Architecture Overview

### Main Process (Node.js)

**Responsibilities**:
- File system access (scan ~/.claude/projects)
- JSONL parsing (via Piscina worker pool)
- IndexedDB management
- IPC server

**Key Files**:
- `electron/main.ts`: App lifecycle, window management
- `electron/services/session-scanner.ts`: Directory scanning
- `electron/services/jsonl-parser.ts`: JSONL parsing logic
- `electron/workers/parse-worker.ts`: Worker thread for parsing

### Renderer Process (Browser)

**Responsibilities**:
- UI rendering (Basecoat UI + Tailwind CSS)
- User interactions
- IPC client
- Virtual scrolling

**Key Files**:
- `src/main.js`: Entry point
- `src/components/SessionList/`: List view with virtual scrolling
- `src/components/SessionDetail/`: Detail view
- `src/services/ipc-client.ts`: Main process communication

### IPC Communication

**Main → Renderer**:
- Session data
- Scan results
- Parse progress

**Renderer → Main**:
- Load session request
- Export request
- Preferences get/set

---

## Development Best Practices

### 1. Code Style

**JavaScript/TypeScript**:
```javascript
// Use JSDoc for type safety
/**
 * @param {string} uuid
 * @returns {Promise<Session>}
 */
export async function loadSession(uuid) {
  // Implementation
}

// Prefer const over let
const sessions = await loadSessions();

// Use async/await over promises
const data = await fetchData();
```

**HTML/CSS** (Basecoat UI):
```javascript
// Secure DOM manipulation (no innerHTML with untrusted data)
const card = document.createElement('div');
card.className = 'p-4 border rounded';
card.textContent = session.summary; // Safe: auto-escapes

// Use Tailwind utility classes
// Avoid custom CSS unless necessary
```

### 2. Performance

**Bundle Size**:
- Run `npm run analyze` weekly
- Keep renderer bundle <300KB
- Use code splitting for large features

**Memory**:
- Monitor with `npm run dev:memory`
- Clean up event listeners in `disconnectedCallback()`
- Use virtual scrolling for lists >100 items

**CPU**:
- Batch JSONL parsing (1000 lines per worker task)
- Throttle UI updates with `requestAnimationFrame`
- Use `requestIdleCallback` for non-critical work

### 3. Testing

**Unit Tests** (Vitest):
```javascript
// tests/unit/parsers/jsonl-parser.test.js
import { describe, it, expect } from 'vitest';
import { parseJSONL } from '../../../electron/services/jsonl-parser';

describe('JSONL Parser', () => {
  it('should parse valid JSONL file', async () => {
    const result = await parseJSONL('/path/to/test.jsonl');
    expect(result.events).toHaveLength(10);
  });
});
```

**E2E Tests** (Playwright):
```javascript
// tests/e2e/session-browser.spec.js
import { test, expect } from '@playwright/test';

test('should load session list', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.session-list')).toBeVisible();
});
```

### 4. Debugging

**Renderer Process**:
- DevTools open automatically in dev mode
- Use breakpoints, console.log, React DevTools

**Main Process**:
```bash
# Start with inspector
npm run dev -- --inspect

# Attach VSCode debugger to localhost:9229
```

**Worker Threads**:
```javascript
// Add logging in parse-worker.ts
console.log('Parsing batch:', batchSize);
```

---

## Common Tasks

### Add New UI Component

1. Create component file in `src/components/`
2. Use Basecoat UI base components
3. Apply Tailwind classes for styling
4. Define as custom element (web component)

```javascript
// src/components/MyComponent/index.js
class MyComponent extends HTMLElement {
  connectedCallback() {
    this.render();
  }

  render() {
    const container = document.createElement('div');
    container.className = 'p-4 bg-white rounded shadow';
    // ... build DOM
    this.replaceChildren(container);
  }
}

customElements.define('my-component', MyComponent);
```

### Add New IPC Channel

1. Define contract in `specs/001-session-browser/contracts/ipc-protocol.json`
2. Implement handler in main process
3. Add client method in `src/services/ipc-client.ts`

```javascript
// electron/main.ts
ipcMain.handle('my-channel', async (event, args) => {
  // Implementation
  return result;
});

// src/services/ipc-client.ts
export async function myAction(args) {
  return window.electron.invoke('my-channel', args);
}
```

### Parse New Event Type

1. Add schema to `contracts/jsonl-events.json`
2. Update parser in `electron/services/jsonl-parser.ts`
3. Handle in UI rendering

---

## Troubleshooting

### Issue: App won't start

**Solution**:
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check Node.js version
node --version  # Should be 20+
```

### Issue: Bundle too large

**Solution**:
```bash
# Analyze bundle
npm run analyze

# Check for large dependencies
npm list --depth=0

# Ensure Tailwind PurgeCSS is working
# Check tailwind.config.js content paths
```

### Issue: Memory leak

**Solution**:
1. Take heap snapshots (Chrome DevTools → Memory)
2. Check for detached DOM nodes
3. Verify event listeners are removed
4. Use `disconnectedCallback()` for cleanup

### Issue: Session won't load

**Solution**:
1. Check JSONL file exists: `ls ~/.claude/projects/*/*/journal.jsonl`
2. Verify file format (each line valid JSON)
3. Check console for parsing errors
4. Try force rescan: Settings → Rescan Sessions

---

## Resources

### Documentation
- [Electron Docs](https://www.electronjs.org/docs)
- [Basecoat UI](https://basecoat.io)
- [Tailwind CSS](https://tailwindcss.com)
- [Vite](https://vitejs.dev)

### Project Docs
- [Constitution](./.specify/memory/constitution.md)
- [Data Model](./data-model.md)
- [API Contracts](./contracts/)
- [Feature Spec](./spec.md)

### Getting Help
- Check existing issues on GitHub
- Review test files for usage examples
- Consult research.md for architecture decisions

---

## Next Steps

After setup:
1. Read [spec.md](./spec.md) for feature requirements
2. Review [data-model.md](./data-model.md) for entity structure
3. Check [constitution.md](../.specify/memory/constitution.md) for principles
4. Start with P1 tasks (viewing sessions)

**Ready to start implementing!** 🚀
