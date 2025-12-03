# Feature Specification: macOS Application Packaging

**Feature Branch**: `007-macos-packaging`
**Created**: 2025-12-03
**Status**: Draft
**Input**: User request: "Package this into an easy application that the user can install and run on its mac"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Download and Install Application (Priority: P1)

As a Mac user interested in Claude Trace UI, I want to download and install the application easily so I can start viewing my Claude Code sessions without complex setup.

**Why this priority**: This is the core value proposition - users need a simple installation path. Without a proper DMG, users must clone the repo and run npm commands.

**Independent Test**: Can be fully tested by downloading the DMG from GitHub Releases, opening it, dragging to Applications, and launching the app. Delivers immediate value by eliminating developer setup.

**Acceptance Scenarios**:

1. **Given** I'm on the GitHub Releases page, **When** I download the DMG for my architecture, **Then** I get a single file ready to install
2. **Given** I have downloaded the DMG, **When** I open it and drag to Applications, **Then** the app is installed
3. **Given** I have installed the app, **When** I launch it from Applications, **Then** the app opens and shows my sessions

---

### User Story 2 - Handle Gatekeeper for Unsigned App (Priority: P1)

As a Mac user installing an unsigned application, I want clear instructions to bypass Gatekeeper so I can run the app without confusion about security warnings.

**Why this priority**: Critical for user success - without code signing, macOS will block the app by default. Users need guidance.

**Independent Test**: Can be tested by installing on a fresh Mac and verifying the documented bypass method works.

**Acceptance Scenarios**:

1. **Given** I have installed the unsigned app, **When** I try to open it normally, **Then** I see macOS Gatekeeper warning
2. **Given** I see the Gatekeeper warning, **When** I right-click and select "Open", **Then** I get option to open anyway
3. **Given** the README documents the bypass, **When** I follow the instructions, **Then** I can successfully run the app

---

### User Story 3 - Support Both Intel and Apple Silicon (Priority: P2)

As a Mac user, I want the application to run natively on my processor architecture so I get optimal performance.

**Why this priority**: Important for all Mac users, but can be delivered after basic DMG works on one architecture.

**Independent Test**: Can be tested by running architecture-specific builds on both Intel and M-series Macs.

**Acceptance Scenarios**:

1. **Given** I have an Intel Mac, **When** I download the x64 DMG and install, **Then** the app runs natively
2. **Given** I have an Apple Silicon Mac, **When** I download the arm64 DMG and install, **Then** the app runs natively (not via Rosetta)
3. **Given** I'm on the Releases page, **When** I look at available downloads, **Then** I see clearly labeled options for both architectures

---

### User Story 4 - Automated Release via GitHub Actions (Priority: P3)

As a developer maintaining Claude Trace UI, I want automated builds on git tags so releases are consistent and require minimal manual effort.

**Why this priority**: Valuable for maintenance, but manual builds work for initial releases.

**Independent Test**: Can be tested by pushing a version tag and verifying DMGs appear on GitHub Releases.

**Acceptance Scenarios**:

1. **Given** I push a tag like `v1.0.0`, **When** GitHub Actions workflow runs, **Then** DMG files are built for all architectures
2. **Given** the workflow completes, **When** I check GitHub Releases, **Then** a new release is created with attached DMGs
3. **Given** I need to make a hotfix release, **When** I push a patch tag, **Then** new DMGs are built automatically

---

### Edge Cases

- What happens when the app tries to read ~/.claude but the folder doesn't exist?
- How does the app handle macOS permissions for reading external folders?
- What if users have very old macOS versions (pre-10.15)?
- How should the app behave when opened without internet (for auto-update features later)?
- What happens if the DMG is downloaded but corrupted during transfer?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide downloadable DMG file for macOS installation
- **FR-002**: System MUST support both x64 (Intel) and arm64 (Apple Silicon) architectures
- **FR-003**: System MUST include proper app icon (icon.icns) in 1024x1024 resolution
- **FR-004**: System MUST include entitlements.plist for file system access permissions
- **FR-005**: System MUST provide clear documentation for Gatekeeper bypass
- **FR-006**: DMG SHOULD include visual installer with drag-to-Applications prompt
- **FR-007**: System MUST set correct app category (Developer Tools)
- **FR-008**: System MAY provide universal binary combining both architectures (future)
- **FR-009**: System MUST clean up temporary files during packaging
- **FR-010**: GitHub Release MUST include version in filename (e.g., Claude-Trace-UI-1.0.0-arm64.dmg)

### Build Requirements

- **BR-001**: Build script MUST work on macOS development machines
- **BR-002**: Build MUST use electron-builder with existing configuration
- **BR-003**: Build MUST produce self-contained application bundle
- **BR-004**: Build output SHOULD be under 200MB per architecture
- **BR-005**: Build MUST NOT require code signing certificate (initially)

### Key Entities

