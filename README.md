# Perle de Fès — Site Vitrine

Site vitrine pour **Perle de Fès**, marque artisanale de cadeaux orientaux marocains personnalisés pour mariages, hennés et événements.

## Stack Technique

- **HTML5** — Structure sémantique
- **CSS3** — Styling, animations, responsive design
- **JavaScript Vanilla** — Interactions, formulaire, modales
- **EmailJS** — Envoi de formulaire sans backend
- **Google Fonts** — Cormorant Garamond, Montserrat

## Lancer en Local

Aucune installation requise. Ouvrez simplement `index.html` dans un navigateur.

```bash
# Option avec serveur local (si Python installé)
python -m http.server 8000
# Puis ouvrez http://localhost:8000
```

## Structure du Projet

```
perle-de-fes/
├── docs/
│   ├── BRIEF.md          # Brief client complet
│   ├── ROADMAP.md        # Phases de développement
│   ├── CHANGELOG.md      # Historique des versions
│   └── DEPLOYMENT.md     # Guide de mise en ligne
├── css/
│   └── style.css         # Styles complets
├── js/
│   └── main.js           # JavaScript (nav, modales, formulaire)
├── images/
│   └── README.md         # Guide des images à remplacer
├── index.html            # Page unique (single page)
├── .gitignore
├── netlify.toml          # Configuration Netlify
└── README.md
```

## Configuration EmailJS

Pour que le formulaire de devis fonctionne :

1. Créez un compte sur [emailjs.com](https://www.emailjs.com)
2. Connectez votre service email (Outlook)
3. Créez un template avec les variables du formulaire
4. Remplacez dans `js/main.js` :

```javascript
const EMAILJS_PUBLIC_KEY = "YOUR_PUBLIC_KEY";    // Votre clé publique
const EMAILJS_SERVICE_ID = "YOUR_SERVICE_ID";    // ID du service email
const EMAILJS_TEMPLATE_ID = "YOUR_TEMPLATE_ID";  // ID du template
```

## Remplacement des Images

Voir `images/README.md` pour la liste complète des 6 images à remplacer :

| Image | Dimensions |
|-------|------------|
| hero-bg.jpg | 1920 x 900 px |
| panier-mini.jpg | 600 x 500 px |
| panier-essentiel.jpg | 600 x 500 px |
| panier-premium.jpg | 600 x 500 px |
| dragees.jpg | 600 x 500 px |
| papeterie.jpg | 600 x 500 px |

## Déploiement

Voir `docs/DEPLOYMENT.md` pour le guide complet.

Commandes rapides :

```bash
git init
git add .
git commit -m "Initial commit — Perle de Fès"
git remote add origin https://github.com/VOTRE_USER/perle-de-fes.git
git push -u origin main
```

Puis connectez le repo à Netlify pour un déploiement automatique.

## Contact

- **Email** : perledefes@outlook.com
- **Téléphone** : 06 52 37 55 78
- **Instagram** : [@perledefes.creation](https://instagram.com/perledefes.creation)

---

Perle de Fès — L'art de personnaliser vos plus beaux souvenirs
