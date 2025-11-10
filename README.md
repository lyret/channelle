<p style="text-align: center;"><img src="./ui/assets/images/logo.gif" alt="channelle-logo-sept-2024-long" border="0"></p>

# Channelle

**Your local theater house online** - A self-hosted multimedia communication platform built specifically for the free culture sector.

Channelle enables artists, cultural workers, and activists to create autonomous digital spaces for performances, lectures, and cultural events without corporate control or censorship.

## Why Channelle?

- **Built for culture**: Theater-focused interface with stage, backstage, and curtains metaphors
- **Autonomous & censorship-resistant**: Self-host your own platform, retain full control over content
- **Public purpose**: Funded with public money to serve the public, not corporate interests
- **Professional streaming**: Broadcasting optimized for performances, not meetings
- **Accessible**: Works in any modern browser without installations or proprietary software

## Key Features

- **Two operational modes**: Theater management for creating shows, Stage mode for live performances
- **Role-based experiences**: Different interfaces for performers, technicians, and audience members
- **Real-time interaction**: Chat, effects, and audience participation tools
- **Show & scene management**: Structure performances with predefined layouts and settings
- **Professional WebRTC streaming**: One-to-many broadcasting with selective forwarding

## Requirements

- Node.js version 21 or higher

## Quick Start

```bash
# Install dependencies
npm ci

# Development mode (stage)
npm run stage:dev

# Development mode (theater)
npm run theater:dev
```

## Configuration & Deployment

### Operational Modes

Channelle operates in two distinct modes:

**Stage Mode (Default - Quick Start)**
- Single performance/meeting execution
- Immediate use - just start and share the URL
- Perfect for individual performances, lectures, or meetings
- WebRTC streaming with real-time chat and effects

**Theater Mode (Advanced Usage)**
- Management interface for creating and organizing multiple shows
- Configure shows, scenes, and performance settings
- Requires authentication (`THEATER_PASSWORD`)
- For organizations running multiple events or complex productions

### CLI Configuration

```bash
# Stage mode (default) - quick start a single performance
npm run stage:dev                    # Development with hot reload
npm run stage:build                  # Build for production
npm run stage:start                  # Start production server

# Theater mode - manage multiple shows
npm run theater:dev                  # Development mode
npm run theater:build               # Build for production  
npm run theater:start               # Start production server

# Advanced CLI options
node cli.mjs --theater --port 8080 --debug --local --lan --wan
node cli.mjs --showId 123 --theaterPassword mypass --production
```

### Environment Variables

Create a `.env` file for persistent configuration:

```env
# Basic Configuration
NODE_ENV=production
PORT=3000
DEBUG=false
VERBOSE=false

# Stage Configuration  
STAGE_NAME="My Performance"
STAGE_ID="my-stage-2024"
STAGE_INVITE_LINK_KEY="secret123"

# Theater Mode
THEATER=true
THEATER_PASSWORD="admin123"
SHOW_ID=42

# Network Access
LOCAL=true
LAN=true
WAN=false
```

### Network Configuration

- `--local`: Access from localhost (127.0.0.1) - always enabled in development
- `--lan`: Access from local network (192.168.x.x, 10.x.x.x) - great for private events
- `--wan`: Access from internet - requires port forwarding/public IP for production

## Technical Foundation

Built on open standards with Node.js, TypeScript, Svelte, and MediaSoup for WebRTC streaming. Uses SQLite for data persistence and tRPC for type-safe APIs.

## Background

Created by Skärmteatern and funded by Kulturbryggan (Swedish Arts Grants Committee). Developed by Viktor Lyresten from [Maskinrepubliken](https://maskinrepubliken.se).

For more context about the free culture movement and why autonomous platforms matter, see [FAQ.md](FAQ.md).

## License

<p style="height:14px!important;margin-left:3px;vertical-align:text-bottom;text-align:center;">
<img src="https://mirrors.creativecommons.org/presskit/icons/cc.svg?ref=chooser-v1" alt=""><img src="https://mirrors.creativecommons.org/presskit/icons/by.svg?ref=chooser-v1" alt=""><img src="https://mirrors.creativecommons.org/presskit/icons/nc.svg?ref=chooser-v1" alt=""></p>

<a property="dct:title" rel="cc:attributionURL" href="https://codeberg.org/lyret/channelle">Channelle</a> by <a rel="cc:attributionURL dct:creator" property="cc:attributionName" href="">Skärmteatern</a> & <a rel="cc:attributionURL dct:creator" property="cc:attributionName" href="https://maskinrepubliken.se/">Maskinrepubliken</a> is licensed under <a href="https://creativecommons.org/licenses/by-nc/4.0/?ref=chooser-v1" target="_blank" rel="license noopener noreferrer" style="display:inline-block;">CC BY-NC 4.0</a>

See [LICENSE.md](LICENSE.md)