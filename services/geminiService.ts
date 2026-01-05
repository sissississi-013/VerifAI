import { GoogleGenAI, FunctionDeclaration, Type, LiveServerMessage, Modality } from "@google/genai";
import { createPcmBlob } from "./audioUtils";
import { FactCardData, VerdictType, ChartType } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- 1. LIVE API (The Listener) ---

const verifyClaimTool: FunctionDeclaration = {
  name: 'verifyClaim',
  description: 'Trigger this immediately when a factual claim, statistic, or verifiable statement is made.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      claim: {
        type: Type.STRING,
        description: 'The exact claim to check.',
      },
    },
    required: ['claim'],
  },
};

export class GeminiLiveSession {
  private sessionPromise: Promise<any> | null = null;
  private audioContext: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private onClaimDetected: (claim: string) => void;

  constructor(onClaimDetected: (claim: string) => void) {
    this.onClaimDetected = onClaimDetected;
  }

  async start() {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    // Connect to Gemini Live
    this.sessionPromise = ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-09-2025',
      callbacks: {
        onopen: () => {
          console.log("Gemini Live Session Opened");
          this.startAudioStreaming();
        },
        onmessage: async (message: LiveServerMessage) => {
          if (message.toolCall) {
            for (const fc of message.toolCall.functionCalls) {
              if (fc.name === 'verifyClaim') {
                const args = fc.args as any;
                this.onClaimDetected(args.claim);
                
                // Keep session alive and prompt for next input
                this.sessionPromise?.then(session => {
                    session.sendToolResponse({
                        functionResponses: {
                            id: fc.id,
                            name: fc.name,
                            response: { result: "Claim received. Continue listening for the next claim." }
                        }
                    });
                });
              }
            }
          }
        },
        onclose: () => console.log("Gemini Live Session Closed"),
        onerror: (e) => console.error("Gemini Live Error", e),
      },
      config: {
        responseModalities: [Modality.AUDIO],
        tools: [{ functionDeclarations: [verifyClaimTool] }],
        systemInstruction: `You are an always-on background fact-checking trigger. 
        Your ONLY job is to listen for factual claims or statistics and call 'verifyClaim' immediately.
        
        Rules:
        1. Listen continuously.
        2. When you hear a claim, call 'verifyClaim'.
        3. Do NOT speak. Do NOT generate audio.
        4. Immediately resume listening for the next claim.
        5. Support multiple claims in rapid succession.
        `
      }
    });
  }

  private startAudioStreaming() {
    if (!this.audioContext || !this.stream || !this.sessionPromise) return;

    const source = this.audioContext.createMediaStreamSource(this.stream);
    this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);

    this.processor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      const pcmBlob = createPcmBlob(inputData);
      
      this.sessionPromise?.then((session) => {
        session.sendRealtimeInput({ media: pcmBlob });
      });
    };

    source.connect(this.processor);
    
    // CRITICAL: Connect to a muted gain node before destination to prevent audio feedback loop
    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = 0;
    this.processor.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
  }

  stop() {
    this.stream?.getTracks().forEach(track => track.stop());
    this.processor?.disconnect();
    this.audioContext?.close();
    this.sessionPromise = null;
  }
}

// --- 2. DEEP FACT CHECK (The Researcher) ---

export const analyzeClaim = async (claim: string, existingId: string): Promise<FactCardData> => {
  const model = 'gemini-3-flash-preview'; 
  
  // Prompt optimized for speed and guaranteed JSON structure
  const prompt = `
    Analyze this claim: "${claim}"
    
    Step 1: Search Google to verify.
    Step 2: Return a raw JSON object (no markdown formatting).
    
    JSON Structure:
    {
      "verdict": "verified" | "debunked" | "nuanced" | "uncertain",
      "explanation": "Extremely concise verdict (max 15 words).",
      "confidenceScore": 0.0 to 1.0,
      "sources": [ { "title": "Source Name", "uri": "URL" } ],
      "visualization": {
         "type": "bar" | "line" | "pie" | "stat",
         "title": "Chart Title",
         "data": [ { "name": "Label", "value": 123 } ]
      }
    }

    Rules:
    - If the claim involves ANY numbers, dates, or trends, you MUST provide a 'visualization' object.
    - If no specific numbers, 'visualization' can be null.
    - 'sources' array MUST be populated with the URLs you found.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response");

    let result;
    try {
        result = JSON.parse(text);
    } catch (e) {
        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        result = JSON.parse(cleanText);
    }
    
    const groundingSources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.filter((c: any) => c.web?.uri && c.web?.title)
      .map((c: any) => ({ title: c.web.title, uri: c.web.uri })) || [];

    let finalSources = result.sources && result.sources.length > 0 ? result.sources : groundingSources;
    const uniqueSources = Array.from(new Map(finalSources.map((s: any) => [s.uri, s])).values());

    return {
      id: existingId,
      timestamp: Date.now(),
      originalClaim: claim,
      status: 'complete',
      verdict: result.verdict,
      explanation: result.explanation,
      confidenceScore: result.confidenceScore,
      visualization: result.visualization,
      sources: uniqueSources as { title: string; uri: string }[]
    };
  } catch (error) {
    console.error("Analysis failed", error);
    return {
      id: existingId,
      timestamp: Date.now(),
      originalClaim: claim,
      status: 'error',
    };
  }
};