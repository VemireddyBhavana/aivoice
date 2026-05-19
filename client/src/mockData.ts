// ==========================================
// 🧪 HIGH-FIDELITY MOCK DATABASE FOR CONSOLE
// ==========================================

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  description: string;
  aliases: string[];
  isAvailable: boolean;
}

export interface OrderItem {
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  customerPhone: string;
  channel: 'VOICE' | 'WHATSAPP';
  items: OrderItem[];
  total: number;
  address: string;
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED';
  deliveryStatus: 'RECEIVED' | 'PREPARING' | 'DISPATCHED' | 'DELIVERED';
  createdAt: string;
}

export interface ActiveCall {
  id: string;
  customerPhone: string;
  status: 'GREETING' | 'ORDERING' | 'VERIFYING' | 'COMPLETED';
  lastUtterance: string;
  speaker: 'AI' | 'CUSTOMER';
  duration: number;
}

export interface CallLog {
  id: string;
  customerPhone: string;
  date: string;
  duration: number;
  transcript: { role: 'ai' | 'customer'; text: string; time: string }[];
}

export const initialMenuItems: MenuItem[] = [
  {
    id: 'item-1',
    name: 'Paneer Butter Masala',
    price: 249,
    description: 'Rich and creamy cottage cheese cubes in tomato butter gravy.',
    aliases: ['pbm', 'paneer butter', 'butter paneer masala'],
    isAvailable: true,
  },
  {
    id: 'item-2',
    name: 'Garlic Naan',
    price: 60,
    description: 'Traditional leavened flatbread topped with minced garlic and butter.',
    aliases: ['naan', 'lasooni naan', 'garlic bread'],
    isAvailable: true,
  },
  {
    id: 'item-3',
    name: 'Mango Lassi',
    price: 80,
    description: 'Refreshing sweet yogurt beverage flavored with Alphonso mango pulp.',
    aliases: ['lassi', 'mango drink', 'aam lassi'],
    isAvailable: true,
  },
  {
    id: 'item-4',
    name: 'Butter Chicken',
    price: 289,
    description: 'Tender chicken tikka cooked in velvety spiced butter sauce.',
    aliases: ['chicken tikka masala', 'bc', 'murgh makhani'],
    isAvailable: true,
  },
  {
    id: 'item-5',
    name: 'Tandoori Roti',
    price: 25,
    description: 'Whole wheat flatbread baked in traditional clay tandoor.',
    aliases: ['roti', 'plain roti'],
    isAvailable: true,
  },
];

export const initialOrders: Order[] = [
  {
    id: 'ord-9921',
    customerPhone: '+91 98765 00123',
    channel: 'VOICE',
    items: [
      { name: 'Paneer Butter Masala', price: 249, quantity: 1 },
      { name: 'Garlic Naan', price: 60, quantity: 2 },
    ],
    total: 369,
    address: 'Flat 402, Signature Residency, Sector 4, Bangalore',
    paymentStatus: 'PAID',
    deliveryStatus: 'PREPARING',
    createdAt: '2026-05-19T14:30:00Z',
  },
  {
    id: 'ord-9922',
    customerPhone: '+91 99998 88888',
    channel: 'WHATSAPP',
    items: [
      { name: 'Mango Lassi', price: 80, quantity: 3 },
    ],
    total: 240,
    address: 'Room 12, Hostels block B, IIT Campus, Bangalore',
    paymentStatus: 'PAID',
    deliveryStatus: 'RECEIVED',
    createdAt: '2026-05-19T14:40:00Z',
  },
  {
    id: 'ord-9920',
    customerPhone: '+91 91234 56789',
    channel: 'VOICE',
    items: [
      { name: 'Butter Chicken', price: 289, quantity: 1 },
      { name: 'Tandoori Roti', price: 25, quantity: 3 },
      { name: 'Mango Lassi', price: 80, quantity: 1 },
    ],
    total: 444,
    address: '102 Park Avenue, Sector 5, Bangalore',
    paymentStatus: 'PENDING',
    deliveryStatus: 'DELIVERED',
    createdAt: '2026-05-19T13:15:00Z',
  },
];

export const initialActiveCalls: ActiveCall[] = [
  {
    id: 'call-tw-881a',
    customerPhone: '+91 98765 44321',
    status: 'ORDERING',
    lastUtterance: 'Bro, ek butter paneer aur do garlic naan daal dena',
    speaker: 'CUSTOMER',
    duration: 48,
  },
  {
    id: 'call-tw-90a2',
    customerPhone: '+91 96666 55555',
    status: 'VERIFYING',
    lastUtterance: 'Okay, I am sending the Razorpay payment link to your WhatsApp.',
    speaker: 'AI',
    duration: 112,
  },
];

export const callLogs: CallLog[] = [
  {
    id: 'call-tw-881a',
    customerPhone: '+91 98765 44321',
    date: '2026-05-19 14:15',
    duration: 62,
    transcript: [
      { role: 'ai', text: 'Namaste! Chai aur Chutney mein aapka swagat hai. Main Rahul hoon, aapka automated voice buddy. Main aapka order le sakta hoon. Aaj aap kya khana chahenge?', time: '14:15:02' },
      { role: 'customer', text: 'Hey, mujhe ek paneer butter masala aur do garlic naan chahiye.', time: '14:15:10' },
      { role: 'ai', text: 'Cottage cheese butter gravy plus do garlic naan! Bohot badhiya choice! Aur hamara popular item Mango Lassi bhi order karna chahenge kya?', time: '14:15:15' },
      { role: 'customer', text: 'Haan, ek mango lassi bhi add kar do.', time: '14:15:20' },
      { role: 'ai', text: 'Done! Aapka cart hai: ek Paneer Butter Masala, do Garlic Naan aur ek Mango Lassi. Kya main ise final karoon?', time: '14:15:26' },
      { role: 'customer', text: 'Ha, confirm kar do.', time: '14:15:31' },
    ],
  },
  {
    id: 'call-tw-90a2',
    customerPhone: '+91 96666 55555',
    date: '2026-05-19 13:58',
    duration: 120,
    transcript: [
      { role: 'ai', text: 'Welcome back to Chai & Chutney! AAP ka pichla favorite Mango Lassi repeat karein kya?', time: '13:58:05' },
      { role: 'customer', text: 'Nahi, aaj direct ek Butter Chicken aur teen tandoori roti pack kar do.', time: '13:58:12' },
      { role: 'ai', text: 'Ok, ek Butter Chicken aur teen Plain Tandoori Roti. Kya main aapka delivery address confirm kar sakta hoon?', time: '13:58:18' },
      { role: 'customer', text: 'Haa, sector 5 park avenue mansion.', time: '13:58:25' },
    ],
  },
];
