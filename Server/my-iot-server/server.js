// server.js - IoT Dashboard Server với Socket.IO và MySQL
const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIO = require('socket.io');
const WebSocket = require('ws');
const mysql = require('mysql2/promise');
const { config } = require('dotenv');
require('dotenv').config();
const app = express();
const server = http.createServer(app);
const io = socketIO(server);
const wss = new WebSocket.Server({ port: 8080 });

app.use(cors({
  origin: 'http://localhost:5173',     // Cho phép frontend Vite
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  credentials: true
}));

app.use(express.json());

// ============================================
// DATABASE CONNECTION
// ============================================
const dbPool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'smart_home',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test database connection
dbPool.getConnection()
  .then(conn => {
    console.log('✅ MySQL connected successfully');
    conn.release();
  })
  .catch(err => {
    console.error('❌ MySQL connection error:', err);
  });

// ============================================
// DATABASE HELPER FUNCTIONS
// ============================================
async function insertSensorData(temperature, humidity, gas, rainValue) {
  try {
    const [result] = await dbPool.execute(
      'INSERT INTO sensor_data (temperature, humidity, gas, rainValue) VALUES (?, ?, ?, ?)',
      [temperature, humidity, gas, rainValue]
    );
    
    // Check for alerts
    if (gas > 50) {
      await createAlert('gas', 'high', 'Phát hiện nồng độ khí gas cao!', gas);
    }
    if (temperature > 35) {
      await createAlert('temperature', 'high', 'Nhiệt độ cao bất thường!', temperature);
    }
    if (humidity > 80) {
      await createAlert('humidity', 'high', 'Độ ẩm quá cao!', humidity);
    }
    if (rainValue > 50) {
      await createAlert('rain', 'high', 'Độ mưa quá cao!', rainValue);
    }
    
    return result;
  } catch (error) {
    console.error('Error inserting sensor data:', error);
    throw error;
  }
}

async function logDeviceAction(deviceName, status, mode = 'manual') {
  try {
    await dbPool.execute(
      'INSERT INTO device_logs (device_name, status, mode) VALUES (?, ?, ?)',
      [deviceName, status ? 1 : 0, mode]
    );
  } catch (error) {
    console.error('Error logging device action:', error);
  }
}

async function createAlert(alertType, severity, message, sensorValue = null) {
  try {
    await dbPool.execute(
      'INSERT INTO alerts (alert_type, severity, message, sensor_value) VALUES (?, ?, ?, ?)',
      [alertType, severity, message, sensorValue]
    );
  } catch (error) {
    console.error('Error creating alert:', error);
  }
}

async function getSensorHistory(sensorType, timeRange) {
  try {
    // Validate sensor type
    const validSensorTypes = ['temperature', 'humidity', 'gas', 'rainValue'];
    if (!validSensorTypes.includes(sensorType)) {
      throw new Error('Invalid sensor type');
    }

    // Validate time range
    const timeMap = {
      '24h': 24,
      '48h': 48,
      '7d': 168
    };

    const hours = timeMap[timeRange];
    if (!hours) {
      throw new Error('Invalid time range');
    }

    let rows;

    // For 7 days, aggregate by hour
    if (timeRange === '7d') {
      // Fix: Use the same expression in SELECT and GROUP BY
      const query = `
        SELECT 
          DATE_FORMAT(timestamp, '%Y-%m-%d %H:00:00') as timestamp,
          AVG(\`${sensorType}\`) as value
        FROM sensor_data
        WHERE timestamp >= DATE_SUB(NOW(), INTERVAL ? HOUR)
        GROUP BY DATE_FORMAT(timestamp, '%Y-%m-%d %H:00:00')
        ORDER BY timestamp ASC
      `;
      [rows] = await dbPool.execute(query, [hours]);
    } else {
      // For 24h and 48h, return all data points
      const query = `
        SELECT 
          DATE_FORMAT(timestamp, '%Y-%m-%d %H:%i:%s') as timestamp,
          \`${sensorType}\` as value
        FROM sensor_data
        WHERE timestamp >= DATE_SUB(NOW(), INTERVAL ? HOUR)
        ORDER BY timestamp ASC
      `;
      [rows] = await dbPool.execute(query, [hours]);
    }

    return rows.map(row => ({
      timestamp: row.timestamp,
      value: parseFloat(row.value) || 0
    }));
  } catch (error) {
    console.error('Error fetching sensor history:', error);
    throw error;
  }
}

