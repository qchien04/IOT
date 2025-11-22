import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface SensorHistoryData {
  timestamp: string;
  value: number;
}

interface Props {
  sensorType: 'temperature' | 'humidity' | 'gas' | 'rainValue';
  onClose: () => void;
}

const SensorHistoryModal: React.FC<Props> = React.memo(({ sensorType, onClose }) => {
  console.log("ve bieu do---------------------------")
  const [timeRange, setTimeRange] = useState<'24h' | '48h' | '7d'>('24h');
  const [data, setData] = useState<SensorHistoryData[]>([]);
  const [loading, setLoading] = useState(true);

  const sensorConfig = {
    temperature: {
      icon: '🌡️',
      label: 'Nhiệt độ',
      unit: '°C',
      color: '#f59e0b',
      min: 0,
      max: 50,
    },
    humidity: {
      icon: '💧',
      label: 'Độ ẩm',
      unit: '%',
      color: '#06b6d4',
      min: 0,
      max: 100,
    },
    gas: {
      icon: '🔥',
      label: 'Khí Gas',
      unit: '',
      color: '#ef4444',
      min: 0,
      max: 100,
    },
    rainValue: {
      icon: '🌧️',
      label: 'Độ mưa',
      unit: '',
      color: '#f75858',
      min: 0,
      max: 100,
    },
  };

  const config = sensorConfig[sensorType];

  // Fetch data from server
  useEffect(() => {
    const fetchSensorHistory = async () => {
      setLoading(true);
      
      try {
        const response = await fetch(`http://localhost:3000/api/sensors/history?type=${sensorType}&range=${timeRange}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch sensor history');
        }
        
        const historyData = await response.json();
        
        // Transform data to expected format
        const transformedData: SensorHistoryData[] = historyData.map((item: any) => ({
          timestamp: item.timestamp,
          value: item.value,
        }));
        
        setData(transformedData);
      } catch (error) {
        console.error('Error fetching sensor history:', error);
        
        // Fallback to empty data or show error message
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSensorHistory();
  }, [timeRange, sensorType]);

  const formatXAxis = (timestamp: string) => {
    const date = new Date(timestamp);
    if (timeRange === '7d') {
      return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    }
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const date = new Date(data.payload.timestamp);
      
      return (
        <div style={{
          background: 'rgba(0, 0, 0, 0.9)',
          border: `1px solid ${config.color}`,
          borderRadius: 12,
          padding: 12,
          backdropFilter: 'blur(10px)',
        }}>
          <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4 }}>
            {date.toLocaleString('vi-VN')}
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, color: config.color }}>
            {data.value.toFixed(1)} {config.unit}
          </div>
        </div>
      );
    }
    return null;
  };

  const stats = data.length > 0 ? {
    current: data[data.length - 1].value,
    avg: data.reduce((sum, d) => sum + d.value, 0) / data.length,
    min: Math.min(...data.map(d => d.value)),
    max: Math.max(...data.map(d => d.value)),
  } : {
    current: 0,
    avg: 0,
    min: 0,
    max: 0,
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.8)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 20,
      }} 
      onClick={onClose}
    >
      <div 
        style={{
          background: 'linear-gradient(135deg, rgba(15,26,43,0.95) 0%, rgba(7,16,38,0.95) 100%)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 24,
          padding: 32,
          maxWidth: 1000,
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          backdropFilter: 'blur(20px)',
        }} 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: 32 }}>{config.icon}</div>
            <div>
              <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>
                Lịch sử {config.label}
              </h2>
              <p style={{ margin: 0, fontSize: 13, color: '#9ca3af' }}>
                Theo dõi biến động qua thời gian
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.05)',
              color: '#fff',
              cursor: 'pointer',
              fontSize: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ×
          </button>
        </div>

        {/* Time Range Selector */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          {[
            { value: '24h', label: '24 giờ' },
            { value: '48h', label: '48 giờ' },
            { value: '7d', label: '7 ngày' },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setTimeRange(option.value as any)}
              style={{
                flex: 1,
                padding: '12px 20px',
                background: timeRange === option.value 
                  ? `linear-gradient(135deg, ${config.color} 0%, ${config.color}dd 100%)`
                  : 'rgba(255,255,255,0.05)',
                border: '1px solid ' + (timeRange === option.value ? config.color : 'rgba(255,255,255,0.1)'),
                borderRadius: 12,
                color: '#fff',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: 14,
                transition: 'all 0.3s ease',
              }}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Hiện tại', value: stats.current },
            { label: 'Trung bình', value: stats.avg },
            { label: 'Thấp nhất', value: stats.min },
            { label: 'Cao nhất', value: stats.max },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 12,
                padding: 16,
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 6, textTransform: 'uppercase' }}>
                {stat.label}
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, color: config.color }}>
                {stat.value.toFixed(1)} {config.unit}
              </div>
            </div>
          ))}
        </div>

        {/* Chart */}
        <div style={{
          background: 'rgba(0,0,0,0.3)',
          borderRadius: 16,
          padding: 20,
          minHeight: 400,
        }}>
          {loading ? (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center', 
              justifyContent: 'center', 
              height: 400,
              color: '#9ca3af',
              gap: 12,
            }}>
              <div style={{ 
                width: 40, 
                height: 40, 
                border: '3px solid rgba(255,255,255,0.1)',
                borderTop: `3px solid ${config.color}`,
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
              }} />
              <div>Đang tải dữ liệu...</div>
            </div>
          ) : data.length === 0 ? (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center', 
              justifyContent: 'center', 
              height: 400,
              color: '#9ca3af',
              gap: 12,
            }}>
              <div style={{ fontSize: 48 }}>📭</div>
              <div>Không có dữ liệu lịch sử</div>
              <div style={{ fontSize: 13, color: '#6b7280' }}>
                Hệ thống chưa ghi nhận dữ liệu cho khoảng thời gian này
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={data}>
                <defs>
                  <linearGradient id={`gradient-${sensorType}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={config.color} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={config.color} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={formatXAxis}
                  stroke="#9ca3af"
                  style={{ fontSize: 12 }}
                />
                <YAxis 
                  domain={[config.min, config.max]}
                  stroke="#9ca3af"
                  style={{ fontSize: 12 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke={config.color}
                  strokeWidth={3}
                  dot={false}
                  fill={`url(#gradient-${sensorType})`}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Footer */}
        <div style={{ 
          marginTop: 24, 
          padding: 16, 
          background: 'rgba(255,255,255,0.03)',
          borderRadius: 12,
          fontSize: 13,
          color: '#9ca3af',
          textAlign: 'center',
        }}>
          💡 Dữ liệu được cập nhật theo thời gian thực từ cảm biến IoT
        </div>
      </div>
      
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
});

export default SensorHistoryModal;