import React from 'react';

const SensorCard: React.FC<{ 
  icon: string; 
  label: string; 
  value: string; 
  unit: string; 
  color: string;
  onClick?: () => void;
}> = ({ icon, label, value, unit, color, onClick }) => (
  <div 
    style={{
      background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 16,
      padding: 20,
      position: 'relative',
      overflow: 'hidden',
      cursor: onClick ? 'pointer' : 'default',
      transition: 'all 0.3s ease',
    }}
    onClick={onClick}
    onMouseEnter={(e) => {
      if (onClick) {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = `0 8px 24px ${color}40`;
        e.currentTarget.style.borderColor = `${color}60`;
      }
    }}
    onMouseLeave={(e) => {
      if (onClick) {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
      }
    }}
  >
    <div style={{
      position: 'absolute',
      top: -20,
      right: -20,
      width: 100,
      height: 100,
      background: `radial-gradient(circle, ${color}20 0%, transparent 70%)`,
      borderRadius: '50%',
    }} />
    <div style={{ position: 'relative', zIndex: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8 }}>
        <div style={{ fontSize: 32 }}>{icon}</div>
        {onClick && (
          <div style={{ 
            fontSize: 12, 
            color: '#9ca3af',
            background: 'rgba(255,255,255,0.05)',
            padding: '4px 8px',
            borderRadius: 6,
          }}>
            📊 Chi tiết
          </div>
        )}
      </div>
      <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <div style={{ fontSize: 32, fontWeight: 700, color: color }}>{value}</div>
        <div style={{ fontSize: 16, color: '#6b7280' }}>{unit}</div>
      </div>
    </div>
  </div>
);

export default SensorCard;