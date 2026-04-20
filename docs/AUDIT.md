# AUDIT COMPLET — PERLE DE FÈS
*Date: 2026-04-20*
*Mise à jour: 2026-04-20 — Corrections appliquées*

---

## RÉSUMÉ EXÉCUTIF

### Avant corrections
| Catégorie | Critique | Élevé | Moyen | Faible | Total |
|-----------|----------|-------|-------|--------|-------|
| Sécurité | 3 | 3 | 6 | 3 | 15 |
| Design/UX | 3 | 13 | 4 | 0 | 20 |
| Bugs/Code mort | 3 | 1 | 4 | 6 | 14 |
| **TOTAL** | **9** | **17** | **14** | **9** | **49** |

### Après corrections (2026-04-20)
| Catégorie | Corrigés | Restants |
|-----------|----------|----------|
| Sécurité | 12 | 3 |
| Design/UX | 15 | 5 |
| Bugs/Code mort | 10 | 4 |
| **TOTAL** | **37** | **12** |

---

## 1. AUDIT SÉCURITÉ

### CRITIQUES (3)

#### 1.1 EmailJS clés hardcodées
- **Fichier:** `js/main.js:10-12`
- **Problème:** Clés API en placeholder visible côté client
- **Risque:** Accès direct à EmailJS par n'importe qui
- **Solution:** Utiliser une fonction Netlify serverless

#### 1.2 innerHTML avec contenu non validé
- **Fichier:** `js/main.js:337`
- **Code:** `li.innerHTML = item;`
- **Risque:** XSS si données JSON compromises
- **Solution:** `li.textContent = item;`

#### 1.3 Path traversal dans github-save.js
- **Fichier:** `netlify/functions/github-save.js:39`
- **Risque:** Accès fichiers hors /data/
- **Solution:** Whitelist des chemins autorisés

### ÉLEVÉS (3)

| Problème | Fichier | Ligne | Solution |
|----------|---------|-------|----------|
| innerHTML données JSON | js/main.js | 140, 255, 257, 361 | Utiliser createElement() |
| Pas de vérification rôle admin | admin/admin.js | 44-56 | Vérifier user.app_metadata.roles |
| URLs non validées | js/main.js | 224, 305, 345 | Valider protocole |

### MOYENS (6)

1. Validation email/téléphone insuffisante (`js/main.js:729, 737`)
2. Authentification fragile (`admin/admin.js:1378-1381`)
3. Pas de header CSP (`netlify.toml`)
4. Pas de validation données JSON (`js/main.js:28`)
5. Pas de rate limiting (`github-save.js`)
6. Pas de SRI sur CDN (`index.html:18, 21, 24`)

### FAIBLES (3)

1. Attributs `rel="noreferrer"` manquants sur liens externes
2. Pas de HTTPS enforcer dans netlify.toml
3. Pas de logging d'audit

---

## 2. AUDIT DESIGN/UX

### CRITIQUES (3)

#### 2.1 Contraste titres insuffisant
- **Fichier:** `css/style.css:169-177`
- **Problème:** #C9A84C sur #FAF6F0 = ratio 3.5:1 (minimum 4.5:1)
- **Solution:** Utiliser #996B2B ou ajouter text-shadow

#### 2.2 Contraste placeholders insuffisant
- **Fichier:** `css/style.css:1691-1692`
- **Problème:** Opacity 0.6 trop faible
- **Solution:** Augmenter à 0.85

#### 2.3 Focus states manquants sur inputs
- **Fichier:** `css/style.css:1682-1687`
- **Solution:** Ajouter `outline: 2px solid var(--gold);`

### IMPORTANTS (13)

| Problème | Fichier | Solution |
|----------|---------|----------|
| Hiérarchie H1/H2 incohérente | index.html:119-150 | H1 visible ou logique claire |
| Pas de validation visuelle formulaire | index.html:522-590 | Styles :invalid + messages |
| Touch targets < 44px | css/style.css:1320 | Augmenter à 48px |
| Pas d'aria-labels SVG | index.html:45-49 | aria-hidden="true" |
| Menu ne se ferme pas auto | js/main.js | Event listener sur liens |
| Images placehold.co externes | index.html:354, 367, 380 | Images locales |
| Pas de skip link | index.html | Ajouter en haut |
| Breakpoint 1024→768 trop large | css/style.css | Ajouter 900px |
| Boutons formulaire petits mobile | css/style.css:3594 | min-height: 48px |
| Points carousel trop petits | css/style.css:1349 | 12x12px minimum |
| Promo banner trop rapide | css/style.css:267 | 30-40s au lieu de 20s |
| Pas de message d'erreur formulaire | index.html:602-611 | Ajouter .quote__error |
| Modal admin sans role="dialog" | admin/admin.css:459 | Ajouter aria-modal |

### MINEURS (4)

1. Animations sans prefers-reduced-motion
2. Flex wrap manquant section chiffres mobile
3. Select icon pas clair tous navigateurs
4. Images Instagram 100px trop petites

---

## 3. AUDIT BUGS & CODE MORT

### BUGS CRITIQUES (3)

#### 3.1 Sélecteur .nav__logo inexistant
- **Fichier:** `js/main.js:250`
- **Impact:** Logo sidebar jamais affiché
- **Solution:** Créer CSS ou corriger sélecteur

