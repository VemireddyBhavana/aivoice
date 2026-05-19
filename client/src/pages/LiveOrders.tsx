import { 
  Phone, 
  MessageSquare, 
  ChefHat, 
  Truck, 
  CheckCircle2, 
  Radio, 
  IndianRupee,
  Clock
} from 'lucide-react';
import type { Order, ActiveCall } from '../mockData';

interface LiveOrdersProps {
  orders: Order[];
  activeCalls: ActiveCall[];
  updateOrderStatus: (id: string, status: Order['deliveryStatus']) => void;
}

export default function LiveOrders({ orders, activeCalls, updateOrderStatus }: LiveOrdersProps) {
  
  // Categorize orders into cooking status lanes
  const laneReceived = orders.filter(o => o.deliveryStatus === 'RECEIVED');
  const lanePreparing = orders.filter(o => o.deliveryStatus === 'PREPARING');
  const laneDispatched = orders.filter(o => o.deliveryStatus === 'DISPATCHED');
  const laneDelivered = orders.filter(o => o.deliveryStatus === 'DELIVERED');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', height: '100%' }}>
      
      {/* PAGE HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.5px' }}>Live Kitchen Console</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Monitor real-time telephony calls and culinary preparation pipelines.</p>
        </div>
        <div className="status-indicator glass-card" style={{ padding: '8px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="status-dot"></div>
          <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Live Connection Listening</span>
        </div>
      </div>

      {/* ACTIVE CALL FEED */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <Radio size={16} color="var(--accent-cyan)" />
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--accent-cyan)' }}>
            Active Conversational Feed ({activeCalls.length})
          </h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px' }}>
          {activeCalls.length === 0 ? (
            <div className="glass-card" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No active customer voice calls currently connected.
            </div>
          ) : (
            activeCalls.map(call => (
              <div key={call.id} className="glass-card pulsing-call-card" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'rgba(6, 182, 212, 0.1)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center' }}>
                      <Phone size={14} color="var(--accent-cyan)" />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>{call.customerPhone}</h4>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SID: {call.id}</span>
                    </div>
                  </div>
                  <span className="badge badge-cyan">{call.status}</span>
                </div>

                <div style={{ backgroundColor: 'rgba(0,0,0,0.2)', padding: '10px 12px', borderRadius: '8px', borderLeft: '3px solid var(--accent-cyan)' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: call.speaker === 'AI' ? 'var(--accent-purple)' : 'var(--accent-cyan)', display: 'block', marginBottom: '2px' }}>
                    {call.speaker === 'AI' ? 'RAHUL (AI VOICE)' : 'CUSTOMER'}
                  </span>
                  <p style={{ fontSize: '0.85rem', fontStyle: 'italic', color: 'var(--text-primary)' }}>
                    "{call.lastUtterance}"
                  </p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={12} />
                    <span>Duration: {call.duration}s</span>
                  </div>
                  <span style={{ color: 'var(--accent-emerald)', fontWeight: 600 }}>Stream packet paced 20ms</span>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* CULINARY KITCHEN PROGRESS BOARD */}
      <section style={{ display: 'flex', gap: '16px', flex: 1, minHeight: '400px', overflowX: 'auto' }}>
        
        {/* COLUMN 1: RECEIVED */}
        <div style={{ flex: 1, minWidth: '250px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 8px' }}>
            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={14} color="var(--accent-amber)" /> RECEIVED
            </span>
            <span style={{ padding: '2px 8px', borderRadius: '20px', backgroundColor: 'rgba(255,255,255,0.05)', fontSize: '0.75rem', fontWeight: 700 }}>
              {laneReceived.length}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, overflowY: 'auto' }}>
            {laneReceived.map(order => (
              <OrderCard key={order.id} order={order} onAdvance={() => updateOrderStatus(order.id, 'PREPARING')} buttonText="Start Prep" buttonIcon={<ChefHat size={14} />} />
            ))}
          </div>
        </div>

        {/* COLUMN 2: PREPARING */}
        <div style={{ flex: 1, minWidth: '250px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 8px' }}>
            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ChefHat size={14} color="var(--accent-purple)" /> PREPARING
            </span>
            <span style={{ padding: '2px 8px', borderRadius: '20px', backgroundColor: 'rgba(255,255,255,0.05)', fontSize: '0.75rem', fontWeight: 700 }}>
              {lanePreparing.length}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, overflowY: 'auto' }}>
            {lanePreparing.map(order => (
              <OrderCard key={order.id} order={order} onAdvance={() => updateOrderStatus(order.id, 'DISPATCHED')} buttonText="Send Dispatch" buttonIcon={<Truck size={14} />} />
            ))}
          </div>
        </div>

        {/* COLUMN 3: DISPATCHED */}
        <div style={{ flex: 1, minWidth: '250px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 8px' }}>
            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Truck size={14} color="var(--accent-cyan)" /> DISPATCHED
            </span>
            <span style={{ padding: '2px 8px', borderRadius: '20px', backgroundColor: 'rgba(255,255,255,0.05)', fontSize: '0.75rem', fontWeight: 700 }}>
              {laneDispatched.length}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, overflowY: 'auto' }}>
            {laneDispatched.map(order => (
              <OrderCard key={order.id} order={order} onAdvance={() => updateOrderStatus(order.id, 'DELIVERED')} buttonText="Complete Order" buttonIcon={<CheckCircle2 size={14} />} />
            ))}
          </div>
        </div>

        {/* COLUMN 4: DELIVERED */}
        <div style={{ flex: 1, minWidth: '250px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 8px' }}>
            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={14} color="var(--accent-emerald)" /> DELIVERED
            </span>
            <span style={{ padding: '2px 8px', borderRadius: '20px', backgroundColor: 'rgba(255,255,255,0.05)', fontSize: '0.75rem', fontWeight: 700 }}>
              {laneDelivered.length}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, overflowY: 'auto' }}>
            {laneDelivered.map(order => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        </div>

      </section>
    </div>
  );
}

