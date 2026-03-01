// ===================================
// IHSAN — Connexion base de données
// ===================================
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Requis pour Supabase
});

pool.connect()
  .then(() => console.log('✅ Base de données connectée'))
  .catch(err => console.error('❌ Erreur DB:', err.message));

module.exports = pool;
