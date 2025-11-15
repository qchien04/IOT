// import React, { useState } from 'react';

// interface Props {
//   imageUrl: string;
// }

// const CameraPanel: React.FC<Props> = ({ imageUrl }) => {
//   const [snapshot, setSnapshot] = useState(imageUrl);

//   const refresh = () => {
//     setSnapshot(`${imageUrl}?t=${Date.now()}`);
//   };

//   return (
//     <div>
//       <h3>Camera trong nhà</h3>
//       <div style={{ marginTop: 8 }}>
//         <img className="camera-img" src={snapshot} alt="camera snapshot" />
//         <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
//           <button className="button" onClick={refresh}>
//             Cập nhật ảnh
//           </button>
//           <div className="small" style={{ marginLeft: 'auto' }}>
//             (Demo: ảnh tĩnh)
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default CameraPanel;
import React from 'react';

interface Props {
  streamUrl: string;
}

const CameraPanel: React.FC<Props> = ({ streamUrl }) => {
  console.log(streamUrl);
  return (
    <div>
      <h3>Camera trong nhà (Live)</h3>
      <img
        src={"http://192.168.43.168:5000/stream"}
        alt="Camera live"
        style={{ width: '100%', maxWidth: '640px', border: '1px solid #ccc', borderRadius: 4 }}
      />
    </div>
  );
};

export default CameraPanel;

