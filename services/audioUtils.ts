import { Blob } from '@google/genai';

export const float32ToInt16 = (float32: Float32Array): Int16Array => {
  const int16 = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]));
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return int16;
};

export const base64EncodeAudio = (int16: Int16Array): string => {
  let binary = '';
  const bytes = new Uint8Array(int16.buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

export const createPcmBlob = (data: Float32Array): Blob => {
  const int16 = float32ToInt16(data);
  const base64 = base64EncodeAudio(int16);
  return {
    data: base64,
    mimeType: 'audio/pcm;rate=16000',
  };
};
