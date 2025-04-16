const mysql = require('mysql');
require('dotenv').config();

// Configuration OPTIMISÉE pour Railway
const pool = mysql.createPool({
  connectionLimit: 10,
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  connectTimeout: 20000, // 20 secondes
  acquireTimeout: 20000, // 20 secondes
  timeout: 20000, // 20 secondes
  ssl: { rejectUnauthorized: false },
  debug: true // Active les logs détaillés
});

// Test de connexion ULTRA-robuste
pool.getConnection((err, connection) => {
  if (err) {
    console.error('❌ ERREUR CRITIQUE MYSQL:', {
      code: err.code,
      message: err.message,
      stack: err.stack,
      config: {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        db: process.env.DB_NAME
      }
    });
    process.exit(1); // Arrête l'application si la DB échoue
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