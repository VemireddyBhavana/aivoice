import { useState, useEffect } from 'react';
import { 
  ClipboardList, 
  Utensils, 
  PhoneCall, 
  BarChart3, 
  Settings as SettingsIcon, 
  UtensilsCrossed 
} from 'lucide-react';
import { 
  initialOrders, 
  initialMenuItems, 
  initialActiveCalls, 
  callLogs, 
} from './mockData';
import type { Order, MenuItem, ActiveCall, CallLog } from './mockData';
import LiveOrders from './pages/LiveOrders';
import Menu from './pages/Menu';
import ConversationReplay from './pages/ConversationReplay';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import api from './services/api';

export default function App() {
  const [activeView, setActiveView] = useState<'orders' | 'menu' | 'replays' | 'reports' | 'settings'>('orders');
  
  // Shared Live Database / Fallback Mock States
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(initialMenuItems);
  const [activeCalls, setActiveCalls] = useState<ActiveCall[]>(initialActiveCalls);
  const [callLogsList, setCallLogsList] = useState<CallLog[]>(callLogs);
  const [isLive, setIsLive] = useState(false);
  
  // Settings States
  const [restaurantName, setRestaurantName] = useState('Chai & Chutney');
  const [greetingText, setGreetingText] = useState(
    'Namaste! Chai aur Chutney mein aapka swagat hai. Main Rahul hoon, aapka automated voice buddy. Main aapka order le sakta hoon.'
  );
  const [selectedVoice, setSelectedVoice] = useState('Rachel');

  // Real-time synchronization loader
  const syncWithBackend = async () => {
    try {
      const connected = await api.checkHealth();
      setIsLive(connected);
      if (connected) {
        // Retrieve Live Orders
        const fetchedOrders = await api.getOrders();
        if (fetchedOrders && fetchedOrders.length > 0) {
          setOrders(fetchedOrders);
        }
        
        // Retrieve Live Menu Catalog
        const fetchedMenu = await api.getMenuItems();
        if (fetchedMenu && fetchedMenu.length > 0) {
          setMenuItems(fetchedMenu);
        }

        // Retrieve Active Ongoing Telephonies
        const fetchedActiveCalls = await api.getActiveCalls();
        setActiveCalls(fetchedActiveCalls);

        // Retrieve Dialogue Conversation Logs
        const fetchedLogs = await api.getCallLogs();
        if (fetchedLogs && fetchedLogs.length > 0) {
          setCallLogsList(fetchedLogs);
        }

        // Retrieve AI Configurations
        const fetchedSettings = await api.getSettings();
        if (fetchedSettings) {
          setRestaurantName(fetchedSettings.restaurantName);
          setGreetingText(fetchedSettings.greetingText);
          setSelectedVoice(fetchedSettings.selectedVoice);
        }
      }
    } catch (err) {
      console.log('[API Sync] Database offline fallback active:', err);
    }
  };

  // Run initial sync and poll ongoing calls every 4 seconds to animate voice pipelines
  useEffect(() => {
    syncWithBackend();
    const interval = setInterval(syncWithBackend, 4000);
    return () => clearInterval(interval);
  }, []);

  // Update order status in UI and DB
  const updateOrderStatus = async (orderId: string, newStatus: Order['deliveryStatus']) => {
    // Optimistic UI update
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, deliveryStatus: newStatus } : o));
    
    if (isLive) {
      try {
        await api.updateOrderStatus(orderId, newStatus);
      } catch (err) {
        console.error('[API Sync] Failed to update delivery status in PostgreSQL:', err);
      }
    }
  };

  // Add menu item in UI and DB
  const addMenuItem = async (item: Omit<MenuItem, 'id'>) => {
    if (isLive) {
      try {
        const created = await api.createMenuItem(item);
        setMenuItems(prev => [...prev, created]);
      } catch (err) {
        console.error('[API Sync] Failed to create item in PostgreSQL:', err);
      }
    } else {
      const newItem: MenuItem = {
        ...item,
        id: `item-${Date.now()}`
      };
      setMenuItems(prev => [...prev, newItem]);
    }
  };

  // Toggle item availability in UI and DB
  const toggleItemAvailability = async (id: string) => {
    // Optimistic UI update
    setMenuItems(prev => prev.map(item => item.id === id ? { ...item, isAvailable: !item.isAvailable } : item));
    
    if (isLive) {
      try {
        await api.toggleMenuItem(id);
      } catch (err) {
        console.error('[API Sync] Failed to toggle item availability in PostgreSQL:', err);
      }
    }
  };

  // Save Settings configuration trigger
  const handleSaveSettings = async () => {
    if (isLive) {
      try {
        await api.saveSettings({
          restaurantName,
          greetingText,
          selectedVoice
        });
      } catch (err) {
        console.error('[API Sync] Failed to sync settings to database:', err);
      }
    }
  };

  const renderActiveView = () => {
    switch (activeView) {
      case 'orders':
        return (
          <LiveOrders 
            orders={orders} 
            activeCalls={activeCalls} 
            updateOrderStatus={updateOrderStatus} 
          />
        );
      case 'menu':
        return (
          <Menu 
            menuItems={menuItems} 
            addMenuItem={addMenuItem} 
            toggleItemAvailability={toggleItemAvailability} 
          />
        );
      case 'replays':
        return (
          <ConversationReplay 
            callLogsList={callLogsList} 
          />
        );
      case 'reports':
        return (
          <Reports 
            orders={orders} 
          />
        );
      case 'settings':
        return (
          <Settings 
            restaurantName={restaurantName}
            setRestaurantName={setRestaurantName}
            greetingText={greetingText}
            setGreetingText={setGreetingText}
            selectedVoice={selectedVoice}
            setSelectedVoice={setSelectedVoice}
            onSave={handleSaveSettings}
          />
        );
      default:
        return <LiveOrders orders={orders} activeCalls={activeCalls} updateOrderStatus={updateOrderStatus} />;
    }
  };

  return (
    <div className="app-container">
      {/* SIDEBAR NAVIGATION */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo-glow">
            <UtensilsCrossed size={18} color="#000" />
          </div>
          <span className="logo-text">{restaurantName} AI</span>
        </div>

        <nav className="sidebar-nav">
          <button 
            className={`nav-link ${activeView === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveView('orders')}
          >
            <ClipboardList size={18} />
            Live Orders
          </button>
          
          <button 
            className={`nav-link ${activeView === 'menu' ? 'active' : ''}`}
            onClick={() => setActiveView('menu')}
          >
            <Utensils size={18} />
            Menu Catalog
          </button>

          <button 
            className={`nav-link ${activeView === 'replays' ? 'active' : ''}`}
            onClick={() => setActiveView('replays')}
          >
            <PhoneCall size={18} />
            Call Recs & Logs
          </button>

          <button 
            className={`nav-link ${activeView === 'reports' ? 'active' : ''}`}
            onClick={() => setActiveView('reports')}
          >
            <BarChart3 size={18} />
            Sales Reports
          </button>

          <button 
            className={`nav-link ${activeView === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveView('settings')}
          >
            <SettingsIcon size={18} />
            AI Configs
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="status-indicator">
            <div className={`status-dot ${isLive ? 'status-live' : 'status-sandbox'}`}></div>
            <span style={{ color: isLive ? 'var(--accent-cyan)' : 'var(--accent-amber)', fontWeight: 700 }}>
              {isLive ? 'DATABASE LIVE CONNECTED' : 'SANDBOX SIMULATOR'}
            </span>
          </div>
        </div>
      </aside>

      {/* WORKSPACE CONTENT AREA */}
      <main className="main-content">
        {renderActiveView()}
      </main>
    </div>
  );
}
