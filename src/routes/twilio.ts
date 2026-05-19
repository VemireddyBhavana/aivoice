import { Router } from 'express';

export const twilioRouter = Router();

// Handle incoming Twilio Voice Webhook
twilioRouter.post('/voice', (req, res) => {
  const host = req.headers.host || 'localhost:5000';
  const protocol = host.startsWith('localhost') || host.startsWith('127.0.0.1') ? 'ws' : 'wss';
  const streamUrl = `${protocol}://${host}/media-stream`;

  console.log(`[Twilio Webhook] Incoming call. Generated stream URL: ${streamUrl}`);

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Aditi-Neural" language="en-IN">Welcome to the AI ordering desk. How can I help you today?</Say>
  <Connect>
    <Stream url="${streamUrl}" />
  </Connect>
</Response>`;

  res.type('text/xml');
  res.send(twiml);
});
