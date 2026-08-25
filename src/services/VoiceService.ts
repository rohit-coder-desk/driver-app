import { NativeModules } from 'react-native';
import Tts from 'react-native-tts';

const { AudioPlayerModule } = NativeModules;

class VoiceService {
  private isInitialized: boolean = false;
  private isSpeaking: boolean = false;

  constructor() {
    this.setupListeners();
  }

  private setupListeners() {
    try {
      Tts.addEventListener('tts-start', () => {
        this.isSpeaking = true;
      });

      Tts.addEventListener('tts-finish', () => {
        this.isSpeaking = false;
      });

      Tts.addEventListener('tts-cancel', () => {
        this.isSpeaking = false;
      });

      Tts.addEventListener('tts-error', (event) => {
        console.warn('[VoiceService] TTS Error:', event);
        this.isSpeaking = false;
      });
    } catch (error) {
      console.warn('[VoiceService] Failed to set up listeners:', error);
    }
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await Tts.getInitStatus();

      // Configure default speech rate and pitch
      await Tts.setDefaultRate(0.5, true);
      await Tts.setDefaultPitch(1.0);

      // Attempt to set Indian English, fallback to standard English
      try {
        await Tts.setDefaultLanguage('en-IN');
      } catch (langError) {
        console.log('[VoiceService] en-IN language not available, using default language');
        try {
          await Tts.setDefaultLanguage('en-US');
        } catch (_) {
          // Keep engine defaults
        }
      }

      this.isInitialized = true;
      console.log('[VoiceService] Text-To-Speech initialized successfully.');
    } catch (error) {
      console.warn('[VoiceService] TTS initialization failed:', error);
    }
  }

  private async playChimeThenSpeak(message: string): Promise<void> {
    try {
      if (AudioPlayerModule && typeof AudioPlayerModule.playNotificationSound === 'function') {
        await AudioPlayerModule.playNotificationSound();
      }
    } catch (err) {
      console.warn('[VoiceService] Notification chime error:', err);
    } finally {
      // Always speak TTS message after chime finishes or fails
      Tts.speak(message);
    }
  }

  public async speakNewOffer(isMultiple: boolean = false): Promise<void> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Stop any active speech before starting a new announcement
      await this.stop();

      const message = isMultiple
        ? 'New delivery requests available.'
        : 'New delivery request.';

      await this.playChimeThenSpeak(message);
    } catch (error) {
      console.warn('[VoiceService] Error speaking offer alert:', error);
    }
  }

  public async stop(): Promise<void> {
    try {
      await Tts.stop();
      this.isSpeaking = false;
    } catch (error) {
      console.warn('[VoiceService] Error stopping TTS:', error);
    }
  }

  public cleanup(): void {
    try {
      Tts.removeAllListeners('tts-start');
      Tts.removeAllListeners('tts-finish');
      Tts.removeAllListeners('tts-cancel');
      Tts.removeAllListeners('tts-error');
    } catch (error) {
      console.warn('[VoiceService] Error cleaning up TTS listeners:', error);
    }
  }
}

export const voiceService = new VoiceService();
