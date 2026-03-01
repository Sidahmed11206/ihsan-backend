// ===================================
// IHSAN — Routes Dons (Donations)
// ===================================
const express = require('express');
const db = require('../utils/db');
const { generateTransactionHash } = require('../utils/hash');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// ─────────────────────────────────
// POST /api/donations
// Créer un don sur un besoin
// ─────────────────────────────────
router.post('/', authMiddleware, async (req, res) => {
  const { need_id, amount } = req.body;

  if (!need_id || !amount || amount <= 0) {
    return res.status(400).json({ success: false, message: 'need_id et montant valide requis.' });
  }

  try {
    // Vérifier que le besoin existe et est ouvert
    const needResult = await db.query(
      'SELECT * FROM needs WHERE id = $1 AND status = $2',
      [need_id, 'open']
    );

    if (needResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Besoin introuvable ou déjà financé.' });
    }

    const need = needResult.rows[0];

    // Générer le hash SHA-256 unique (preuve d'immuabilité)
    const hash = generateTransactionHash({
      donor_id: req.user.id,
      need_id,
      amount,
      need_title: need.title,
    });

    // Créer la transaction de don
    const donResult = await db.query(
      `INSERT INTO donations (donor_id, need_id, amount, hash_sha256, status)
       VALUES ($1, $2, $3, $4, 'pending')
       RETURNING *`,
      [req.user.id, need_id, amount, hash]
    );

    const donation = donResult.rows[0];

    // Mettre à jour le montant financé du besoin
    const newFunded = parseFloat(need.funded) + parseFloat(amount);
    await db.query(
      'UPDATE needs SET funded = $1 WHERE id = $2',
      [newFunded, need_id]
    );

    // Si besoin totalement financé, fermer
    if (newFunded >= parseFloat(need.amount)) {
      await db.query("UPDATE needs SET status = 'funded' WHERE id = $1", [need_id]);
    }

    // Réponse avec reçu numérique
    res.status(201).json({
      success: true,
      message: 'Don enregistré avec succès.',
      receipt: {
        transaction_id: donation.id,
        donor: req.user.name[0] + '*** (anonyme)',
        need_title: need.title,
        quartier: need.quartier,
        amount: donation.amount,
        hash_sha256: donation.hash_sha256,
        status: 'pending',
        timestamp: donation.created_at,
      },
    });
  } catch (err) {
    console.error('Donation error:', err);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

// ─────────────────────────────────
// GET /api/donations/my
// Mes dons (donneur connecté)
// ─────────────────────────────────
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT d.*, n.title AS need_title, n.quartier, n.type
       FROM donations d
       JOIN needs n ON d.need_id = n.id
       WHERE d.donor_id = $1
       ORDER BY d.created_at DESC`,
      [req.user.id]
    );

    res.json({ success: true, donations: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

// ─────────────────────────────────
// GET /api/donations/:id
// Détail d'un don (pour vérification)
// ─────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT 
        d.id, d.amount, d.hash_sha256, d.status, d.created_at,
        n.title AS need_title, n.quartier, n.type,
        c.photo_url, c.message AS confirmation_message, c.confirmed_at
       FROM donations d
       JOIN needs n ON d.need_id = n.id
       LEFT JOIN confirmations c ON d.id = c.donation_id
       WHERE d.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Transaction introuvable.' });
    }

    res.json({ success: true, donation: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

module.exports = router;