- **DMG**: Disk image file for macOS application distribution
- **App Bundle**: macOS .app directory structure containing executable and resources
- **Entitlements**: macOS security permissions for file system access
- **Icon Set**: icns file containing all required icon sizes for macOS
- **Architecture**: CPU instruction set (x64 for Intel, arm64 for Apple Silicon)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can download and install the app within 5 minutes
- **SC-002**: App launches successfully on macOS 11+ (Big Sur and later)
- **SC-003**: DMG file size is under 200MB per architecture
- **SC-004**: 90% of users successfully bypass Gatekeeper on first attempt using documentation
- **SC-005**: App runs natively on both Intel and Apple Silicon Macs
- **SC-006**: GitHub Release download count exceeds 50 in first month
- **SC-007**: Zero critical bugs reported related to packaging within 30 days

## Assumptions *(mandatory)*

- **No Code Signing**: Initial release will be unsigned; users must bypass Gatekeeper
- **GitHub Distribution**: DMGs distributed via GitHub Releases, not Mac App Store
- **macOS 11+**: Minimum supported version is Big Sur (electron 28 requirement)
- **Manual Build Initially**: First releases built manually; CI/CD added later
- **Developer Machine**: Builds must be run on macOS (not Linux/Windows)
- **Electron Builder**: Using existing electron-builder configuration

## Dependencies *(mandatory if applicable)*

- **electron-builder**: Package already installed, configured in electron-builder.json
- **macOS Development Machine**: Required for building signed/notarized apps later
- **GitHub Repository**: https://github.com/TakTik-Ou/claude-trace-ui for releases
- **App Icon**: Must be created (currently missing)

## Scope Boundaries *(mandatory)*

### In Scope

- DMG packaging for macOS
- Support for x64 and arm64 architectures
- App icon creation
- Entitlements configuration
- Build scripts (npm run package:mac)
- Installation documentation
- GitHub Release setup

### Out of Scope

- Code signing with Apple Developer certificate
- Notarization for Gatekeeper approval
- Mac App Store submission
- Auto-update functionality (Squirrel/electron-updater)
- Windows NSIS installer (separate Phase 8)
- Linux AppImage (separate Phase 9)
- Universal binary (single DMG for both architectures)
- Crash reporting integration

## Implementation Plan

### Phase 7A: Icon and Assets (T001-T004)

1. **T001**: Create app icon design (1024x1024 PNG)
2. **T002**: Generate icon.icns with all required sizes
3. **T003**: Add icon to build/icon.icns location
4. **T004**: Update electron-builder.json to reference icon

### Phase 7B: Entitlements (T005-T007)

5. **T005**: Create build/entitlements.mac.plist with file system access
6. **T006**: Create build/entitlements.mac.inherit.plist for child processes
7. **T007**: Update electron-builder.json with entitlements paths

### Phase 7C: Build Scripts (T008-T012)

8. **T008**: Add `package:mac` script for current architecture
9. **T009**: Add `package:mac:x64` script for Intel builds
10. **T010**: Add `package:mac:arm64` script for Apple Silicon builds
11. **T011**: Test build output on both architectures
12. **T012**: Verify app launches and reads ~/.claude

### Phase 7D: Documentation (T013-T016)

13. **T013**: Add "Installation" section to README
14. **T014**: Document Gatekeeper bypass with screenshots
15. **T015**: Add "Building from Source" section
16. **T016**: Create RELEASES.md with versioning policy

### Phase 7E: GitHub Release (T017-T020)

17. **T017**: Create first GitHub Release manually
18. **T018**: Upload DMG files for both architectures
19. **T019**: Write release notes with installation instructions
20. **T020**: Test download and install on clean Mac

### Future: Phase 7F: CI/CD (Deferred)

- GitHub Actions workflow for automated builds
- Automatic release on version tags
- Build status badges

## Technical Notes

### electron-builder.json Updates Required

```json
{
  "mac": {
    "icon": "build/icon.icns",
    "entitlements": "build/entitlements.mac.plist",
    "entitlementsInherit": "build/entitlements.mac.inherit.plist",
    "hardenedRuntime": true,
    "gatekeeperAssess": false
  }
}
```

### Entitlements Required

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>com.apple.security.cs.allow-unsigned-executable-memory</key>
    <true/>
    <key>com.apple.security.files.user-selected.read-write</key>
    <true/>
</dict>
</plist>
```

### Expected Output Sizes

| Build | Estimated Size |
|-------|---------------|
| arm64 DMG | ~80MB |
| x64 DMG | ~85MB |
| Universal DMG | ~160MB |

### Gatekeeper Bypass Instructions

```
1. Download Claude-Trace-UI-x.x.x-arm64.dmg
2. Open the DMG file
3. Drag "Claude Trace UI" to Applications folder
4. Right-click the app in Applications
5. Select "Open" from context menu
6. Click "Open" in the dialog that appears
7. App will now always open without warnings
```

---

**Status**: 📋 Planned (Phase 7)
**Depends On**: Phase 1-6 completion (all features implemented and tested)
**Estimated Tasks**: 20 tasks across 5 sub-phases
