import React from 'react';
import type { Devices, AutoModes } from './types';
import DeviceCard from './DeviceCard';

const ControlsPanel: React.FC<{
  devices: Devices;
  autoModes: AutoModes;
  toggleDevice: (key: keyof Devices) => void;
  toggleMode: (key: keyof AutoModes) => void;
  doorPosition: number;
  roofPosition: number;
}> = ({ devices, autoModes, toggleDevice, toggleMode, doorPosition, roofPosition }) => (
  <div className="card">
    <h3>🎛️ Điều khiển thiết bị</h3>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      <DeviceCard
        icon="🚪"
        title="Cửa ra vào"
        device="doorOpen"
        devices={devices}
        autoMode="autoDoor"
        autoModes={autoModes}
        position={doorPosition}
        toggleDevice={toggleDevice}
        toggleMode={toggleMode}
      />
      <DeviceCard
        icon="🏠"
        title="Mái che"
        device="roofOpen"
        devices={devices}
        autoMode="autoRoof"
        autoModes={autoModes}
        position={roofPosition}
        toggleDevice={toggleDevice}
        toggleMode={toggleMode}
      />
      <DeviceCard
        icon="👤"
        title="Cảm biến PIR"
        device="ledPIR"
        devices={devices}
        autoMode="autoPIR"
        autoModes={autoModes}
        toggleDevice={toggleDevice}
        toggleMode={toggleMode}
      />
      <DeviceCard
        icon="🔔"
        title="Còi báo Gas"
        device="gasBuzzer"
        devices={devices}
        autoMode="autoGasBuzzer"
        autoModes={autoModes}
        toggleDevice={toggleDevice}
        toggleMode={toggleMode}
      />
    </div>
  </div>
);

export default ControlsPanel;