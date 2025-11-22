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

    const timeMap = {
      '24h': 24,
      '48h': 48,
      '7d': 168
    };
    const hours = timeMap[range];
    const [statsResult] = await dbPool.execute(`
      SELECT 
        (SELECT \`${type}\` FROM sensor_data 
         WHERE timestamp >= DATE_SUB(NOW(), INTERVAL ? HOUR)
         ORDER BY timestamp DESC LIMIT 1) as current_value,
        AVG(\`${type}\`) as avg_value,
        MIN(\`${type}\`) as min_value,
        MAX(\`${type}\`) as max_value
      FROM sensor_data
      WHERE timestamp >= DATE_SUB(NOW(), INTERVAL ? HOUR)
    `, [hours, hours]);

    const stats = {
      current: parseFloat(statsResult[0].current_value) || 0,
      avg: parseFloat(statsResult[0].avg_value) || 0,
      min: parseFloat(statsResult[0].min_value) || 0,
      max: parseFloat(statsResult[0].max_value) || 0,
    };

    res.json({
      data: history,
      stats: stats
    });
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

// GET /api/device-logs
app.get('/api/device-logs', async (req, res) => {
  try {
    const { device, range = '24h', limit = '100' } = req.query;
    
    const hours = range === '24h' ? 24 : range === '48h' ? 48 : range === '7d' ? 168 : 24;
    const limitNum = parseInt(limit) || 100;
    
    let query;
    let params;
    
    if (device && device !== 'all') {
      // Có filter device - dùng string interpolation cho LIMIT
      query = `
        SELECT id, device_name, status, mode, timestamp
        FROM device_logs
        WHERE timestamp >= DATE_SUB(NOW(), INTERVAL ${hours} HOUR)
        AND device_name = ?
        ORDER BY timestamp DESC
        LIMIT ${limitNum}
      `;
      params = [device];
    } else {
      // Không filter device
      query = `
        SELECT id, device_name, status, mode, timestamp
        FROM device_logs
        WHERE timestamp >= DATE_SUB(NOW(), INTERVAL ${hours} HOUR)
        ORDER BY timestamp DESC
        LIMIT ${limitNum}
      `;
      params = [];
    }
    
    const [rows] = await dbPool.execute(query, params);
    res.json(rows);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/alerts
app.get('/api/alerts', async (req, res) => {
  try {
    const { type, resolved, range = '7d', limit = '100' } = req.query;
    
    const hours = range === '24h' ? 24 : range === '48h' ? 48 : range === '7d' ? 168 : 168;
    const limitNum = parseInt(limit) || 100;
    
    let query = `
      SELECT id, alert_type, severity, message, sensor_value, resolved, resolved_at, created_at
      FROM alerts
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ${hours} HOUR)
    `;
    const params = [];
    
    if (type && type !== 'all') {
      query += ' AND alert_type = ?';
      params.push(type);
    }
    
    if (resolved !== undefined && resolved !== 'all') {
      query += ' AND resolved = ?';
      params.push(resolved === 'true' ? 1 : 0);
    }
    
    query += ` ORDER BY created_at DESC LIMIT ${limitNum}`;
    
    const [rows] = await dbPool.execute(query, params);
    res.json(rows);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/alerts/status
app.get('/api/alerts/status', async (req, res) => {
  try {
    const hours = 24; // dùng số, không dùng '24h'
    
    const query = `
      SELECT COUNT(*) AS alertCount
      FROM alerts
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ${hours} HOUR)
      AND resolved = false
    `;
    
    const [rows] = await dbPool.execute(query);

    res.json({ count: rows[0].alertCount });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/alerts/:id/resolve
app.put('/api/alerts/:id/resolve', async (req, res) => {
  try {
    const { id } = req.params;
    
    await dbPool.execute(
      'UPDATE alerts SET resolved = TRUE, resolved_at = NOW() WHERE id = ?',
      [id]
    );
    
    res.json({ success: true });
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
      await logDeviceAction('ledBedRoom', value, 'manual');
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
      await logDeviceAction('camBuzzer', value, 'manual');
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
        if(systemState.devices.doorOpen != data.doorOpen){
          await logDeviceAction('doorOpen', value, systemState.autoModes.autoDoor?'auto':'manual');
        }
        systemState.devices.doorOpen = data.doorOpen;
        systemState.doorPosition = data.doorPosition || systemState.doorPosition;
      }
      if (data.roofOpen !== undefined) {
        if(systemState.devices.roofOpen != data.roofOpen){
          await logDeviceAction('roofOpen', value, systemState.autoModes.autoRoof?'auto':'manual');
        }
        systemState.devices.roofOpen = data.roofOpen;
        systemState.roofPosition = data.roofPosition || systemState.roofPosition;
      }
      if (data.ledPIR !== undefined) {
        if(systemState.devices.ledPIR != data.ledPIR){
          await logDeviceAction('ledPIR', value, systemState.autoModes.autoPIR?'auto':'manual');
        }
        systemState.devices.ledPIR = data.ledPIR;
      }
      if (data.gasBuzzer !== undefined) {
        if(systemState.devices.gasBuzzer != data.gasBuzzer){
          await logDeviceAction('gasBuzzer', value, systemState.autoModes.autoGasBuzzer?'auto':'manual');
        }
        systemState.devices.gasBuzzer = data.gasBuzzer;
      }
      if (data.ledBedRoom !== undefined) {
        if(systemState.devices.ledBedRoom != data.ledBedRoom){
          await logDeviceAction('ledBedRoom', value, 'manual');
        }
        systemState.devices.ledBedRoom = data.ledBedRoom;
      }
      if (data.camBuzzer !== undefined) {
        if(systemState.devices.camBuzzer != data.camBuzzer){
          await logDeviceAction('camBuzzer', value, 'manual');
        }
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