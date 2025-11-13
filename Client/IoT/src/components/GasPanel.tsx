import React from 'react';

interface Props {
  gasDetected: boolean;
  gasAlert: boolean;
  clearAlert: () => void;
}

const GasPanel: React.FC<Props> = ({ gasDetected, gasAlert, clearAlert }) => (
  <div>
    <h3>Khí Gas</h3>
    <div style={{ marginTop: 8 }}>
      {gasAlert ? (
        <div className="alert warn">
          <div style={{ fontWeight: 700 }}>⚠️ Phát hiện khí gas!</div>
          <div className="col" style={{ flex: 1 }}>
            <div className="small">
              Nồng độ khí vượt ngưỡng an toàn. Kiểm tra nguồn gas và mở thông gió.
            </div>
            <button className="button" onClick={clearAlert}>
              Dừng cảnh báo
            </button>
          </div>
        </div>
      ) : (
        <div className="alert ok">
          <div>✅ Bình thường</div>
        </div>
      )}
      <div className="small" style={{ marginTop: 8 }}>
        Trạng thái cảm biến: {gasDetected ? 'Phát hiện' : 'Ổn định'}
      </div>
    </div>
  </div>
);

export default GasPanel;
