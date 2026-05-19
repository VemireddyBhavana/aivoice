import Razorpay from 'razorpay';
import { config } from '../config';

let razorpayClient: any = null;

if (config.razorpayKeyId && config.razorpayKeySecret) {
  try {
    razorpayClient = new Razorpay({
      key_id: config.razorpayKeyId,
      key_secret: config.razorpayKeySecret,
    });
    console.log('[Razorpay] Initialized live Razorpay client.');
  } catch (err) {
    console.error('[Razorpay] Failed to initialize live Razorpay client:', err);
  }
} else {
  console.log('[Razorpay] Key ID or Secret not configured. Payment link generation will run in fallback mock mode.');
}

/**
 * Generates a Razorpay payment link for checkout.
 * @param orderId The unique database ID of the Order.
 * @param amountInRupees The final order total in INR.
 * @param customerPhone The phone number of the customer.
 * @returns Promise resolving to a short payment link URL.
 */
export async function createPaymentLink(
  orderId: string,
  amountInRupees: number,
  customerPhone: string
): Promise<string> {
  const amountInPaise = Math.round(amountInRupees * 100);

  if (razorpayClient) {
    try {
      console.log(`[Razorpay] Dispatching paymentLink.create request for Order: ${orderId}, Amount: ₹${amountInRupees}`);
      const linkResponse = await razorpayClient.paymentLink.create({
        amount: amountInPaise,
        currency: 'INR',
        accept_partial: false,
        reference_id: orderId,
        description: `Payment for Chai & Chutney Order #${orderId}`,
        customer: {
          name: 'AI Voice Valued Customer',
          contact: customerPhone.replace(/\D/g, ''), // Standard numeric-only contact representation
        },
        notify: {
          sms: false,
          email: false,
        },
        reminder_enable: false,
        notes: {
          orderId: orderId,
        },
        callback_url: `https://rzp.io/success`,
        callback_method: 'get',
      });

      console.log(`[Razorpay] Live payment link generated: ${linkResponse.short_url}`);
      return linkResponse.short_url;
    } catch (err: any) {
      console.error('[Razorpay] Live Razorpay API call failed. Falling back to mock link.', err.message || err);
    }
  }

  // Fallback to a mock short URL
  const fallbackUrl = `https://rzp.io/i/mock_${orderId}`;
  console.log(`[Razorpay] Fallback mock link generated: ${fallbackUrl}`);
  return fallbackUrl;
}
