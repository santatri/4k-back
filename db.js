const mysql = require('mysql');
require('dotenv').config(); // Charger les variables d’environnement

// Créer la connexion à la base de données
const db = mysql.createConnection({
    host: process.env.DB_HOST ,
    user: process.env.DB_USER ,
    password: process.env.DB_PASSWORD ,
    database: process.env.DB_NAME ,
    port: process.env.DB_PORT  // Correction du port MySQL
});

// Gérer la connexion à la base de données
db.connect(err => {
    if (err) {
        console.error('❌ Erreur de connexion MySQL:', err.message);
        return;
    }
    console.log('✅ Connecté à MySQL');
});

// Gérer les erreurs de connexion (utile en production)
db.on('error', err => {
    console.error('⚠️ Erreur MySQL:', err.message);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
        console.log('🔄 Tentative de reconnexion...');
        db.connect();
    } else {
        throw err;
    }
});

module.exports = db;

