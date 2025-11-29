# Claude Trace UI Constitution

## Core Principles

### I. Real-Time Performance
Real-time rendering is paramount for developer experience:
- UI must update within 100ms of data changes
- Virtual scrolling required for large traces (>100 items)
- No blocking operations on main thread
- Progressive loading for large session files

### II. Data Integrity
Session data is sacred and immutable:
- UI is read-only - never modify source session files
- Handle malformed/incomplete session data gracefully
- Preserve all trace metadata and timing information
- Support both active sessions and archived snapshots

### III. Developer-Centric Design
Optimize for debugging workflow efficiency:
- Keyboard navigation for all primary actions
- Search/filter must be instant (<50ms)
- Collapse/expand state persists across refreshes
- Export/share capabilities for collaboration

### IV. File Format Agnostic
Support multiple trace sources:
- Claude Code session files (~/.claude/projects/*/*/journal.jsonl)
- claude-trace JSON format (streaming and complete)
- Extensible parser architecture for future formats
- Graceful degradation for unknown properties

### V. Progressive Enhancement
Start simple, add sophistication iteratively:
- Core viewer first (tree view, basic search)
- Then advanced features (diff view, timeline, metrics)
- No premature abstraction - YAGNI principles
- Each feature must justify complexity cost

## Technical Constraints

### Stack Requirements
- TypeScript for type safety across trace formats
- React 18+ for concurrent rendering
- Tailwind CSS for rapid UI iteration
- No heavyweight frameworks (keep bundle <500KB)

### Browser Support
- Modern browsers only (ES2022+)
- Chrome/Edge, Firefox, Safari latest 2 versions
- No IE11 or legacy support needed

### Performance Standards
- Initial load: <2s for 1000-item trace
- Search/filter: <50ms response time
- Memory: <200MB for typical sessions
- CPU: <10% idle, <30% during updates

## Development Workflow

### Testing Strategy
- Unit tests for parsers and data transformations
- Integration tests for file loading and rendering
- Visual regression tests for UI components
- Manual testing for UX flows

### Code Quality
- ESLint + Prettier enforced via pre-commit
- TypeScript strict mode enabled
- No `any` types except in parser boundary layer
- All exports documented with JSDoc

### Review Process
- Self-review before commit
- Automated checks must pass (lint, type, test)
- Performance profiling for data-heavy features
- Accessibility review for new UI components

## Governance

This constitution defines the non-negotiable principles for Claude Trace UI development. All implementation decisions must align with these principles. When principles conflict, prioritize in order: Data Integrity > Real-Time Performance > Developer-Centric Design > Progressive Enhancement > File Format Agnostic.

Amendments require:
1. Documented rationale for change
2. Impact analysis on existing features
3. Migration plan if breaking changes
4. Approval before implementation

**Version**: 1.0.0 | **Ratified**: 2025-11-29 | **Last Amended**: 2025-11-29
