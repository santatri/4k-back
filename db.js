const mysql = require('mysql');
require('dotenv').config();

// Configuration améliorée avec pool de connexions
const pool = mysql.createPool({
  connectionLimit: 10, // Nombre max de connexions
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  queueLimit: 0
});

// Test de connexion au démarrage
pool.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Erreur de connexion MySQL:', err.message);
    return;
  }
  console.log('✅ Connecté à MySQL');
  connection.release();
});

module.exports = pool;