/* HELPER TICKET CARD COMPONENT */
interface OrderCardProps {
  order: Order;
  onAdvance?: () => void;
  buttonText?: string;
  buttonIcon?: React.ReactNode;
}

function OrderCard({ order, onAdvance, buttonText, buttonIcon }: OrderCardProps) {
  const getChannelBadge = (channel: Order['channel']) => {
    return channel === 'VOICE' 
      ? <span className="badge badge-cyan" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.65rem' }}><Phone size={10} /> Call</span>
      : <span className="badge badge-emerald" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.65rem' }}><MessageSquare size={10} /> WhatsApp</span>;
  };

  const getPaymentStatusBadge = (status: Order['paymentStatus']) => {
    if (status === 'PAID') return <span style={{ color: 'var(--accent-emerald)', fontSize: '0.7rem', fontWeight: 700 }}>PAID</span>;
    if (status === 'FAILED') return <span style={{ color: 'var(--accent-danger)', fontSize: '0.7rem', fontWeight: 700 }}>FAILED</span>;
    return <span style={{ color: 'var(--accent-amber)', fontSize: '0.7rem', fontWeight: 700 }}>PENDING LINK</span>;
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="glass-card" style={{ padding: '14px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
      
      {/* Header info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{order.id}</span>
        {getChannelBadge(order.channel)}
      </div>

      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
        Received at {formatTime(order.createdAt)} • {order.customerPhone}
      </span>

      <hr style={{ border: 0, borderBottom: '1px solid var(--border-glass)', margin: '4px 0' }} />

      {/* Ordered items listing */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {order.items.map((item, idx) => (
          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-primary)' }}>
            <span>{item.quantity}x {item.name}</span>
            <span style={{ color: 'var(--text-secondary)' }}>₹{item.price * item.quantity}</span>
          </div>
        ))}
      </div>

      <hr style={{ border: 0, borderBottom: '1px solid var(--border-glass)', margin: '4px 0' }} />

      {/* Address */}
      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', wordBreak: 'break-word', fontStyle: 'italic' }}>
        📍 {order.address}
      </p>

      {/* Footer totals */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>SUBTOTAL</span>
          <span style={{ fontWeight: 800, color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '1px' }}>
            <IndianRupee size={12} /> {order.total}
          </span>
        </div>
        {getPaymentStatusBadge(order.paymentStatus)}
      </div>

      {/* Work advance button */}
      {onAdvance && buttonText && (
        <button 
          className="btn btn-secondary" 
          onClick={onAdvance}
          style={{ width: '100%', padding: '6px 12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '6px', borderRadius: '6px' }}
        >
          {buttonIcon}
          {buttonText}
        </button>
      )}

    </div>
  );
}
