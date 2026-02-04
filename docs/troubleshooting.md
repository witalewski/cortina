# Troubleshooting

## Common Issues

### Audio Not Playing

**Symptom**: No sound when pressing keys or MIDI input.

**Cause**: Browser blocks AudioContext until user gesture.

**Solution**: Always wrap audio initialization in a click handler:

```typescript
// ✅ Correct - triggered by button click
const handleStart = async () => {
  await Tone.start();
  await audioEngine.initialize();
};
<button onClick={handleStart}>Start</button>

// ❌ Wrong - will be blocked
useEffect(() => {
  audioEngine.initialize(); // Browser will block this
}, []);
```

### MIDI Shows "Not Supported"

**Symptom**: MIDI status shows "Not Supported" even with devices connected.

**Cause**: Web MIDI API only works in **Chrome and Edge**. Safari and Firefox don't support it.

**Solution**: Use Chrome or Edge, or show graceful fallback:

```typescript
if (!navigator.requestMIDIAccess) {
  setError('Web MIDI not supported. Use Chrome or Edge.');
  return;
}
```

### MIDI Device Not Detected

**Symptom**: MIDI status shows "0 devices" even with device connected.

**Possible causes**:
1. Browser didn't receive permission - check permission prompt
2. Device connected after initialization - devices should auto-detect now
3. Device not properly connected - check USB connection

**Debug steps**:
1. Open Chrome DevTools → Console
2. Check for MIDI-related errors
3. Try `navigator.requestMIDIAccess().then(m => console.log([...m.inputs.values()]))`

### Keys Stuck / Repeating

**Symptom**: Notes continue playing or retrigger unexpectedly.

**Cause**: Keyboard repeat events not being filtered.

**Solution**: Always check `event.repeat`:

```typescript
const handleKeyDown = (event: KeyboardEvent) => {
  // ✅ Best approach - use browser's repeat flag
  if (event.repeat) {
    event.preventDefault();
    return;
  }
  
  // Also keep a ref as backup for edge cases
  if (pressedKeysRef.current.has(event.key)) return;
  
  pressedKeysRef.current.add(event.key);
  playNote(keyToMidi[event.key]);
};
```

### TypeScript Errors in Tests

**Symptom**: ESLint errors about `require` in test files.

**Solution**: Add disable comment at top of test file:

```typescript
/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any */
```

This is needed because Jest's module reset pattern requires dynamic `require()`.

---

## Browser Compatibility

| Feature | Chrome | Edge | Firefox | Safari |
|---------|--------|------|---------|--------|
| Web Audio API | ✅ | ✅ | ✅ | ✅ |
| Web MIDI API | ✅ | ✅ | ❌ | ❌ |
| Tone.js | ✅ | ✅ | ✅ | ✅ |

**Recommendation**: Develop and test primarily in Chrome, but ensure audio works in all browsers.

---

## Console Warnings

### "AudioContext was not allowed to start"

**This is expected** on page load. It's the browser's autoplay policy. The warning goes away after user clicks "Start Audio Engine".

### Tone.js version message

```
* Tone.js v15.1.22 *
```

**This is informational**, not an error. Tone.js logs its version on initialization.

---

## Debug Tips

### Check Audio State

```javascript
// In browser console
Tone.context.state  // Should be 'running' after init
```

### List MIDI Devices

```javascript
// In browser console (Chrome/Edge only)
navigator.requestMIDIAccess().then(m => {
  console.log('Inputs:', [...m.inputs.values()]);
  console.log('Outputs:', [...m.outputs.values()]);
});
```

### Monitor MIDI Messages

```javascript
// In browser console
navigator.requestMIDIAccess().then(m => {
  m.inputs.forEach(input => {
    input.onmidimessage = (msg) => console.log(msg.data);
  });
});
```
