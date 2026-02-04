# AI Agent Instructions for Cortina

> **Note**: This is the entry point for AI agents. Detailed documentation is in the [`docs/`](./docs/) directory.

## Project Overview

Cortina is a musical skills training application built with Next.js 16, React 19, and TypeScript. The synthesizer module is complete with piano keyboard visualization, controllable via MIDI devices and computer keyboard.

### Current Status ✅
- **Synthesizer**: Fully functional with Tone.js audio engine
- **Piano UI**: 25-key interactive keyboard (C3-C5)
- **MIDI Input**: Web MIDI API integration (Chrome/Edge only)
- **Keyboard Input**: Computer keyboard mapping
- **Testing**: Jest with 16+ unit tests

### Future Plans
- Musical training exercises
- Note recognition games
- Rhythm training
- Progress tracking

## Quick Start

```bash
npm install          # Install dependencies
npm run dev          # Start dev server (port 3000)
npm test             # Run tests
npm run lint         # ESLint
```

## Documentation

| Document | When to Read |
|----------|--------------|
| [docs/architecture.md](./docs/architecture.md) | Understanding the codebase structure |
| [docs/api-reference.md](./docs/api-reference.md) | Using existing services, hooks, components |
| [docs/patterns.md](./docs/patterns.md) | Writing new code, code style |
| [docs/troubleshooting.md](./docs/troubleshooting.md) | Something not working |
| [docs/music-theory.md](./docs/music-theory.md) | Working with MIDI, notes, piano layout |

## Key Files

```
app/
├── page.tsx                 # Main synth page
├── services/audio.ts        # Tone.js audio engine
├── services/midi.ts         # Web MIDI API wrapper
├── hooks/useAudio.ts        # Audio React hook
├── hooks/useMidi.ts         # MIDI React hook
├── hooks/useKeyboard.ts     # Keyboard input hook
├── components/piano/        # Piano UI components
└── types/music.ts           # Music types
```

## Critical Patterns

### Audio Initialization
Always initialize audio from a user gesture (click handler). See [troubleshooting.md](./docs/troubleshooting.md#audio-not-playing).

### MIDI Browser Support
Web MIDI only works in Chrome/Edge. Always check `navigator.requestMIDIAccess` first. See [troubleshooting.md](./docs/troubleshooting.md#midi-shows-not-supported).

### Keyboard Input
Use `event.repeat` to prevent key repeat issues. See [troubleshooting.md](./docs/troubleshooting.md#keys-stuck--repeating).

## Resources

- [Tone.js Docs](https://tonejs.github.io/)
- [Web MIDI API Spec](https://webaudio.github.io/web-midi-api/)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Tailwind CSS](https://tailwindcss.com/)
- [Jest Testing](https://jestjs.io/)
