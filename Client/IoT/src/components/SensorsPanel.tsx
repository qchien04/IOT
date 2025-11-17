import React, { useState } from 'react';
import type { Sensors } from './types';
import SensorCard from './SensorCard';
import SensorHistoryModal from './SensorHistoryModal';

const SensorsPanel: React.FC<{ sensors: Sensors }> = ({ sensors }) => {
  const [selectedSensor, setSelectedSensor] = useState<'temperature' | 'humidity' | 'gas' | 'rainValue' | null>(null);

  return (
    <>
      <SensorCard
        icon="🌡️"
        label="Nhiệt độ"
        value={sensors.temperature.toFixed(1)}
        unit="°C"
        color="#f59e0b"
        onClick={() => setSelectedSensor('temperature')}
      />
      <SensorCard
        icon="💧"
        label="Độ ẩm"
        value={sensors.humidity.toFixed(0)}
        unit="%"
        color="#06b6d4"
        onClick={() => setSelectedSensor('humidity')}
      />
      <SensorCard
        icon="🔥"
        label="Khí Gas"
        value={sensors.gas.toFixed(0)}
        unit=""
        color="#ef4444"
        onClick={() => setSelectedSensor('gas')}
      />
      <SensorCard
        icon="🌧️"
        label="Độ mưa"
        value={sensors.rainValue.toFixed(0)}
        unit=""
        color="#ef4444"
        onClick={() => setSelectedSensor('rainValue')}
      />

      {selectedSensor && (
        <SensorHistoryModal
          sensorType={selectedSensor}
          onClose={() => setSelectedSensor(null)}
        />
      )}
    </>
  );
};

export default SensorsPanel;