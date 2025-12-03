# Tasks: Claude Code Session Browser

**Input**: Design documents from `/specs/001-session-browser/`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/ ✓

**Tests**: NOT included (not explicitly requested in specification). Add tests phase if needed.

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story mapping (US1, US2, US3, US4, US5)
- Include exact file paths in descriptions

## User Story Mapping

| Story | Title | Priority | Spec Reference |
|-------|-------|----------|----------------|
| US1 | View Session History | P1 | spec.md User Story 1 |
| US2 | Search and Filter Sessions | P2 | spec.md User Story 2 |
| US3 | Export Session Reports | P3 | spec.md User Story 3 |
| US4 | Navigate Within Sessions | P2 | spec.md User Story 4 |
| US5 | Monitor Session Metadata | P3 | spec.md User Story 5 |

---

## Phase 1: Setup (Project Initialization)

**Purpose**: Initialize Electron + Vite project with Basecoat UI stack

- [x] T001 Create project directory structure per plan.md (electron/, src/, tests/ folders)
- [x] T002 Initialize package.json with Electron 28+, Vite 5.x dependencies
- [x] T003 [P] Configure TypeScript for type-checking only (noEmit: true) in tsconfig.json
- [x] T004 [P] Configure Tailwind CSS 4.0 with PurgeCSS in tailwind.config.js
- [x] T005 [P] Configure Vite for Electron renderer build in vite.config.ts
- [x] T006 [P] Configure electron-builder packaging in electron-builder.json
- [x] T007 Create Electron main process entry point in electron/main.ts
- [x] T008 Create secure preload script with IPC bridge in electron/preload.ts
- [x] T009 Create renderer entry point in src/main.js
- [x] T010 Create app initialization module in src/app.js
- [x] T011 [P] Add ESLint + Prettier configuration in .eslintrc.js and .prettierrc
- [x] T012 Create base HTML template in src/index.html

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure required by ALL user stories

**⚠️ CRITICAL**: No user story can begin until this phase completes

### Type Definitions

- [x] T013 [P] Create Session type definitions in src/types/session.d.ts
- [x] T014 [P] Create Event type definitions in src/types/event.d.ts
- [x] T015 [P] Create IPC protocol types in src/types/ipc.d.ts
- [x] T016 Export all types from src/types/index.d.ts

### Core Libraries

- [x] T017 [P] Implement EventEmitter (pub/sub pattern) in src/lib/EventEmitter.js
- [x] T018 [P] Implement VirtualList (virtual scrolling) in src/lib/VirtualList.js
- [x] T019 Implement SessionStore (state container) in src/lib/SessionStore.js

### Main Process Services

- [x] T020 Implement session scanner service in electron/services/session-scanner.ts
- [x] T021 [P] Implement JSONL parser service in electron/services/jsonl-parser.ts
- [x] T022 Implement IndexedDB index manager in electron/services/index-manager.ts
- [x] T023 Create Piscina parse worker in electron/workers/parse-worker.ts

### Renderer Services

- [x] T024 [P] Implement IPC client wrapper in src/services/ipc-client.js
- [x] T025 [P] Implement markdown renderer (marked + DOMPurify) in src/services/markdown-renderer.js
- [x] T026 [P] Implement syntax highlighter (highlight.js selective import) in src/services/syntax-highlighter.js

### Utilities

- [x] T027 [P] Create secure DOM helpers (no innerHTML with untrusted data) in src/utils/dom-helpers.js
- [x] T028 [P] Create date formatter utilities in src/utils/date-formatter.js
- [x] T029 [P] Create error handler with graceful degradation in src/utils/error-handler.js

### Base Styles

- [x] T030 Create base Tailwind styles and component utilities in src/styles/base.css

**Checkpoint**: ✅ Foundation ready - user story implementation can begin

---

## Phase 3: User Story 1 - View Session History (Priority: P1) 🎯 MVP

**Goal**: Users can browse all past sessions and view full conversation details

**Independent Test**: Launch app → see session list → click session → view conversation with markdown/code

### IPC Channels (US1)

- [x] T031 [US1] Implement `session:scan` IPC channel handler in electron/main.ts
- [x] T032 [US1] Implement `session:load` IPC channel handler in electron/main.ts

