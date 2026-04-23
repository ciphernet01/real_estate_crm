import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const ACTIONS = [
  { id: 'home', title: 'Go to Dashboard', shortcut: 'G D', icon: '🏠', path: '/' },
  { id: 'leads', title: 'View Leads', shortcut: 'G L', icon: '🎯', path: '/leads' },
  { id: 'props', title: 'Portfolio Grid', shortcut: 'G P', icon: '🏢', path: '/properties' },
  { id: 'clients', title: 'Managed Clients', shortcut: 'G C', icon: '👥', path: '/clients' },
  { id: 'deals', title: 'Kanban Pipeline', shortcut: 'G K', icon: '💳', path: '/deals' },
  { id: 'reports', title: 'Analytics BI', shortcut: 'G R', icon: '📊', path: '/reports' },
  { id: 'settings', title: 'System Settings', shortcut: 'G S', icon: '⚙️', path: '/settings' },
];

export function CommandPalette({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const filteredActions = ACTIONS.filter(a => 
    a.title.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeydown = (e) => {
      if (!isOpen) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredActions.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredActions.length) % filteredActions.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const action = filteredActions[selectedIndex];
        if (action) {
          navigate(action.path);
          onClose();
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [isOpen, filteredActions, selectedIndex, navigate, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      style={{
        position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', justifyContent: 'center', paddingTop: '10vh', background: 'rgba(2, 6, 23, 0.6)', backdropFilter: 'blur(8px)'
      }}
      onClick={onClose}
    >
      <div 
        onClick={e => e.stopPropagation()}
        style={{
          width: 'min(500px, 90vw)', background: 'var(--bg-glass)', backdropFilter: 'blur(16px)', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', overflow: 'hidden', height: 'fit-content', border: '1px solid var(--border-glass)', animation: 'scaleIn 0.15s ease-out'
        }}
      >
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border-glass)', display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.02)' }}>
          <span style={{ color: '#94a3b8' }}>🔍</span>
          <input 
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Type a command or search..."
            style={{ flex: 1, border: 'none', background: 'none', outline: 'none', fontSize: '1rem', fontWeight: 500, color: '#f8fafc' }}
          />
        </div>
        <div style={{ padding: '8px 0', maxHeight: '300px', overflowY: 'auto' }}>
          {filteredActions.map((action, idx) => (
            <div
              key={action.id}
              onClick={() => { navigate(action.path); onClose(); }}
              onMouseEnter={() => setSelectedIndex(idx)}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', cursor: 'pointer', background: selectedIndex === idx ? 'rgba(255,255,255,0.05)' : 'transparent', color: selectedIndex === idx ? '#818cf8' : '#94a3b8', transition: 'all 0.1s'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '1.25rem' }}>{action.icon}</span>
                <span style={{ fontWeight: 600, fontSize: '0.9rem', color: selectedIndex === idx ? '#f8fafc' : '#94a3b8' }}>{action.title}</span>
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                {action.shortcut.split(' ').map(key => (
                  <kbd key={key} style={{ fontSize: '0.65rem', fontWeight: 800, padding: '2px 6px', background: 'rgba(255,255,255,0.05)', color: '#94a3b8', borderRadius: '4px', border: '1px solid var(--border-glass)' }}>{key}</kbd>
                ))}
              </div>
            </div>
          ))}
          {filteredActions.length === 0 && <div style={{ padding: '32px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>No commands found...</div>}
        </div>
        <div style={{ padding: '12px 16px', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid var(--border-glass)', display: 'flex', gap: '16px' }}>
          <span style={{ fontSize: '0.65rem', color: '#64748b' }}><kbd style={{ background: 'rgba(255,255,255,0.05)', padding: '2px 4px', borderRadius: '4px', border: '1px solid var(--border-glass)', color: '#94a3b8' }}>↵</kbd> select</span>
          <span style={{ fontSize: '0.65rem', color: '#64748b' }}><kbd style={{ background: 'rgba(255,255,255,0.05)', padding: '2px 4px', borderRadius: '4px', border: '1px solid var(--border-glass)', color: '#94a3b8' }}>↑↓</kbd> navigate</span>
          <span style={{ fontSize: '0.65rem', color: '#64748b' }}><kbd style={{ background: 'rgba(255,255,255,0.05)', padding: '2px 4px', borderRadius: '4px', border: '1px solid var(--border-glass)', color: '#94a3b8' }}>esc</kbd> close</span>
        </div>
      </div>
      <style>{`
        @keyframes scaleIn {
          from { transform: scale(0.98); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
