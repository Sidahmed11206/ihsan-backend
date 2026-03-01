# 🌙 IHSAN Backend — API

> La charité radicalement transparente

## 🚀 Installation en 5 étapes

### Étape 1 — Copier le projet
```bash
# Mets tous les fichiers dans un dossier ihsan-backend
cd ihsan-backend
```

### Étape 2 — Installer les packages
```bash
npm install
```

### Étape 3 — Créer la base de données (Supabase)
1. Va sur [supabase.com](https://supabase.com) → créer un compte gratuit
2. Créer un nouveau projet
3. Aller dans **SQL Editor**
4. Coller tout le contenu de `schema.sql`
5. Cliquer **Run**

### Étape 4 — Configurer les variables
```bash
# Copier le fichier exemple
cp .env.example .env

# Ouvrir .env et remplir :
# DATABASE_URL = ta connection string Supabase
# JWT_SECRET   = une longue phrase secrète
```

> Pour trouver DATABASE_URL : Supabase → Settings → Database → Connection string (URI)

### Étape 5 — Lancer le serveur
```bash
npm run dev   # développement (avec rechargement automatique)
npm start     # production
```

---

## 📡 Endpoints API

### 🔐 Authentification
| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/auth/register` | Créer un compte |
| POST | `/api/auth/login` | Connexion |
| GET  | `/api/auth/me` | Mon profil (token requis) |

### 🏪 Besoins
| Méthode | Route | Description |
|---------|-------|-------------|
| GET  | `/api/needs` | Liste des besoins ouverts |
| GET  | `/api/needs?type=iftar` | Filtrer par type |
| GET  | `/api/needs/:id` | Détail d'un besoin |
| POST | `/api/needs` | Poster un besoin (validateur) |

### 💰 Dons
| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/donations` | Faire un don |
| GET  | `/api/donations/my` | Mes dons |
| GET  | `/api/donations/:id` | Détail + preuve |

### ✅ Confirmations
| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/confirmations` | Confirmer une remise (validateur) |
| GET  | `/api/confirmations/pending` | Mes remises en attente |

### 📊 Tableau de bord (PUBLIC)
| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/dashboard` | Toutes les transactions |
| GET | `/api/dashboard/stats` | Statistiques globales |
| GET | `/api/dashboard/verify/:hash` | Vérifier un hash |

---

## 🔑 Utiliser l'API (exemples)

### S'inscrire
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Ali","email":"ali@test.mr","password":"secret123","role":"donor"}'
```

### Se connecter
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ali@test.mr","password":"secret123"}'
# → Récupère le token JWT
```

### Faire un don (avec token)
```bash
curl -X POST http://localhost:3000/api/donations \
  -H "Authorization: Bearer TON_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"need_id":"UUID_DU_BESOIN","amount":1250}'
```

---

## 🏗 Structure du projet

```
ihsan-backend/
├── src/
│   ├── server.js          ← Point d'entrée
│   ├── routes/
│   │   ├── auth.js        ← Inscription / Connexion
│   │   ├── needs.js       ← Gestion des besoins
│   │   ├── donations.js   ← Dons + hash SHA-256
│   │   ├── confirmations.js ← Preuves d'impact
│   │   └── dashboard.js   ← Tableau de bord public
│   ├── middleware/
│   │   └── auth.js        ← Vérification JWT
│   └── utils/
│       ├── db.js          ← Connexion PostgreSQL
│       └── hash.js        ← Génération SHA-256
├── schema.sql             ← Tables Supabase
├── .env.example           ← Variables d'environnement
└── package.json
```

---

## 🚢 Déploiement sur Render (gratuit)

1. Push le projet sur GitHub
2. Va sur [render.com](https://render.com) → New Web Service
3. Connecte ton repo GitHub
4. Configure :
   - **Build command**: `npm install`
   - **Start command**: `npm start`
5. Ajoute les variables d'environnement (DATABASE_URL, JWT_SECRET)
6. Deploy !
