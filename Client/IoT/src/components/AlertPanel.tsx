import React, { useEffect, useState } from 'react';


const AlertPanel: React.FC = React.memo(() => {
  const [alertCount, setAlertCount] =useState<number>(0);

  useEffect(() => {
    const fetchSensorHistory = async () => {
      
      try {
        const response = await fetch(
          `http://localhost:3000/api/alerts/status`
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch alerts status');
        }
        
        const result = await response.json();
        
        setAlertCount(result.count);
        
      } catch (error) {
        console.error('Error fetching sensor history:', error);
      }
    };

    fetchSensorHistory();
  }, []);

  return (
  <div>
    <h3>Cảnh báo an toàn</h3>
    <div style={{ marginTop: 8 }}>
      {alertCount > 0 ? (
        <div className="alert warn">
          <div style={{ fontWeight: 700 }}>⚠️ Còn cảnh báo chưa xử lý!</div>
          <div className="col" style={{ flex: 1 }}>
            <div className="small">
              Hãy xử lý cảnh báo đồng thời xác nhận trên log
            </div>
          </div>
        </div>
      ) : (
        <div className="alert ok">
          <div>✅ Tất cả đang trong tình trạng tốt nhất</div>
        </div>
      )}
      <div className="small" style={{ marginTop: 8 }}>
        Trạng thái : {alertCount>0 ? 'Còn nguy hiểm chưa xử lý' : 'Hoàn hảo'}
      </div>
    </div>
  </div>
)});

export default AlertPanel;
