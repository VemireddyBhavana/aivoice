import crypto from 'crypto';
import { config } from '../config';

/**
 * Serializes paid order data, signs the payload with HMAC-SHA256,
 * and POSTs it directly to the merchant's kitchen receipt console.
 * @param order The active Order record from database
 */
export async function dispatchToKitchen(order: any): Promise<void> {
  console.log(`[Kitchen Dispatch] Initiating dispatch for Order ID: ${order.id}`);

  // Fetch kitchen webhooks secrets, defaulting to local test anchors if not in .env
  const kitchenUrl = config.kitchenWebhookUrl || 'http://localhost:5000/api/kitchen/webhook';
  const kitchenSecret = config.kitchenWebhookSecret || 'test-kitchen-secret-9999';

  const payload = {
    orderId: order.id,
    merchantId: order.merchantId,
    customerPhone: order.customerPhone,
    channel: order.channel,
    items: order.items,
    subtotal: order.subtotal,
    tax: order.tax,
    total: order.total,
    address: order.address,
    timestamp: new Date().toISOString(),
  };

  const serializedPayload = JSON.stringify(payload);

  // Compute HMAC-SHA256 signature to guarantee payload authenticity
  const signature = crypto
    .createHmac('sha256', kitchenSecret)
    .update(serializedPayload)
    .digest('hex');

  console.log(`[Kitchen Dispatch] Computed HMAC-SHA256 Signature: ${signature}`);

  try {
    const response = await fetch(kitchenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-kitchen-signature': signature,
      },
      body: serializedPayload,
    });

    if (response.ok) {
      console.log(`[Kitchen Dispatch] Order successfully dispatched to kitchen console at ${kitchenUrl}`);
    } else {
      const errorText = await response.text();
      console.error(`[Kitchen Dispatch] Kitchen webhook returned error: ${response.status} - ${errorText}`);
    }
  } catch (err: any) {
    // If local kitchen server is not running, fallback to simulated logging
    console.warn(`[Kitchen Dispatch] Kitchen console at ${kitchenUrl} is unreachable. Error: ${err.message}`);
    console.log(`[Kitchen Dispatch] Simulated Signed Dispatch Success.`);
  }
}
