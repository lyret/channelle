# Debug Components

This directory contains reusable debug components for the Channelle application. These components provide diagnostic information and debugging tools that can be embedded throughout the application when debug mode is enabled.

## Debug Mode Control

Debug mode is now controlled by a **persisted store** (`debugModeStore`) instead of directly checking `CONFIG.runtime.debug`. This provides better user control:

```typescript
// ~/stores/debugMode.ts
export const debugModeStore = persisted(
  `${CONFIG.stage.id}-debug-mode`,
  CONFIG.runtime.debug  // Defaults to CONFIG value
);
```

### Benefits:
- **User Controllable**: Users can toggle debug mode on/off via the Debug Instrument
- **Persistent**: Setting is saved per stage and persists across sessions  
- **Flexible**: Defaults to CONFIG.runtime.debug but can be overridden
- **Runtime Toggle**: No need to restart or change configuration

## Components

### `DebugPanel.svelte`
A versatile debug panel that can be displayed in both compact and full modes. Perfect for embedding in video components or other UI elements.

**Props:**
- `peerId: string` - The peer ID to show debug information for
- `compact: boolean = true` - Whether to show in compact mode (for overlays) or full mode

**Usage:**
```svelte
<script>
  import { DebugPanel } from '~/components/debug';
  import { debugModeStore } from '~/stores/debugMode';
</script>

{#if $debugModeStore}
  <DebugPanel peerId={somePeerId} compact={true} />
{/if}
```

### `PeerMediaStatus.svelte`
Shows detailed media status for a specific peer, including video and audio transmission states.

**Props:**
- `peerId: string` - The peer ID
- `peerData: any` - Peer information object
- `sessionData: any` - Session data for the peer
- `isActiveSpeaker: boolean = false` - Whether this peer is currently the active speaker

### `ConnectionStatus.svelte`
Displays connection and transport status for a peer.

**Props:**
- `peerId: string` - The peer ID
- `peerData: any` - Peer information object
- `isOnline: boolean = false` - Connection status
- `hasTransport: boolean = false` - Transport status
- `isMyPeer: boolean = false` - Whether this is the current user's peer

### `SessionStats.svelte`
Provides an overview of session statistics including peer counts, media statistics, and consumer information.

**Props:** None (uses reactive stores)

### `DebugView.svelte`
A comprehensive debug dashboard that combines all debug functionality. Can be used as a standalone debug page.

**Props:** None (uses reactive stores)

## User Interface Integration

### Debug Instrument
The Debug Instrument (accessible via the options panel) provides users with:
- **Toggle Switch**: Enable/disable debug overlays on videos
- **Quick Access**: Link to open the full debug dashboard

**Visibility:**
- **All Users**: When `CONFIG.runtime.debug` is `true`
- **Managers**: Always visible (with additional manager-specific tools)

### Video Component Integration
Debug panels automatically appear on video elements when `$debugModeStore` is `true`:

```svelte
<!-- Video.svelte -->
{#if $debugModeStore}
  <DebugPanel {peerId} compact={true} />
{/if}
```

Shows:
- Media transmission status (video/audio)
- Consumer/producer status
- Connection health
- Active speaker indicator
- Local vs remote peer identification

## Store Dependencies

These components depend on various stores from `~/api/room`:

- `peersStore` - Peer information
- `sessionsStore` - Session data
- `consumersStore` - Media consumers
- `currentActiveSpeakerStore` - Active speaker tracking
- `localMediaStream` - Local media stream
- `videoProducer` / `audioProducer` - Local producers
- `hasJoinedRoomStore` - Connection status
- `deviceStore` - Device capabilities

Plus the new debug control:
- `debugModeStore` - User-controllable debug mode toggle

## Integration Examples

### 1. Video Component Overlay (Automatic)
```svelte
<!-- Automatically appears when debug mode is enabled -->
<video src={stream} />
{#if $debugModeStore}
  <DebugPanel {peerId} compact={true} />
{/if}
```

### 2. Conditional Debug Features
```svelte
<script>
  import { debugModeStore } from '~/stores/debugMode';
</script>

{#if $debugModeStore}
  <div class="debug-info">
    <SessionStats />
    <PeerMediaStatus {peerId} {peerData} {sessionData} />
  </div>
{/if}
```

### 3. Admin Tools with Debug Mode
```svelte
{#if $peerStore.manager && $debugModeStore}
  <DebugView />
{/if}
```

### 4. Toggle Button Example
```svelte
<script>
  import { debugModeStore } from '~/stores/debugMode';
</script>

<label class="checkbox">
  <input type="checkbox" bind:checked={$debugModeStore} />
  Show debug overlays
</label>
```

## Debugging Information Displayed

### For Local Peer:
- **Media Status**: Local camera/microphone availability
- **Producer Status**: Whether media is being sent to server
- **Stream Health**: Local media stream status
- **Special Indicators**: "You" badge, producer labels

### For Remote Peers:
- **Media Status**: Peer's transmission status (video/audio)
- **Consumer Status**: Whether we're receiving their media
- **Connection Status**: Online/offline, transport health
- **Active Speaker**: Highlighted when speaking

### Session Overview:
- **Peer Statistics**: Total, online, offline counts
- **Media Statistics**: Active/paused stream counts
- **Consumer Statistics**: Video/audio consumer counts
- **Connection Health**: Overall session status

## Configuration

Debug mode is controlled by:

1. **Initial Default**: `CONFIG.runtime.debug` (set at build/deployment time)
2. **User Override**: `debugModeStore` (persisted per-user, per-stage)
3. **UI Controls**: Debug Instrument toggle switch

### Access Control:
- **Debug Instrument**: Visible to all users when `CONFIG.runtime.debug` is `true`
- **Manager Tools**: Additional debug features for managers
- **Debug Dashboard**: Accessible via direct link `/debug` when debug mode enabled

## Development Workflow

1. **Development**: Set `CONFIG.runtime.debug = true` in config
2. **Production**: Set `CONFIG.runtime.debug = false` in config  
3. **User Control**: Users can still enable debug mode via the UI toggle
4. **Debugging**: Use the Debug Instrument to toggle overlays and access full dashboard

This approach provides maximum flexibility - developers control the default availability, but users have final control over the debug experience.

## Implementation Status: ✅ Complete

- ✅ Persisted debug mode store with CONFIG default
- ✅ User-controllable debug toggle in Debug Instrument
- ✅ Debug Instrument visible to all users when CONFIG.runtime.debug enabled
- ✅ Video components use debugModeStore instead of CONFIG directly
- ✅ Automatic debug overlays on video elements
- ✅ Full debug dashboard integration
- ✅ Proper separation between CONFIG defaults and user preferences
- ✅ Real-time toggle without application restart