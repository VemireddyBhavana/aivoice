import { Router } from 'express';
import { config } from '../config';
import { prisma } from '../db';
import { generateAIResponse } from '../services/claude';

export const whatsappRouter = Router();

/**
 * Outbound helper to send structured text replies via Twilio WhatsApp API.
 * @param to Customer phone number (e.g. "+919876543210")
 * @param text Message body content
 */
export async function sendWhatsAppMessage(to: string, text: string): Promise<void> {
  const accountSid = config.twilioAccountSid;
  const authToken = config.twilioAuthToken;
  const fromWhatsApp = config.twilioPhoneNumber.startsWith('+') 
    ? `whatsapp:${config.twilioPhoneNumber}` 
    : `whatsapp:+14155238886`; // standard Twilio sandbox WhatsApp sender default

  if (!accountSid || !authToken) {
    console.warn('[WhatsApp Outbound] Twilio account SID or auth token not configured. Outbound message skipped.');
    console.log(`[WhatsApp Simulated Outbound To ${to}]: "${text}"`);
    return;
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const body = new URLSearchParams({
    To: `whatsapp:${to}`,
    From: fromWhatsApp,
    Body: text,
  });

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[WhatsApp Outbound] Outbox push failed: ${response.status} - ${errorText}`);
  } else {
    console.log(`[WhatsApp Outbound] Response dispatched successfully to ${to}`);
  }
}

/**
 * Inbound Webhook handler. Intercepts incoming WhatsApp messages from Twilio.
 */
whatsappRouter.post('/webhook', async (req, res) => {
  try {
    const { From, Body, MediaUrl0, NumMedia } = req.body;

    if (!From) {
      res.status(400).send('Missing parameter From');
      return;
    }

    const customerPhone = From.replace('whatsapp:', '').trim();
    const merchantId = 'test-merchant-1234';
    // WhatsApp session matches the customer phone number for persistence
    const sessionId = customerPhone;

    console.log(`[WhatsApp Webhook] Message received. Sender: ${customerPhone}, Content: "${Body || 'None'}"`);

    // 1. Scaffold merchant, session, and CallLog inside database dynamically if first-time contact
    await prisma.merchant.upsert({
      where: { id: merchantId },
      update: {},
      create: {
        id: merchantId,
        name: 'Chai & Chutney',
        phone: '+919876543210',
      },
    });

    await prisma.customerSession.upsert({
      where: { id: sessionId },
      update: { currentState: 'ORDERING' },
      create: {
        id: sessionId,
        merchantId: merchantId,
        customerPhone: customerPhone,
        channel: 'WHATSAPP',
        activeCart: { items: [] },
        currentState: 'ORDERING',
      },
    });

    await prisma.callLog.upsert({
      where: { id: sessionId },
      update: {},
      create: {
        id: sessionId,
        sessionId: sessionId,
        transcript: [],
      },
    });

    let customerText = Body || '';

    // 2. If customer sent an audio voice note, download and transcribe it
    const hasMedia = NumMedia && parseInt(NumMedia, 10) > 0;
    if (hasMedia && MediaUrl0) {
      console.log(`[WhatsApp Webhook] Audio voice note detected. Fetching media: ${MediaUrl0}`);
      
      try {
        // Download audio file from Twilio CDN
        const audioResponse = await fetch(MediaUrl0);
        if (!audioResponse.ok) {
          throw new Error(`Failed to download audio: ${audioResponse.statusText}`);
        }
        
        const audioBuffer = Buffer.from(await audioResponse.arrayBuffer());
        
        // Transcribe voice note using Deepgram REST API
        console.log('[WhatsApp Webhook] Sending voice note buffer to Deepgram Nova-2 STT...');
        const deepgramUrl = 'https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true';
        
        const dgResponse = await fetch(deepgramUrl, {
          method: 'POST',
          headers: {
            Authorization: `Token ${config.deepgramApiKey}`,
            'Content-Type': audioResponse.headers.get('content-type') || 'audio/ogg',
          },
          body: audioBuffer,
        });

        if (!dgResponse.ok) {
          const dgError = await dgResponse.text();
          throw new Error(`Deepgram STT failed: ${dgResponse.status} - ${dgError}`);
        }

        const dgResult = await dgResponse.json() as any;
        const transcript = dgResult.results?.channels?.[0]?.alternatives?.[0]?.transcript;

        if (transcript) {
          console.log(`[WhatsApp Webhook] Deepgram transcription success: "${transcript}"`);
          customerText = transcript;
        } else {
          console.warn('[WhatsApp Webhook] Deepgram did not yield a valid transcript.');
        }
      } catch (audioErr: any) {
        console.error('[WhatsApp Webhook] Voice note transcription failed:', audioErr);
        await sendWhatsAppMessage(customerPhone, 'Sorry, I couldn\'t process your voice note. Could you try sending a text message instead?');
        res.status(200).send('<Response></Response>');
        return;
      }
    }

    if (!customerText.trim()) {
      console.log('[WhatsApp Webhook] Skipping response (Empty text input received)');
      res.status(200).send('<Response></Response>');
      return;
    }

    // 3. Dispatch the message text to Claude AI Conversational Brain
    const aiReply = await generateAIResponse(sessionId, customerText);
    console.log(`[WhatsApp Webhook] AI generated response: "${aiReply}"`);

    // 4. Send the conversational text reply back to WhatsApp
    await sendWhatsAppMessage(customerPhone, aiReply);

    // Twilio webhooks expect valid TwiML, returning empty response as we push out-of-band via REST
    res.type('text/xml');
    res.send('<Response></Response>');
  } catch (err: any) {
    console.error('[WhatsApp Webhook] Error processing message:', err);
    res.status(500).send('Internal Server Error');
  }
});
