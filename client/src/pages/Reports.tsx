import { 
  TrendingUp, 
  IndianRupee, 
  ShoppingBag, 
  PhoneOff,
  Percent
} from 'lucide-react';
import type { Order } from '../mockData';

interface ReportsProps {
  orders: Order[];
}

export default function Reports({ orders }: ReportsProps) {
  
  // 1. Calculate Analytics Metrics from orders list
  const totalOrders = orders.length;
  const paidOrders = orders.filter(o => o.paymentStatus === 'PAID');
  const totalRevenue = paidOrders.reduce((sum, o) => sum + o.total, 0);
  const aov = totalOrders > 0 ? Math.round(totalRevenue / paidOrders.length) : 0;
  
  // Calculate simulated call analytics
  const abandonedCallsCount = 1; // 1 out of 3 calls mock abandoned
  const totalCallsInitiated = totalOrders + abandonedCallsCount;
  const conversionRate = totalCallsInitiated > 0 
    ? Math.round((totalOrders / totalCallsInitiated) * 100) 
    : 0;

  // 2. Aggregate menu items to find popular dishes
  const itemCounts: Record<string, number> = {};
  orders.forEach(order => {
    order.items.forEach(item => {
      itemCounts[item.name] = (itemCounts[item.name] || 0) + item.quantity;
    });
  });

  const topItemsSorted = Object.entries(itemCounts)
    .map(([name, qty]) => ({ name, qty }))
    .sort((a, b) => b.qty - a.qty);

  // Mock Sales Trend Data for pure CSS Graph rendering
  const salesHistory = [
    { date: 'Mon', revenue: 1450 },
    { date: 'Tue', revenue: 1820 },
    { date: 'Wed', revenue: 2200 },
    { date: 'Thu', revenue: 1950 },
    { date: 'Fri', revenue: 3100 },
    { date: 'Sat', revenue: 4500 },
    { date: 'Sun', revenue: totalRevenue + 1200 } // dynamic spike
  ];

  const maxRevenue = Math.max(...salesHistory.map(s => s.revenue));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {/* PAGE HEADER */}
      <div>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.5px' }}>Business Intelligence Dashboard</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Analyze kitchen conversions, average ticket sizes, and item categories.</p>
      </div>

      {/* METRIC DASHBOARD WIDGETS */}
      <div className="grid-cols-4">
        
        {/* Metric 1: Paid Revenue */}
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IndianRupee size={22} color="var(--accent-emerald)" />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Sales</span>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>₹{totalRevenue}</h2>
          </div>
        </div>

        {/* Metric 2: Completed Orders */}
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'rgba(6, 182, 212, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShoppingBag size={22} color="var(--accent-cyan)" />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Orders</span>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>{totalOrders}</h2>
          </div>
        </div>

        {/* Metric 3: AOV */}
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'rgba(168, 85, 247, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TrendingUp size={22} color="var(--accent-purple)" />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Avg Order Value</span>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>₹{aov}</h2>
          </div>
        </div>

        {/* Metric 4: Conversation Conversion */}
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Percent size={22} color="var(--accent-amber)" />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Call Conversion</span>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>{conversionRate}%</h2>
          </div>
        </div>

      </div>

      {/* CHARTS CONTAINER GRID */}
      <div className="grid-cols-2">
        
        {/* CHART 1: WEEKLY SALES GROWTH (Pure CSS Glass Graph) */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Weekly Telephony Sales Trend</h3>
          
          <div style={{ display: 'flex', alignItems: 'flex-end', height: '240px', gap: '16px', padding: '10px 0', borderBottom: '1px solid var(--border-glass)' }}>
            {salesHistory.map((day, idx) => {
              const heightPercent = Math.round((day.revenue / maxRevenue) * 90);
              return (
                <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', height: '100%', justifyContent: 'flex-end' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>₹{day.revenue}</span>
                  
                  {/* Glowing Bar */}
                  <div 
                    style={{ 
                      width: '100%', 
                      height: `${heightPercent}%`, 
                      background: 'linear-gradient(180deg, var(--accent-cyan), rgba(6, 182, 212, 0.05))',
                      borderRadius: '8px 8px 0 0',
                      boxShadow: '0 0 10px rgba(6, 182, 212, 0.2)',
                      transition: 'height 0.5s ease-out'
                    }}
                  />
                  
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{day.date}</span>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <span>* Simulated telemetry logs mapped to Razorpay Webhooks</span>
            <span>Update: Just now</span>
          </div>
        </div>

        {/* CHART 2: POPULAR ITEMS & MISSED CALL RATIO */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Best-Selling Dishes & Telephony Funnel</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
            {topItemsSorted.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                No active orders recorded yet.
              </div>
            ) : (
              topItemsSorted.slice(0, 3).map((item, idx) => {
                const totalQuantitySold = topItemsSorted.reduce((sum, i) => sum + i.qty, 0);
                const pct = Math.round((item.qty / totalQuantitySold) * 100);
                return (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <span style={{ fontWeight: 600 }}>{idx + 1}. {item.name}</span>
                      <span style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>{item.qty} units sold ({pct}%)</span>
                    </div>
                    {/* Progress Bar background */}
                    <div style={{ height: '8px', width: '100%', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, backgroundColor: 'var(--accent-cyan)', borderRadius: '4px', boxShadow: '0 0 8px var(--accent-cyan)' }} />
                    </div>
                  </div>
                );
              })
            )}

            <hr style={{ border: 0, borderBottom: '1px solid var(--border-glass)', margin: '4px 0' }} />

            {/* Missed / Abandoned Calls tracker */}
            <div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--accent-amber)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <PhoneOff size={14} /> Missed Call Telemetry
              </h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '135%' }}>
                Abandoned session counts capture customers who hung up during `GREETING` or `ORDERING` stages before lock-in order confirmation.
              </p>
              <div style={{ display: 'flex', gap: '20px', marginTop: '12px' }}>
                <div>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Abandoned Calls</span>
                  <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-danger)' }}>{abandonedCallsCount} Call</span>
                </div>
                <div>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Abandoned Rate</span>
                  <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-danger)' }}>
                    {Math.round((abandonedCallsCount / totalCallsInitiated) * 100)}%
                  </span>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
