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

// Configuration CORS intelligente
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'https://4kdesigns-mada.com',
      'https://4kfront.vercel.app',
      'http://localhost:3000',
      'http://localhost:5173'
    ];
    
    // Autoriser les requêtes sans origine (Postman, curl, etc.)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Access-Control-Allow-Origin'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Pré-flight pour toutes les routes
// Configuration Socket.IO
const io = new Server(server, { cors: corsOptions });

// Middlewares
app.use((req, res, next) => { req.io = io; next(); });
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Multer Configuration
const upload = multer({ 
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
  })
});

// Routes

// Ajoutez ceci juste avant les routes existantes (après app.use(cors))
app.get('/api/ping', (req, res) => {
  res.json({ status: "OK", message: "Backend is working!kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk" });
});
app.get('/config', (req, res) => {
  res.json({
    DB_HOST: process.env.DB_HOST,
    FRONTEND_URL: process.env.FRONTEND_URL,
    NODE_ENV: process.env.NODE_ENV,
    DB_PORT: process.env.DB_PORT
  });
});

app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/users', require('./routes/userRoutesLogin'));
app.use('/api/users', require('./routes/userRoutesCRUD'));
app.use('/api/clients', require('./routes/ClientRoute'));
app.use('/api/factures', require('./routes/factureRoutes'));
app.use('/api', require('./routes/ProduitRoutes'));

// Gestion des erreurs
app.use((req, res) => res.status(404).json({ error: "Not Found" }));
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Server Error' });
});

server.listen(port, () => {
  console.log(`🚀 Backend: http://localhost:${port}`);
  console.log(`🌐 Mode: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🛡️ CORS autorise: ${process.env.FRONTEND_URL}, http://localhost:5173, etc.`);
}); 