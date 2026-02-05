import type { MidiNote } from '@/app/types/music';
import { MIDI_NOTE_ON, MIDI_NOTE_OFF } from '@/app/types/music';

export interface MidiDevice {
  id: string;
  name: string;
  manufacturer: string;
}

export interface MidiMessage {
  type: 'noteon' | 'noteoff';
  note: MidiNote;
  velocity: number;
}

type MidiMessageCallback = (message: MidiMessage) => void;
type DeviceChangeCallback = () => void;

class MidiService {
  private access: MIDIAccess | null = null;
  private listeners: MidiMessageCallback[] = [];
  private deviceChangeListeners: DeviceChangeCallback[] = [];
  private activeInputs: Set<string> = new Set();

  async initialize(): Promise<boolean> {
    // Already initialized - return true
    if (this.access) return true;

    if (!navigator.requestMIDIAccess) {
      console.warn('MidiService: Web MIDI API not supported in this browser');
      return false;
    }

    try {
      this.access = await navigator.requestMIDIAccess();
      this.setupInputListeners();
      return true;
    } catch (error) {
      console.error('MidiService: Failed to get MIDI access:', error);
      return false;
    }
  }

  isSupported(): boolean {
    return 'requestMIDIAccess' in navigator;
  }

  isInitialized(): boolean {
    return this.access !== null;
  }

  getDevices(): MidiDevice[] {
    if (!this.access) return [];

    const devices: MidiDevice[] = [];
    this.access.inputs.forEach((input) => {
      devices.push({
        id: input.id,
        name: input.name || 'Unknown Device',
        manufacturer: input.manufacturer || 'Unknown',
      });
    });

    return devices;
  }

  enableDevice(deviceId: string): void {
    if (!this.access) return;

    const input = this.access.inputs.get(deviceId);
    if (input) {
      input.onmidimessage = this.handleMidiMessage.bind(this);
      this.activeInputs.add(deviceId);
    }
  }

  disableDevice(deviceId: string): void {
    if (!this.access) return;

    const input = this.access.inputs.get(deviceId);
    if (input) {
      input.onmidimessage = null;
      this.activeInputs.delete(deviceId);
    }
  }

  enableAllDevices(): void {
    const devices = this.getDevices();
    devices.forEach(device => this.enableDevice(device.id));
  }

  onMessage(callback: MidiMessageCallback): () => void {
    this.listeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  onDeviceChange(callback: DeviceChangeCallback): () => void {
    this.deviceChangeListeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.deviceChangeListeners.indexOf(callback);
      if (index > -1) {
        this.deviceChangeListeners.splice(index, 1);
      }
    };
  }

  private notifyDeviceChange(): void {
    this.deviceChangeListeners.forEach(listener => listener());
  }

  private setupInputListeners(): void {
    if (!this.access) return;

    // Listen for device connections/disconnections
    this.access.onstatechange = (e) => {
      const event = e as MIDIConnectionEvent;
      if (!event.port) return;
      
      if (event.port.type === 'input') {
        if (event.port.state === 'connected') {
          // Auto-enable new devices
          this.enableDevice(event.port.id);
          // Notify listeners of device change
          this.notifyDeviceChange();
        } else if (event.port.state === 'disconnected') {
          this.activeInputs.delete(event.port.id);
          // Notify listeners of device change
          this.notifyDeviceChange();
        }
      }
    };
  }

  private handleMidiMessage(event: MIDIMessageEvent): void {
    if (!event.data || event.data.length < 3) return;
    
    const [status, note, velocity] = event.data;
    const command = status & 0xf0;

    let message: MidiMessage | null = null;

    if (command === MIDI_NOTE_ON && velocity > 0) {
      message = {
        type: 'noteon',
        note: note as MidiNote,
        velocity: velocity / 127,
      };
    } else if (command === MIDI_NOTE_OFF || (command === MIDI_NOTE_ON && velocity === 0)) {
      message = {
        type: 'noteoff',
        note: note as MidiNote,
        velocity: 0,
      };
    }

    if (message) {
      this.listeners.forEach(listener => listener(message));
    }
  }

  dispose(): void {
    if (this.access) {
      this.access.inputs.forEach(input => {
        input.onmidimessage = null;
      });
      this.access.onstatechange = null;
    }
    this.listeners = [];
    this.deviceChangeListeners = [];
    this.activeInputs.clear();
    this.access = null;
  }
}

export const midiService = new MidiService();