### Components (US1)

- [x] T033 [US1] Create SessionList custom element (web component) in src/components/SessionList.js
- [x] T034 [P] [US1] Create SessionList styles (inline Tailwind)
- [x] T035 [US1] Integrate VirtualList into SessionList for 1000+ sessions performance
- [x] T036 [US1] Create SessionDetail custom element in src/components/SessionDetail.js
- [x] T037 [P] [US1] Create SessionDetail styles (inline Tailwind)
- [x] T038 [US1] Create MessageView component for user/assistant messages in src/components/MessageView.js
- [x] T039 [US1] Create ToolCallView component with expand/collapse in src/components/ToolCallView.js
- [x] T040 [P] [US1] Create ToolCallView styles (inline Tailwind)

### App Integration (US1)

- [x] T041 [US1] Wire SessionList to IPC `session:scan` in src/app.js
- [x] T042 [US1] Wire SessionDetail to IPC `session:load` in src/app.js
- [x] T043 [US1] Add loading states and error handling for session loading
- [x] T044 [US1] Implement session list → detail navigation flow

### Performance (US1)

- [x] T045 [US1] Implement lazy loading of session details (IndexedDB cache)
- [x] T046 [US1] Add progressive loading indicator during JSONL parsing
- [x] T047 [US1] Validate <2s session list load time (SC-001) - ✅ 412 sessions in ~1s
- [x] T048 [US1] Validate <1s session detail open time (SC-002) - ✅ confirmed

**Checkpoint**: ✅ MVP Complete - Users can view all sessions and conversation details

---

## Phase 4: User Story 4 - Navigate Within Sessions (Priority: P2)

**Goal**: Users can search within sessions and jump to specific parts

**Independent Test**: Open long session → use in-session search → navigate between matches

**Dependency**: Requires US1 (Session viewing)

### Components (US4)

- [x] T049 [US4] Create InSessionSearch component in src/components/InSessionSearch.js
- [x] T050 [P] [US4] Create InSessionSearch styles (inline Tailwind)
- [x] T051 [US4] Create SessionOutline component (message type navigation) in src/components/SessionOutline.js
- [x] T052 [P] [US4] Create SessionOutline styles (inline Tailwind)

### Features (US4)

- [x] T053 [US4] Implement in-session keyword search with highlighting
- [x] T054 [US4] Implement navigate to next/previous match (Cmd+G / Shift+Cmd+G)
- [x] T055 [US4] Implement message type filter (user/assistant/tool) in SessionOutline
- [x] T056 [US4] Implement session outline jump-to navigation
- [x] T057 [US4] Add keyboard shortcuts for in-session navigation (⌘F, ⌘G)

### Integration (US4)

- [x] T058 [US4] Integrate InSessionSearch into SessionDetail component
- [x] T059 [US4] Integrate SessionOutline sidebar into SessionDetail view
- [x] T060 [US4] Validate navigation in 100+ message session <5s (SC-007)

**Checkpoint**: ✅ US4 Complete - Users can navigate within long sessions efficiently

---

## Phase 5: User Story 2 - Search and Filter Sessions (Priority: P2)

**Goal**: Users can filter and search across all sessions

**Independent Test**: Enter search term → see filtered results → clear filters → see all

**Dependency**: Requires US1 (Session list)

### Services (US2)

- [x] T061 [US2] Implement SearchIndex in-memory indexing in src/lib/SearchIndex.js
- [x] T062 [US2] Add search index population during session scan

### Components (US2)

- [x] T063 [US2] Create SearchBar component in src/components/SearchBar.js
- [x] T064 [P] [US2] Create SearchBar styles (inline Tailwind)
- [x] T065 [US2] Create FilterPanel component (project, date range) in src/components/FilterPanel.js
- [x] T066 [P] [US2] Create FilterPanel styles (inline Tailwind)

### Features (US2)

- [x] T067 [US2] Implement keyword search across session summaries
- [x] T068 [US2] Implement project directory filter (dropdown)
- [x] T069 [US2] Implement date range filter (from/to date pickers)
- [x] T070 [US2] Implement "Clear Filters" action
- [x] T071 [US2] Implement sort options (date, project, duration, tokens)

### Integration (US2)

