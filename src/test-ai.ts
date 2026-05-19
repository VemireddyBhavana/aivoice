import { prisma } from './db';
import { generateAIResponse } from './services/claude';

async function runDialogueSimulation() {
  const testSessionId = `test-call-${Math.floor(Math.random() * 10000)}`;
  const merchantId = 'test-merchant-1234';

  console.log(`\n==================================================`);
  console.log(`🧪 Starting AI Conversational Dialogue Simulator`);
  console.log(`📞 Test Session SID: ${testSessionId}`);
  console.log(`==================================================\n`);

  try {
    // 1. Scaffold database structures for simulation
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

    // Make sure we have at least some items in case seeder wasn't run
    const menuCount = await prisma.menuItem.count({ where: { merchantId } });
    if (menuCount === 0) {
      console.log('[Simulator] Creating fallback menu items for testing...');
      await prisma.menuItem.createMany({
        data: [
          { merchantId, name: 'Paneer Butter Masala', price: 249, aliases: ['pbm', 'paneer butter'] },
          { merchantId, name: 'Garlic Naan', price: 60, aliases: ['naan', 'garlic naan'] },
          { merchantId, name: 'Mango Lassi', price: 80, aliases: ['lassi', 'mango lassi'] },
        ],
      });
    }

    // Initialize session
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

    // Initialize call log
    await prisma.callLog.create({
      data: {
        id: testSessionId,
        sessionId: testSessionId,
        transcript: [],
      },
    });

    // 2. Run simulation conversation thread turns
    const dialogueTurns = [
      'Hi there, what do you have on the menu?',
      'Awesome. Ek paneer butter masala aur do garlic naan add kar do please.',
      'Haan ji, delete one garlic naan.',
      'Address is 102 Park Avenue, Sector 5, Bangalore.',
      'Yes, please confirm the order.',
    ];

    for (let turn = 0; turn < dialogueTurns.length; turn++) {
      const userText = dialogueTurns[turn];
      console.log(`\n🗣️  [Turn ${turn + 1}] Customer: "${userText}"`);
      
      const aiReply = await generateAIResponse(testSessionId, userText);
      console.log(`🧠 [Turn ${turn + 1}] Claude: "${aiReply}"`);

      // Query and display updated database cart state
      const session = await prisma.customerSession.findUnique({
        where: { id: testSessionId },
      });

      if (session) {
        const cart: any = typeof session.activeCart === 'string' ? JSON.parse(session.activeCart) : session.activeCart;
        console.log(`🛒 [Database Cart]:`, cart.items);
        console.log(`📍 [Database State]: "${session.currentState}"`);
      }
    }

    // Verify created order
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
    } else {
      console.log('⚠️ No orders found in database for this customer.');
    }

  } catch (err: any) {
    console.error('\n❌ [Simulator Error]:', err.message);
    if (err.message.includes('Can\'t reach database server')) {
      console.log('\n💡 Seeding simulator compiled successfully! Running the simulator requires a live PostgreSQL/Supabase database setup.');
    }
  } finally {
    await prisma.$disconnect();
  }
}

runDialogueSimulation();
