import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import { config } from './config';
import { prisma } from './db';
import { twilioRouter } from './routes/twilio';
import { createDeepgramLiveStream } from './services/deepgram';
import { synthesizeSpeechStream, streamAudioToTwilio } from './services/elevenlabs';
import { generateAIResponse } from './services/claude';

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
  let callSid = '';
  let deepgramWs: WebSocket | null = null;

  // Handles finalized text transcribed by Deepgram
  const handleTranscript = async (transcript: string) => {
    try {
      console.log(`[WebSocket Pipeline] Inbound speech transcript: "${transcript}"`);
      
      // Dispatch transcript to the Claude AI Conversational Brain!
      const aiReply = await generateAIResponse(callSid, transcript);
      console.log(`[WebSocket Pipeline] Claude speech response: "${aiReply}"`);
      
      // Synthesize response speech via ElevenLabs
      const audioBuffer = await synthesizeSpeechStream(aiReply);
      
      // Play back synthesized speech down Twilio stream in real-time
      await streamAudioToTwilio(ws, streamSid, audioBuffer);
    } catch (err) {
      console.error('[WebSocket Pipeline] Error executing Claude voice cycle:', err);
    }
  };

  ws.on('message', async (message: string) => {
    try {
      const data = JSON.parse(message);
      
      switch (data.event) {
        case 'connected':
          console.log('[WebSocket] Media stream connection active');
          break;
          
        case 'start':
          streamSid = data.start.streamSid;
          callSid = data.start.callSid;
          console.log(`[WebSocket] Starting media stream. StreamSid: ${streamSid}, CallSid: ${callSid}`);
          
          const customerPhone = data.start.customParameters?.from || '+919999988888';
          const merchantId = 'test-merchant-1234';

          try {
            console.log(`[WebSocket Setup] Initializing PostgreSQL session records for CallSid: ${callSid}`);
            
            // 1. Safely guarantee that the test merchant profile exists
            await prisma.merchant.upsert({
              where: { id: merchantId },
              update: {},
              create: {
                id: merchantId,
                name: 'Chai & Chutney',
                phone: '+919876543210',
              },
            });

            // 2. Instantiate dynamic customer session record
            await prisma.customerSession.upsert({
              where: { id: callSid },
              update: {
                activeCart: { items: [] },
                currentState: 'GREETING',
                address: null,
              },
              create: {
                id: callSid,
                merchantId: merchantId,
                customerPhone: customerPhone,
                channel: 'VOICE',
                activeCart: { items: [] },
                currentState: 'GREETING',
              },
            });

            // 3. Create active dialog logs record
            await prisma.callLog.upsert({
              where: { id: callSid },
              update: { transcript: [] },
              create: {
                id: callSid,
                sessionId: callSid,
                transcript: [],
              },
            });

            console.log(`[WebSocket Setup] Database session initialized successfully.`);
          } catch (dbErr) {
            console.error('[WebSocket Setup] Database session initiation failed:', dbErr);
          }

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
