# Cybertour 2026 — Site Goodies & Roulette

Site statique pour l'événement Cybertour 2026 : vérification QR code anti-bot, roulette de goodies, formulaire d'inscription, et page de confirmation avec QR de récupération.

---

## Lancement rapide

Ouvre simplement `index.html` dans un navigateur (Chrome recommandé).

⚠️ **La vérification caméra requiert HTTPS ou localhost.**  
Sur un système de fichiers local (`file://`), `getUserMedia` est bloqué par la plupart des navigateurs. Utilise Live Server ou un serveur local.

---

## Développement local

### Option 1 — VS Code Live Server (recommandé)

1. Installe l'extension **Live Server** dans VS Code
2. Clic droit sur `index.html` → **"Open with Live Server"**
3. Le site s'ouvre sur `http://127.0.0.1:5500`

### Option 2 — Python (sans installation)

```bash
# Python 3
python -m http.server 8080
# Ouvre http://localhost:8080
```

### Option 3 — Node.js (npx)

```bash
npx serve .
```

---

## Structure des fichiers

```
cybertour-2026/
├── index.html          ← Accueil + vérification QR
├── game.html           ← Roulette + formulaire
├── confirmation.html   ← Page de succès
│
├── assets/
│   ├── css/
│   │   ├── main.css          ← Variables, reset, typo, utilitaires
│   │   ├── hero.css          ← Hero + grille + countdown
│   │   ├── qr-verify.css     ← Overlay vérification QR
│   │   ├── wheel.css         ← Roulette canvas
│   │   ├── form.css          ← Formulaire d'inscription
│   │   └── confirmation.css  ← Page succès
│   │
│   └── js/
│       ├── storage.js     ← Anti-spam, sessionStorage, fingerprint
│       ├── qr-verify.js   ← Module nimiq/qr-scanner
│       ├── wheel.js       ← Roulette canvas + probabilités
│       ├── form.js        ← Validation + submit
│       └── confetti.js    ← Effets confettis
│
└── README.md
```

---

## Configuration

### `assets/js/qr-verify.js`

| Variable | Défaut | Description |
|---|---|---|
| `SESSION_DURATION_MS` | `1 800 000` (30 min) | Durée de validité du token QR |
| `VALID_QR_CODES` | `[]` (tous) | Liste blanche de QR codes. Vide = tout QR accepté |
| `TIMER_DURATION_S` | `60` | Secondes avant reset du scanner |

**Exemple — restreindre à un QR spécifique :**
```js
const VALID_QR_CODES = ['CYBERTOUR2026', 'https://cybertour.io'];
```

### `assets/js/wheel.js`

| Variable | Description |
|---|---|
| `PRIZES` | Tableau des lots avec `key`, `emoji`, `name`, `color`, `prob` |
| `SPIN_DURATION` | Durée de base de la rotation en ms (défaut : 5 000) |

**Exemple — modifier les probabilités :**
```js
export const PRIZES = [
  { key: 'tshirt',   emoji: '🎽', name: 'T-Shirt Cybertour',       color: '#1e1b4b', prob: 20 },
  { key: 'jackpot',  emoji: '😮', name: 'JACKPOT — Sweat',          color: '#1a0a2e', prob: 2  },
  // ...
];
// prob est relatif, pas besoin que ça somme à 100
```

### `assets/js/form.js`

| Variable | Description |
|---|---|
| `SUBMIT_ENDPOINT` | URL de l'endpoint de collecte (Formspree, Netlify Forms…) |
| `USE_MAILTO_FALLBACK` | `true` = ouvre le client mail si le fetch échoue |

**Intégration Formspree :**
1. Crée un formulaire sur [formspree.io](https://formspree.io)
2. Remplace `SUBMIT_ENDPOINT` par ton URL `https://formspree.io/f/XXXXXXXX`

**Intégration Netlify Forms :**
Ajoute `netlify` à la balise `<form>` dans `game.html` et configure l'endpoint dans `form.js`.

---

## Déploiement

Le site est 100% statique, compatible avec :

### Netlify (le plus simple)
Glisse-dépose le dossier sur [netlify.com/drop](https://netlify.com/drop).  
Résultat : URL HTTPS en 30 secondes, caméra fonctionnelle.

### GitHub Pages
```bash
git init
git add .
git commit -m "feat: cybertour 2026 site"
gh repo create cybertour-2026 --public --push --source .
# Active Pages dans les Settings du repo → branch main
```

### Vercel
```bash
npx vercel deploy
```

---

## Notes techniques

### Vérification QR
- Bibliothèque : [nimiq/qr-scanner@1.4.2](https://github.com/nimiq/qr-scanner) via CDN
- Fallback : QR code SVG statique intégré dans la page si pas de webcam
- Token : stocké dans `sessionStorage` (pas `localStorage`), expiré après 30 min

### Roulette
- Canvas pur, pas de lib externe
- Easing `easeOutCubic` pour une décélération naturelle
- Probabilités pondérées (champ `prob` dans `PRIZES`)
- Anti-spam : `sessionStorage` empêche plus d'un spin par session

### Sécurité
Ce site est purement côté client : il n'y a pas de validation côté serveur.  
Pour un événement avec des lots de valeur, branche le formulaire sur un backend qui vérifie les données (ex. Supabase, Firebase, ou ton propre API).

### Accessibilité
- Rôles ARIA sur les dialogues et zones interactives
- `prefers-reduced-motion` respecté via CSS
- Focus visible sur tous les éléments interactifs
- Labels associés aux champs de formulaire

---

## Dépendances CDN

| Lib | Version | Usage |
|---|---|---|
| `nimiq/qr-scanner` | 1.4.2 | Scan QR via caméra |
| `canvas-confetti` | 1.9.3 | Animations confettis |
| `qrcode` | 1.5.3 | Génération QR de récupération |
| Google Fonts | — | Space Grotesk + Inter |

Aucune dépendance npm — déploiement immédiat sans build.
