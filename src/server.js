// ===================================
// IHSAN BACKEND — Serveur principal
// ===================================
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const needsRoutes = require('./routes/needs');
const donationsRoutes = require('./routes/donations');
const confirmationsRoutes = require('./routes/confirmations');
const dashboardRoutes = require('./routes/dashboard');

const app = express();
const PORT = process.env.PORT || 3000;

// ===== MIDDLEWARE =====
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// ===== ROUTES =====
app.use('/api/auth',          authRoutes);
app.use('/api/needs',         needsRoutes);
app.use('/api/donations',     donationsRoutes);
app.use('/api/confirmations', confirmationsRoutes);
app.use('/api/dashboard',     dashboardRoutes);

// ===== ROUTE DE TEST =====
app.get('/', (req, res) => {
  res.json({
    message: '🌙 IHSAN API — La charité radicalement transparente',
    version: '1.0.0',
    status: 'running',
  });
});

// ===== GESTION D'ERREURS =====
app.use((err, req, res, next) => {
  console.error('❌ Erreur:', err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Erreur serveur interne',
  });
});

// ===== DÉMARRAGE =====
app.listen(PORT, () => {
  console.log(`✅ Serveur IHSAN lancé sur http://localhost:${PORT}`);
});
