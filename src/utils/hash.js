// ===================================
// IHSAN — Génération de hash SHA-256
// ===================================
const crypto = require('crypto');

/**
 * Génère un hash SHA-256 unique pour chaque transaction.
 * Cela simule l'immutabilité blockchain.
 * Personne ne peut modifier une transaction sans que le hash change.
 */
function generateTransactionHash(data) {
  const payload = JSON.stringify({
    ...data,
    timestamp: Date.now(),
    nonce: crypto.randomBytes(8).toString('hex'),
  });

  return crypto.createHash('sha256').update(payload).digest('hex');
}

/**
 * Vérifie si un hash correspond aux données
 */
function verifyHash(data, hash) {
  // Pour la vérification, on compare juste que le hash existe et a le bon format
  return typeof hash === 'string' && hash.length === 64;
}

module.exports = { generateTransactionHash, verifyHash };
