import type { AutoModes, Config, Devices, Sensors, SystemState } from "./types";
import React, { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import SensorsPanel from "./SensorsPanel";
import ControlsPanel from "./ControlsPanel";
import CameraPanel from "./CameraPanel";
import ConfigModal from "./ConfigModal";
import GasPanel from "./GasPanel";
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const [state, setState] = useState<SystemState>({
    sensors: { temperature: 25, humidity: 60, gas: 20, rainValue: 0 },
    devices: { doorOpen: false, roofOpen: false, ledPIR: false, gasBuzzer: false },
    autoModes: { autoDoor: false, autoRoof: false, autoPIR: false, autoGasBuzzer: false },
    cameraImageUrl: 'http://192.168.43.168:5000/stream',
    roofPosition: 0,
    doorPosition: 0,
    connected: false,
  });

  const [showConfig, setShowConfig] = useState(false);
  const [config, setConfig] = useState<Config>({
    ROOF_OPEN_CORNER: 110,
    ROOF_CLOSE_CORNER: 20,
    DOOR_OPEN: 180,
    DOOR_CLOSE: 100,
    GAS_THRESHOLD: 200,
    RAIN_THRESHOLD: 2000,
    sendInterval : 500,
    dhtInterval  : 2000,
    lcdInterval  : 2000,
    gasInterval  : 500,
  });

  const socketRef = useRef<Socket | null>(null);

  const getConfig = async ()=>{
    try {
      const response = await fetch('http://localhost:3000/api/config', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to get config');
      }

      const data = await response.json();
      setConfig(data);
    } catch (error) {
      console.error('Config get error:', error);
    }
  }
  useEffect(()=>{
    getConfig();
  },[]);

  useEffect(() => {
    const socket = io('http://localhost:3000', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to server');
      setState(s => ({ ...s, connected: true }));
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
      setState(s => ({ ...s, connected: false }));
    });

    socket.on('state:sync', (serverState: SystemState) => {
      console.log('State sync:', serverState);
      setState(s => ({
        ...s,
        sensors: serverState.sensors || s.sensors,
        devices: serverState.devices || s.devices,
        autoModes: serverState.autoModes || s.autoModes,
        roofPosition: serverState.roofPosition ?? s.roofPosition,
        doorPosition: serverState.doorPosition ?? s.doorPosition,
      }));
    });

    socket.on('sensors:update', (data: Sensors) => {
      setState(s => ({ ...s, sensors: data }));
    });

    socket.on('devices:update', (data: Devices) => {
      setState(s => ({ ...s, devices: data }));
    });

    socket.on('mode:update', (data: AutoModes) => {
      setState(s => ({ ...s, autoModes: data }));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const toggleDevice = (deviceKey: keyof Devices) => {
      const newValue = !state.devices[deviceKey];
      
      if (socketRef.current?.connected) {
      socketRef.current.emit('device:toggle', {
          device: deviceKey,
          value: newValue,
      });
      }

      setState(s => ({
      ...s,
      devices: { ...s.devices, [deviceKey]: newValue },
      }));
  };
  
  const toggleMode = (modeKey: keyof AutoModes) => {
      const newValue = !state.autoModes[modeKey];
      
      if (socketRef.current?.connected) {
      socketRef.current.emit('mode:change', {
          module: modeKey,
          auto: newValue,
      });
      }

      setState(s => ({
      ...s,
      autoModes: { ...s.autoModes, [modeKey]: newValue },
      }));
  };
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'success'
  });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const handleConfigUpdate = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        throw new Error('Failed to update config');
      }

      setShowConfig(false);
      showToast('✓ Đã cập nhật cấu hình thành công', 'success');
      
      // Still emit via socket for real-time update
      if (socketRef.current?.connected) {
        socketRef.current.emit('config:update', config);
      }
    } catch (error) {
      showToast('❌ Có lỗi xảy ra khi cập nhật', 'error');
      console.error('Config update error:', error);
    }
  };

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <div className="header-logo">
            <div className="logo-icon">🏠</div>
            <div className="logo-text">
              <h1>Smart Home</h1>
              <p>IoT Control Dashboard</p>
            </div>
          </div>
          
          <div className="header-actions">
            <button
              onClick={() => setShowConfig(!showConfig)}
              className="config-button"
            >
              ⚙️ Cấu hình
            </button>
            
            <div className={`connection-status ${state.connected ? 'connected' : 'disconnected'}`}>
              <span className={`connection-dot ${state.connected ? 'pulse' : ''}`} />
              {state.connected ? 'Đã kết nối' : 'Mất kết nối'}
            </div>
          </div>
        </div>
      </div>

      {/* Config Modal */}
      {showConfig && (
        <ConfigModal
          config={config}
          setConfig={setConfig}
          setShowConfig={setShowConfig}
          handleConfigUpdate={handleConfigUpdate}
        />
      )}
      
      {/* Main Content */}
      <div className="dashboard-content">

        {/* Toast Notification */}
        {toast.show && (
          <div style={{
            position: 'fixed',
            top: 80,
            right: 20,
            zIndex: 2000,
            animation: 'slideIn 0.3s ease-out',
          }}>
            <div style={{
              background: toast.type === 'success' 
                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: 'white',
              padding: '16px 24px',
              borderRadius: 12,
              boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              minWidth: 300,
            }}>
              <span style={{ fontSize: 20 }}>
                {toast.type === 'success' ? '✓' : '✗'}
              </span>
              <span style={{ fontWeight: 500 }}>{toast.message}</span>
            </div>
          </div>
        )}
        {/* Sensors Row - 4 cards in a row */}
        <div className="sensors-grid">
          <SensorsPanel sensors={state.sensors} />
        </div>

        {/* Main Grid - 2 columns */}
        <div className="main-grid">
          {/* Left column - Controls */}
          <ControlsPanel
            devices={state.devices}
            autoModes={state.autoModes}
            toggleDevice={toggleDevice}
            toggleMode={toggleMode}
            doorPosition={state.doorPosition}
            roofPosition={state.roofPosition}
          />
          
          {/* Right column - Camera and Gas */}
          <div className="right-column">
            <CameraPanel streamUrl={state.cameraImageUrl} />
            <GasPanel gasDetected={true} gasAlert={true} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;