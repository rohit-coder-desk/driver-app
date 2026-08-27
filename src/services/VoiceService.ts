import { NativeModules } from 'react-native';

const { AudioPlayerModule } = NativeModules;

class VoiceService {
  private isInitialized: boolean = false;

  public async initialize(): Promise<void> {
    this.isInitialized = true;
    console.log('[VoiceService] Audio player service initialized.');
  }

  public async playChime(): Promise<void> {
    try {
      if (AudioPlayerModule && typeof AudioPlayerModule.playNotificationSound === 'function') {
        await AudioPlayerModule.playNotificationSound();
      } else {
        console.warn('[VoiceService] AudioPlayerModule.playNotificationSound not available');
      }
    } catch (err) {
      console.warn('[VoiceService] Notification chime error:', err);
    }
  }

  public async speakNewOffer(_isMultiple: boolean = false): Promise<void> {
    // Pure beep chime sound, no spoken voice
    await this.playChime();
  }

  public async playOfferAlert(): Promise<void> {
    await this.playChime();
  }

  public async stop(): Promise<void> {
    // No active TTS audio to stop
  }

  public cleanup(): void {
    // No event listeners to clean up
  }
}

export const voiceService = new VoiceService();

