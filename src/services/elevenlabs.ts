import { config } from '../config';

/**
 * Synthesizes text into 8kHz Mulaw audio bytes using ElevenLabs Low-Latency API.
 * @param text The text string to synthesize.
 * @returns Promise resolving to a Buffer of raw 8kHz Mulaw audio.
 */
export async function synthesizeSpeechStream(text: string): Promise<Buffer> {
  const voiceId = config.elevenlabsVoiceId;
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream?output_format=ulaw_8000`;

  console.log(`[ElevenLabs] Dispatching synthesis request for: "${text}"`);
  
  if (!config.elevenlabsApiKey) {
    console.warn('[ElevenLabs] Warning: ELEVENLABS_API_KEY is not set. Synthesis will fail.');
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'xi-api-key': config.elevenlabsApiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_turbo_v2', // Turbo v2 delivers sub-second synthesis speeds.
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ElevenLabs synthesis failed: ${response.status} - ${errorText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Helper to stream an audio buffer back to Twilio in 20ms chunks (exactly 160 bytes per packet).
 * @param ws The Twilio active WebSocket client.
 * @param streamSid The Twilio session stream SID.
 * @param audioBuffer The full synthesized Mulaw audio buffer.
 */
export async function streamAudioToTwilio(
  ws: any,
  streamSid: string,
  audioBuffer: Buffer
): Promise<void> {
  const CHUNK_SIZE = 160; // 20ms of 8000Hz 1-byte raw audio = 160 bytes.
  let offset = 0;

  console.log(`[Twilio Audio Output] Streaming synthesized audio of size ${audioBuffer.length} bytes to stream: ${streamSid}`);

  // Send chunks with exactly 20ms spacing matching telephony pacing
  while (offset < audioBuffer.length) {
    const end = Math.min(offset + CHUNK_SIZE, audioBuffer.length);
    const chunk = audioBuffer.subarray(offset, end);
    
    const mediaPayload = {
      event: 'media',
      streamSid,
      media: {
        payload: chunk.toString('base64'),
      },
    };

    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(mediaPayload));
    } else {
      console.warn('[Twilio Audio Output] WebSocket closed prematurely during streaming.');
      break;
    }

    offset += CHUNK_SIZE;
    // Wait for 20 milliseconds to match real-time voice playout
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  
  console.log(`[Twilio Audio Output] Finished streaming buffer for stream: ${streamSid}`);
}
