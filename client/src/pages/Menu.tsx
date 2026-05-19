import { useState } from 'react';
import { 
  Plus, 
  Search, 
  Eye, 
  EyeOff, 
  Tag, 
  IndianRupee 
} from 'lucide-react';
import type { MenuItem } from '../mockData';

interface MenuProps {
  menuItems: MenuItem[];
  addMenuItem: (item: Omit<MenuItem, 'id'>) => void;
  toggleItemAvailability: (id: string) => void;
}

export default function Menu({ menuItems, addMenuItem, toggleItemAvailability }: MenuProps) {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form State
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [aliasesInput, setAliasesInput] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price) return;

    // Parse comma separated tags
    const aliases = aliasesInput
      .split(',')
      .map(tag => tag.trim().toLowerCase())
      .filter(tag => tag.length > 0);

    addMenuItem({
      name,
      price: parseFloat(price),
      description,
      aliases,
      isAvailable: true
    });

    // Reset Form
    setName('');
    setPrice('');
    setDescription('');
    setAliasesInput('');
    setShowAddForm(false);
  };

  const filteredItems = menuItems.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {/* PAGE HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.5px' }}>Menu Catalog Manager</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Tune menu items, prices, and phonetic speech-recognition synonyms.</p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          <Plus size={16} />
          {showAddForm ? 'Close Editor' : 'Add New Dish'}
        </button>
      </div>

      {/* ADD DISH DIALOG FORM */}
      {showAddForm && (
        <form onSubmit={handleAddSubmit} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '600px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>Configure New Menu Dish</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Dish Name *</label>
              <input 
                type="text" 
                placeholder="e.g. Paneer Butter Masala" 
                className="form-input" 
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Price (INR) *</label>
              <input 
                type="number" 
                placeholder="e.g. 249" 
                className="form-input" 
                value={price}
                onChange={e => setPrice(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Phonetic Voice Aliases (Comma separated)</label>
            <input 
              type="text" 
              placeholder="e.g. pbm, butter paneer, paneer butter" 
              className="form-input" 
              value={aliasesInput}
              onChange={e => setAliasesInput(e.target.value)}
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Helpful Hinglish nicknames to help Deepgram & Claude match customer pronunciation.</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Description</label>
            <textarea 
              placeholder="Provide a detailed description of the culinary item..." 
              className="form-input" 
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              style={{ resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
            <button type="submit" className="btn btn-primary">Save Dish</button>
            <button type="button" className="btn btn-secondary" onClick={() => setShowAddForm(false)}>Cancel</button>
          </div>
        </form>
      )}

      {/* FILTER SEARCH BAR */}
      <div className="glass-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Search size={18} color="var(--text-muted)" />
        <input 
          type="text" 
          placeholder="Search menu items by name, description, or voice tags..." 
          className="form-input" 
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{ border: 0, padding: 0, backgroundColor: 'transparent' }}
        />
      </div>

      {/* DISHES LIST GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
        {filteredItems.map(item => (
          <div key={item.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px', opacity: item.isAvailable ? 1 : 0.6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>{item.name}</h3>
              <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '1px' }}>
                <IndianRupee size={12} /> {item.price}
              </span>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', flex: 1, minHeight: '40px', lineHeight: '135%' }}>
              {item.description || 'No description provided.'}
            </p>

            {/* Speech synonyms */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
              {item.aliases.length === 0 ? (
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Tag size={10} /> No phonetic tags
                </span>
              ) : (
                item.aliases.map((alias, idx) => (
                  <span key={idx} className="badge badge-cyan" style={{ fontSize: '0.65rem', padding: '2px 8px', textTransform: 'lowercase' }}>
                    🗣️ {alias}
                  </span>
                ))
              )}
            </div>

            <hr style={{ border: 0, borderBottom: '1px solid var(--border-glass)' }} />

            {/* Toggle stock availability */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: item.isAvailable ? 'var(--accent-emerald)' : 'var(--accent-danger)' }}>
                {item.isAvailable ? '✅ IN STOCK' : '❌ OUT OF STOCK'}
              </span>
              <button 
                onClick={() => toggleItemAvailability(item.id)}
                className={`btn ${item.isAvailable ? 'btn-secondary' : 'btn-primary'}`}
                style={{ padding: '6px 12px', fontSize: '0.75rem', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                {item.isAvailable ? (
                  <>
                    <EyeOff size={12} /> Make Offline
                  </>
                ) : (
                  <>
                    <Eye size={12} /> Put Online
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