- [x] T072 [US2] Integrate SearchBar into main app layout
- [x] T073 [US2] Connect FilterPanel to SessionStore for reactive updates
- [x] T074 [US2] Validate <50ms search/filter response (constitution requirement) - ✅ console logs show ~1-5ms

**Checkpoint**: ✅ US2 Complete - Users can search and filter sessions efficiently

---

## Phase 6: User Story 3 - Export Session Reports (Priority: P3)

**Goal**: Users can export sessions as standalone HTML files

**Independent Test**: Select session → click export → open HTML in browser → verify formatting

**Dependency**: Requires US1 (Session viewing)

### Services (US3)

- [ ] T075 [US3] Implement HTML exporter service in src/services/html-exporter.js
- [ ] T076 [P] [US3] Create export HTML template with embedded styles in src/templates/export.html

### IPC Channels (US3)

- [ ] T077 [US3] Implement `session:export` IPC channel handler in electron/main.ts

### Components (US3)

- [ ] T078 [US3] Create ExportDialog component (Basecoat dialog) in src/components/ExportDialog/index.js
- [ ] T079 [P] [US3] Create ExportDialog styles in src/components/ExportDialog/styles.css

### Features (US3)

- [ ] T080 [US3] Implement single session export to HTML
- [ ] T081 [US3] Implement export options (include tool outputs, syntax highlighting)
- [ ] T082 [US3] Implement batch export of multiple selected sessions
- [ ] T083 [US3] Implement file naming per export-format.json pattern
- [ ] T084 [US3] Add export progress indicator for batch operations

### Integration (US3)

- [ ] T085 [US3] Add "Export as HTML" button to SessionDetail
- [ ] T086 [US3] Add batch export button to SessionList (with selection)
- [ ] T087 [US3] Validate export <3s (SC-004)
- [ ] T088 [US3] Validate exported HTML works offline in all modern browsers (SC-009)

**Checkpoint**: ✅ US3 Complete - Users can export and share sessions

---

## Phase 7: User Story 5 - Monitor Session Metadata (Priority: P3)

**Goal**: Users can view token usage and session statistics

**Independent Test**: View session → see metadata panel → sort by tokens → verify values

**Dependency**: Requires US1 (Session viewing), US2 (Sorting)

### Services (US5)

- [ ] T089 [US5] Implement token counter utility in src/utils/token-counter.js

### Components (US5)

- [ ] T090 [US5] Create MetadataPanel component in src/components/MetadataPanel/index.js
- [ ] T091 [P] [US5] Create MetadataPanel styles in src/components/MetadataPanel/styles.css

### Features (US5)

- [ ] T092 [US5] Display session metadata (tokens, messages, duration, version) in MetadataPanel
- [ ] T093 [US5] Display per-message token counts in MessageView
- [ ] T094 [US5] Implement sort by token usage in session list
- [ ] T095 [US5] Display git branch and status in session metadata

### Integration (US5)

- [ ] T096 [US5] Integrate MetadataPanel into SessionDetail sidebar
- [ ] T097 [US5] Add token usage column to SessionList (optional display)

**Checkpoint**: ✅ US5 Complete - Users can monitor usage and optimize

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final improvements across all user stories

### Keyboard Navigation (FR-018)

- [ ] T098 Implement keyboard shortcuts table in src/lib/KeyboardManager.js
- [ ] T099 Add j/k navigation in session list (Vim-style)
- [ ] T100 Add Enter to open session, Escape to close detail
- [ ] T101 Add / to focus search bar

### Preferences (FR-019)

- [ ] T102 Implement preferences service in src/services/preferences.js
- [ ] T103 Implement `preferences:get` and `preferences:set` IPC handlers
- [ ] T104 Persist window size and position
- [ ] T105 Persist filter settings and sort order
- [ ] T106 Persist last viewed session

### Error Handling (FR-014)

- [ ] T107 Add malformed JSONL graceful handling with user notification
- [ ] T108 Add missing ~/.claude/projects directory handling
- [ ] T109 Add handling for sessions actively being written
- [ ] T110 Add schema version mismatch graceful degradation

### Performance Validation

