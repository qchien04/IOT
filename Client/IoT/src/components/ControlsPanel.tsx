import React from 'react';
import type { Devices } from './types';

interface Props {
  devices: Devices;
  toggleDevice: (key: keyof Devices) => void;
}

const Toggle: React.FC<{ on: boolean; label: string; onClick: () => void }> = ({ on, label, onClick }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
    <div style={{ fontSize: 13 }}>{label}</div>
    <div
      className={`switch ${on ? 'on' : ''}`}
      onClick={onClick}
      role="button"
      aria-pressed={on}
    >
      <div className="knob"></div>
    </div>
  </div>
);

const ControlsPanel: React.FC<Props> = ({ devices, toggleDevice }) => (
  <div>
    <h3>Điều khiển</h3>
    <div className="controls" style={{ marginTop: 10 }}>
      <div className="ctrl-row">
        <Toggle
          label="Quạt trong nhà"
          on={devices.fan}
          onClick={() => toggleDevice('fan')}
        />
      </div>

      <div className="ctrl-row">
        <Toggle
          label="Cửa trong nhà"
          on={devices.doorOpen}
          onClick={() => toggleDevice('doorOpen')}
        />
      </div>

      <div className="ctrl-row">
        <Toggle
          label="Mái che quần áo"
          on={devices.awningOpen}
          onClick={() => toggleDevice('awningOpen')}
        />
      </div>
    </div>
  </div>
);

export default ControlsPanel;
