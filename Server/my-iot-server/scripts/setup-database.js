const mysql = require('mysql2/promise');
require('dotenv').config();

async function setupDatabase() {
  let connection;
  
  try {
    // Connect without database first
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || ''
    });

    console.log('✅ Connected to MySQL');

    // Create database
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'smart_home'}`);
    console.log('✅ Database created/verified');

    await connection.query(`USE ${process.env.DB_NAME || 'smart_home'}`);

    // Create sensor_data table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS sensor_data (
        id INT AUTO_INCREMENT PRIMARY KEY,
        temperature DECIMAL(5, 2) NOT NULL,
        humidity DECIMAL(5, 2) NOT NULL,
        gas INT NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_timestamp (timestamp)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('✅ sensor_data table created');

    // Create device_logs table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS device_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        device_name VARCHAR(50) NOT NULL,
        status BOOLEAN NOT NULL,
        mode VARCHAR(20) DEFAULT 'manual',
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_device_timestamp (device_name, timestamp)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('✅ device_logs table created');

    // Create system_config table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS system_config (
        id INT AUTO_INCREMENT PRIMARY KEY,
        config_key VARCHAR(50) NOT NULL UNIQUE,
        config_value VARCHAR(255) NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_config_key (config_key)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('✅ system_config table created');

    // Create alerts table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS alerts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        alert_type VARCHAR(50) NOT NULL,
        severity VARCHAR(20) NOT NULL,
        message TEXT NOT NULL,
        sensor_value DECIMAL(10, 2),
        resolved BOOLEAN DEFAULT FALSE,
        resolved_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_alert_type (alert_type, created_at),
        INDEX idx_resolved (resolved)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('✅ alerts table created');

    // Insert default config
    const defaultConfigs = [
      ['ROOF_OPEN_CORNER', '110'],
      ['ROOF_CLOSE_CORNER', '20'],
      ['DOOR_OPEN', '180'],
      ['DOOR_CLOSE', '100'],
      ['GAS_THRESHOLD', '50'],
      ['TEMP_HIGH_THRESHOLD', '35'],
      ['TEMP_LOW_THRESHOLD', '15'],
      ['HUMIDITY_HIGH_THRESHOLD', '80'],
      ['HUMIDITY_LOW_THRESHOLD', '30']
    ];

    for (const [key, value] of defaultConfigs) {
      await connection.query(
        'INSERT INTO system_config (config_key, config_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE config_value = ?',
        [key, value, value]
      );
    }
    console.log('✅ Default configuration inserted');

    console.log('\n🎉 Database setup completed successfully!');
    console.log('\n📊 Tables created:');
    console.log('   - sensor_data');
    console.log('   - device_logs');
    console.log('   - system_config');
    console.log('   - alerts');

  } catch (error) {
    console.error('❌ Error setting up database:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

setupDatabase();