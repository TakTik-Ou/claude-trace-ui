# Feature Specification: UI Polish & Performance

**Feature Branch**: `002-ui-polish`
**Created**: 2025-12-03
**Status**: Draft
**Input**: UI improvements covering performance, UX, search, metadata, and navigation

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Virtual Scrolling for Large Session Lists (Priority: P1)

As a user with hundreds of sessions, I want the session list to remain performant and responsive when scrolling through project groups so that I can navigate quickly without lag.

**Why this priority**: Performance is critical for usability. With 400+ sessions, DOM bloat causes noticeable lag when expanding groups. Virtual scrolling prevents rendering all items at once.

**Independent Test**: Can be tested by loading 400+ sessions, expanding all groups, and measuring scroll performance. Success delivers smooth 60fps scrolling.

**Acceptance Scenarios**:

1. **Given** a project group with 100+ sessions, **When** I expand the group and scroll, **Then** only visible items (~20) are rendered in the DOM
2. **Given** I am scrolling quickly through the session list, **When** I stop scrolling, **Then** visible items render within 100ms with no visible flickering
3. **Given** virtual scrolling is active, **When** I click a session item, **Then** the selection works correctly regardless of scroll position

---

### User Story 2 - Remember Expanded Groups in Preferences (Priority: P1)

As a user, I want my expanded/collapsed group preferences to persist between sessions so that I don't have to re-expand my frequently used projects every time I open the app.

**Why this priority**: UX convenience that significantly reduces friction. Users typically work with the same 2-3 projects and shouldn't need to expand them repeatedly.

**Independent Test**: Can be tested by expanding some groups, restarting the app, and verifying the same groups are still expanded.

**Acceptance Scenarios**:

1. **Given** I expand project groups A and B, **When** I close and reopen the app, **Then** groups A and B are still expanded
2. **Given** I collapse all groups, **When** I restart the app, **Then** all groups remain collapsed
3. **Given** groups are saved in preferences, **When** a new project appears in the list, **Then** the new project starts collapsed (default)

---

### User Story 3 - Highlight Matching Sessions When Groups Collapsed (Priority: P2)

As a user searching for sessions, I want to see which collapsed groups contain matches so that I can find sessions without manually expanding every group.

**Why this priority**: Improves search discoverability. Currently, collapsed groups hide matches, making search less useful when groups are collapsed.

**Independent Test**: Can be tested by searching for a term, observing collapsed groups show match indicators.

**Acceptance Scenarios**:

1. **Given** a search term is entered, **When** collapsed groups contain matching sessions, **Then** the group header shows "(N matches)" badge
2. **Given** a search is active with collapsed groups showing matches, **When** I click the group header, **Then** the group expands showing only matching sessions highlighted
3. **Given** groups show match counts, **When** I clear the search, **Then** the match badges disappear and normal counts resume

---

### User Story 4 - Clearer Missing Data Messaging (Priority: P2)

As a user viewing session metadata, I want clear indicators for unavailable data (like "N/A" instead of "No token data") so that I understand what information is missing vs what had zero values.

**Why this priority**: Reduces user confusion. "No token data" is ambiguous - could mean zero tokens or missing data.

**Independent Test**: Can be tested by viewing sessions with missing token data and verifying "N/A" displays clearly.

**Acceptance Scenarios**:

1. **Given** a session has no token usage data, **When** I view the metadata panel, **Then** I see "N/A" for token fields
2. **Given** a session has zero tokens, **When** I view the metadata panel, **Then** I see "0" (not "N/A")
3. **Given** git information is unavailable, **When** I view technical details, **Then** git fields show "N/A" or are hidden

---

### User Story 5 - Total Token Count in Header (Priority: P2)

As a user, I want to see the total token count across all visible sessions in the header so that I can understand my overall Claude Code usage at a glance.

**Why this priority**: Provides useful aggregate information without requiring extra clicks. Helpful for usage tracking.

**Independent Test**: Can be tested by loading sessions and verifying the header shows correct total token count.

**Acceptance Scenarios**:

1. **Given** sessions are loaded, **When** I view the session list header, **Then** I see total tokens (e.g., "1.2M tokens")
2. **Given** I filter sessions by search or date, **When** the filter is applied, **Then** the total token count updates to reflect filtered sessions only
3. **Given** some sessions have no token data, **When** totals are calculated, **Then** those sessions are excluded from the total (not counted as 0)

---

### User Story 6 - Keyboard Navigation for Groups (Priority: P3)

As a power user, I want to use j/k keys for Vim-style navigation through sessions and groups so that I can browse efficiently without using the mouse.

**Why this priority**: Power user feature. Improves efficiency for keyboard-centric users but not essential for basic functionality.

**Independent Test**: Can be tested by pressing j/k keys and verifying navigation through list items.

**Acceptance Scenarios**:

1. **Given** focus is on the session list, **When** I press `j`, **Then** selection moves to next session/group
2. **Given** I press `k`, **When** a session is selected, **Then** selection moves to previous session/group
3. **Given** a collapsed group is selected, **When** I press `Enter` or `l`, **Then** the group expands
4. **Given** an expanded group is selected, **When** I press `h`, **Then** the group collapses

---

### User Story 7 - Batch Export Button (Priority: P3)

As a user, I want a batch export button in the session list header so that I can export multiple sessions at once without opening each one individually.

**Why this priority**: Convenience feature for users who want to archive multiple sessions. Nice-to-have but not essential.

**Independent Test**: Can be tested by selecting multiple sessions and clicking batch export.

**Acceptance Scenarios**:

1. **Given** I am viewing the session list, **When** I click "Export All", **Then** a dialog lets me choose export options for visible sessions
2. **Given** I have filtered sessions, **When** I click "Export All", **Then** only filtered sessions are included in export
3. **Given** batch export is in progress, **When** export completes, **Then** I see success message with count of exported sessions

---

### Edge Cases

- What happens when virtual scroll container size changes (window resize)?
- How does system handle preference storage failure (localStorage quota)?
- What if search matches 1000+ sessions across many groups?
- How handle keyboard nav when list is empty?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST implement virtual scrolling for session items, rendering only visible items plus buffer
- **FR-002**: System MUST persist expanded group state to localStorage
- **FR-003**: System MUST restore expanded group state on app launch
- **FR-004**: System MUST show match count badges on collapsed groups during search
- **FR-005**: System MUST display "N/A" for unavailable data vs "0" for zero values
- **FR-006**: System MUST calculate and display total token count in session list header
- **FR-007**: System MUST support j/k keyboard navigation when session list has focus
- **FR-008**: System MUST support batch export of visible/filtered sessions
- **FR-009**: System MUST update aggregates when filters change

### Key Entities

- **UserPreferences**: Stores expanded groups, view settings, persisted to localStorage
- **VirtualScrollState**: Tracks scroll position, visible range, rendered items

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Session list maintains 60fps scroll performance with 500+ sessions
- **SC-002**: Expanded group state correctly persists across app restarts (100% reliability)
- **SC-003**: Search match indicators appear on collapsed groups within 100ms of typing
- **SC-004**: Token count header updates within 50ms of filter changes
- **SC-005**: Keyboard navigation (j/k) responds within 16ms (one frame)
- **SC-006**: Batch export completes 100 sessions within 10 seconds
