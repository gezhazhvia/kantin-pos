// ============================================================
// Konfigurasi MySQL Connection Pool
// ============================================================

const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host:     process.env.DB_HOST || 'localhost',
    port:     parseInt(process.env.DB_PORT) || 3306,
    user:     process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'kantin_pos',

    // Pool settings
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,

    // Timezone
    timezone: '+07:00',

    // Mengaktifkan named placeholders (:name)
    namedPlaceholders: true,
});

// Test koneksi saat startup
pool.getConnection()
    .then(conn => {
        console.log('✅ Database MySQL terhubung');
        conn.release();
    })
    .catch(err => {
        console.error('❌ Gagal koneksi ke database:', err.message);
    });

module.exports = pool;
