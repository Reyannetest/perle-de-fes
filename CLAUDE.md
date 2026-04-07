# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Perle de Fès** - Single-page website for a Moroccan artisanal gift brand specializing in personalized gifts for weddings, henna days, and events.

## Tech Stack

- **HTML5** - Semantic structure
- **CSS3** - Custom properties, animations, responsive design
- **JavaScript Vanilla** - No frameworks
- **EmailJS** - Form submission (CDN)
- **Google Fonts** - Cormorant Garamond, Montserrat

## Project Structure

```
perle-de-fes/
├── docs/
│   ├── BRIEF.md          # Complete client brief
│   ├── ROADMAP.md        # Development phases
│   ├── CHANGELOG.md      # Version history
│   └── DEPLOYMENT.md     # Deployment guide
├── css/
│   └── style.css         # All styles (~900 lines)
├── js/
│   └── main.js           # All JS functionality
├── images/
│   └── README.md         # Image replacement guide
├── index.html            # Single page application
├── .gitignore
├── netlify.toml          # Netlify config with headers
└── README.md
```

## Development

No build step required. Open `index.html` directly in browser.

```bash
# Optional: local server with Python
python -m http.server 8000
```

## Design System

### CSS Custom Properties (defined in :root)
```css
--bg-main: #FAF6F0      /* Warm off-white */
--bg-section: #F5EFE6   /* Beige nude */
--gold: #C9A84C         /* Primary accent */
--gold-light: #E8D5A3   /* Light gold */
--text: #2C2C2C         /* Dark brown */
```

### Typography
- Titles: `Cormorant Garamond Bold` (52px desktop / 32px mobile)
- Body: `Montserrat Regular`

## Key Components

### Navigation (`css/style.css:144-240`)
- Fixed header with scroll effect
- Mobile hamburger menu with CSS animation
- Gold underline on active link

### Product Gallery (`css/style.css:350-470`)
- 3-column grid (responsive: 2/1 on smaller screens)
- Hover: zoom + gold overlay
- Click: opens modal with full composition

### Product Modal (`css/style.css:475-600`)
- Backdrop blur effect
- Product composition list
- WhatsApp order button with pre-filled message

### Quote Form (`css/style.css:605-750`)
- 9 fields with custom styling
- Gold underline focus effect
- Success message with animated checkmark
- EmailJS integration (requires configuration)

### WhatsApp Button (`css/style.css:815-860`)
- Fixed bottom-right
- Bounce animation every 5 seconds

## Configuration Required

### EmailJS (js/main.js:12-14)
```javascript
const EMAILJS_PUBLIC_KEY = "YOUR_PUBLIC_KEY";
const EMAILJS_SERVICE_ID = "YOUR_SERVICE_ID";
const EMAILJS_TEMPLATE_ID = "YOUR_TEMPLATE_ID";
```

### Images to Replace (images/README.md)
| File | Dimensions |
|------|------------|
| hero-bg.jpg | 1920x900px |
| panier-mini.jpg | 600x500px |
| panier-essentiel.jpg | 600x500px |
| panier-premium.jpg | 600x500px |
| dragees.jpg | 600x500px |
| papeterie.jpg | 600x500px |

## Deployment

See `docs/DEPLOYMENT.md` for full guide.

Quick deploy:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/USER/perle-de-fes.git
git push -u origin main
```
Then connect to Netlify for automatic deploys.
