import React, { useState } from 'react';

interface Props {
  imageUrl: string;
}

const CameraPanel: React.FC<Props> = ({ imageUrl }) => {
  const [snapshot, setSnapshot] = useState(imageUrl);

  const refresh = () => {
    setSnapshot(`${imageUrl}?t=${Date.now()}`);
  };

  return (
    <div>
      <h3>Camera trong nhà</h3>
      <div style={{ marginTop: 8 }}>
        <img className="camera-img" src={snapshot} alt="camera snapshot" />
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button className="button" onClick={refresh}>
            Cập nhật ảnh
          </button>
          <div className="small" style={{ marginLeft: 'auto' }}>
            (Demo: ảnh tĩnh)
          </div>
        </div>
      </div>
    </div>
  );
};

export default CameraPanel;
