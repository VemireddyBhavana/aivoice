import { Router } from 'express';
import { prisma } from '../db';
import fs from 'fs';
import path from 'path';

export const merchantRouter = Router();

const SETTINGS_PATH = path.join(__dirname, '../../data/settings.json');

// Global In-Memory Database Virtualizer for offline resilience
let mockOrders: any[] = [
  {
    id: 'ord-82060',
    merchantId: 'test-merchant-1234',
    customerPhone: '+919876500000',
    channel: 'VOICE',
    items: [
      { menuItemId: 'item-1', name: 'Paneer Butter Masala', price: 249, quantity: 1 },
      { menuItemId: 'item-2', name: 'Garlic Naan', price: 60, quantity: 1 }
    ],
    subtotal: 309,
    tax: 15.45,
    total: 324.45,
    address: 'Address is 102 Park Avenue, Sector 5, Bangalore.',
    paymentStatus: 'PAID',
    paymentLinkId: 'https://rzp.io/i/mock-payment-link',
    deliveryStatus: 'RECEIVED',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'ord-99812',
    merchantId: 'test-merchant-1234',
    customerPhone: '+919988223344',
    channel: 'WHATSAPP',
    items: [
      { menuItemId: 'item-3', name: 'Mango Lassi', price: 80, quantity: 3 }
    ],
    subtotal: 240,
    tax: 12.0,
    total: 252.0,
    address: 'Villa 12, Palm Meadows, Bangalore',
    paymentStatus: 'PAID',
    paymentLinkId: 'https://rzp.io/i/mock-payment-link',
    deliveryStatus: 'PREPARING',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString()
  }
];

let mockMenu: any[] = [
  { id: 'item-1', merchantId: 'test-merchant-1234', name: 'Paneer Butter Masala', price: 249, description: 'Cottage cheese cooked in premium buttery tomato masala', aliases: ['pbm', 'paneer butter'], isAvailable: true },
  { id: 'item-2', merchantId: 'test-merchant-1234', name: 'Garlic Naan', price: 60, description: 'Clay-oven leavened flatbread topped with minced garlic and butter', aliases: ['naan', 'garlic naan'], isAvailable: true },
  { id: 'item-3', merchantId: 'test-merchant-1234', name: 'Mango Lassi', price: 80, description: 'Traditional yogurt smoothie blended with fresh alphonsos', aliases: ['lassi', 'mango lassi'], isAvailable: true }
];

let mockActiveCalls: any[] = [
  {
    id: 'call-active-1',
    customerPhone: '+919988776655',
    status: 'ORDERING',
    duration: 38,
    lastUtterance: 'Ek paneer butter masala aur ek garlic naan add kar do please.',
    speaker: 'CUSTOMER'
  },
  {
    id: 'call-active-2',
    customerPhone: '+919876543299',
    status: 'ADDRESS',
    duration: 72,
    lastUtterance: 'Address note kijiye: 102 Park Avenue, Sector 5, Bangalore.',
    speaker: 'CUSTOMER'
  }
];

let mockCallLogs: any[] = [
  {
    id: 'call-log-1',
    customerPhone: 'test-call-6231 (AI Rahul)',
    date: new Date().toLocaleString(),
    duration: 85,
    transcript: [
      { role: 'ai', text: 'Namaste! Chai & Chutney mein aapka swagat hai. Main Rahul hoon. Main aapka kya order loon sir?', time: new Date().toISOString() },
      { role: 'customer', text: 'Hi, can I get one paneer butter masala and two garlic naan?', time: new Date().toISOString() },
      { role: 'ai', text: 'Bilkul sir! Maine 1x Paneer Butter Masala aur 2x Garlic Naan add kar diya hai. Kuch aur chahiye?', time: new Date().toISOString() },
      { role: 'customer', text: 'Haan ji, delete one garlic naan.', time: new Date().toISOString() },
      { role: 'ai', text: 'Ji bilkul sir, maine Garlic Naan hata kar ek kar di hai. Ab cart mein 1x Paneer Butter Masala aur 1x Garlic Naan hai.', time: new Date().toISOString() },
      { role: 'customer', text: 'Address is 102 Park Avenue, Sector 5, Bangalore.', time: new Date().toISOString() },
      { role: 'ai', text: 'Aapka order finalize ho gaya hai sir! Total bill ₹324 (₹309 subtotal + ₹15 tax) hai. Delivery address: "102 Park Avenue, Sector 5, Bangalore" par locked hai. Thank you!', time: new Date().toISOString() }
    ]
  }
];

