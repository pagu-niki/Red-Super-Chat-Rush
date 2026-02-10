import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";

interface Blob {
  data: string;
  mimeType: string;
}

export class LiveAudioService {
  private session: any = null;
  private inputContext: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private isConnected: boolean = false;

  constructor(
    private apiKey: string,
    private onTranscription: (text: string) => void,
    private onStatusChange: (isConnected: boolean) => void
  ) {}

  async connect() {
    if (this.isConnected) return;

    try {
      const ai = new GoogleGenAI({ apiKey: this.apiKey });
      
      this.inputContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 16000,
      });

      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const config = {
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: this.handleOpen.bind(this),
          onmessage: this.handleMessage.bind(this),
          onclose: this.handleClose.bind(this),
          onerror: this.handleError.bind(this),
        },
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: { model: "google_speech" }, // Request transcription
          systemInstruction: "You are a referee for a game. Listen to the user. Do not speak.",
          thinkingConfig: { thinkingBudget: 0 } // Disable thinking for speed
        },
      };

      // @ts-ignore - connect returns a promise that resolves to the session
      this.session = await ai.live.connect(config);
      
    } catch (error) {
      console.error("Failed to connect to Live API:", error);
      this.cleanup();
      this.onStatusChange(false);
      throw error;
    }
  }

  private handleOpen() {
    console.log("Live API Connected");
    this.isConnected = true;
    this.onStatusChange(true);
    this.startAudioStream();
  }

  private startAudioStream() {
    if (!this.inputContext || !this.stream || !this.session) return;

    this.source = this.inputContext.createMediaStreamSource(this.stream);
    this.processor = this.inputContext.createScriptProcessor(4096, 1, 1);

    this.processor.onaudioprocess = (e) => {
      if (!this.isConnected) return;
      
      const inputData = e.inputBuffer.getChannelData(0);
      const pcmBlob = this.createBlob(inputData);
      
      // Send audio chunk
      this.session.sendRealtimeInput({ media: pcmBlob });
    };

    this.source.connect(this.processor);
    this.processor.connect(this.inputContext.destination);
  }

  private handleMessage(message: LiveServerMessage) {
    // Handle transcription
    if (message.serverContent?.inputTranscription) {
      const text = message.serverContent.inputTranscription.text;
      if (text) {
        this.onTranscription(text);
      }
    }
  }

  private handleClose() {
    console.log("Live API Closed");
    this.cleanup();
  }

  private handleError(e: any) {
    console.error("Live API Error:", e);
    this.cleanup();
  }

  disconnect() {
    if (this.session) {
        // session.close() might not exist on the type depending on version, 
        // but traditionally we just stop sending and nullify.
        // If the SDK supports close, call it.
        try {
            // @ts-ignore
            if (typeof this.session.close === 'function') {
                 // @ts-ignore
                this.session.close();
            }
        } catch (e) {
            console.warn("Error closing session", e);
        }
    }
    this.cleanup();
  }

  private cleanup() {
    this.isConnected = false;
    this.onStatusChange(false);

    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.inputContext) {
      this.inputContext.close();
      this.inputContext = null;
    }
    this.session = null;
  }

  private createBlob(data: Float32Array): Blob {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      int16[i] = data[i] * 32768;
    }
    return {
      data: this.encode(new Uint8Array(int16.buffer)),
      mimeType: 'audio/pcm;rate=16000',
    };
  }

  private encode(bytes: Uint8Array) {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
}
