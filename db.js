const mysql = require('mysql');
require('dotenv').config();

const pool = mysql.createPool({
  connectionLimit: 10,
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  connectTimeout: 20000,
  acquireTimeout: 20000,
  timeout: 20000,
  ssl: { rejectUnauthorized: false },
  // ↓ Solution pour MySQL 8+ avec 'mysql' (ancienne méthode d'authentification)
  authSwitchHandler: function ({ pluginName }, cb) {
    if (pluginName === 'caching_sha2_password') {
      // Force l'utilisation de 'mysql_native_password'
      cb(null, Buffer.from(process.env.DB_PASSWORD + '\0'));
    }
  }
});

// Test de connexion
pool.getConnection((err, connection) => {
  if (err) {
    console.error('❌ ERREUR MYSQL:', {
      code: err.code,
      message: err.message,
      stack: err.stack,
      config: {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        db: process.env.DB_NAME
      }
    });
    process.exit(1);
  } else {
    connection.query('SELECT 1 + 1 AS test', (error, results) => {
      connection.release();
      if (error) {
        console.error('❌ TEST QUERY FAILED:', error);
      } else {
        console.log('✅ MySQL Opérationnel. Test résultat:', results[0].test);
      }
    });
  }
});

module.exports = pool;