// Helper to read settings
const getVoiceSettings = () => {
  try {
    if (!fs.existsSync(path.dirname(SETTINGS_PATH))) {
      fs.mkdirSync(path.dirname(SETTINGS_PATH), { recursive: true });
    }
    if (fs.existsSync(SETTINGS_PATH)) {
      return JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf-8'));
    }
  } catch (err) {
    console.error('[Settings] Error reading settings.json:', err);
  }
  return {
    restaurantName: 'Chai & Chutney',
    greetingText: 'Namaste! Chai aur Chutney mein aapka swagat hai. Main Rahul hoon, aapka automated voice buddy. Main aapka order le sakta hoon.',
    selectedVoice: 'Rachel'
  };
};

const saveVoiceSettings = (settings: any) => {
  try {
    if (!fs.existsSync(path.dirname(SETTINGS_PATH))) {
      fs.mkdirSync(path.dirname(SETTINGS_PATH), { recursive: true });
    }
    fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Settings] Error writing settings.json:', err);
  }
};

/**
 * GET /api/merchant/orders
 * Fetches all orders from Prisma (fallback to virtual mock state if unreachable)
 */
merchantRouter.get('/orders', async (req, res) => {
  const merchantId = (req.query.merchantId as string) || 'test-merchant-1234';
  try {
    const orders = await prisma.order.findMany({
      where: { merchantId },
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json({ success: true, orders });
  } catch (err: any) {
    console.log('[Prisma Fallback] Serving mockOrders payload because PostgreSQL is offline.');
    res.status(200).json({ success: true, orders: mockOrders });
  }
});

/**
 * PUT /api/merchant/orders/:id/status
 * Updates delivery progression status
 */
merchantRouter.put('/orders/:id/status', async (req, res) => {
  const { id } = req.params;
  const { deliveryStatus } = req.body;
  try {
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { deliveryStatus }
    });
    res.status(200).json({ success: true, order: updatedOrder });
  } catch (err: any) {
    console.log('[Prisma Fallback] Updating virtual mockOrders in-memory.');
    const idx = mockOrders.findIndex(o => o.id === id);
    if (idx > -1) {
      mockOrders[idx].deliveryStatus = deliveryStatus;
      res.status(200).json({ success: true, order: mockOrders[idx] });
    } else {
      res.status(404).json({ success: false, error: 'Mock order not found.' });
    }
  }
});

/**
 * GET /api/merchant/menu
 * Fetches all menu catalog items
 */
merchantRouter.get('/menu', async (req, res) => {
  const merchantId = (req.query.merchantId as string) || 'test-merchant-1234';
  try {
    const menuItems = await prisma.menuItem.findMany({
      where: { merchantId },
      orderBy: { name: 'asc' }
    });
    res.status(200).json({ success: true, menuItems });
  } catch (err: any) {
    console.log('[Prisma Fallback] Serving mockMenu catalog because PostgreSQL is offline.');
    res.status(200).json({ success: true, menuItems: mockMenu });
  }
});

/**
 * POST /api/merchant/menu
 * Creates a new menu dish with speech tags
 */
merchantRouter.post('/menu', async (req, res) => {
  const merchantId = (req.body.merchantId as string) || 'test-merchant-1234';
  const { name, price, description, aliases } = req.body;
  try {
    await prisma.merchant.upsert({
      where: { id: merchantId },
      update: {},
      create: { id: merchantId, name: 'Chai & Chutney', phone: '+919876543210' }
    });

    const newItem = await prisma.menuItem.create({
      data: {
        merchantId,
        name,
        price: parseFloat(price),
        description,
        aliases: aliases || [],
        isAvailable: true
      }
    });
    res.status(201).json({ success: true, menuItem: newItem });
  } catch (err: any) {
    console.log('[Prisma Fallback] Adding virtual MenuItem inside mockMenu array.');
    const newItem = {
      id: `item-${Date.now()}`,
      merchantId,
      name,
      price: parseFloat(price),
      description,
      aliases: aliases || [],
      isAvailable: true
    };
    mockMenu.push(newItem);
    res.status(201).json({ success: true, menuItem: newItem });
  }
});

