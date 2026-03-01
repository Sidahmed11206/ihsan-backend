// ===================================
// IHSAN — Routes Besoins (Needs)
// ===================================
const express = require('express');
const db = require('../utils/db');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

const router = express.Router();

// ─────────────────────────────────
// GET /api/needs
// Liste tous les besoins ouverts (public)
// ─────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { type, quartier } = req.query;

    let query = `
      SELECT 
        n.id, n.type, n.title, n.description, n.quartier,
        n.amount, n.funded, n.status, n.created_at,
        u.name AS validator_name,
        u.reputation_score AS validator_score
      FROM needs n
      JOIN users u ON n.validator_id = u.id
      WHERE n.status = 'open'
    `;
    const params = [];

    if (type) {
      params.push(type);
      query += ` AND n.type = $${params.length}`;
    }
    if (quartier) {
      params.push(`%${quartier}%`);
      query += ` AND n.quartier ILIKE $${params.length}`;
    }

    query += ' ORDER BY n.created_at DESC';

    const result = await db.query(query, params);
    res.json({ success: true, needs: result.rows });
  } catch (err) {
    console.error('Get needs error:', err);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

// ─────────────────────────────────
// GET /api/needs/:id
// Détail d'un besoin
// ─────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT n.*, u.name AS validator_name, u.reputation_score AS validator_score
       FROM needs n
       JOIN users u ON n.validator_id = u.id
       WHERE n.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Besoin introuvable.' });
    }

    res.json({ success: true, need: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

// ─────────────────────────────────
// POST /api/needs
// Créer un nouveau besoin (validateurs seulement)
// ─────────────────────────────────
router.post('/', authMiddleware, roleMiddleware('validator'), async (req, res) => {
  const { type, title, description, quartier, amount } = req.body;

  if (!type || !title || !description || !quartier || !amount) {
    return res.status(400).json({ success: false, message: 'Tous les champs sont requis.' });
  }

  const validTypes = ['iftar', 'alimentaire', 'médical', 'logement'];
  if (!validTypes.includes(type)) {
    return res.status(400).json({ success: false, message: 'Type invalide.' });
  }

  try {
    const result = await db.query(
      `INSERT INTO needs (validator_id, type, title, description, quartier, amount)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [req.user.id, type, title, description, quartier, amount]
    );

    res.status(201).json({
      success: true,
      message: 'Besoin publié avec succès.',
      need: result.rows[0],
    });
  } catch (err) {
    console.error('Post need error:', err);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

// ─────────────────────────────────
// PUT /api/needs/:id/status
// Changer le statut d'un besoin (validateur propriétaire)
// ─────────────────────────────────
router.put('/:id/status', authMiddleware, roleMiddleware('validator'), async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['open', 'funded', 'closed'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: 'Statut invalide.' });
  }

  try {
    const result = await db.query(
      `UPDATE needs SET status = $1 WHERE id = $2 AND validator_id = $3 RETURNING *`,
      [status, req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Besoin introuvable ou non autorisé.' });
    }

    res.json({ success: true, need: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

module.exports = router;
