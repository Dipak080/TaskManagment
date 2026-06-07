import React from 'react';

export default function DevFillButton({ onFill }) {
  if (!import.meta.env.DEV) return null;

  return (
    <button 
      type="button" 
      onClick={onFill}
      style={{
        position: 'absolute',
        top: 10,
        right: 10,
        background: '#10B981',
        color: '#fff',
        border: 'none',
        borderRadius: '4px',
        padding: '4px 8px',
        fontSize: '11px',
        fontWeight: 'bold',
        cursor: 'pointer',
        zIndex: 9999,
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
      }}
      title="DEV ONLY: Auto-fill form"
    >
      DEV FILL
    </button>
  );
}
