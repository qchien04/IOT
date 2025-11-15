import React, { useEffect, useRef, useState } from 'react';
import SensorsPanel from './SensorsPanel';
import ControlsPanel from './ControlsPanel';
import CameraPanel from './CameraPanel';
import GasPanel from './GasPanel';
import type { DashboardState, Devices, Sensors } from './types';
import { io, Socket } from 'socket.io-client';

const Dashboard: React.FC = () => {
  const [state, setState] = useState<DashboardState>({
    sensors: { temperature: 0, humidity: 0, gas: 0 },
    devices: { fan: false, doorOpen: false, awningOpen: false },
    gasDetected: false,
    gasAlert: false,
    cameraImageUrl: '/sample-camera.jpg',
    connected: false,
  });

  
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    connectToServer();
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const connectToServer = () => {
    if (!socketRef.current) {
      const socket = io('http://localhost:3000', {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
      });

      socketRef.current = socket;

      socket.on('connect', () => setState(s => ({ ...s, connected: true })));
      socket.on('disconnect', () => setState(s => ({ ...s, connected: false })));
      socket.on('sensors:update', (data: Sensors) => setState(s => ({ ...s, sensors: data })));
      socket.on('devices:update', (data: Devices) => setState(s => ({ ...s, devices: data })));
      socket.on('gas:alert', (data) => setState(s => ({ ...s, gasDetected: data.detected, gasAlert: data.alert })));
      socket.on('camera:update', (url: string) => setState(s => ({ ...s, cameraImageUrl: url })));
      socket.on('state:sync', (fullState: Partial<DashboardState>) => setState(s => ({ ...s, ...fullState })));
    }
  };

  const toggleDevice = (deviceKey: keyof Devices) => {
    const newValue = !state.devices[deviceKey];
    
    // Emit to server
    if (socketRef.current?.connected) {
      socketRef.current.emit('device:toggle', {
        device: deviceKey,
        value: newValue,
      });
    }

    // Optimistic update
    setState((s) => ({
      ...s,
      devices: { ...s.devices, [deviceKey]: newValue },
    }));
  };

  const clearGasAlert = () => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('gas:clear');
    }
    setState((s) => ({ ...s, gasDetected: false, gasAlert: false }));
  };


  return (
    <div>
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="row">
          <h3>Kết nối Server</h3>
          <div style={{ 
            padding: '4px 12px', 
            borderRadius: 12, 
            fontSize: 12,
            fontWeight: 600,
            background: state.connected ? '#10b981' : '#ef4444',
            color: 'white'
          }}>
            {state.connected ? '● Đã kết nối' : '● Ngắt kết nối'}
          </div>
        </div>
      </div>

      <div className="grid">
        <div className="card left-8">
          <div className="row">
            <h2>Tổng quan hệ thống</h2>
            <div className="small">Cập nhật: {new Date().toLocaleTimeString()}</div>
          </div>

          <div className="grid" style={{ marginTop: 12 }}>
            <div className="card left-4">
              <SensorsPanel sensors={state.sensors} />
            </div>

            <div className="card left-8">
              <ControlsPanel
                devices={state.devices}
                toggleDevice={toggleDevice}
              />
            </div>
          </div>
        </div>

        <div className="card left-4">
          <GasPanel
            gasDetected={state.gasDetected}
            gasAlert={state.gasAlert}
            clearAlert={clearGasAlert}
          />
          <div style={{ height: 12 }} />
          <CameraPanel streamUrl={state.cameraImageUrl} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
