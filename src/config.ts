import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || '5000',
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || '',
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID || '',
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN || '',
  twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER || '',
  deepgramApiKey: process.env.DEEPGRAM_API_KEY || '',
  elevenlabsApiKey: process.env.ELEVENLABS_API_KEY || '',
  elevenlabsVoiceId: process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM', // default Rachel
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
  razorpayKeyId: process.env.RAZORPAY_KEY_ID || '',
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || '',
  redisUrl: process.env.REDIS_URL || '',
};
