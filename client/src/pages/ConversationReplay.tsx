import { useState } from 'react';
import { 
  Clock, 
  Calendar, 
  Play, 
  Pause, 
  Volume2,
  FileText
} from 'lucide-react';
import type { CallLog } from '../mockData';

interface ReplayProps {
  callLogsList: CallLog[];
}

export default function ConversationReplay({ callLogsList }: ReplayProps) {
  const [selectedCallId, setSelectedCallId] = useState<string>(callLogsList[0]?.id || '');
  const [isPlaying, setIsPlaying] = useState(false);

  const selectedCall = callLogsList.find(c => c.id === selectedCallId);

  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', height: '100%' }}>
      
      {/* PAGE HEADER */}
      <div>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.5px' }}>Conversation Audit Console</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Audit dialogue streams, playback synthesized responses, and review user interactions.</p>
      </div>

      <div className="grid-cols-2" style={{ gridTemplateColumns: '320px 1fr', flex: 1, minHeight: '500px' }}>
        
        {/* LEFT COLUMN: CALL LOGS LIST */}
        <div className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '550px', overflowY: 'auto' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, borderBottom: '1px solid var(--border-glass)', paddingBottom: '8px', color: 'var(--text-secondary)' }}>
            Historical Log Records ({callLogsList.length})
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {callLogsList.map(call => (
              <div 
                key={call.id} 
                onClick={() => {
                  setSelectedCallId(call.id);
                  setIsPlaying(false);
                }}
                style={{ 
                  padding: '12px 14px', 
                  borderRadius: '10px', 
                  backgroundColor: selectedCallId === call.id ? 'rgba(6, 182, 212, 0.1)' : 'rgba(255,255,255,0.02)',
                  border: '1px solid',
                  borderColor: selectedCallId === call.id ? 'rgba(6, 182, 212, 0.3)' : 'var(--border-glass)',
                  cursor: 'pointer',
                  transition: 'var(--transition-fast)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{call.customerPhone}</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{call.id.replace('call-', '')}</span>
                </div>

                <div style={{ display: 'flex', gap: '12px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={12} />
                    <span>{call.date.split(' ')[0]}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={12} />
                    <span>{call.duration}s</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN: REPLAY VIEWER */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '550px' }}>
          
          {selectedCall ? (
            <>
              {/* Telephony Metadata Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '14px' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Conversation Replay</h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Phone ID: {selectedCall.customerPhone} • Logs timestamp: {selectedCall.date}
                  </p>
                </div>
                
                {/* Mock Audio Player Control */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: 'rgba(0,0,0,0.2)', padding: '6px 14px', borderRadius: '30px', border: '1px solid var(--border-glass)' }}>
                  <button 
                    onClick={togglePlayback}
                    style={{ background: 'none', border: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--accent-cyan)' }}
                  >
                    {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                  </button>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', minWidth: '100px' }}>
                    <Volume2 size={12} color="var(--text-secondary)" />
                    <span style={{ color: isPlaying ? 'var(--accent-emerald)' : 'var(--text-secondary)' }}>
                      {isPlaying ? 'Replaying Audio...' : 'Audio Loaded'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Chat bubbles list */}
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px', paddingRight: '6px' }}>
                {selectedCall.transcript.map((bubble, idx) => {
                  const isAi = bubble.role === 'ai';
                  return (
                    <div 
                      key={idx} 
                      style={{ 
                        alignSelf: isAi ? 'flex-start' : 'flex-end',
                        maxWidth: '80%',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        alignItems: isAi ? 'flex-start' : 'flex-end'
                      }}
                    >
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, color: isAi ? 'var(--accent-purple)' : 'var(--accent-cyan)' }}>
                        {isAi ? '🤖 RAHUL (AI VOICE)' : '🗣️ CUSTOMER'}
                      </span>
                      
                      <div 
                        style={{ 
                          padding: '12px 16px', 
                          borderRadius: '12px', 
                          borderTopLeftRadius: isAi ? '2px' : '12px',
                          borderTopRightRadius: isAi ? '12px' : '2px',
                          backgroundColor: isAi ? 'rgba(168, 85, 247, 0.08)' : 'rgba(6, 182, 212, 0.08)',
                          border: '1px solid',
                          borderColor: isAi ? 'rgba(168, 85, 247, 0.25)' : 'rgba(6, 182, 212, 0.25)',
                          lineHeight: '140%',
                          fontSize: '0.88rem'
                        }}
                      >
                        {bubble.text}
                      </div>

                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                        {bubble.time}
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', gap: '10px' }}>
              <FileText size={48} />
              <span>Select a historical call record on the left to review dialogues.</span>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
