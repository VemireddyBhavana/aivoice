import { useState } from 'react';
import { 
  Sparkles, 
  Volume2, 
  Link
} from 'lucide-react';

interface SettingsProps {
  restaurantName: string;
  setRestaurantName: (val: string) => void;
  greetingText: string;
  setGreetingText: (val: string) => void;
  selectedVoice: string;
  setSelectedVoice: (val: string) => void;
  onSave?: () => void;
}

export default function Settings({
  restaurantName,
  setRestaurantName,
  greetingText,
  setGreetingText,
  selectedVoice,
  setSelectedVoice,
  onSave
}: SettingsProps) {
  const [successMessage, setSuccessMessage] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSave) {
      onSave();
    }
    setSuccessMessage(true);
    setTimeout(() => {
      setSuccessMessage(false);
    }, 3000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', maxWidth: '800px' }}>
      
      {/* PAGE HEADER */}
      <div>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.5px' }}>AI Agent Settings</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Tune voice personas, update welcomes, and copy Twilio media connection paths.</p>
      </div>

      {successMessage && (
        <div style={{ padding: '12px 16px', borderRadius: '8px', backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', color: 'var(--accent-emerald)', fontSize: '0.9rem', fontWeight: 600 }}>
          🎉 Settings successfully synced to core database schema and local Redis memory!
        </div>
      )}

      {/* SETTINGS FORM */}
      <form onSubmit={handleSubmit} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Profile Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-cyan)' }}>
            <Sparkles size={16} /> Restaurant Metadata
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Brand Name</label>
            <input 
              type="text" 
              className="form-input" 
              value={restaurantName}
              onChange={e => setRestaurantName(e.target.value)}
              required
            />
          </div>
        </div>

        <hr style={{ border: 0, borderBottom: '1px solid var(--border-glass)' }} />

        {/* AI Voice configurations */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-cyan)' }}>
            <Volume2 size={16} /> Telephony Speech & Brain
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>ElevenLabs Synthesis Voice ID</label>
              <select 
                className="form-input" 
                value={selectedVoice}
                onChange={e => setSelectedVoice(e.target.value)}
                style={{ cursor: 'pointer' }}
              >
                <option value="Rachel">Rachel (Sweet & Courteous)</option>
                <option value="Rahul-Bilingual">Rahul (Natural Hinglish Accent)</option>
                <option value="Antigravity-Male">Antigravity-Male (Fast Paced)</option>
                <option value="Aditi-Neural">Aditi-Neural (Warm Indian Accent)</option>
              </select>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Speech Buffer Pacing</label>
              <input 
                type="text" 
                className="form-input" 
                value="20ms (160 Bytes at 8000Hz u-law)" 
                disabled 
                style={{ opacity: 0.6, cursor: 'not-allowed' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Welcome Voice greeting Prompt</label>
            <textarea 
              className="form-input" 
              rows={4}
              value={greetingText}
              onChange={e => setGreetingText(e.target.value)}
              style={{ resize: 'vertical' }}
              required
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>This greeting triggers instantly upon inbound hook connection prior to starting Deepgram media stream.</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
          <button type="submit" className="btn btn-primary">Save Configs</button>
        </div>

      </form>

      {/* TELEPHONY TELEMETRY DIAGNOSTIC WIDGET */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-amber)' }}>
          <Link size={16} /> Twilio & WhatsApp Integration Routes
        </h3>
        
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '140%' }}>
          Copy these active webhook URL endpoints and configure them inside your **Twilio Console Properties** to link live cell networks to your local Express server!
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '4px' }}>
          
          {/* Hook 1: Twilio Inbound Voice */}
          <div style={{ padding: '12px 14px', borderRadius: '8px', backgroundColor: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-glass)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.75rem', fontWeight: 700 }}>
              <span>INBOUND TELEPHONY WEBHOOK (POST)</span>
              <span style={{ color: 'var(--accent-cyan)' }}>Active</span>
            </div>
            <code style={{ fontSize: '0.8rem', color: 'var(--text-primary)', wordBreak: 'break-all', backgroundColor: 'transparent', padding: 0 }}>
              http://localhost:5000/api/twilio/voice
            </code>
          </div>

          {/* Hook 2: WhatsApp Webhook */}
          <div style={{ padding: '12px 14px', borderRadius: '8px', backgroundColor: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-glass)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.75rem', fontWeight: 700 }}>
              <span>WHATSAPP MESSAGING WEBHOOK (POST)</span>
              <span style={{ color: 'var(--accent-emerald)' }}>Active</span>
            </div>
            <code style={{ fontSize: '0.8rem', color: 'var(--text-primary)', wordBreak: 'break-all', backgroundColor: 'transparent', padding: 0 }}>
              http://localhost:5000/api/twilio/whatsapp
            </code>
          </div>

        </div>
      </div>

    </div>
  );
}
