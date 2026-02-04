# Contributing to Cortina

Thank you for your interest in contributing to Cortina! This document provides guidelines and instructions for development.

## Getting Started

### Prerequisites
- Node.js 20+ (LTS recommended)
- npm, yarn, pnpm, or bun
- Git
- (Optional) MIDI device for testing

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd cortina
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run development server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000)

4. **Build for production**
   ```bash
   npm run build
   npm start
   ```

5. **Lint code**
   ```bash
   npm run lint
   ```

## Development Workflow

### Branch Strategy
- `main` - Production-ready code
- `feature/*` - New features
- `fix/*` - Bug fixes
- `docs/*` - Documentation updates

### Making Changes

1. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow code style in `AGENTS.md`
   - Write TypeScript types
   - Use Tailwind for styling
   - Keep components focused and small

3. **Test your changes**
   - Test in browser (Chrome, Firefox, Safari)
   - Test with MIDI device if applicable
   - Test keyboard input
   - Check console for errors
   - Run linter: `npm run lint`

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add piano keyboard component"
   ```

   **Commit message format:**
   - `feat:` New feature
   - `fix:` Bug fix
   - `docs:` Documentation
   - `style:` Formatting
   - `refactor:` Code restructuring
   - `test:` Adding tests
   - `chore:` Maintenance

5. **Push and create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

## Pull Request Guidelines

### Before Submitting
- [ ] Code follows style guidelines
- [ ] Types are properly defined
- [ ] No console errors or warnings
- [ ] Linter passes (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] Tested in multiple browsers
- [ ] MIDI functionality tested (if applicable)

### PR Description Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] New feature
- [ ] Bug fix
- [ ] Documentation
- [ ] Refactoring

## Testing
- [ ] Tested in Chrome
- [ ] Tested in Firefox
- [ ] Tested with MIDI device
- [ ] Tested keyboard input
- [ ] No console errors

## Screenshots (if applicable)
[Add screenshots or video]
```

## Code Review Checklist

### Reviewers Should Check
- [ ] Code follows `AGENTS.md` patterns
- [ ] TypeScript types are correct
- [ ] Components are properly decomposed
- [ ] Audio initialization requires user gesture
- [ ] MIDI API has browser support check
- [ ] No performance issues
- [ ] Tailwind classes used consistently
- [ ] No hardcoded magic numbers

## Project-Specific Guidelines

### Audio Development
- Always check `Tone.context.state` before playing
- Use `Tone.start()` after user interaction
- Clean up audio nodes on unmount
- Consider audio latency in design

### MIDI Development
- Check `navigator.requestMIDIAccess` availability
- Handle permission denial gracefully
- Test with multiple MIDI devices
- Map MIDI note numbers correctly (60 = C4)

### Keyboard Input
- Prevent default browser shortcuts carefully
- Handle key repeat (prevent duplicate triggers)
- Provide visual feedback for key presses
- Document keyboard shortcuts

### Performance
- Minimize re-renders in audio components
- Use `useMemo` for expensive calculations
- Debounce/throttle UI updates if needed
- Profile with React DevTools

## Troubleshooting

### MIDI Not Working
- Ensure HTTPS (required for Web MIDI API)
- Check browser support (Chrome/Edge best)
- Check browser permissions
- Try different MIDI device

### Audio Not Playing
- Check browser autoplay policies
- Ensure user gesture triggered audio
- Check `Tone.context.state`
- Check browser console for errors

### Build Errors
- Clear `.next` directory: `rm -rf .next`
- Delete `node_modules` and reinstall
- Check Node.js version

## Getting Help

- Review `AGENTS.md` for architecture
- Check existing issues and PRs
- Create issue with reproducible example
- Include browser version and OS

## License

By contributing, you agree that your contributions will be licensed under the project's license.
