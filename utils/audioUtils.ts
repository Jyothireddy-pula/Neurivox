// utils/audioUtils.ts

// Global AudioContext for managing audio playback
let audioContext: AudioContext | null = null;
let nextStartTime = 0; // Acts as a cursor for scheduling audio playback
const playingSources = new Set<AudioBufferSourceNode>(); // Track currently playing sources

/**
 * Initializes and returns a global AudioContext.
 */
const getAudioContext = (): AudioContext => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  }
  return audioContext;
};

/**
 * Decodes a Base64 encoded string to a Uint8Array.
 * This is a custom implementation required for raw PCM data.
 */
function decodeBase64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Decodes raw PCM audio data (Uint8Array) into an AudioBuffer.
 * This is a custom implementation for raw PCM, not for standard formats like WAV/MP3.
 */
export async function decodeBase64Audio(
  base64AudioString: string,
  sampleRate: number = 24000,
  numChannels: number = 1,
): Promise<AudioBuffer> {
  const ctx = getAudioContext();
  const data = decodeBase64ToUint8Array(base64AudioString);
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

/**
 * Plays an AudioBuffer through the global AudioContext.
 * Schedules playback to ensure smooth, gapless transitions between chunks.
 */
export function playAudioBuffer(buffer: AudioBuffer): void {
  const ctx = getAudioContext();

  // Stop any currently playing audio to prevent overlap if user is interrupting
  stopAllAudio();

  // Schedule the new buffer to play immediately if nothing else is scheduled,
  // or right after the current `nextStartTime`
  nextStartTime = Math.max(nextStartTime, ctx.currentTime);

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(ctx.destination); // Connect directly to destination
  
  source.start(nextStartTime);
  nextStartTime = nextStartTime + buffer.duration; // Update cursor for next chunk

  playingSources.add(source);
  source.onended = () => {
    playingSources.delete(source);
    // If no other audio is playing, reset nextStartTime
    if (playingSources.size === 0) {
      nextStartTime = 0;
    }
  };
}

/**
 * Stops all currently playing audio sources.
 */
export function stopAllAudio(): void {
  for (const source of playingSources.values()) {
    try {
      source.stop();
    } catch (e) {
      console.warn("Error stopping audio source:", e);
    }
  }
  playingSources.clear();
  nextStartTime = 0; // Reset nextStartTime when audio is stopped
}
