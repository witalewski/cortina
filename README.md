# Cortina 🎹

A web-based musical skills training application featuring an in-browser synthesizer with piano keyboard visualization, controllable via MIDI devices and computer keyboard.

**Live Demo**: [https://witalewski.github.io/cortina](https://witalewski.github.io/cortina)

## Features

- 🎹 **Interactive Piano Keyboard** - 25-key visual piano with dynamic range
- 🎵 **Multiple Instruments** - Sampled piano (default), FM synth, basic synth, and acid bass
- 🎛️ **MIDI Device Support** - Connect and play with physical MIDI keyboards
- ⌨️ **Computer Keyboard Input** - Play notes using your keyboard
- 📱 **Mobile Support** - Rotated keyboard layout for portrait mode
- 🎚️ **Velocity Sensitive** - Dynamic expression via MIDI velocity

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **UI**: React 19 + TypeScript
- **Styling**: Tailwind CSS 4
- **Audio**: Tone.js
- **MIDI**: Web MIDI API

## Getting Started

### Prerequisites
- Node.js 20+ (LTS recommended)
- Modern browser with Web Audio support (Chrome/Edge recommended for MIDI)

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000/cortina](http://localhost:3000/cortina) to see the app.

### Build for Production

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
```

## Browser Support

- **Audio**: All modern browsers (Chrome, Firefox, Safari, Edge)
- **MIDI**: Chrome, Edge (best support), Firefox (partial), Safari (not supported)

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development guidelines.

For AI coding assistants, see [AGENTS.md](./AGENTS.md) for architecture and patterns.

## License

MIT