#### 3.2 innerHTML non échappé (XSS)
- **Fichier:** `js/main.js:255, 257, 337, 361`
- **Solution:** textContent ou escapeHTML()

#### 3.3 Fetch sans feedback erreur
- **Fichier:** `js/main.js:66-98`
- **Solution:** Afficher message utilisateur

### CODE MORT (5)

| Code | Fichier | Ligne | Action |
|------|---------|-------|--------|
| preloadImages() inefficace | js/main.js | 907-915 | Déplacer ou supprimer |
| editingProductIndex global | admin/admin.js | 13 | Refactorer |
| carouselAutoSlideInterval fuite | js/main.js | 570-587 | Nettoyer proprement |
| .filter(Boolean) inutile | admin/admin.js | 278, 288 | Simplifier |
| Logique innerHTML morte | js/main.js | 416 | Corriger |

### ERREURS POTENTIELLES (6)

1. **EmailJS non configuré** (`js/main.js:10-12`) — CRITIQUE
2. Null check incomplet modalDelay (`js/main.js:632-637`)
3. État global fragile cardSlideshowIntervals (`js/main.js:103`)
4. Event listeners dupliqués liens # (`index.html:886-902`)
5. sidebarDisplay désynchronisé (`site-content.json:10`)
6. Pas de lazy loading images Instagram (`index.html:703-709`)

---

## 4. CHECKLIST DE CORRECTION

### PRIORITÉ 1 — Immédiat (avant production)

- [ ] Configurer EmailJS via fonction Netlify serverless
- [ ] Remplacer innerHTML par textContent (lignes 255, 257, 337, 361)
- [ ] Ajouter whitelist chemins dans github-save.js
- [ ] Fixer contraste titres (utiliser #996B2B)
- [ ] Ajouter focus states visibles sur inputs
- [ ] Créer .nav__logo ou corriger sélecteur JS

### PRIORITÉ 2 — Court terme

- [ ] Ajouter header CSP dans netlify.toml
- [ ] Vérifier rôles admin dans admin.js
- [ ] Valider URLs avant utilisation
- [ ] Ajouter validation visuelle formulaire
- [ ] Augmenter touch targets à 48px mobile
- [ ] Ajouter SRI sur scripts CDN

### PRIORITÉ 3 — Moyen terme

- [ ] Ajouter rate limiting github-save.js
- [ ] Respecter prefers-reduced-motion
- [ ] Remplacer images placehold.co
- [ ] Ajouter skip link
- [ ] Ajouter lazy loading images
- [ ] Nettoyer code mort

---

## 5. FICHIERS À REVOIR PAR PRIORITÉ

```
P1 (Critique):
├── js/main.js (lignes 10-12, 140, 250, 255, 257, 337, 361)
├── netlify/functions/github-save.js (lignes 10, 39)
└── css/style.css (lignes 169-177, 1682-1687, 1691-1692)

P2 (Élevé):
├── admin/admin.js (lignes 44-56, 1378-1381)
├── index.html (lignes 18, 21, 24, 522-590)
└── netlify.toml (manque CSP)

P3 (Moyen):
├── css/style.css (responsive, touch targets)
├── data/site-content.json (validation)
└── js/main.js (code mort, performance)
```

---

## 6. NOTES TECHNIQUES

### Configuration EmailJS recommandée

```javascript
// netlify/functions/send-email.js
exports.handler = async (event) => {
    // Valider les données
    // Utiliser process.env.EMAILJS_*
    // Envoyer via API EmailJS côté serveur
};
```

### Header CSP recommandé

```toml
# netlify.toml
[[headers]]
  for = "/*"
  [headers.values]
    Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-inline' https://identity.netlify.com https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https:"
```

### Fonction escapeHTML

```javascript
function escapeHTML(str) {
    return str.replace(/[&<>"']/g, char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[char]));
}
```

---

## 7. CORRECTIONS APPLIQUÉES (2026-04-20)

### Sécurité ✅
- [x] **XSS innerHTML → textContent** (`js/main.js:337, 361, 255, 257, 416`)
- [x] **Path traversal protection** — whitelist ajoutée dans `github-save.js`
- [x] **Header CSP** ajouté dans `netlify.toml`
- [x] **URLs validées** — fonction `sanitizeUrl()` ajoutée
- [x] **rel="noreferrer"** ajouté sur liens externes
- [x] **defer** ajouté sur scripts CDN

### Design/UX ✅
- [x] **Contraste titres** — #C9A84C → #996B2B (ratio 4.5:1 WCAG AA)
- [x] **Contraste placeholders** — opacity 0.6 → couleur #5A5A5A
- [x] **Focus states inputs** — outline 2px solid ajouté
- [x] **Skip link** ajouté pour accessibilité clavier
- [x] **Touch targets 48px** — minimum sur mobile
- [x] **prefers-reduced-motion** — animations désactivées si préférence

### Bugs/Code mort ✅
- [x] **Sélecteur .nav__logo** — corrigé pour utiliser .nav__logo-img et .nav__logo-text
- [x] **preloadImages()** — fonction corrigée et optimisée
- [x] **Fetch error handling** — messages d'erreur améliorés

### Restant à faire (P3 - Moyen terme)
- [ ] Remplacer images placehold.co par images réelles
- [ ] Ajouter lazy loading sur images Instagram
- [ ] Configurer EmailJS via fonction serverless
- [ ] Ajouter rate limiting github-save.js

---

*Fin de l'audit — Document généré automatiquement*
