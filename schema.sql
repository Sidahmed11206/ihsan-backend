-- =======================================
-- IHSAN PLATFORM — Schéma SQL (Supabase)
-- Colle ce code dans Supabase > SQL Editor
-- =======================================

-- 1. TABLE UTILISATEURS
CREATE TABLE users (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  email            TEXT UNIQUE NOT NULL,
  password_hash    TEXT NOT NULL,
  role             TEXT NOT NULL CHECK (role IN ('donor', 'validator', 'partner')),
  reputation_score INTEGER DEFAULT 100 CHECK (reputation_score BETWEEN 0 AND 100),
  created_at       TIMESTAMP DEFAULT NOW()
);

-- 2. TABLE BESOINS
CREATE TABLE needs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  validator_id UUID NOT NULL REFERENCES users(id),
  type         TEXT NOT NULL CHECK (type IN ('iftar', 'alimentaire', 'médical', 'logement')),
  title        TEXT NOT NULL,
  description  TEXT NOT NULL,
  quartier     TEXT NOT NULL,
  amount       NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  funded       NUMERIC(10,2) DEFAULT 0,
  status       TEXT DEFAULT 'open' CHECK (status IN ('open', 'funded', 'closed')),
  created_at   TIMESTAMP DEFAULT NOW()
);

-- 3. TABLE DONS
CREATE TABLE donations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id    UUID NOT NULL REFERENCES users(id),
  need_id     UUID NOT NULL REFERENCES needs(id),
  amount      NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  hash_sha256 TEXT UNIQUE NOT NULL,  -- Preuve d'immuabilité
  status      TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed')),
  created_at  TIMESTAMP DEFAULT NOW()
);

-- 4. TABLE CONFIRMATIONS (preuves d'impact)
CREATE TABLE confirmations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_id  UUID UNIQUE NOT NULL REFERENCES donations(id),
  validator_id UUID NOT NULL REFERENCES users(id),
  photo_url    TEXT,        -- URL photo anonymisée (visages floutés)
  message      TEXT NOT NULL,
  confirmed_at TIMESTAMP DEFAULT NOW()
);

-- =======================================
-- DONNÉES DE TEST (optionnel)
-- =======================================

-- Validateur de test (mot de passe: test1234)
INSERT INTO users (name, email, password_hash, role) VALUES
('Sidi M.', 'sidi@ihsan.mr', '$2a$10$example_hash_replace_with_real', 'validator'),
('Ali Donor', 'ali@ihsan.mr', '$2a$10$example_hash_replace_with_real', 'donor');

-- Besoin de test
INSERT INTO needs (validator_id, type, title, description, quartier, amount)
SELECT id, 'iftar', '5 repas Iftar', 'Repas chauds pour 5 familles dans le besoin', 'Tevragh Zeina', 1250
FROM users WHERE email = 'sidi@ihsan.mr';
