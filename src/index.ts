import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import { config } from './config';
import { twilioRouter } from './routes/twilio';
import { createDeepgramLiveStream } from './services/deepgram';
import { synthesizeSpeechStream, streamAudioToTwilio } from './services/elevenlabs';

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount Twilio REST endpoints
app.use('/api/twilio', twilioRouter);

// Express Healthcheck
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    env: config.nodeEnv,
  });
});

// Create standard HTTP server
const server = http.createServer(app);

// Create WebSocket Server
const wss = new WebSocketServer({ noServer: true });

// Handle WebSocket connections
wss.on('connection', (ws: WebSocket, request) => {
  console.log('[WebSocket] Client connected');
  let streamSid = '';
  let deepgramWs: WebSocket | null = null;

  // Handles finalized text transcribed by Deepgram
  const handleTranscript = async (transcript: string) => {
    try {
      console.log(`[WebSocket Pipeline] Processing transcript: "${transcript}"`);
      
      // Phase 2 Closed-Loop Test Response (will be replaced by Claude LLM in Phase 3)
      const testAckText = `I heard you say: ${transcript}. How else can I help you today?`;
      
      const audioBuffer = await synthesizeSpeechStream(testAckText);
      await streamAudioToTwilio(ws, streamSid, audioBuffer);
    } catch (err) {
      console.error('[WebSocket Pipeline] Error in closed-loop voice response:', err);
    }
  };

  ws.on('message', (message: string) => {
    try {
      const data = JSON.parse(message);
      
      switch (data.event) {
        case 'connected':
          console.log('[WebSocket] Media stream connection active');
          break;
          
        case 'start':
          streamSid = data.start.streamSid;
          console.log(`[WebSocket] Starting media stream. StreamSid: ${streamSid}, CallSid: ${data.start.callSid}`);
          
          // Instantiate a fresh Deepgram transcription client for this call
          deepgramWs = createDeepgramLiveStream(handleTranscript);
          break;
          
        case 'media':
          // Decodes the incoming mulaw base64 audio chunk from Twilio
          if (deepgramWs && deepgramWs.readyState === WebSocket.OPEN) {
            const rawAudio = Buffer.from(data.media.payload, 'base64');
            deepgramWs.send(rawAudio);
          }
          break;
          
        case 'stop':
          console.log(`[WebSocket] Media stream stopped for StreamSid: ${streamSid}`);
          if (deepgramWs) {
            deepgramWs.close();
            deepgramWs = null;
          }
          break;
          
        default:
          break;
      }
    } catch (error) {
      console.error('[WebSocket] Error parsing message:', error);
    }
  });

  ws.on('close', () => {
    console.log(`[WebSocket] Client disconnected. StreamSid: ${streamSid}`);
    if (deepgramWs) {
      deepgramWs.close();
      deepgramWs = null;
    }
  });

  ws.on('error', (error) => {
    console.error(`[WebSocket] Error:`, error);
    if (deepgramWs) {
      deepgramWs.close();
      deepgramWs = null;
    }
  });
});

// Upgrade HTTP connection to WebSockets if path is /media-stream
server.on('upgrade', (request, socket, head) => {
  const pathname = new URL(request.url || '', `http://${request.headers.host}`).pathname;

  if (pathname === '/media-stream') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});

// Start the server
server.listen(config.port, () => {
  console.log(`==================================================`);
  console.log(`🎙️  AI Voice & WhatsApp Restaurant Ordering Server`);
  console.log(`🔌 Listening on Port ${config.port}`);
  console.log(`🔗 WS endpoint: ws://localhost:${config.port}/media-stream`);
  console.log(`==================================================`);
});
