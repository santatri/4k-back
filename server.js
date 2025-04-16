const express = require('express');
const cors = require('cors');
const db = require('./db');
const multer = require('multer');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 5000;

// ==================== Configuration améliorée ====================

// 1. CORS avec logging étendu
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'https://4kdesigns-mada.com',
      'https://4kfront.vercel.app',
      'http://localhost:3000',
      'http://localhost:5173'
    ];
    
    if (!origin || allowedOrigins.includes(origin)) {
      console.log(`✅ CORS autorisé pour: ${origin || 'no-origin'}`);
      callback(null, true);
    } else {
      console.warn(`🚨 CORS bloqué pour: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Access-Control-Allow-Origin'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// 2. Socket.IO avec gestion d'erreur
const io = new Server(server, { 
  cors: corsOptions,
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000 // 2 minutes
  }
});

io.on('connection', (socket) => {
  console.log(`⚡ Socket connecté: ${socket.id}`);
  
  socket.on('error', (err) => {
    console.error('Socket error:', err);
  });
});

// ==================== Middlewares améliorés ====================

app.use((req, res, next) => { 
  req.io = io; 
  next(); 
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Multer avec gestion d'erreur
const upload = multer({ 
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    }
  }),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
}).on('error', (err) => {
  console.error('Multer error:', err);
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ==================== Routes améliorées ====================

// Endpoint de diagnostic étendu
app.get('/api/health', (req, res) => {
  db.getConnection((err, connection) => {
    if (err) {
      return res.status(500).json({
        status: "ERROR",
        db: "DISCONNECTED",
        error: err.message,
        uptime: process.uptime()
      });
    }
    
    connection.query('SELECT NOW() AS db_time, 1+1 AS test', (error, results) => {
      connection.release();
      
      if (error) {
        res.status(500).json({
          status: "DEGRADED",
          db: "ERROR",
          error: error.message
        });
      } else {
        res.json({
          status: "OK",
          db: "CONNECTED",
          db_time: results[0].db_time,
          test_result: results[0].test,
          uptime: process.uptime()
        });
      }
    });
  });
});

// Vos routes existantes
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/users', require('./routes/userRoutesLogin'));
app.use('/api/users', require('./routes/userRoutesCRUD'));
app.use('/api/clients', require('./routes/ClientRoute'));
app.use('/api/factures', require('./routes/factureRoutes'));
app.use('/api', require('./routes/ProduitRoutes'));

// ==================== Gestion d'erreurs améliorée ====================

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ 
    error: "Not Found",
    path: req.path,
    method: req.method
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error('💥 Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  // Gestion spécifique des erreurs MySQL
  if (err.code === 'ETIMEDOUT' || err.code === 'PROTOCOL_CONNECTION_LOST') {
    return res.status(503).json({ 
      error: 'DATABASE_UNAVAILABLE',
      message: 'Service temporairement indisponible'
    });
  }

  // Gestion des erreurs CORS
  if (err.message.includes('CORS')) {
    return res.status(403).json({
      error: 'CORS_FORBIDDEN',
      message: 'Accès interdit'
    });
  }

  res.status(500).json({ 
    error: 'SERVER_ERROR',
    message: process.env.NODE_ENV === 'development' 
      ? err.message 
      : 'Une erreur est survenue'
  });
});

// ==================== Démarrage du serveur ====================

server.listen(port, () => {
  console.log(`
  =========================================
  🚀  Backend lancé sur http://localhost:${port}
  🌐  Environnement: ${process.env.NODE_ENV || 'development'}
  🗄️  MySQL: ${process.env.DB_HOST}:${process.env.DB_PORT}
  ⏱️  Uptime: ${new Date().toISOString()}
  =========================================
  `);
});

// Gestion propre des arrêts
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

function gracefulShutdown() {
  console.log('🛑 Arrêt propre du serveur...');
  
  io.close(() => {
    console.log('⚡ Socket.IO fermé');
  });

  server.close(() => {
    db.end((err) => {
      if (err) console.error('Erreur fermeture MySQL:', err);
      console.log('🗄️  Pool MySQL fermé');
      process.exit(0);
    });
  });

  setTimeout(() => {
    console.error('Forçant arrêt du serveur');
    process.exit(1);
  }, 5000);
}