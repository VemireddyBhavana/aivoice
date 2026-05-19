import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import { config } from './config';

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
          break;
        case 'media':
          // Raw mulaw audio chunks from Twilio
          // In the next milestone, this is piped to Deepgram
          break;
        case 'stop':
          console.log(`[WebSocket] Media stream stopped for StreamSid: ${streamSid}`);
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
  });

  ws.on('error', (error) => {
    console.error(`[WebSocket] Error:`, error);
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
