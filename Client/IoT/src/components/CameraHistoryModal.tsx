import { useEffect, useState } from "react";

interface Detection {
  id: number;
  timestamp: string;
  imageUrl: string;
  detectedObjects: string;
  confidence: number;
}

const CameraHistoryModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [selectedImage, setSelectedImage] = useState<Detection | null>(null);
  const [timeRange, setTimeRange] = useState<'today' | 'yesterday' | 'week'>('today');
  const [detections, setDetections] = useState<Detection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDetections();
  }, [timeRange]);

  const fetchDetections = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3000/api/camera/detections?range=${timeRange}`);
      const data = await response.json();
      setDetections(data);
    } catch (error) {
      console.error('Error fetching detections:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) {
      const diffMins = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return `${diffMins} phút trước`;
    }
    if (diffHours < 24) {
      return `${diffHours} giờ trước`;
    }
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
          maxWidth: 1200,
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
            <div style={{ fontSize: 32 }}>📸</div>
            <div>
              <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Lịch sử phát hiện</h2>
              <p style={{ margin: 0, fontSize: 13, color: '#9ca3af' }}>
                Các đối tượng được phát hiện bởi AI
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
            { value: 'today', label: 'Hôm nay' },
            { value: 'yesterday', label: 'Hôm qua' },
            { value: 'week', label: '7 ngày' },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setTimeRange(option.value as 'today' | 'yesterday' | 'week')}
              style={{
                flex: 1,
                padding: '12px 20px',
                background: timeRange === option.value 
                  ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                  : 'rgba(255,255,255,0.05)',
                border: '1px solid ' + (timeRange === option.value ? '#667eea' : 'rgba(255,255,255,0.1)'),
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

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 12,
            padding: 16,
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 6, textTransform: 'uppercase' }}>
              Tổng phát hiện
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#667eea' }}>
              {detections.length}
            </div>
          </div>
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 12,
            padding: 16,
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 6, textTransform: 'uppercase' }}>
              Người
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#10b981' }}>
              {detections.filter(d => d.detectedObjects === 'person').length}
            </div>
          </div>
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 12,
            padding: 16,
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 6, textTransform: 'uppercase' }}>
              Độ chính xác TB
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#f59e0b' }}>
              {(detections.reduce((sum, d) => sum + parseFloat(d.confidence.toString()), 0) / detections.length * 100).toFixed(0)}%
            </div>
          </div>
        </div>

        {/* Detection Grid */}
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
              borderTop: '3px solid #667eea',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }} />
            <div>Đang tải dữ liệu...</div>
          </div>
        ) : detections.length === 0 ? (
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
            <div>Không có phát hiện nào</div>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 16,
            maxHeight: '500px',
            overflow: 'auto',
          }}>
            {detections.map((detection) => (
              <div
                key={detection.id}
                onClick={() => setSelectedImage(detection)}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 16,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(102, 126, 234, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ position: 'relative' }}>
                  <img
                    src={detection.imageUrl}
                    alt="Detection"
                    style={{
                      width: '100%',
                      height: 200,
                      objectFit: 'cover',
                    }}
                  />
                  <div style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    padding: '4px 8px',
                    background: 'rgba(16, 185, 129, 0.9)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 600,
                    color: 'white',
                  }}>
                    {(parseFloat(detection.confidence.toString()) * 100).toFixed(0)}%
                  </div>
                </div>
                <div style={{ padding: 12 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
                    🎯 {detection.detectedObjects}
                  </div>
                  <div style={{ fontSize: 12, color: '#9ca3af' }}>
                    🕐 {formatTime(detection.timestamp)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Image Viewer Modal */}
        {selectedImage && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.95)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2000,
              padding: 40,
            }}
            onClick={() => setSelectedImage(null)}
          >
            <div style={{ position: 'relative', maxWidth: '90%', maxHeight: '90%' }}>
              <img
                src={selectedImage.imageUrl}
                alt="Detection detail"
                style={{
                  maxWidth: '100%',
                  maxHeight: '80vh',
                  borderRadius: 16,
                  boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                }}
              />
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)',
                padding: 24,
                borderRadius: '0 0 16px 16px',
              }}>
                <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
                  🎯 {selectedImage.detectedObjects}
                </div>
                <div style={{ fontSize: 14, color: '#9ca3af' }}>
                  🕐 {new Date(selectedImage.timestamp).toLocaleString('vi-VN')}
                </div>
                <div style={{ fontSize: 14, color: '#10b981', marginTop: 4 }}>
                  ✓ Độ chính xác: {(parseFloat(selectedImage.confidence.toString()) * 100).toFixed(0)}%
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CameraHistoryModal;