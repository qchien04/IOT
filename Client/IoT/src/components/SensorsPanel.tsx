import React from 'react';
import type { Sensors } from './types';

interface Props {
  sensors: Sensors;
}

const SensorsPanel: React.FC<Props> = ({ sensors }) => (
  <div>
    <h3>Cảm biến</h3>
    <div style={{ marginTop: 8 }}>
      <div className="sensor">
        <div>
          <div className="kv">Dữ liệu cảm biến</div>
          <div className="value">🌡️ Nhiệt độ: {sensors.temperature} °C</div>
          <div className="small">💧 Độ ẩm: {sensors.humidity}%</div>
          <div className="small">🔥 Khí gas: {sensors.gas}</div>
        </div>
      </div>
    </div>
  </div>
);

export default SensorsPanel;
