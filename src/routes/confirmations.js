const express = require('express');
const db = require('../utils/db');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

const router = express.Router();

router.post('/', authMiddleware, roleMiddleware('validator'), async (req, res) => {
  const { donation_id, photo_url, message } = req.body;

  if (!donation_id || !message) {
    return res.status(400).json({ success: false, message: 'donation_id et message requis.' });
  }

  try {
    const donResult = await db.query(
      `SELECT d.*, n.validator_id, n.title AS need_title, n.quartier
       FROM donations d
       JOIN needs n ON d.need_id = n.id
       WHERE d.id = $1 AND d.status = 'pending'`,
      [donation_id]
    );

    if (donResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Don introuvable ou déjà confirmé.' });
    }

    const donation = donResult.rows[0];

    if (donation.validator_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Non autorisé.' });
    }

    const confResult = await db.query(
      `INSERT INTO confirmations (donation_id, validator_id, photo_url, message)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [donation_id, req.user.id, photo_url || null, message]
    );

    await db.query("UPDATE donations SET status = 'confirmed' WHERE id = $1", [donation_id]);
    await db.query('UPDATE users SET reputation_score = LEAST(reputation_score + 2, 100) WHERE id = $1', [req.user.id]);

    res.status(201).json({ success: true, message: 'Remise confirmée !', confirmation: confResult.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

router.get('/pending', authMiddleware, roleMiddleware('validator'), async (req, res) => {
  try {
    const result = await db.query(
      `SELECT d.id AS donation_id, d.amount, d.hash_sha256, d.created_at,
              n.title AS need_title, n.quartier, n.type
       FROM donations d
       JOIN needs n ON d.need_id = n.id
       WHERE n.validator_id = $1 AND d.status = 'pending'
       ORDER BY d.created_at ASC`,
      [req.user.id]
    );
    res.json({ success: true, pending: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

module.exports = router;
