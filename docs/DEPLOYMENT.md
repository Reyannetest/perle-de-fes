# DEPLOYMENT — Guide de Mise en Ligne

## Prérequis

- Un compte GitHub (gratuit) : https://github.com
- Un compte Netlify (gratuit) : https://netlify.com
- Git installé sur votre ordinateur

---

## Étape 1 : Initialiser Git

Ouvrez un terminal dans le dossier du projet et exécutez :

```bash
git init
```

---

## Étape 2 : Premier commit

```bash
git add .
git commit -m "Initial commit — Perle de Fès v1.0.0"
```

---

## Étape 3 : Créer le repository GitHub

1. Allez sur https://github.com
2. Cliquez sur le **+** en haut à droite → **New repository**
3. Nom du repository : `perle-de-fes`
4. Description : "Site vitrine Perle de Fès — Cadeaux marocains personnalisés"
5. Laissez **Public** sélectionné
6. Ne cochez PAS "Add a README" (on en a déjà un)
7. Cliquez **Create repository**

---

## Étape 4 : Connecter et pousser vers GitHub

Remplacez `VOTRE_USERNAME` par votre nom d'utilisateur GitHub :

```bash
git remote add origin https://github.com/VOTRE_USERNAME/perle-de-fes.git
git branch -M main
git push -u origin main
```

---

## Étape 5 : Déployer sur Netlify

1. Allez sur https://app.netlify.com
2. Cliquez **Add new site** → **Import an existing project**
3. Choisissez **GitHub**
4. Autorisez Netlify à accéder à votre compte GitHub
5. Sélectionnez le repository `perle-de-fes`
6. **Build settings** : laissez tout vide (site statique, pas de build)
7. Cliquez **Deploy site**

Le déploiement prend environ 30 secondes. Netlify vous donne une URL temporaire du type :
`https://random-name-123456.netlify.app`

---

## Étape 6 : Personnaliser le nom du site (optionnel)

1. Dans Netlify, allez dans **Site configuration** → **Site details**
2. Cliquez **Change site name**
3. Entrez un nom personnalisé, par exemple : `perledefes`
4. Votre URL devient : `https://perledefes.netlify.app`

---

## Étape 7 : Domaine personnalisé (optionnel)

Si vous avez un nom de domaine (ex: perledefes.fr) :

1. Dans Netlify → **Domain management** → **Add custom domain**
2. Entrez votre domaine
3. Suivez les instructions pour configurer les DNS chez votre registrar

---

## Mises à jour du site

À chaque modification, exécutez simplement :

```bash
git add .
git commit -m "Description de la modification"
git push
```

**Netlify redéploie automatiquement** à chaque push sur la branche main.

---

## Vérification

Après déploiement, vérifiez :

- [ ] Le site s'affiche correctement
- [ ] La navigation fonctionne
- [ ] Les animations se déclenchent
- [ ] Le formulaire s'envoie (après configuration EmailJS)
- [ ] Les liens WhatsApp/Instagram/Email fonctionnent
- [ ] Le site est responsive sur mobile

---

## Configuration EmailJS

Avant que le formulaire fonctionne, vous devez :

1. Créer un compte sur https://www.emailjs.com
2. Ajouter un **Email Service** (connectez votre Outlook)
3. Créer un **Email Template** avec ces variables :
   - `{{from_name}}` — Nom du client
   - `{{from_email}}` — Email du client
   - `{{phone}}` — Téléphone
   - `{{product_type}}` — Type de produit
   - `{{quantity}}` — Quantité
   - `{{event_date}}` — Date événement
   - `{{event_type}}` — Type événement
   - `{{personalization}}` — Personnalisation
   - `{{message}}` — Message
4. Récupérez vos 3 clés :
   - **Public Key** (dans Account → API Keys)
   - **Service ID** (dans Email Services)
   - **Template ID** (dans Email Templates)
5. Remplacez dans `js/main.js` :
   ```javascript
   const EMAILJS_PUBLIC_KEY = "votre_public_key";
   const EMAILJS_SERVICE_ID = "votre_service_id";
   const EMAILJS_TEMPLATE_ID = "votre_template_id";
   ```
6. Faites un nouveau commit et push

---

## Support

En cas de problème :
- Documentation Netlify : https://docs.netlify.com
- Documentation EmailJS : https://www.emailjs.com/docs
- GitHub Docs : https://docs.github.com