- [ ] T111 Run bundle size analysis (target: 200-300KB minified)
- [ ] T112 Run memory profiling (target: <300MB active)
- [ ] T113 Run CPU profiling (target: <2% idle, <25% active)
- [ ] T114 Validate all success criteria from spec.md

### Final Polish

- [ ] T115 Add application menu (File, Edit, View, Help)
- [ ] T116 Add about dialog with version info
- [ ] T117 [P] Add loading skeleton states for better UX
- [ ] T118 Run quickstart.md validation scenarios

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup) → Phase 2 (Foundational) → User Stories (Phase 3-7) → Phase 8 (Polish)
                                           ↓
                              Can run in parallel after Phase 2
```

### User Story Dependencies

| Story | Depends On | Can Start After |
|-------|------------|-----------------|
| US1 (View) | Foundational | Phase 2 complete |
| US2 (Search) | US1 | T044 (navigation flow) |
| US3 (Export) | US1 | T044 (navigation flow) |
| US4 (Navigate) | US1 | T044 (navigation flow) |
| US5 (Metadata) | US1, US2 | T071 (sort options) |

### Recommended Execution Order

**Sequential (Single Developer)**:
1. Phase 1 → Phase 2 → US1 → US4 → US2 → US3 → US5 → Phase 8

**Parallel (Multiple Developers)**:
1. Phase 1 + Phase 2 (all)
2. After Phase 2: US1 (all), then fork:
   - Dev A: US4 → US5
   - Dev B: US2 → US3
3. Phase 8 (all)

### Within Each User Story

1. IPC channels / Services first
2. Components (parallelizable if different files)
3. Features (may depend on components)
4. Integration (last, depends on all above)

---

## Parallel Opportunities

### Phase 1 Parallel (4 tasks)
```
T003 TypeScript config
T004 Tailwind config       } All different files
T005 Vite config
T006 Electron builder config
```

### Phase 2 Parallel (8+ tasks)
```
T013 Session types
T014 Event types          } Type definitions
T015 IPC types

T017 EventEmitter
T018 VirtualList          } Core libraries

T024 IPC client
T025 Markdown renderer    } Renderer services
T026 Syntax highlighter

T027 DOM helpers
T028 Date formatter       } Utilities
T029 Error handler
```

### User Story Parallel (within each)
```
[US1] T033 SessionList + T034 styles (parallel)
[US2] T063 SearchBar + T064 styles (parallel)
[US3] T078 ExportDialog + T079 styles (parallel)
```

---

## Implementation Strategy

### MVP First (US1 Only)

1. ✅ Complete Phase 1: Setup
2. ✅ Complete Phase 2: Foundational
3. ✅ Complete Phase 3: US1 - View Session History
4. **STOP and VALIDATE**: Test session viewing independently
5. Deploy/demo MVP

### Incremental Delivery

| Increment | Stories | Deliverable |
|-----------|---------|-------------|
| MVP | US1 | View sessions and conversations |
| v0.2 | + US4 | In-session navigation |
| v0.3 | + US2 | Search and filter |
| v0.4 | + US3 | HTML export |
| v1.0 | + US5 + Polish | Full feature set |

### MVP Checklist

- [ ] Session list loads <2s (SC-001)
- [ ] Session detail opens <1s (SC-002)
- [ ] Markdown renders correctly
- [ ] Code has syntax highlighting (SC-008)
- [ ] Tool calls expand/collapse
- [ ] Works with 1000+ sessions (SC-005)

---

## Task Summary

| Phase | Tasks | Parallel | Sequential |
|-------|-------|----------|------------|
| Setup | 12 | 6 | 6 |
| Foundational | 18 | 12 | 6 |
| US1 (View) | 18 | 3 | 15 |
| US4 (Navigate) | 12 | 2 | 10 |
| US2 (Search) | 14 | 2 | 12 |
| US3 (Export) | 14 | 2 | 12 |
| US5 (Metadata) | 9 | 1 | 8 |
| Polish | 21 | 1 | 20 |
| **Total** | **118** | **29** | **89** |

---

## Notes

- **[P] tasks** = different files, no dependencies within phase
- **[US#] label** = maps task to specific user story
- Each user story independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate independently
- **Security**: Use DOM APIs, not innerHTML with untrusted data (research.md)
- **Performance**: Virtual scrolling required >100 items (constitution)
