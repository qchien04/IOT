import type { Config } from "./types";

interface Props {
    config: Config;
    setConfig: (config: Config) => void;
    setShowConfig: (show: boolean) => void;
    handleConfigUpdate: () => void;
}

const ConfigModal: React.FC<Props> = ({ config, setConfig, setShowConfig, handleConfigUpdate }) => (
  <div style={{
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.7)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: 20,
    }} onClick={() => setShowConfig(false)}>
    <div style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 24,
        padding: 32,
        maxWidth: 500,
        width: '100%',
        backdropFilter: 'blur(20px)',
    }} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ margin: '0 0 24px 0', fontSize: 24, fontWeight: 700 }}>⚙️ Cấu hình Servo</h2>
        
        <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: 20 
            }}>
            {[
                { key: 'ROOF_OPEN_CORNER', label: '🏠 Mái mở (góc)' },
                { key: 'ROOF_CLOSE_CORNER', label: '🏠 Mái đóng (góc)' },
                { key: 'DOOR_OPEN', label: '🚪 Cửa mở (góc)' },
                { key: 'DOOR_CLOSE', label: '🚪 Cửa đóng (góc)' },
                { key: 'GAS_THRESHOLD', label: '🔥 Ngưỡng gas cảnh báo' },
                { key: 'RAIN_THRESHOLD', label: '🌧️ Ngưỡng mưa cảnh báo' },
                { key: 'sendInterval', label: '🌐 Gửi dữ liệu (ms)' },
                { key: 'dhtInterval', label: '🌡️ Đọc DHT (ms)' },
                { key: 'lcdInterval', label: 'LCD update (ms)' },
                { key: 'gasInterval', label: '🔥 Đọc gas (ms)' },
            ].map(({ key, label }) => (
                <div key={key} style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ 
                    fontSize: 13, 
                    color: '#9ca3af', 
                    marginBottom: 8 
                }}>
                    {label}
                </label>

                <input
                    type="number"
                    value={config[key as keyof Config]}
                    onChange={(e) => setConfig({ ...config, [key]: Number(e.target.value) })}
                    style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 12,
                    color: '#fff',
                    fontSize: 16,
                    outline: 'none',
                    }}
                />
                </div>
            ))}
        </div>
        
        <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
        <button
            onClick={() => setShowConfig(false)}
            style={{
            flex: 1,
            padding: '14px 24px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12,
            color: '#fff',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: 15,
            }}
        >
            Hủy
        </button>
        <button
            onClick={handleConfigUpdate}
            style={{
            flex: 1,
            padding: '14px 24px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            border: 'none',
            borderRadius: 12,
            color: '#fff',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: 15,
            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
            }}
        >
            Lưu cấu hình
        </button>
        </div>
    </div>
    </div>
);

export default ConfigModal;