async function updateConfig(key, value) {
  try {
    await dbPool.execute(
      'INSERT INTO system_config (config_key, config_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE config_value = ?',
      [key, value.toString(), value.toString()]
    );
  } catch (error) {
    console.error('Error updating config:', error);
  }
}

async function getConfig() {
  try {
    const [rows] = await dbPool.query('SELECT config_key, config_value FROM system_config');
    const config = {};
    rows.forEach(row => {
      config[row.config_key] = parseFloat(row.config_value) || row.config_value;
    });
    return config;
  } catch (error) {
    console.error('Error fetching config:', error);
    return {
      ROOF_OPEN_CORNER: 15,
      ROOF_CLOSE_CORNER: 120,
      DOOR_OPEN: 180,
      DOOR_CLOSE: 100
    };
  }
}

// ============================================
// STATE MANAGEMENT
// ============================================
let systemState = {
  sensors: {
    temperature: 25.5,
    humidity: 60,
    gas: 20,
    rainValue: 0,
  },
  devices: {
    doorOpen: false,
    roofOpen: false,
    ledPIR: false,
    gasBuzzer: false,
    ledBedRoom: false,
    camBuzzer: false
  },
  autoModes: {
    autoDoor: false,
    autoRoof: false,
    autoPIR: false,
    autoGasBuzzer: false,
  },
  cameraImageUrl: 'http://192.168.43.168:5000/stream',
  roofPosition: 0,
  doorPosition: 0
};

let Config = {
  ROOF_OPEN_CORNER: 30,
  ROOF_CLOSE_CORNER: 120,
  DOOR_OPEN_CORNER: 180,
  DOOR_CLOSE_CORNER: 100,
  RAIN_THRESHOLD: 2000,
  GAS_THRESHOLD: 200,

  sendInterval : 500,     // 0.5s gửi dữ liệu
  dhtInterval  : 2000,    // 2s đọc DHT
  lcdInterval  : 2000,    // 2s update LCD
  gasInterval  : 500,     // 0.5s đọc gas

};

// Load config from database on startup
getConfig().then(dbConfig => {
  Config = { ...Config, ...dbConfig };
  console.log('✅ Config loaded from database:', Config);
  
});

// ============================================
// REST API ROUTES
// ============================================

