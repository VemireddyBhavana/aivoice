import { config } from './config';

async function main() {
  const args = process.argv.slice(2);
  const mode = args[0]; // "call" or "whatsapp"
  const targetPhone = args[1]; // e.g. "+919876543210"
  const ngrokUrl = args[2]; // e.g. "https://xxxx.ngrok-free.app"

  if (!config.twilioAccountSid || !config.twilioAuthToken) {
    console.error('❌ Error: Twilio credentials not found in .env!');
    process.exit(1);
  }

  const accountSid = config.twilioAccountSid;
  const authToken = config.twilioAuthToken;
  const authHeader = `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`;

  console.log('📡 [Twilio Outbound CLI] Querying active phone numbers on your account...');
  
  let twilioNum = '';
  try {
    const listUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/IncomingPhoneNumbers.json?PageSize=1`;
    const res = await fetch(listUrl, {
      headers: { Authorization: authHeader }
    });
    
    if (!res.ok) {
      throw new Error(`Twilio returned HTTP ${res.status}`);
    }
    
    const data = await res.json() as any;
    const numberObj = data.incoming_phone_numbers?.[0];
    if (!numberObj) {
      console.warn('⚠️  Warning: No active phone numbers auto-detected on your Twilio console.');
      twilioNum = '+14155238886'; // sandbox fall-back
    } else {
      twilioNum = numberObj.phone_number;
    }
  } catch (err: any) {
    console.error('❌ Failed to fetch phone numbers from Twilio:', err.message);
    twilioNum = '+14155238886';
  }

  console.log(`✅ Twilio Phone Number set: ${twilioNum}`);

  if (!mode || !targetPhone) {
    console.log('\n📖 Outbound Test CLI Usage:');
    console.log('----------------------------------------------------');
    console.log('📞 Place Outbound Call connected to your AI Voice Stream:');
    console.log('   npx tsx src/test-outbound.ts call <your-mobile> <your-ngrok-url>');
    console.log('   Example: npx tsx src/test-outbound.ts call +919876543210 https://abcd.ngrok-free.app');
    console.log('\n💬 Send Test WhatsApp message from Twilio Sandbox:');
    console.log('   npx tsx src/test-outbound.ts whatsapp <your-mobile>');
    console.log('   Example: npx tsx src/test-outbound.ts whatsapp +919876543210');
    console.log('----------------------------------------------------\n');
    process.exit(0);
  }

  if (mode === 'call') {
    if (!ngrokUrl) {
      console.error('❌ Error: Please specify your active ngrok HTTPS URL for voice stream routing!');
      process.exit(1);
    }
    const cleanUrl = ngrokUrl.replace(/\/$/, ''); // strip trailing slash
    const webhookUrl = `${cleanUrl}/api/twilio/voice`;

    console.log(`📞 [Twilio Outbound Call] Ringing cell phone ${targetPhone} from ${twilioNum}...`);
    console.log(`🔗 Webhook Voice Target: ${webhookUrl}`);

    try {
      const callUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json`;
      const body = new URLSearchParams({
        Url: webhookUrl,
        To: targetPhone,
        From: twilioNum
      });

      const res = await fetch(callUrl, {
        method: 'POST',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: body.toString()
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errorText}`);
      }

      const data = await res.json() as any;
      console.log(`🎉 Call initialized successfully! Call SID: ${data.sid}`);
      console.log('👉 Keep an eye on your phone, it should start ringing now! Speak into it to talk live with your AI!');
    } catch (err: any) {
      console.error('❌ Call initiation failed:', err.message);
    }
  } else if (mode === 'whatsapp') {
    const fromWhatsApp = `whatsapp:+14155238886`; // standard sandbox number

    console.log(`💬 [Twilio Outbound WhatsApp] Dispatching sandbox invite text to ${targetPhone}...`);
    console.log(`⚠️  Note: Make sure your mobile number has joined the Twilio Sandbox by sending "join <sandbox-code>" to +1 415 523 8886 first!`);

    try {
      const msgUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
      const body = new URLSearchParams({
        To: `whatsapp:${targetPhone}`,
        From: fromWhatsApp,
        Body: 'Namaste from Chai & Chutney! 🍛 Live WhatsApp commerce pipeline verified and fully operational. Aap Paneer Butter Masala order karne ke liye ready hain!'
      });

      const res = await fetch(msgUrl, {
        method: 'POST',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: body.toString()
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errorText}`);
      }

      const data = await res.json() as any;
      console.log(`🎉 Message dispatched successfully! SID: ${data.sid}`);
      console.log('👉 Check your WhatsApp inbox for the test message!');
    } catch (err: any) {
      console.error('❌ Message push failed:', err.message);
    }
  }
}

main().catch(err => {
  console.error('❌ Unexpected script error:', err);
});
