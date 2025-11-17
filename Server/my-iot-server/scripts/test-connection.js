const mysql = require('mysql2/promise');
require('dotenv').config();

async function testConnection() {
  console.log('🔍 Testing connections...\n');

  // Test MySQL
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'smart_home'
    });

    console.log('✅ MySQL connection successful');

    // Test query
    const [rows] = await connection.query('SELECT COUNT(*) as count FROM sensor_data');
    console.log(`   📊 Sensor data records: ${rows[0].count}`);

    const [deviceRows] = await connection.query('SELECT COUNT(*) as count FROM device_logs');
    console.log(`   📝 Device logs records: ${deviceRows[0].count}`);

    await connection.end();
  } catch (error) {
    console.error('❌ MySQL connection failed:', error.message);
  }

  console.log('\n✅ Connection test completed');
}

testConnection();