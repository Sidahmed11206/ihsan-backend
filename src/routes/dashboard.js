// ===================================
// IHSAN — Routes Tableau de bord public
// ===================================
const express = require('express');
const db = require('../utils/db');

const router = express.Router();

// ─────────────────────────────────
// GET /api/dashboard
// Toutes les transactions publiques (immuables)
// ─────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        d.id,
        LEFT(u.name, 1) || '***' AS donor_display,
        n.title AS need_title,
        n.quartier,
        n.type,
        d.amount,
        d.hash_sha256,
        d.status,
        d.created_at,
        c.confirmed_at,
        c.message AS confirmation_message,
        c.photo_url
      FROM donations d
      JOIN needs n ON d.need_id = n.id
      JOIN users u ON d.donor_id = u.id
      LEFT JOIN confirmations c ON d.id = c.donation_id
      ORDER BY d.created_at DESC
      LIMIT 100
    `);

    res.json({ success: true, transactions: result.rows });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

// ─────────────────────────────────
// GET /api/dashboard/stats
// Statistiques globales (pour le hero)
// ─────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const stats = await db.query(`
      SELECT 
        COUNT(CASE WHEN d.status = 'confirmed' THEN 1 END) AS total_confirmed,
        COALESCE(SUM(CASE WHEN d.status = 'confirmed' THEN d.amount END), 0) AS total_mru,
        COUNT(DISTINCT d.id) AS total_donations,
        COUNT(DISTINCT n.id) AS total_needs
      FROM donations d
      JOIN needs n ON d.need_id = n.id
    `);

    res.json({
      success: true,
      stats: {
        confirmed_donations: parseInt(stats.rows[0].total_confirmed) || 0,
        total_mru_distributed: parseFloat(stats.rows[0].total_mru) || 0,
        total_donations: parseInt(stats.rows[0].total_donations) || 0,
        total_needs: parseInt(stats.rows[0].total_needs) || 0,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

// ─────────────────────────────────
// GET /api/dashboard/verify/:hash
// Vérifier une transaction par son hash
// ─────────────────────────────────
router.get('/verify/:hash', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT d.id, d.amount, d.status, d.hash_sha256, d.created_at,
              n.title AS need_title, n.quartier
       FROM donations d
       JOIN needs n ON d.need_id = n.id
       WHERE d.hash_sha256 = $1`,
      [req.params.hash]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Transaction introuvable avec ce hash.' });
    }

    res.json({
      success: true,
      verified: true,
      transaction: result.rows[0],
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

module.exports = router;