// GET /api/sensors/history
app.get('/api/sensors/history', async (req, res) => {
  try {
    const { type, range } = req.query;

    if (!type || !['temperature', 'humidity', 'gas', 'rainValue'].includes(type)) {
      return res.status(400).json({ error: 'Invalid sensor type' });
    }

    if (!range || !['24h', '48h', '7d'].includes(range)) {
      return res.status(400).json({ error: 'Invalid time range' });
    }

    const history = await getSensorHistory(type, range);
    res.json(history);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/sensors/latest
app.get('/api/sensors/latest', async (req, res) => {
  try {
    const [rows] = await dbPool.query(
      'SELECT * FROM sensor_data ORDER BY timestamp DESC LIMIT 1'
    );
    res.json(rows[0] || systemState.sensors);
  } catch (error) {
    console.error('API Error:', error);
    res.json(systemState.sensors);
  }
});

// GET /api/sensors/stats
app.get('/api/sensors/stats', async (req, res) => {
  try {
    const { range = '24h' } = req.query;
    const hours = range === '24h' ? 24 : range === '48h' ? 48 : 168;

    const [rows] = await dbPool.execute(`
      SELECT 
        MIN(temperature) as min_temp,
        MAX(temperature) as max_temp,
        AVG(temperature) as avg_temp,
        MIN(humidity) as min_humidity,
        MAX(humidity) as max_humidity,
        AVG(humidity) as avg_humidity,
        MIN(gas) as min_gas,
        MAX(gas) as max_gas,
        AVG(gas) as avg_gas,
        MIN(rainValue) as min_rain,
        MAX(rainValue) as max_rain,
        AVG(rainValue) as avg_rain,
        COUNT(*) as data_points
      FROM sensor_data
      WHERE timestamp >= DATE_SUB(NOW(), INTERVAL ? HOUR)
    `, [hours]);

    res.json(rows[0]);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/config
app.get('/api/config', async (req, res) => {
  try {
    const config = await getConfig();
    res.json(config);
  } catch (error) {
    console.error('API Error:', error);
    res.json(Config);
  }
});

app.post('/api/config', async (req, res) => {
  try {
    const config = req.body;
    console.log("send fix config+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++")
    console.log(config);
    console.log("send fix config+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++")
    for (const key in config) {
      await updateConfig(key, config[key]);
    }

    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        console.log("send fix config+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++")
        client.send(JSON.stringify({ type: 'config', config: config }));
      }
    });

    res.json({ status: "ok", updated: config });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: "Failed to update config" });
  }
});

// GET /api/camera/detections - Get camera detection history
app.get('/api/camera/detections', async (req, res) => {
  try {
    const { range = 'today' } = req.query;

    const now = new Date();
    let startTime, endTime;

    // Handle time range
    switch (range) {
      case 'today':
        startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        break;

      case 'yesterday':
        startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0);
        endTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);

        const [yesterdayRows] = await dbPool.execute(
          `SELECT id, timestamp, image_url, detected_objects, confidence
           FROM camera_detections
           WHERE timestamp >= ? AND timestamp < ?
           ORDER BY timestamp DESC`,
          [startTime, endTime]
        );

        // Map fields for frontend
        return res.json(
          yesterdayRows.map(row => ({
            id: row.id,
            timestamp: row.timestamp,
            imageUrl: row.image_url,
            detectedObjects: row.detected_objects,
            confidence: row.confidence
          }))
        );

      case 'week':
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;

      default:
        startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    }

    const [rows] = await dbPool.execute(
      `SELECT id, timestamp, image_url, detected_objects, confidence
       FROM camera_detections
       WHERE timestamp >= ?
       ORDER BY timestamp DESC`,
      [startTime]
    );

    res.json(
      rows.map(row => ({
        id: row.id,
        timestamp: row.timestamp,
        imageUrl: row.image_url,
        detectedObjects: row.detected_objects,
        confidence: row.confidence
      }))
    );

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// POST /api/camera/detection - Save new detection (from AI service)
app.post('/api/camera/detection', async (req, res) => {
  try {
    const { imageUrl, detectedObjects, confidence } = req.body;
    
    if (!imageUrl || !detectedObjects) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const [result] = await dbPool.execute(
      'INSERT INTO camera_detections (image_url, detected_objects, confidence) VALUES (?, ?, ?)',
      [imageUrl, detectedObjects, confidence || 0.0]
    );
    
    // Broadcast to all connected clients
    io.emit('camera:detection', {
      id: result.insertId,
      imageUrl,
      detectedObjects,
      confidence,
      timestamp: new Date()
    });
    
    res.json({ success: true, id: result.insertId });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================
// SOCKET.IO CONNECTION HANDLING
// ============================================
io.on('connection', (socket) => {
  console.log(`✅ Client connected: ${socket.id}`);

  // Send current state to newly connected client
  socket.emit('state:sync', systemState);

  // Handle device toggle
  socket.on('device:toggle', async (data) => {
    console.log('🔄 Device toggle request:', data);
    
    const { device, value } = data;

    if (device === 'doorOpen') {
      systemState.devices.doorOpen = value;
      systemState.doorPosition = value ? Config.DOOR_OPEN : Config.DOOR_CLOSE;

      // Log to database
      await logDeviceAction('doorOpen', value, systemState.autoModes.autoDoor ? 'auto' : 'manual');

      // Send to ESP32
      wss.clients.forEach((wsClient) => {
        if (wsClient.readyState === WebSocket.OPEN) {
          wsClient.send(JSON.stringify({
            type: 'doorOpen',
            value: systemState.devices.doorOpen
          }));
        }
      });
    }

    if (device === 'roofOpen') {
      systemState.devices.roofOpen = value;
      systemState.roofPosition = value ? Config.ROOF_OPEN_CORNER : Config.ROOF_CLOSE_CORNER;
      console.log("-------------------------------")
      console.log(systemState.devices.roofOpen)
      console.log(systemState.roofPosition)
      console.log("-------------------------------")
      // Log to database
      await logDeviceAction('roofOpen', value, systemState.autoModes.autoRoof ? 'auto' : 'manual');

      // Send to ESP32
      wss.clients.forEach((wsClient) => {
        if (wsClient.readyState === WebSocket.OPEN) {
          wsClient.send(JSON.stringify({
            type: 'roofOpen',
            value: systemState.devices.roofOpen
          }));
        }
      });
    }

    if (device === 'ledPIR') {
      systemState.devices.ledPIR = value;

      // Log to database
      await logDeviceAction('ledPIR', value, systemState.autoModes.autoPIR ? 'auto' : 'manual');

      // Send to ESP32
      wss.clients.forEach((wsClient) => {
        if (wsClient.readyState === WebSocket.OPEN) {
          wsClient.send(JSON.stringify({
            type: 'ledPIR',
            value: value
          }));
        }
      });
    }

    if (device === 'gasBuzzer') {
      systemState.devices.gasBuzzer = value;

      // Log to database
      await logDeviceAction('gasBuzzer', value, systemState.autoModes.autoGasBuzzer ? 'auto' : 'manual');

      // Send to ESP32
      wss.clients.forEach((wsClient) => {
        if (wsClient.readyState === WebSocket.OPEN) {
          wsClient.send(JSON.stringify({
            type: 'gasBuzzer',
            value: value
          }));
        }
      });
    }

    if (device === 'ledBedRoom') {
      systemState.devices.ledBedRoom = value;

      // Send to ESP32
      wss.clients.forEach((wsClient) => {
        if (wsClient.readyState === WebSocket.OPEN) {
          wsClient.send(JSON.stringify({
            type: 'ledBedRoom',
            value: value
          }));
        }
      });
    }

    if (device === 'camBuzzer') {
      systemState.devices.camBuzzer = value;

      // Send to ESP32
      wss.clients.forEach((wsClient) => {
        if (wsClient.readyState === WebSocket.OPEN) {
          wsClient.send(JSON.stringify({
            type: 'camBuzzer',
            value: value
          }));
        }
      });
    }

    // Broadcast updated state to all clients
    io.emit('devices:update', systemState.devices);
  });

  // Handle mode change
  socket.on("mode:change", (data) => {
    const { module, auto } = data;
    console.log("🔄 Mode change:", module, auto);

    systemState.autoModes[module] = auto;

    // Send to ESP32
    wss.clients.forEach(c => {
      if (c.readyState === WebSocket.OPEN) {
        c.send(JSON.stringify({
          type: "mode",
          module: module,
          auto: auto
        }));
      }
    });

    io.emit("mode:update", systemState.autoModes);
  });

  socket.on('camera:refresh', () => {
    const timestamp = Date.now();
    systemState.cameraImageUrl = `http://192.168.43.168:5000/stream?t=${timestamp}`;
    socket.emit('camera:update', systemState.cameraImageUrl);
  });

  socket.on('disconnect', () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
  });
});

// ============================================
// WEBSOCKET (ESP32) CONNECTION HANDLING
// ============================================
wss.on('connection', (ws) => {
  console.log('🔌 ESP32 connected via WebSocket');

  // Send current state to ESP32
  ws.send(JSON.stringify({ 
    type: 'state', 
    data: {
      ...systemState,
      config: Config
    }
  }));

  ws.on('message', async (message) => {
    const msgStr = message.toString();
    console.log('📨 Received from ESP32:', msgStr);
    
    try {
      const data = JSON.parse(msgStr);
      
      // Update sensor data
      if (data.temperature !== undefined || data.humidity !== undefined || data.gas !== undefined) {
        const temp = data.temperature ?? systemState.sensors.temperature;
        const hum = data.humidity ?? systemState.sensors.humidity;
        const gas = data.gas ?? systemState.sensors.gas;
        const rainValue = data.rainValue ?? systemState.sensors.rainValue;
        
        systemState.sensors.temperature = temp;
        systemState.sensors.humidity = hum;
        systemState.sensors.gas = gas;
        systemState.sensors.rainValue = rainValue;

        // Save to database
        await insertSensorData(temp, hum, gas, rainValue);

        // Broadcast to all dashboard clients
        io.emit('sensors:update', systemState.sensors);
      }

      // Update device states from ESP32
      if (data.doorOpen !== undefined) {
        systemState.devices.doorOpen = data.doorOpen;
        systemState.doorPosition = data.doorPosition || systemState.doorPosition;
      }
      if (data.roofOpen !== undefined) {
        systemState.devices.roofOpen = data.roofOpen;
        systemState.roofPosition = data.roofPosition || systemState.roofPosition;
      }
      if (data.ledPIR !== undefined) {
        systemState.devices.ledPIR = data.ledPIR;
      }
      if (data.gasBuzzer !== undefined) {
        systemState.devices.gasBuzzer = data.gasBuzzer;
      }
      if (data.ledBedRoom !== undefined) {
        systemState.devices.ledBedRoom = data.ledBedRoom;
      }
      if (data.camBuzzer !== undefined) {
        systemState.devices.camBuzzer = data.camBuzzer;
      }

      let isChange=false;
      // Update auto modes from ESP32
      if (data.autoDoor !== undefined) {
        if(systemState.autoModes.autoDoor != data.autoDoor){
          isChange=true;
          wss.clients.forEach(c => {
            if (c.readyState === WebSocket.OPEN) {
              c.send(JSON.stringify({
                type: "mode",
                module: "autoDoor",
                auto: systemState.autoModes.autoDoor
              }));
            }
          });
        }
      }
      if (data.autoRoof !== undefined) {
        if(systemState.autoModes.autoRoof != data.autoRoof){
          isChange=true;
          wss.clients.forEach(c => {
            if (c.readyState === WebSocket.OPEN) {
              c.send(JSON.stringify({
                type: "mode",
                module: "autoRoof",
                auto: systemState.autoModes.autoRoof
              }));
            }
          });
        }
      }
      if (data.autoPIR !== undefined) {
        if(systemState.autoModes.autoPIR != data.autoPIR){
          isChange=true;
          wss.clients.forEach(c => {
            if (c.readyState === WebSocket.OPEN) {
              c.send(JSON.stringify({
                type: "mode",
                module: "autoPIR",
                auto: systemState.autoModes.autoPIR
              }));
            }
          });
        }
      }
      if (data.autoGasBuzzer !== undefined) {
        if(systemState.autoModes.autoGasBuzzer != data.autoGasBuzzer){
          isChange=true;
          wss.clients.forEach(c => {
            if (c.readyState === WebSocket.OPEN) {
              c.send(JSON.stringify({
                type: "mode",
                module: "autoGasBuzzer",
                auto: systemState.autoModes.autoGasBuzzer
              }));
            }
          });
        }
      }

      // if(isChange===true){
      //   wss.clients.forEach(client => {
      //     if (client.readyState === WebSocket.OPEN) {
      //       client.send(JSON.stringify({ type: 'config', config: systemState.autoModes }));
      //     }
      //   });
      // }

    } catch (err) {
      console.error('❌ Error parsing JSON from ESP32:', err);
    }
  });

  ws.on('close', () => {
    console.log('🔌 ESP32 disconnected');
  });

  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error);
  });
});

setInterval(() => {
  //console.log("🔥 Sending state to clients:", systemState);
  io.emit('state:sync', systemState);
}, 1000);

// ============================================
// START SERVER
// ============================================
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log('🚀 IoT Server running');
  console.log(`📊 Dashboard: http://localhost:${PORT}`);
  console.log(`🔌 Socket.IO: http://localhost:${PORT}`);
  console.log(`🌐 WebSocket (ESP32): ws://localhost:8080`);
});

process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');
  
  // Close database connections
  await dbPool.end();
  console.log('✅ Database connections closed');
  
  // Close WebSocket server
  wss.close(() => {
    console.log('✅ WebSocket server closed');
  });
  
  // Close HTTP server
  server.close(() => {
    console.log('✅ HTTP server closed');
    process.exit(0);
  });
});