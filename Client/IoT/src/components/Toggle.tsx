import type React from "react";


const Toggle: React.FC<{ on: boolean; label: string; onClick: () => void; disabled?: boolean }> = ({ 
  on, label, onClick, disabled = false 
}) => (
  <div style={{ 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    padding: '12px 16px',
    background: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    transition: 'all 0.3s ease',
    border: '1px solid rgba(255,255,255,0.05)',
  }}>
    <div style={{ fontSize: 14, fontWeight: 500, color: disabled ? '#6b7280' : '#e6eef8' }}>
      {label}
    </div>
    <div
      className={`toggle-switch ${on ? 'active' : ''}`}
      onClick={disabled ? undefined : onClick}
      style={{ 
        opacity: disabled ? 0.4 : 1, 
        cursor: disabled ? 'not-allowed' : 'pointer',
        position: 'relative',
        width: 52,
        height: 28,
        background: on ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'rgba(255,255,255,0.1)',
        borderRadius: 14,
        transition: 'all 0.3s ease',
        boxShadow: on ? '0 4px 12px rgba(102, 126, 234, 0.4)' : 'none',
      }}
    >
      <div style={{
        position: 'absolute',
        top: 4,
        left: on ? 28 : 4,
        width: 20,
        height: 20,
        background: 'white',
        borderRadius: '50%',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
      }} />
    </div>
  </div>
);

export default Toggle;