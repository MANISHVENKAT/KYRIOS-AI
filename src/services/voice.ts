export interface VoiceOptions {
  speed?: number;
  pitch?: number;
  voiceName?: string;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: any) => void;
}

class VoiceServiceManager {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private recognition: any = null;
  private isListening = false;
  private isSpeaking = false;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
    }
  }

  public getVoices(): SpeechSynthesisVoice[] {
    if (!this.synth) return [];
    return this.synth.getVoices();
  }

  public cleanTextForSpeech(text: string): string {
    return text
      .replace(/```[\s\S]*?```/g, ' Code snippet omitted. ')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/https?:\/\/\S+/g, 'link')
      .replace(/#+\s*/g, '')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/^\s*[-*+]\s+/gm, '')
      .replace(/^\s*>\s+/gm, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  public speak(text: string, options: VoiceOptions = {}): void {
    if (!this.synth) {
      options.onError?.(new Error('Speech synthesis not supported in this browser.'));
      return;
    }

    this.stopSpeaking();

    const clean = this.cleanTextForSpeech(text);
    if (!clean) return;

    const utterance = new SpeechSynthesisUtterance(clean);
    this.currentUtterance = utterance;

    utterance.rate = options.speed ?? 1.0;
    utterance.pitch = options.pitch ?? 1.0;

    if (options.voiceName) {
      const voices = this.getVoices();
      const matched = voices.find(v => v.name === options.voiceName || v.lang.startsWith(options.voiceName!));
      if (matched) utterance.voice = matched;
    }

    utterance.onstart = () => {
      this.isSpeaking = true;
      options.onStart?.();
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      this.currentUtterance = null;
      options.onEnd?.();
    };

    utterance.onerror = (e) => {
      this.isSpeaking = false;
      this.currentUtterance = null;
      options.onError?.(e);
    };

    this.synth.speak(utterance);
  }

  public stopSpeaking(): void {
    if (this.synth) {
      this.synth.cancel();
      this.isSpeaking = false;
      this.currentUtterance = null;
    }
  }

  public getIsSpeaking(): boolean {
    return this.isSpeaking;
  }

  public startListening(
    onResult: (transcript: string, isFinal: boolean) => void,
    onError: (err: any) => void,
    onEnd: () => void,
    lang = 'en-US'
  ): boolean {
    if (typeof window === 'undefined') return false;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      onError(new Error('Speech recognition is not supported in this browser. Try Google Chrome or Edge.'));
      return false;
    }

    try {
      this.stopListening();
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = lang;

      this.recognition.onstart = () => {
        this.isListening = true;
      };

      this.recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        const combined = finalTranscript || interimTranscript;
        onResult(combined, !!finalTranscript);
      };

      this.recognition.onerror = (event: any) => {
        this.isListening = false;
        onError(event.error);
      };

      this.recognition.onend = () => {
        this.isListening = false;
        onEnd();
      };

      this.recognition.start();
      return true;
    } catch (e) {
      onError(e);
      return false;
    }
  }

  public stopListening(): void {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (e) {
        // ignore
      }
      this.isListening = false;
    }
  }

  public getIsListening(): boolean {
    return this.isListening;
  }
}

export const VoiceService = new VoiceServiceManager();
