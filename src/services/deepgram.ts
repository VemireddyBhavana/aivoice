import WebSocket from 'ws';
import { config } from '../config';

/**
 * Creates a real-time streaming WebSocket connection to Deepgram's STT engine.
 * @param onTranscript Callback fired when a finalized sentence is transcribed.
 */
export function createDeepgramLiveStream(onTranscript: (text: string) => void): WebSocket {
  // Configured specifically for Twilio standard telephony: Mulaw, 8000Hz, 1 channel.
  const url = 'wss://api.deepgram.com/v1/listen?encoding=mulaw&sample_rate=8000&channels=1&interim_results=false&endpointing=300';
  
  console.log('[Deepgram] Instantiating real-time STT WebSocket...');
  
  const ws = new WebSocket(url, {
    headers: {
      Authorization: `Token ${config.deepgramApiKey}`,
    },
  });

  ws.on('open', () => {
    console.log('[Deepgram] Connection active. Ready to ingest telephony audio chunks.');
  });

  ws.on('message', (data: WebSocket.Data) => {
    try {
      const response = JSON.parse(data.toString());
      const transcript = response.channel?.alternatives?.[0]?.transcript;
      
      // Emit transcript only when finalized and non-empty
      if (transcript && response.is_final) {
        console.log(`[Deepgram Speech-To-Text] transcript: "${transcript}"`);
        onTranscript(transcript);
      }
    } catch (error) {
      console.error('[Deepgram] Error parsing transcript frame:', error);
    }
  });

  ws.on('error', (err) => {
    console.error('[Deepgram] Socket encountered an error:', err);
  });

  ws.on('close', (code, reason) => {
    console.log(`[Deepgram] Connection closed. Code: ${code}, Reason: ${reason || 'None'}`);
  });

  return ws;
}
