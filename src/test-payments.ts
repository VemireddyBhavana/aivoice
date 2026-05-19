import express from 'express';
import crypto from 'crypto';
import { prisma } from './db';
import { paymentsRouter } from './routes/payments';

async function runPaymentsVerificationSimulation() {
  console.log(`\n==================================================`);
  console.log(`💳 Starting Cryptographic Payment Webhook Simulator`);
  console.log(`==================================================\n`);

  const mockOrderId = `order-test-${Math.floor(Math.random() * 10000)}`;
  const testSecret = 'test-razorpay-secret-7777';
  const testPort = 5999;

  // 1. Scaffold database structures for simulation
  try {
    console.log('[Simulator] Ensuring test merchant and pending order are in database...');
    const merchantId = 'test-merchant-1234';

    await prisma.merchant.upsert({
      where: { id: merchantId },
      update: {},
      create: {
        id: merchantId,
        name: 'Chai & Chutney',
        phone: '+919876543210',
      },
    });

    // Create a pending Order in database
    await prisma.order.create({
      data: {
        id: mockOrderId,
        merchantId: merchantId,
        customerPhone: '+919876500000',
        channel: 'WHATSAPP',
        items: [{ menuItemId: 'item-1', name: 'Mango Lassi', price: 80, quantity: 1 }],
        subtotal: 80,
        tax: 4,
        total: 84,
        address: 'HSR Layout, Bangalore',
        paymentStatus: 'PENDING',
        deliveryStatus: 'RECEIVED',
      },
    });

    console.log(`[Simulator] Prepared mock pending order in DB: "${mockOrderId}"`);
  } catch (err: any) {
    console.error('\n❌ [Simulator DB Setup Error]:', err.message);
    if (err.message.includes('Can\'t reach database server')) {
      console.log('\n💡 Seeding simulator database structures failed. Proceeding with in-memory execution test...');
    }
  }

  // 2. Initialize in-process test Express server
  const testApp = express();
  
  // Configure raw body capture
  testApp.use(express.json({
    verify: (req: any, res, buf) => {
      req.rawBody = buf;
    }
  }));

  // Mount payments router under the test server
  testApp.use('/api/payments', paymentsRouter);

  const server = testApp.listen(testPort, async () => {
    console.log(`[Simulator] In-process Express server booted on port ${testPort}`);

    // 3. Prepare mock Razorpay Webhook Event Payload
    const webhookPayload = {
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_test_123',
            order_id: 'rzp_order_abc',
            receipt: mockOrderId,
            amount: 8400, // paise
            status: 'captured',
            notes: {
              orderId: mockOrderId
            }
          }
        }
      }
    };

    const serializedPayload = JSON.stringify(webhookPayload);

    // Compute expected cryptographic HMAC-SHA256 signature
    const signature = crypto
      .createHmac('sha256', testSecret)
      .update(serializedPayload)
      .digest('hex');

    console.log(`[Simulator] Generated Webhook Signature: "${signature}"`);

    // 4. Dispatch local HTTP POST request to test verification
    try {
      console.log('[Simulator] Sending signed webhook payload to test endpoint...');
      const response = await fetch(`http://localhost:${testPort}/api/payments/webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-razorpay-signature': signature,
        },
        body: serializedPayload,
      });

      const responseBody = await response.json();
      console.log(`[Simulator] Webhook Endpoint Status: ${response.status}`, responseBody);

      if (response.ok) {
        console.log('\n==================================================');
        console.log('✅ Cryptographic signature verified successfully!');
        console.log('==================================================');
      } else {
        console.error('\n❌ Webhook processing failed.');
      }
    } catch (reqErr: any) {
      console.error('[Simulator] HTTP Client Request Failed:', reqErr.message);
    } finally {
      // 5. Tear down Express server
      console.log('\n[Simulator] Tearing down in-process Express server...');
      server.close(async () => {
        console.log('[Simulator] Server terminated.');
        await prisma.$disconnect();
      });
    }
  });
}

runPaymentsVerificationSimulation();
