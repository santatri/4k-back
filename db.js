const mysql = require('mysql');
require('dotenv').config();

// Configuration améliorée avec SSL et timeout étendu
const pool = mysql.createPool({
  connectionLimit: 10,
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  connectTimeout: 10000, // 10 secondes
  waitForConnections: true,
  queueLimit: 0,
  ssl: { rejectUnauthorized: false } // Nécessaire pour Railway
});

// Test de connexion robuste
pool.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Erreur MySQL:', {
      code: err.code,
      message: err.message,
      stack: err.stack
    });
    return;
  }
  
  console.log('✅ Connecté à MySQL (Railway)');
  connection.query('SELECT 1 + 1 AS test', (error) => {
    connection.release();
    if (error) console.error('❌ Test query failed:', error);
    else console.log('✔ Test query réussie');
  });
});

module.exports = pool;