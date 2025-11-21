import type { Devices, AutoModes } from "./types";
import Toggle from "./Toggle";
const DeviceCard: React.FC<{
  icon: string;
  title: string;
  device: keyof Devices;
  devices: Devices;
  autoMode: keyof AutoModes;
  autoModes: AutoModes;
  position?: number;
  toggleDevice: (key: keyof Devices) => void;
  toggleMode: (key: keyof AutoModes) => void;
}> = ({ icon, title, device, devices, autoMode, autoModes, position, toggleDevice, toggleMode }) => {
  const isOn = devices[device];
  const isAuto = autoModes[autoMode];
  
  return (
    <div  style={{
      background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 20,
      padding: 24,
      position: 'relative',
      overflow: 'hidden',
      transition: 'all 0.3s ease',
    }}>
      {isOn ? (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
          boxShadow: '0 0 20px rgba(102, 126, 234, 0.5)',
        }} />
      ): null}
      
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
        <div style={{
          width: 56,
          height: 56,
          background: isOn 
            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
            : 'rgba(255,255,255,0.05)',
          borderRadius: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 28,
          transition: 'all 0.3s ease',
          boxShadow: isOn ? '0 8px 24px rgba(102, 126, 234, 0.3)' : 'none',
        }}>
          {icon}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{title}</div>
          <div style={{ 
            fontSize: 12, 
            color: isOn ? '#10b981' : '#6b7280',
            fontWeight: 500,
          }}>
            {isOn ? '● Đang bật' : '○ Đã tắt'}
          </div>
        </div>
      </div>

      {position !== undefined && (
        <div style={{
          background: 'rgba(0,0,0,0.2)',
          borderRadius: 12,
          padding: 12,
          marginBottom: 16,
        }}>
          <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
            Vị trí Servo
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              flex: 1,
              height: 6,
              background: 'rgba(255,255,255,0.1)',
              borderRadius: 3,
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                width: `${(position / 180) * 100}%`,
                background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                transition: 'width 0.5s ease',
              }} />
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, minWidth: 40 }}>{position}°</div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Toggle
          label={isOn ? 'Đang bật' : 'Đã tắt'}
          on={isOn}
          onClick={() => toggleDevice(device)}
          disabled={isAuto}
        />
        <Toggle
          label="Chế độ tự động"
          on={isAuto}
          onClick={() => toggleMode(autoMode)}
        />
      </div>
    </div>
  );
};
export default DeviceCard;