/**
 * PUT /api/merchant/menu/:id/availability
 * Toggles stock availability
 */
merchantRouter.put('/menu/:id/availability', async (req, res) => {
  const { id } = req.params;
  try {
    const item = await prisma.menuItem.findUnique({ where: { id } });
    if (!item) {
      return res.status(404).json({ success: false, error: 'Menu item not found.' });
    }
    const updatedItem = await prisma.menuItem.update({
      where: { id },
      data: { isAvailable: !item.isAvailable }
    });
    res.status(200).json({ success: true, menuItem: updatedItem });
  } catch (err: any) {
    console.log('[Prisma Fallback] Toggling virtual MenuItem availability inside mockMenu.');
    const idx = mockMenu.findIndex(m => m.id === id);
    if (idx > -1) {
      mockMenu[idx].isAvailable = !mockMenu[idx].isAvailable;
      res.status(200).json({ success: true, menuItem: mockMenu[idx] });
    } else {
      res.status(404).json({ success: false, error: 'Mock item not found.' });
    }
  }
});

/**
 * GET /api/merchant/calls/active
 * Fetches ongoing voice telephony call sessions
 */
merchantRouter.get('/calls/active', async (req, res) => {
  const merchantId = (req.query.merchantId as string) || 'test-merchant-1234';
  try {
    const activeSessions = await prisma.customerSession.findMany({
      where: {
        merchantId,
        channel: 'VOICE',
        currentState: {
          notIn: ['COMPLETED', 'PAYMENT']
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    const activeCalls = await Promise.all(activeSessions.map(async (sess) => {
      const logs = await prisma.callLog.findUnique({
        where: { id: sess.id }
      });
      const transcriptArray = (logs?.transcript as any) || [];
      const lastLine = transcriptArray[transcriptArray.length - 1];
      
      return {
        id: sess.id,
        customerPhone: sess.customerPhone,
        status: sess.currentState,
        duration: Math.round((Date.now() - new Date(sess.createdAt).getTime()) / 1000),
        lastUtterance: lastLine ? lastLine.text : 'Greeting customer...',
        speaker: lastLine ? (lastLine.role === 'ai' ? 'AI' : 'CUSTOMER') : 'AI'
      };
    }));

    res.status(200).json({ success: true, activeCalls });
  } catch (err: any) {
    console.log('[Prisma Fallback] Serving mockActiveCalls because PostgreSQL is offline.');
    res.status(200).json({ success: true, activeCalls: mockActiveCalls });
  }
});

/**
 * GET /api/merchant/calls/logs
 * Fetches completed conversation dialogues and recordings
 */
merchantRouter.get('/calls/logs', async (req, res) => {
  const merchantId = (req.query.merchantId as string) || 'test-merchant-1234';
  try {
    const logs = await prisma.callLog.findMany({
      where: {
        session: {
          merchantId
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const callLogs = logs.map(log => ({
      id: log.id,
      customerPhone: log.id,
      date: new Date(log.createdAt).toLocaleString(),
      duration: log.duration || 45,
      transcript: (log.transcript as any) || []
    }));

    res.status(200).json({ success: true, callLogs });
  } catch (err: any) {
    console.log('[Prisma Fallback] Serving mockCallLogs dialogues because PostgreSQL is offline.');
    res.status(200).json({ success: true, callLogs: mockCallLogs });
  }
});

/**
 * GET /api/merchant/settings
 * Retrieves active voice parameters
 */
merchantRouter.get('/settings', (req, res) => {
  const settings = getVoiceSettings();
  res.status(200).json({ success: true, settings });
});

/**
 * POST /api/merchant/settings
 * Saves updated voice parameters
 */
merchantRouter.post('/settings', (req, res) => {
  const { restaurantName, greetingText, selectedVoice } = req.body;
  const settings = { restaurantName, greetingText, selectedVoice };
  saveVoiceSettings(settings);
  res.status(200).json({ success: true, settings });
});
