# Channelle - AI Development Guidelines

## Overview
Channelle is an open-source multimedia communication platform for the free culture sector, enabling autonomous online performances without corporate control.

## Architecture

### Operational Modes
- **Theater Mode** (`--theater`): Management interface for shows, scenes, and settings
- **Stage Mode** (default): Live performance with WebRTC streaming and audience interaction

### Core Architecture
- **Unified Server**: Single Node.js application with mode-specific routing
- **Database**: SQLite with Sequelize ORM
- **WebRTC**: MediaSoup SFU for professional broadcasting
- **API**: tRPC with WebSocket support
- **Frontend**: Multiple Svelte interfaces
- **Build**: Custom CLI with ESBuild

## Development Guidelines

### Code Style
- **Indentation**: Tabs (not spaces)
- **Quotes**: Double quotes for strings
- **Semicolons**: Required
- **Line Length**: Max 160 characters
- **Types**: TypeScript strict mode

### File Organization
- **Naming**: lowercase filenames, camelCase for multi-word
- **Index Files**: Use wildcard exports (`export * from "module"`)
- **Single Responsibility**: One clear purpose per file
- **Type Centralization**: Related types in dedicated `types.ts` files

### Barrel File Patterns
```typescript
// GOOD: Wildcard export for clean API
export * from "./module";

// BAD: Manual named exports
export { foo, bar } from "./module";
```

### Module Organization
- **Function-Based**: Organize by primary exported function
- **Registry Pattern**: Module-level functions over class-based registries
- **Helper Functions**: Extract common logic to pure functions
- **Avoid Classes**: Prefer functional programming patterns

### Constants and Defaults
- **Respect Constants**: Always use defined constants, never hardcode values
- **Server-Client Sync**: When constants are defined client-side but needed server-side:
  - Document the expected value in server code
  - Add comments like `// Matches DEFAULT_THEME constant from client-side`
  - Ensure server defaults align with client constants
- **Default Values**: Prefer constants over magic strings/numbers
- **Example**:
  ```typescript
  // GOOD: Uses constant
  defaultValue: DEFAULT_THEME,
  
  // BAD: Hardcoded value
  defaultValue: "mellan",
  
  // ACCEPTABLE: Server-side with comment
  defaultValue: "mellan", // Matches DEFAULT_THEME constant from client-side
  ```

## AI Assistant Rules

### ❌ Prohibited Actions
- **NEVER** create documentation files (README.md, guides, etc.)
- **NEVER** create example/demo files
- **NEVER** run linting commands
- **NEVER** create markdown files for documentation
- **NEVER** start the server (build only for testing)

### ✅ Required Behavior
- **Focus**: Implement requested functionality only
- **Explanations**: Brief inline comments, not separate docs
- **Testing**: Build verification only (manual testing approach)
- **Code**: Work directly with codebase, no auxiliary files

### Testing Approach
- **Manual Testing**: No automated tests
- **Visual Verification**: Check UI features visually
- **Build Verification**: Ensure code compiles without errors
- **Functional Testing**: Test in running application

### Git Guidelines
- **NEVER Stage Changes**: Agents must not stage or commit changes
- **Build Only**: Use builds to verify code compiles correctly
- **No Git Operations**: Avoid `git add`, `git commit`, `git stage`, etc.
- **Verification**: Test functionality through builds, not git operations

## Common Patterns

### Theme System
- **Show-Level**: Theme applies to all users of a show
- **Real-time**: Changes sync to all connected clients
- **CSS Variables**: Uses `--channelle-*` variables
- **Implementation**: Integrated with backstage configuration

### Configuration Sync
- **Pattern**: `subscribeToBackstageConfigurationChanges()`
- **Usage**: Apply changes when configuration updates
- **Example**: Theme application happens in config subscription

### Store Patterns
- **Derived Stores**: For computed state
- **Reactive**: Automatically update when dependencies change
- **Cleanup**: Unsubscribe when components unmount

## License
Creative Commons BY-NC 4.0 (non-commercial use)