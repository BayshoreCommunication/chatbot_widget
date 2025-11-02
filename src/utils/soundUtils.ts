// Sound utility for playing notification sounds

class SoundManager {
  private welcomeAudio: HTMLAudioElement | null = null;
  private messageAudio: HTMLAudioElement | null = null;
  private hasPlayedWelcome: boolean = false;

  constructor() {
    // Create welcome sound (pleasant chime)
    this.welcomeAudio = this.createAudio(this.generateWelcomeTone());

    // Create message sound (subtle pop)
    this.messageAudio = this.createAudio(this.generateMessageTone());
  }

  private createAudio(dataUri: string): HTMLAudioElement {
    const audio = new Audio(dataUri);
    audio.volume = 0.5; // Set volume to 50%
    return audio;
  }

  // Generate a pleasant welcome chime sound
  private generateWelcomeTone(): string {
    const audioContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)();
    const duration = 0.6;
    const sampleRate = audioContext.sampleRate;
    const numSamples = duration * sampleRate;
    const buffer = audioContext.createBuffer(1, numSamples, sampleRate);
    const data = buffer.getChannelData(0);

    // Create a pleasant two-tone chime (C and E notes)
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-3 * t); // Decay envelope

      // First tone (C note - 523.25 Hz)
      const tone1 = Math.sin(2 * Math.PI * 523.25 * t) * envelope;
      // Second tone (E note - 659.25 Hz)
      const tone2 = Math.sin(2 * Math.PI * 659.25 * t) * envelope * 0.7;

      data[i] = (tone1 + tone2) * 0.3; // Mix and reduce volume
    }

    return this.bufferToWav(buffer);
  }

  // Generate a subtle message pop sound
  private generateMessageTone(): string {
    const audioContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)();
    const duration = 0.15;
    const sampleRate = audioContext.sampleRate;
    const numSamples = duration * sampleRate;
    const buffer = audioContext.createBuffer(1, numSamples, sampleRate);
    const data = buffer.getChannelData(0);

    // Create a subtle pop sound
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-25 * t); // Fast decay
      const frequency = 800 + 400 * (1 - t / duration); // Frequency sweep

      data[i] = Math.sin(2 * Math.PI * frequency * t) * envelope * 0.3;
    }

    return this.bufferToWav(buffer);
  }

  // Convert audio buffer to WAV data URI
  private bufferToWav(buffer: AudioBuffer): string {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;

    const data = buffer.getChannelData(0);
    const dataLength = data.length * numChannels * (bitDepth / 8);
    const arrayBuffer = new ArrayBuffer(44 + dataLength);
    const view = new DataView(arrayBuffer);

    // WAV header
    this.writeString(view, 0, "RIFF");
    view.setUint32(4, 36 + dataLength, true);
    this.writeString(view, 8, "WAVE");
    this.writeString(view, 12, "fmt ");
    view.setUint32(16, 16, true); // Format chunk size
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * (bitDepth / 8), true);
    view.setUint16(32, numChannels * (bitDepth / 8), true);
    view.setUint16(34, bitDepth, true);
    this.writeString(view, 36, "data");
    view.setUint32(40, dataLength, true);

    // Write audio data
    let offset = 44;
    for (let i = 0; i < data.length; i++) {
      const sample = Math.max(-1, Math.min(1, data[i]));
      view.setInt16(
        offset,
        sample < 0 ? sample * 0x8000 : sample * 0x7fff,
        true
      );
      offset += 2;
    }

    const blob = new Blob([arrayBuffer], { type: "audio/wav" });
    return URL.createObjectURL(blob);
  }

  private writeString(view: DataView, offset: number, string: string): void {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  // Play welcome sound
  playWelcomeSound(): void {
    if (this.welcomeAudio && !this.hasPlayedWelcome) {
      this.welcomeAudio.play().catch((error) => {
        console.log("Welcome sound autoplay prevented:", error);
      });
      this.hasPlayedWelcome = true;
    }
  }

  // Play message sound
  playMessageSound(): void {
    if (this.messageAudio) {
      // Clone and play to allow multiple overlapping sounds
      this.messageAudio.currentTime = 0;
      this.messageAudio.play().catch((error) => {
        console.log("Message sound play prevented:", error);
      });
    }
  }

  // Reset welcome sound flag (for testing or re-initialization)
  resetWelcomeSound(): void {
    this.hasPlayedWelcome = false;
  }
}

// Create singleton instance
export const soundManager = new SoundManager();

// Export individual functions for convenience
export const playWelcomeSound = () => soundManager.playWelcomeSound();
export const playMessageSound = () => soundManager.playMessageSound();
export const resetWelcomeSound = () => soundManager.resetWelcomeSound();
