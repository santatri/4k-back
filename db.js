const mysql = require('mysql');
require('dotenv').config();

const pool = mysql.createPool({
  connectionLimit: 15,
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 23553,
  connectTimeout: 20000, // 20s timeout
  ssl: process.env.NODE_ENV === 'production' 
    ? { rejectUnauthorized: false } 
    : null,
  charset: 'utf8mb4',
  timezone: 'local',
  debug: process.env.NODE_ENV === 'development'
});

// Test de connexion robuste
pool.getConnection((err, connection) => {
  if (err) {
    console.error('❌ ERREUR MySQL:', {
      code: err.code,
      errno: err.errno,
      stack: err.stack
    });
    
    // Réessai après délai
    setTimeout(() => pool.getConnection(() => {}), 5000);
    return;
  }

  connection.query('SELECT NOW() AS time', (error) => {
    connection.release();
    if (error) {
      console.error('⚠️ Test MySQL échoué:', error);
    } else {
      console.log('✅ MySQL prêt');
    }
  });
});

// Gestion des erreurs du pool
pool.on('error', (err) => {
  console.error('💥 Pool MySQL error:', {
    message: err.message,
    code: err.code,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

module.exports = pool;