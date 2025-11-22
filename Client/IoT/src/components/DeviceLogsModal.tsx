import React, { useState, useEffect, memo, useCallback } from 'react';

interface DeviceLog {
  id: number;
  device_name: string;
  status: boolean;
  mode: string;
  timestamp: string;
}

interface Alert {
  id: number;
  alert_type: string;
  severity: string;
  message: string;
  sensor_value: number | null;
  resolved: boolean;
  resolved_at: string | null;
  created_at: string;
}

interface Props {
  onClose: () => void;
}

const DeviceLogsModal: React.FC<Props> = memo(({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'logs' | 'alerts'>('logs');
  const [timeRange, setTimeRange] = useState<'24h' | '48h' | '7d'>('24h');
  const [deviceFilter, setDeviceFilter] = useState<string>('all');
  const [alertFilter, setAlertFilter] = useState<string>('all');
  const [resolvedFilter, setResolvedFilter] = useState<string>('all');
  
  const [logs, setLogs] = useState<DeviceLog[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  const deviceConfig: Record<string, { icon: string; label: string; color: string }> = {
    doorOpen: { icon: '🚪', label: 'Cửa', color: '#3b82f6' },
    roofOpen: { icon: '🏠', label: 'Mái che', color: '#8b5cf6' },
    ledPIR: { icon: '💡', label: 'Đèn PIR', color: '#f59e0b' },
    gasBuzzer: { icon: '🔔', label: 'Còi Gas', color: '#ef4444' },
    ledBedRoom: { icon: '🛏️', label: 'Đèn phòng ngủ', color: '#10b981' },
    camBuzzer: { icon: '📷', label: 'Còi Camera', color: '#06b6d4' },
  };

  const alertConfig: Record<string, { icon: string; label: string; color: string }> = {
    gas: { icon: '🔥', label: 'Khí Gas', color: '#ef4444' },
    temperature: { icon: '🌡️', label: 'Nhiệt độ', color: '#f59e0b' },
    humidity: { icon: '💧', label: 'Độ ẩm', color: '#06b6d4' },
    rain: { icon: '🌧️', label: 'Mưa', color: '#8b5cf6' },
  };

  const severityConfig: Record<string, { color: string; bg: string }> = {
    low: { color: '#10b981', bg: 'rgba(16, 185, 129, 0.2)' },
    medium: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.2)' },
    high: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.2)' },
  };

  // Fetch device logs
  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        range: timeRange,
        limit: '100',
      });
      if (deviceFilter !== 'all') params.append('device', deviceFilter);

      const response = await fetch(`http://localhost:3000/api/device-logs?${params}`);
      if (response.ok) {
        const data = await response.json();
        setLogs(data);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  }, [timeRange, deviceFilter]);

  // Fetch alerts
  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        range: timeRange,
        limit: '100',
      });
      if (alertFilter !== 'all') params.append('type', alertFilter);
      if (resolvedFilter !== 'all') params.append('resolved', resolvedFilter);

      const response = await fetch(`http://localhost:3000/api/alerts?${params}`);
      if (response.ok) {
        const data = await response.json();
        setAlerts(data);
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  }, [timeRange, alertFilter, resolvedFilter]);

  useEffect(() => {
    if (activeTab === 'logs') {
      fetchLogs();
    } else {
      fetchAlerts();
    }
  }, [activeTab, fetchLogs, fetchAlerts]);

  const handleResolveAlert = async (id: number) => {
    try {
      const response = await fetch(`http://localhost:3000/api/alerts/${id}/resolve`, {
        method: 'PUT',
      });
      if (response.ok) {
        setAlerts(prev => prev.map(a => 
          a.id === id ? { ...a, resolved: true, resolved_at: new Date().toISOString() } : a
        ));
      }
    } catch (error) {
      console.error('Error resolving alert:', error);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('vi-VN');
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
          maxWidth: 1100,
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
            <div style={{ fontSize: 32 }}>📋</div>
            <div>
              <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#fff' }}>
                Nhật ký hệ thống
              </h2>
              <p style={{ margin: 0, fontSize: 13, color: '#9ca3af' }}>
                Theo dõi hoạt động thiết bị và cảnh báo
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
            }}
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          <button
            onClick={() => setActiveTab('logs')}
            style={{
              flex: 1,
              padding: '14px 20px',
              background: activeTab === 'logs'
                ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                : 'rgba(255,255,255,0.05)',
              border: '1px solid ' + (activeTab === 'logs' ? '#3b82f6' : 'rgba(255,255,255,0.1)'),
              borderRadius: 12,
              color: '#fff',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            🔧 Log thiết bị
          </button>
          <button
            onClick={() => setActiveTab('alerts')}
            style={{
              flex: 1,
              padding: '14px 20px',
              background: activeTab === 'alerts'
                ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                : 'rgba(255,255,255,0.05)',
              border: '1px solid ' + (activeTab === 'alerts' ? '#ef4444' : 'rgba(255,255,255,0.1)'),
              borderRadius: 12,
              color: '#fff',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            ⚠️ Cảnh báo
          </button>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          {/* Time Range */}
          <div style={{ display: 'flex', gap: 8 }}>
            {['24h', '48h', '7d'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range as any)}
                style={{
                  padding: '8px 16px',
                  background: timeRange === range ? 'rgba(59, 130, 246, 0.3)' : 'rgba(255,255,255,0.05)',
                  border: '1px solid ' + (timeRange === range ? '#3b82f6' : 'rgba(255,255,255,0.1)'),
                  borderRadius: 8,
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: 13,
                }}
              >
                {range === '24h' ? '24 giờ' : range === '48h' ? '48 giờ' : '7 ngày'}
              </button>
            ))}
          </div>

          {/* Device/Alert Filter */}
          {activeTab === 'logs' ? (
            <select
              value={deviceFilter}
              onChange={(e) => setDeviceFilter(e.target.value)}
              style={{
                padding: '8px 16px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                color: '#fff',
                cursor: 'pointer',
                fontSize: 13,
              }}
            >
              <option value="all">Tất cả thiết bị</option>
              {Object.entries(deviceConfig).map(([key, cfg]) => (
                <option key={key} value={key}>{cfg.icon} {cfg.label}</option>
              ))}
            </select>
          ) : (
            <>
              <select
                value={alertFilter}
                onChange={(e) => setAlertFilter(e.target.value)}
                style={{
                  padding: '8px 16px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8,
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: 13,
                }}
              >
                <option value="all">Tất cả loại</option>
                {Object.entries(alertConfig).map(([key, cfg]) => (
                  <option key={key} value={key}>{cfg.icon} {cfg.label}</option>
                ))}
              </select>
              <select
                value={resolvedFilter}
                onChange={(e) => setResolvedFilter(e.target.value)}
                style={{
                  padding: '8px 16px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8,
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: 13,
                }}
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="false">Chưa xử lý</option>
                <option value="true">Đã xử lý</option>
              </select>
            </>
          )}
        </div>

        {/* Content */}
        <div style={{
          background: 'rgba(0,0,0,0.3)',
          borderRadius: 16,
          padding: 20,
          minHeight: 400,
          maxHeight: 500,
          overflow: 'auto',
        }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: '#9ca3af' }}>
              <div style={{
                width: 40,
                height: 40,
                border: '3px solid rgba(255,255,255,0.1)',
                borderTop: '3px solid #3b82f6',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
              }} />
            </div>
          ) : activeTab === 'logs' ? (
            logs.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#9ca3af', padding: 60 }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
                <div>Không có log thiết bị</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {logs.map((log) => {
                  const cfg = deviceConfig[log.device_name] || { icon: '❓', label: log.device_name, color: '#6b7280' };
                  return (
                    <div
                      key={log.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 16,
                        padding: 16,
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 12,
                      }}
                    >
                      <div style={{ fontSize: 24 }}>{cfg.icon}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, color: '#fff', marginBottom: 4 }}>{cfg.label}</div>
                        <div style={{ fontSize: 12, color: '#9ca3af' }}>{formatTime(log.timestamp)}</div>
                      </div>
                      <div style={{
                        padding: '6px 12px',
                        borderRadius: 8,
                        background: log.status ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                        color: log.status ? '#10b981' : '#ef4444',
                        fontSize: 13,
                        fontWeight: 600,
                      }}>
                        {log.status ? 'BẬT' : 'TẮT'}
                      </div>
                      <div style={{
                        padding: '6px 12px',
                        borderRadius: 8,
                        background: log.mode === 'auto' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(156, 163, 175, 0.2)',
                        color: log.mode === 'auto' ? '#3b82f6' : '#9ca3af',
                        fontSize: 13,
                      }}>
                        {log.mode === 'auto' ? '🤖 Tự động' : '👆 Thủ công'}
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            alerts.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#9ca3af', padding: 60 }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
                <div>Không có cảnh báo</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {alerts.map((alert) => {
                  const cfg = alertConfig[alert.alert_type] || { icon: '⚠️', label: alert.alert_type, color: '#f59e0b' };
                  const sev = severityConfig[alert.severity] || severityConfig.medium;
                  return (
                    <div
                      key={alert.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 16,
                        padding: 16,
                        background: alert.resolved ? 'rgba(255,255,255,0.02)' : 'rgba(239, 68, 68, 0.05)',
                        border: '1px solid ' + (alert.resolved ? 'rgba(255,255,255,0.08)' : 'rgba(239, 68, 68, 0.3)'),
                        borderRadius: 12,
                        opacity: alert.resolved ? 0.7 : 1,
                      }}
                    >
                      <div style={{ fontSize: 24 }}>{cfg.icon}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, color: '#fff', marginBottom: 4 }}>{alert.message}</div>
                        <div style={{ fontSize: 12, color: '#9ca3af' }}>
                          {formatTime(alert.created_at)}
                          {alert.sensor_value !== null && ` • Giá trị: ${alert.sensor_value}`}
                        </div>
                      </div>
                      <div style={{
                        padding: '6px 12px',
                        borderRadius: 8,
                        background: sev.bg,
                        color: sev.color,
                        fontSize: 12,
                        fontWeight: 600,
                        textTransform: 'uppercase',
                      }}>
                        {alert.severity}
                      </div>
                      {!alert.resolved && (
                        <button
                          onClick={() => handleResolveAlert(alert.id)}
                          style={{
                            padding: '8px 16px',
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            border: 'none',
                            borderRadius: 8,
                            color: '#fff',
                            cursor: 'pointer',
                            fontSize: 13,
                            fontWeight: 600,
                          }}
                        >
                          ✓ Xử lý
                        </button>
                      )}
                      {alert.resolved && (
                        <div style={{ color: '#10b981', fontSize: 13 }}>✓ Đã xử lý</div>
                      )}
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>

        {/* Stats */}
        <div style={{
          marginTop: 24,
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 12,
        }}>
          <div style={{
            padding: 16,
            background: 'rgba(255,255,255,0.03)',
            borderRadius: 12,
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#3b82f6' }}>
              {activeTab === 'logs' ? logs.length : alerts.length}
            </div>
            <div style={{ fontSize: 12, color: '#9ca3af' }}>
              {activeTab === 'logs' ? 'Tổng log' : 'Tổng cảnh báo'}
            </div>
          </div>
          {activeTab === 'alerts' && (
            <>
              <div style={{
                padding: 16,
                background: 'rgba(239, 68, 68, 0.1)',
                borderRadius: 12,
                textAlign: 'center',
              }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#ef4444' }}>
                  {alerts.filter(a => !a.resolved).length}
                </div>
                <div style={{ fontSize: 12, color: '#9ca3af' }}>Chưa xử lý</div>
              </div>
              <div style={{
                padding: 16,
                background: 'rgba(16, 185, 129, 0.1)',
                borderRadius: 12,
                textAlign: 'center',
              }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#10b981' }}>
                  {alerts.filter(a => a.resolved).length}
                </div>
                <div style={{ fontSize: 12, color: '#9ca3af' }}>Đã xử lý</div>
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        select option {
          background: #1a1a2e;
          color: #fff;
        }
      `}</style>
    </div>
  );
});

export default DeviceLogsModal;