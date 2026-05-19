import axios from 'axios';
import type { Order, MenuItem, ActiveCall, CallLog } from '../mockData';

const API_BASE = 'http://localhost:5000/api';

// Create pre-configured axios instance
const client = axios.create({
  baseURL: API_BASE,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const api = {
  // Test connection to backend healthcheck
  checkHealth: async (): Promise<boolean> => {
    try {
      const res = await axios.get(`${API_BASE}/health`, { timeout: 2000 });
      return res.status === 200;
    } catch {
      return false;
    }
  },

  // Orders REST Sync
  getOrders: async (): Promise<Order[]> => {
    const res = await client.get('/merchant/orders');
    return res.data.orders;
  },

  updateOrderStatus: async (id: string, deliveryStatus: Order['deliveryStatus']): Promise<Order> => {
    const res = await client.put(`/merchant/orders/${id}/status`, { deliveryStatus });
    return res.data.order;
  },

  // Menu Catalog CRUD Sync
  getMenuItems: async (): Promise<MenuItem[]> => {
    const res = await client.get('/merchant/menu');
    return res.data.menuItems;
  },

  createMenuItem: async (item: Omit<MenuItem, 'id'>): Promise<MenuItem> => {
    const res = await client.post('/merchant/menu', item);
    return res.data.menuItem;
  },

  toggleMenuItem: async (id: string): Promise<MenuItem> => {
    const res = await client.put(`/merchant/menu/${id}/availability`);
    return res.data.menuItem;
  },

  // Telephony Voice Session Streams Sync
  getActiveCalls: async (): Promise<ActiveCall[]> => {
    const res = await client.get('/merchant/calls/active');
    return res.data.activeCalls;
  },

  getCallLogs: async (): Promise<CallLog[]> => {
    const res = await client.get('/merchant/calls/logs');
    return res.data.callLogs;
  },

  // Voice Persona configurations Sync
  getSettings: async () => {
    const res = await client.get('/merchant/settings');
    return res.data.settings;
  },

  saveSettings: async (settings: { restaurantName: string; greetingText: string; selectedVoice: string }) => {
    const res = await client.post('/merchant/settings', settings);
    return res.data.settings;
  }
};
export default api;
