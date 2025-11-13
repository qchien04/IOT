// server.js - IoT Dashboard Server với Socket.IO
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const WebSocket = require('ws');
const app = express();
const server = http.createServer(app);
const io = socketIO(server);
const wss = new WebSocket.Server({ port: 8080 });

app.use(express.json());

// State của hệ thống IoT
let systemState = {
  sensors: {
    temperature: 25.5,
    humidity: 60,
    gas: 20
  },
  devices: {
    fan: false,
    doorOpen: false,
    awningOpen: false
  },
  gasDetected: false,
  gasAlert: false,
  cameraImageUrl: '/sample-camera.jpg',
  servoPosition: 0,      // mái che
  doorServoPosition: 0   // cửa ra vào
};

// Simulate sensor data updates
function simulateSensorData() {
  // Nhiệt độ thay đổi ±0.5°C
  systemState.sensors.temperature = parseFloat(
    (systemState.sensors.temperature + (Math.random() - 0.5)).toFixed(1)
  );
  
  // Độ ẩm thay đổi ±2%
  systemState.sensors.humidity = Math.max(20, Math.min(90,
    Math.round(systemState.sensors.humidity + (Math.random() - 0.5) * 4)
  ));
  
  // Khí gas thay đổi ±3 units
  systemState.sensors.gas = Math.max(0, Math.min(100,
    Math.round(systemState.sensors.gas + (Math.random() - 0.5) * 6)
  ));

  // 5% cơ hội phát hiện gas (demo)
  if (Math.random() < 0.05) {
    systemState.gasDetected = true;
    systemState.gasAlert = true;
    systemState.sensors.gas = Math.max(70, systemState.sensors.gas);
  }

  // Tự động tắt cảnh báo sau 10 giây nếu gas về mức an toàn
  if (systemState.sensors.gas < 50 && systemState.gasDetected) {
    systemState.gasDetected = false;
  }
}

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Gửi state hiện tại cho client mới kết nối
  socket.emit('state:sync', systemState);

  socket.on('device:toggle', (data) => {
    console.log('Device toggle request:', data);
    
    const { device, value } = data;
    if (device === 'doorOpen') {
      systemState.devices.doorOpen = value;
      
      // Cập nhật vị trí servo cửa
      systemState.doorServoPosition = value ? 180 : 100;

      // Gửi lệnh qua WebSocket cho ESP32
      wss.clients.forEach((wsClient) => {
        if (wsClient.readyState === WebSocket.OPEN) {
          wsClient.send(JSON.stringify({
            type: 'door',
            position: systemState.doorServoPosition
          }));
        }
      });
    }

    if (device === 'fan') {
      systemState.devices.fan = value;
      
      // Gửi lệnh qua WebSocket cho ESP32
      wss.clients.forEach((wsClient) => {
        if (wsClient.readyState === WebSocket.OPEN) {
          wsClient.send(JSON.stringify({
            type: 'fan',
            value: value
          }));
        }
      });
    }

    // Cập nhật state cho dashboard
    io.emit('devices:update', systemState.devices);
  });

  // Nhận lệnh clear gas alert
  socket.on('gas:clear', () => {
    console.log('Gas alert cleared');
    systemState.gasDetected = false;
    systemState.gasAlert = false;
    
    io.emit('gas:alert', {
      detected: false,
      alert: false
    });
  });

  // Nhận yêu cầu refresh camera
  socket.on('camera:refresh', () => {
    // Trong thực tế, bạn sẽ lấy ảnh mới từ camera
    const timestamp = Date.now();
    systemState.cameraImageUrl = `/api/camera/snapshot?t=${timestamp}`;
    socket.emit('camera:update', systemState.cameraImageUrl);
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});


// Simulate sensor updates every 2.5 seconds
setInterval(() => {
  simulateSensorData();
  
  // Broadcast sensor data to all connected clients
  io.emit('sensors:update', systemState.sensors);
  
  // Send gas alerts if detected
  if (systemState.gasAlert) {
    io.emit('gas:alert', {
      detected: systemState.gasDetected,
      alert: systemState.gasAlert
    });
  }
}, 2500);

wss.on('connection', (ws) => {
  console.log('Client connected');

  // Gửi state hiện tại ngay khi client kết nối
  ws.send(JSON.stringify({ type: 'state', data: systemState }));

  ws.on('message', (message) => {
    // Chuyển buffer sang string
    const msgStr = message.toString(); // <- thêm dòng này
    console.log('Nhận từ client:', msgStr);

    try {
      const data = JSON.parse(msgStr);
      if (data.rainValue !== undefined) {
        systemState.rainValue = data.rainValue;
        console.log('Cập nhật rainValue:', systemState.rainValue);

        if (systemState.rainValue < 1500) {
          systemState.servoPosition = 110; // Có mưa
        } else {
          systemState.servoPosition = 20;  // Không mưa
        }

        // Gửi lệnh servo cho tất cả client
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
              type: 'servo',
              position: systemState.servoPosition
            }));
          }
        });
      }
      if (data.gas !== undefined) {
        systemState.gas = data.gas;
        console.log('Cập nhật gasValue:', systemState.gas);

        if (systemState.gas < 1500) {
          systemState.gasAlert = true;
        } else {
          systemState.gasAlert = false;
        }
      }
    } catch (err) {
      console.error('Lỗi parse JSON:', err);
    }
  });


  ws.on('close', () => {
    console.log('Client disconnected');
  });
});
// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 IoT Server running on port ${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}`);
  console.log(`🔌 Socket.IO ready for connections`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});