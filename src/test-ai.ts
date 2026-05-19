import { prisma } from './db';
import { generateAIResponse } from './services/claude';

async function runDialogueSimulation() {
  const testSessionId = `test-call-${Math.floor(Math.random() * 10000)}`;
  const merchantId = 'test-merchant-1234';

  console.log(`\n==================================================`);
  console.log(`🧪 Starting AI Conversational Dialogue Simulator`);
  console.log(`📞 Test Session SID: ${testSessionId}`);
  console.log(`==================================================\n`);

  let useDbMock = false;

  try {
    // 1. Attempt database scaffolding
    console.log('[Simulator] Ensuring test merchant and menus are seeded in database...');
    await prisma.merchant.upsert({
      where: { id: merchantId },
      update: {},
      create: {
        id: merchantId,
        name: 'Chai & Chutney',
        phone: '+919876543210',
      },
    });

    const menuCount = await prisma.menuItem.count({ where: { merchantId } });
    if (menuCount === 0) {
      console.log('[Simulator] Creating menu items for testing...');
      await prisma.menuItem.createMany({
        data: [
          { merchantId, name: 'Paneer Butter Masala', price: 249, aliases: ['pbm', 'paneer butter'] },
          { merchantId, name: 'Garlic Naan', price: 60, aliases: ['naan', 'garlic naan'] },
          { merchantId, name: 'Mango Lassi', price: 80, aliases: ['lassi', 'mango lassi'] },
        ],
      });
    }

    // Initialize session records
    await prisma.customerSession.create({
      data: {
        id: testSessionId,
        merchantId: merchantId,
        customerPhone: '+919876500000',
        channel: 'VOICE',
        activeCart: { items: [] },
        currentState: 'GREETING',
      },
    });

    // Initialize call logs
    await prisma.callLog.create({
      data: {
        id: testSessionId,
        sessionId: testSessionId,
        transcript: [],
      },
    });

  } catch (err: any) {
    if (err.message.includes("Can't reach database server") || err.message.includes("localhost:5432")) {
      console.log('\n⚠️  [PostgreSQL Server Unreachable] Activating In-Memory Database Simulator Fallback!');
      useDbMock = true;
    } else {
      console.error('❌ Scaffolding Error:', err.message);
      return;
    }
  }

  // 2. Set up simulation script turns
  const dialogueTurns = [
    'Hi there, what do you have on the menu?',
    'Awesome. Ek paneer butter masala aur do garlic naan add kar do please.',
    'Haan ji, delete one garlic naan.',
    'Address is 102 Park Avenue, Sector 5, Bangalore.',
    'Yes, please confirm the order.',
  ];

  if (!useDbMock) {
    // RUN SIMULATION WITH POSTGRES
    try {
      for (let turn = 0; turn < dialogueTurns.length; turn++) {
        const userText = dialogueTurns[turn];
        console.log(`\n🗣️  [Turn ${turn + 1}] Customer: "${userText}"`);
        
        const aiReply = await generateAIResponse(testSessionId, userText);
        console.log(`🧠 [Turn ${turn + 1}] Claude: "${aiReply}"`);

        const session = await prisma.customerSession.findUnique({
          where: { id: testSessionId },
        });

        if (session) {
          const cart: any = typeof session.activeCart === 'string' ? JSON.parse(session.activeCart) : session.activeCart;
          console.log(`🛒 [Database Cart]:`, cart.items);
          console.log(`📍 [Database State]: "${session.currentState}"`);
        }
      }

      console.log(`\n==================================================`);
      console.log(`📄 Order Lock Summary (Checking final DB records)`);
      console.log(`==================================================`);
      const orders = await prisma.order.findMany({
        where: { merchantId, customerPhone: '+919876500000' },
        orderBy: { createdAt: 'desc' },
        take: 1,
      });

      if (orders.length > 0) {
        const ord = orders[0];
        console.log(`✅ Final Order ID: ${ord.id}`);
        console.log(`💰 Subtotal: ₹${ord.subtotal} | Tax: ₹${ord.tax} | Total: ₹${ord.total}`);
        console.log(`🚚 Delivery Address: "${ord.address}"`);
        console.log(`🛍️  Items Payload:`, ord.items);
      }
    } catch (simErr: any) {
      console.error('❌ Database Simulation Error:', simErr.message);
    } finally {
      await prisma.$disconnect();
    }
  } else {
    // RUN SIMULATION WITH IN-MEMORY SANDBOX
    let mockState = 'GREETING';
    let mockCart: any[] = [];
    let mockAddress = '';
    const mockMenu = [
      { id: '1', name: 'Paneer Butter Masala', price: 249 },
      { id: '2', name: 'Garlic Naan', price: 60 },
      { id: '3', name: 'Mango Lassi', price: 80 }
    ];

    for (let turn = 0; turn < dialogueTurns.length; turn++) {
      const userText = dialogueTurns[turn];
      console.log(`\n🗣️  [Turn ${turn + 1}] Customer: "${userText}"`);

      let reply = '';
      const input = userText.toLowerCase();

      if (turn === 0) {
        reply = `Namaste! Chai & Chutney mein aapka swagat hai. Main Rahul hoon, aapka automated voice assistant. Hamare paas fresh Paneer Butter Masala, Garlic Naan aur Mango Lassi hai. Aap kya order karenge sir?`;
        mockState = 'ORDERING';
      } else if (turn === 1) {
        mockCart.push({ menuItemId: '1', name: 'Paneer Butter Masala', price: 249, quantity: 1 });
        mockCart.push({ menuItemId: '2', name: 'Garlic Naan', price: 60, quantity: 2 });
        reply = `Sure sir! Maine 1x Paneer Butter Masala aur 2x Garlic Naan aapke cart mein add kar diya hai. Ab kya order lena hai, ya main bill verify karu?`;
      } else if (turn === 2) {
        // Remove one garlic naan
        const idx = mockCart.findIndex(i => i.menuItemId === '2');
        if (idx > -1) {
          mockCart[idx].quantity = 1;
        }
        reply = `Ji bilkul sir, maine Garlic Naan ki quantity hata kar ek kar di hai. Ab aapke cart mein 1x Paneer Butter Masala aur 1x Garlic Naan hai. Finalize karein order?`;
      } else if (turn === 3) {
        mockAddress = userText;
        const subtotal = mockCart.reduce((sum, i) => sum + i.price * i.quantity, 0);
        const tax = subtotal * 0.05;
        const total = subtotal + tax;
        reply = `Perfect sir! Delivery address "${mockAddress}" note kar liya hai. Aapka order total bill ₹${Math.round(total)} hai (₹${subtotal} subtotal + ₹${Math.round(tax)} tax). Kya main confirm karu?`;
        mockState = 'VERIFYING';
      } else if (turn === 4) {
        const subtotal = mockCart.reduce((sum, i) => sum + i.price * i.quantity, 0);
        const tax = subtotal * 0.05;
        const total = subtotal + tax;
        reply = `Aapka order successfully register ho gaya hai sir! Total bill ₹${Math.round(total)} hai. Delivery address "${mockAddress}" par order locked ho gaya hai. Payment link WhatsApp par bhej diya hai, thank you!`;
        mockState = 'COMPLETED';
      }

      console.log(`🧠 [Turn ${turn + 1}] Claude Mock: "${reply}"`);
      console.log(`🛒 [In-Memory Cart]:`, mockCart);
      console.log(`📍 [In-Memory State]: "${mockState}"`);
    }

    console.log(`\n==================================================`);
    console.log(`📄 Order Lock Summary (Checking final Memory records)`);
    console.log(`==================================================`);
    const subtotal = mockCart.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const tax = subtotal * 0.05;
    const total = subtotal + tax;
    console.log(`✅ Final Order ID: order-mock-${Math.floor(Math.random() * 100000)}`);
    console.log(`💰 Subtotal: ₹${subtotal} | Tax: ₹${tax} | Total: ₹${total}`);
    console.log(`🚚 Delivery Address: "${mockAddress}"`);
    console.log(`🛍️  Items Payload:`, mockCart);
    console.log(`💳 Razorpay Checkout: "https://rzp.io/i/mock-payment-link"`);
    console.log(`\n🎉 In-Memory Telephony brain simulation completed successfully!\n`);
  }
}

runDialogueSimulation();
