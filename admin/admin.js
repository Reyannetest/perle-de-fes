/* ============================================
   PERLE DE FES — ADMIN PANEL COMPLET
   Gestion complète du site
   ============================================ */

// ============================================
// VARIABLES GLOBALES
// ============================================
let currentUser = null;
let productsData = { items: [] };
let siteContent = {};
let siteDesign = {};
let editingProductIndex = -1;
let editingTestimonialIndex = -1;
let pendingProductImages = [];
let pendingUploads = {};
let deleteCallback = null;

// Polices disponibles
const AVAILABLE_FONTS = [
    { name: 'Cormorant Garamond', category: 'serif', preview: 'Élégance Classique' },
    { name: 'Playfair Display', category: 'serif', preview: 'Luxe Raffiné' },
    { name: 'Lora', category: 'serif', preview: 'Charme Intemporel' },
    { name: 'Montserrat', category: 'sans-serif', preview: 'Modernité Claire' },
    { name: 'Poppins', category: 'sans-serif', preview: 'Style Contemporain' },
    { name: 'Raleway', category: 'sans-serif', preview: 'Simplicité Élégante' },
    { name: 'Open Sans', category: 'sans-serif', preview: 'Lisibilité Parfaite' }
];

// ============================================
// INITIALISATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    initAuth();
    initTabs();
    initProductModal();
    initDeleteModal();
    initTestimonialModal();
});

// ============================================
// AUTHENTIFICATION
// ============================================
function initAuth() {
    netlifyIdentity.on('init', user => { if (user) { currentUser = user; showAdmin(); } });
    netlifyIdentity.on('login', user => { currentUser = user; netlifyIdentity.close(); showAdmin(); });
    netlifyIdentity.on('logout', () => {
        currentUser = null;
        document.getElementById('adminPanel').style.display = 'none';
        document.getElementById('loginScreen').style.display = 'flex';
    });

    document.getElementById('loginBtn').addEventListener('click', () => netlifyIdentity.open('login'));
    document.getElementById('logoutBtn').addEventListener('click', () => netlifyIdentity.logout());
    netlifyIdentity.init();
}

async function showAdmin() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminPanel').style.display = 'block';
    await loadAllData();
}

// ============================================
// CHARGEMENT DES DONNEES
// ============================================
async function loadAllData() {
    showLoader();
    try {
        const [pRes, cRes, dRes] = await Promise.all([
            fetch('/data/products.json'),
            fetch('/data/site-content.json'),
            fetch('/data/site-design.json').catch(() => ({ ok: false }))
        ]);

        productsData = await pRes.json();
        siteContent = await cRes.json();

        if (dRes.ok) {
            siteDesign = await dRes.json();
        } else {
            siteDesign = getDefaultDesign();
        }
    } catch (e) {
        console.error('Erreur chargement:', e);
        siteDesign = getDefaultDesign();
    }

    // Render all forms
    renderProductsList();
    renderTextsForm();
    renderColorsForm();
    renderFontsForm();
    renderImagesForm();
    renderEventsForm();
    renderTestimonialsForm();
    renderOrnamentsForm();
    renderContactForm();

    hideLoader();
}

function getDefaultDesign() {
    return {
        colors: {
            primary: "#C9A84C",
            primaryLight: "#E8D5A3",
            primaryDark: "#8B6914",
            background: "#FAF6F0",
            backgroundAlt: "#F5EFE6",
            text: "#2C2C2C",
            textLight: "#5A5A5A"
        },
        sectionColors: {
            hero: { bg: "#FAF6F0", text: "#2C2C2C" },
            presentation: { bg: "#F5EFE6", text: "#2C2C2C" },
            products: { bg: "#FAF6F0", text: "#2C2C2C" },
            events: { bg: "#F5EFE6", text: "#2C2C2C" },
            testimonials: { bg: "#FAF6F0", text: "#2C2C2C" },
            quote: { bg: "#F5EFE6", text: "#2C2C2C" },
            contact: { bg: "#FAF6F0", text: "#2C2C2C" },
            footer: { bg: "#2C2C2C", text: "#FAF6F0" }
        },
        fonts: {
            title: "Cormorant Garamond",
            body: "Montserrat"
        },
        textures: {
            hero: { enabled: true, opacity: 0.12 },
            presentation: { enabled: true, opacity: 0.10 },
            events: { enabled: true, opacity: 0.12 }
        },
        ornaments: {
            dividers: { style: "simple", opacity: 0.6 },
            stars: { showOnTitles: true, opacity: 0.85 },
            lanterns: { hero: true, footer: true }
        }
    };
}

// ============================================
// ONGLETS
// ============================================
function initTabs() {
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
        });
    });
}

// ============================================
// PRODUITS
// ============================================
function renderProductsList() {
    const list = document.getElementById('productsList');
    const items = productsData.items || [];
    items.sort((a, b) => (a.order || 0) - (b.order || 0));

    if (items.length === 0) {
        list.innerHTML = `
            <div style="grid-column: 1/-1; text-align:center; padding:60px 20px; color:var(--text-muted);">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" style="margin-bottom:16px; opacity:0.5;"><path d="M20 12V22H4V12M22 7H2V12H22V7ZM12 22V7M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/></svg>
                <p style="font-size:16px; margin-bottom:8px;">Aucun produit</p>
                <p style="font-size:14px;">Cliquez sur "Nouveau produit" pour commencer.</p>
            </div>
        `;
        return;
    }

    list.innerHTML = items.map((p, i) => `
        <div class="product-card">
            <img src="${esc(p.image || p.images?.[0] || '')}" alt="${esc(p.title)}" class="product-card__image"
                 onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22180%22%3E%3Crect fill=%22%23F5EFE6%22 width=%22200%22 height=%22180%22/%3E%3Ctext x=%22100%22 y=%2295%22 text-anchor=%22middle%22 fill=%22%23C9A84C%22 font-size=%2214%22%3EPhoto%3C/text%3E%3C/svg%3E'">
            <div class="product-card__body">
                <div class="product-card__title">${esc(p.title)}</div>
                <div class="product-card__price">${esc(p.price)}</div>
                ${p.badge ? `<div class="product-card__badge">${esc(p.badge)}</div>` : ''}
                <div class="product-card__actions">
                    <button class="btn btn-outline btn-sm" onclick="editProduct(${i})">Modifier</button>
                    <button class="btn btn-danger-outline btn-sm" onclick="confirmDeleteProduct(${i})">Supprimer</button>
                </div>
            </div>
        </div>
    `).join('');
}

function initProductModal() {
    document.getElementById('addProductBtn').addEventListener('click', () => openProductModal(-1));
    document.getElementById('modalClose').addEventListener('click', closeProductModal);
    document.getElementById('modalCancel').addEventListener('click', closeProductModal);
    document.getElementById('modalSave').addEventListener('click', saveProduct);
    document.getElementById('addCompositionBtn').addEventListener('click', addCompositionItem);
    document.getElementById('addProductImageBtn').addEventListener('click', () => document.getElementById('productImageInput').click());
    document.getElementById('productImageInput').addEventListener('change', handleProductImagesUpload);
    document.getElementById('productModal').addEventListener('click', e => { if (e.target.id === 'productModal') closeProductModal(); });
}

function openProductModal(index) {
    editingProductIndex = index;
    pendingProductImages = [];

    if (index === -1) {
        document.getElementById('modalProductTitle').textContent = 'Nouveau produit';
        document.getElementById('editTitle').value = '';
        document.getElementById('editPrice').value = '';
        document.getElementById('editBadge').value = '';
        document.getElementById('editDelay').value = 'Délai : 2 semaines maximum';
        document.getElementById('editWhatsapp').value = '';
        renderProductImagesGallery([]);
        renderCompositionList([]);
    } else {
        const p = productsData.items[index];
        document.getElementById('modalProductTitle').textContent = 'Modifier : ' + p.title;
        document.getElementById('editTitle').value = p.title || '';
        document.getElementById('editPrice').value = p.price || '';
        document.getElementById('editBadge').value = p.badge || '';
        document.getElementById('editDelay').value = p.delay || '';
        document.getElementById('editWhatsapp').value = p.whatsappMessage || '';

        const images = p.images || (p.image ? [p.image] : []);
        renderProductImagesGallery(images);
        renderCompositionList(p.composition || []);
    }

    document.getElementById('productImageInput').value = '';
    document.getElementById('productModal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeProductModal() {
    document.getElementById('productModal').style.display = 'none';
    document.body.style.overflow = '';
}

function renderProductImagesGallery(images) {
    const gallery = document.getElementById('productImagesGallery');
    const allImages = [...images, ...pendingProductImages.map(p => p.preview)];

    if (allImages.length === 0) {
        gallery.innerHTML = `
            <div class="image-upload" onclick="document.getElementById('productImageInput').click()">
                <div class="image-placeholder">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                    <span>Ajouter des images</span>
                    <small>Format recommandé : 600x500px</small>
                </div>
            </div>
        `;
        return;
    }

    gallery.innerHTML = allImages.map((img, i) => `
        <div class="image-item ${i === 0 ? 'image-item--main' : ''}">
            <img src="${esc(img)}" alt="Image ${i + 1}">
            <button class="image-item__remove" onclick="removeProductImage(${i})" type="button">&times;</button>
        </div>
    `).join('');
}

function handleProductImagesUpload(e) {
    const files = e.target.files;
    if (!files.length) return;

    Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = ev => {
            pendingProductImages.push({
                preview: ev.target.result,
                base64: ev.target.result.split(',')[1],
                name: 'product-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9) + '-' + file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
            });

            const currentImages = editingProductIndex >= 0
                ? (productsData.items[editingProductIndex].images || [productsData.items[editingProductIndex].image].filter(Boolean))
                : [];
            renderProductImagesGallery(currentImages);
        };
        reader.readAsDataURL(file);
    });
}

function removeProductImage(index) {
    const currentImages = editingProductIndex >= 0
        ? (productsData.items[editingProductIndex].images || [productsData.items[editingProductIndex].image].filter(Boolean))
        : [];

    if (index < currentImages.length) {
        currentImages.splice(index, 1);
        if (editingProductIndex >= 0) {
            productsData.items[editingProductIndex].images = currentImages;
        }
    } else {
        pendingProductImages.splice(index - currentImages.length, 1);
    }

    renderProductImagesGallery(currentImages);
}

function renderCompositionList(items) {
    document.getElementById('compositionList').innerHTML = items.map(item => `
        <div class="composition-item">
            <input type="text" value="${esc(item)}">
            <button class="remove-btn" onclick="this.parentElement.remove()" type="button">&times;</button>
        </div>
    `).join('');
}

function addCompositionItem() {
    const div = document.createElement('div');
    div.className = 'composition-item';
    div.innerHTML = '<input type="text" value="" placeholder="Nouvel élément..."><button class="remove-btn" onclick="this.parentElement.remove()" type="button">&times;</button>';
    document.getElementById('compositionList').appendChild(div);
    div.querySelector('input').focus();
}

async function saveProduct() {
    const title = document.getElementById('editTitle').value.trim();
    const price = document.getElementById('editPrice').value.trim();

    if (!title || !price) {
        alert('Le nom et le prix sont obligatoires.');
        return;
    }

    showLoader();

    const badge = document.getElementById('editBadge').value.trim();
    const delay = document.getElementById('editDelay').value.trim();
    const whatsapp = document.getElementById('editWhatsapp').value.trim();
    const composition = Array.from(document.querySelectorAll('#compositionList .composition-item input'))
        .map(i => i.value.trim()).filter(v => v);

    // Get current images
    let images = editingProductIndex >= 0
        ? (productsData.items[editingProductIndex].images || [productsData.items[editingProductIndex].image].filter(Boolean))
        : [];

    // Upload new images
    for (const pending of pendingProductImages) {
        try {
            const path = await uploadFile('images/' + pending.name, pending.base64);
            images.push(path);
        } catch (err) {
            hideLoader();
            showToast('Erreur upload image : ' + err.message, 'error');
            return;
        }
    }

    const product = {
        title, price, badge, delay,
        image: images[0] || '',
        images: images,
        order: editingProductIndex >= 0 ? productsData.items[editingProductIndex].order : (productsData.items.length + 1),
        composition,
        whatsappMessage: whatsapp || 'Bonjour, je suis intéressée par ' + title + '.'
    };

    if (editingProductIndex === -1) {
        productsData.items.push(product);
    } else {
        productsData.items[editingProductIndex] = product;
    }

    const ok = await saveProducts();
    hideLoader();
    if (ok) {
        closeProductModal();
        renderProductsList();
        showToast('Produit enregistré !');
    }
}

async function saveProducts() {
    try {
        await saveFile('data/products.json', JSON.stringify(productsData, null, 2));
        return true;
    } catch (err) {
        showToast('Erreur : ' + err.message, 'error');
        return false;
    }
}

function editProduct(index) {
    openProductModal(index);
}

function confirmDeleteProduct(index) {
    const p = productsData.items[index];
    openDeleteModal('"' + p.title + '"', async () => {
        showLoader();
        productsData.items.splice(index, 1);
        productsData.items.forEach((item, i) => { item.order = i + 1; });
        const ok = await saveProducts();
        hideLoader();
        if (ok) {
            renderProductsList();
            showToast('Produit supprimé.');
        }
    });
}

// ============================================
// TEXTES DU SITE
// ============================================
function renderTextsForm() {
    const c = siteContent;
    document.getElementById('textsForm').innerHTML = `
        ${formCard('Section Accueil (Hero)', 'hero', `
            ${field('txt_hero_title', 'Titre principal', c.hero?.title)}
            ${field('txt_hero_subtitle', 'Sous-titre', c.hero?.subtitle)}
            ${textarea('txt_hero_tagline', "Phrase d'accroche", c.hero?.tagline)}
            ${field('txt_hero_cta', 'Texte du bouton', c.hero?.cta)}
        `)}

        ${formCard('Section Présentation', 'presentation', `
            ${field('txt_pres_title', 'Titre', c.presentation?.title)}
            ${textarea('txt_pres_text', 'Texte de présentation', c.presentation?.text)}
            <div class="form-group">
                <label>Points forts (3 éléments)</label>
                <div class="list-editor" id="featuresEditor">
                    ${(c.presentation?.features || ['', '', '']).map((f, i) => `
                        <div class="list-editor-item">
                            <input type="text" value="${esc(f)}" placeholder="Point fort ${i + 1}">
                        </div>
                    `).join('')}
                </div>
            </div>
        `)}

        ${formCard('Section Produits', 'products', `
            ${field('txt_prod_title', 'Titre de la section', c.products?.title)}
            ${textarea('txt_prod_subtitle', 'Sous-titre', c.products?.subtitle)}
        `)}

        ${formCard('Section Événements', 'events-text', `
            ${field('txt_events_title', 'Titre', c.events?.title)}
            ${textarea('txt_events_subtitle', 'Sous-titre', c.events?.subtitle)}
        `)}

        ${formCard('Section Témoignages', 'testimonials-text', `
            ${field('txt_test_title', 'Titre', c.testimonials?.title)}
            ${textarea('txt_test_subtitle', 'Sous-titre', c.testimonials?.subtitle)}
        `)}

        ${formCard('Section Devis', 'quote', `
            ${field('txt_quote_title', 'Titre', c.quote?.title)}
            ${field('txt_quote_subtitle', 'Sous-titre', c.quote?.subtitle)}
            ${textarea('txt_quote_success', 'Message de confirmation', c.quote?.successMessage)}
        `)}

        ${formCard('Pied de page', 'footer', `
            ${field('txt_footer_brand', 'Nom de la marque', c.footer?.brand)}
            ${field('txt_footer_tagline', 'Slogan', c.footer?.tagline)}
            ${field('txt_footer_copyright', 'Copyright', c.footer?.copyright)}
        `)}
    `;

    document.getElementById('saveTextsBtn').addEventListener('click', saveTexts);
}

async function saveTexts() {
    showLoader();

    siteContent.hero = {
        ...siteContent.hero,
        title: val('txt_hero_title'),
        subtitle: val('txt_hero_subtitle'),
        tagline: val('txt_hero_tagline'),
        cta: val('txt_hero_cta')
    };

    siteContent.presentation = {
        ...siteContent.presentation,
        title: val('txt_pres_title'),
        text: val('txt_pres_text'),
        features: Array.from(document.querySelectorAll('#featuresEditor input')).map(i => i.value.trim()).filter(v => v)
    };

    siteContent.products = {
        ...siteContent.products,
        title: val('txt_prod_title'),
        subtitle: val('txt_prod_subtitle')
    };

    siteContent.events = {
        ...siteContent.events,
        title: val('txt_events_title'),
        subtitle: val('txt_events_subtitle')
    };

    siteContent.testimonials = {
        ...siteContent.testimonials,
        title: val('txt_test_title'),
        subtitle: val('txt_test_subtitle')
    };

    siteContent.quote = {
        title: val('txt_quote_title'),
        subtitle: val('txt_quote_subtitle'),
        successMessage: val('txt_quote_success')
    };

    siteContent.footer = {
        brand: val('txt_footer_brand'),
        tagline: val('txt_footer_tagline'),
        copyright: val('txt_footer_copyright')
    };

    try {
        await saveFile('data/site-content.json', JSON.stringify(siteContent, null, 2));
        showToast('Textes enregistrés !');
    } catch (err) {
        showToast('Erreur: ' + err.message, 'error');
    }
    hideLoader();
}

// ============================================
// COULEURS
// ============================================
function renderColorsForm() {
    const d = siteDesign;
    const c = d.colors || {};
    const sc = d.sectionColors || {};
    const bc = d.buttonColors || {};
    const cc = d.cardColors || {};

    document.getElementById('colorsForm').innerHTML = `
        ${formCard('Couleurs Principales', 'colors-main', `
            <p class="form-hint" style="margin-bottom:16px;">Les couleurs de base utilisées sur tout le site.</p>
            <div class="form-row">
                ${colorField('color_primary', 'Couleur Or (principale)', c.primary || '#C9A84C')}
                ${colorField('color_primaryLight', 'Or Clair', c.primaryLight || '#E8D5A3')}
            </div>
            <div class="form-row">
                ${colorField('color_primaryDark', 'Or Foncé', c.primaryDark || '#8B6914')}
                ${colorField('color_titleColor', 'Couleur Titres', c.titleColor || '#996B2B')}
            </div>
            <div class="form-row">
                ${colorField('color_background', 'Fond Principal', c.background || '#FAF6F0')}
                ${colorField('color_backgroundAlt', 'Fond Alternatif', c.backgroundAlt || '#F5EFE6')}
            </div>
            <div class="form-row">
                ${colorField('color_backgroundDark', 'Fond Sombre', c.backgroundDark || '#2C2420')}
                ${colorField('color_text', 'Texte Principal', c.text || '#2C2C2C')}
            </div>
            <div class="form-row">
                ${colorField('color_textLight', 'Texte Secondaire', c.textLight || '#5A5A5A')}
            </div>
        `)}

        ${formCard('Boutons', 'colors-buttons', `
            <p class="form-hint" style="margin-bottom:16px;">Couleurs des boutons d'action.</p>
            <div class="form-row">
                ${colorField('btn_primary_bg', 'Fond Bouton Principal', bc.primaryBg || '#C9A84C')}
                ${colorField('btn_primary_text', 'Texte Bouton Principal', bc.primaryText || '#FFFFFF')}
            </div>
            <div class="form-row">
                ${colorField('btn_secondary_bg', 'Fond Bouton Secondaire', bc.secondaryBg || 'transparent')}
                ${colorField('btn_secondary_border', 'Bordure Bouton Secondaire', bc.secondaryBorder || '#C9A84C')}
            </div>
        `)}

        ${formCard('Cartes Produits', 'colors-cards', `
            <p class="form-hint" style="margin-bottom:16px;">Apparence des cartes produits.</p>
            <div class="form-row">
                ${colorField('card_bg', 'Fond Carte', cc.bg || '#FFFFFF')}
                ${colorField('card_border', 'Bordure Carte', cc.border || '#E8D5A3')}
            </div>
            <div class="form-row">
                ${colorField('card_title', 'Titre Carte', cc.title || '#2C2C2C')}
                ${colorField('card_price', 'Prix Carte', cc.price || '#C9A84C')}
            </div>
            <div class="form-row">
                ${colorField('card_badge_bg', 'Fond Badge', cc.badgeBg || '#C9A84C')}
                ${colorField('card_badge_text', 'Texte Badge', cc.badgeText || '#FFFFFF')}
            </div>
        `)}

        ${formCard('Couleur par Section', 'colors-sections', `
            <p class="form-hint" style="margin-bottom:16px;">Personnalisez le fond, texte et titres de chaque section.</p>

            <div class="section-divider"><span>Hero (Accueil)</span></div>
            <div class="form-row">
                ${colorField('sc_hero_bg', 'Fond', sc.hero?.bg || '#FAF6F0')}
                ${colorField('sc_hero_text', 'Texte', sc.hero?.text || '#2C2C2C')}
                ${colorField('sc_hero_title', 'Titre', sc.hero?.titleColor || '#996B2B')}
            </div>

            <div class="section-divider"><span>Présentation</span></div>
            <div class="form-row">
                ${colorField('sc_presentation_bg', 'Fond', sc.presentation?.bg || '#F5EFE6')}
                ${colorField('sc_presentation_text', 'Texte', sc.presentation?.text || '#2C2C2C')}
                ${colorField('sc_presentation_title', 'Titre', sc.presentation?.titleColor || '#996B2B')}
            </div>

            <div class="section-divider"><span>Produits</span></div>
            <div class="form-row">
                ${colorField('sc_products_bg', 'Fond', sc.products?.bg || '#FAF6F0')}
                ${colorField('sc_products_text', 'Texte', sc.products?.text || '#2C2C2C')}
                ${colorField('sc_products_title', 'Titre', sc.products?.titleColor || '#996B2B')}
            </div>

            <div class="section-divider"><span>Événements</span></div>
            <div class="form-row">
                ${colorField('sc_events_bg', 'Fond', sc.events?.bg || '#F5EFE6')}
                ${colorField('sc_events_text', 'Texte', sc.events?.text || '#2C2C2C')}
                ${colorField('sc_events_title', 'Titre', sc.events?.titleColor || '#996B2B')}
            </div>

            <div class="section-divider"><span>Témoignages</span></div>
            <div class="form-row">
                ${colorField('sc_testimonials_bg', 'Fond', sc.testimonials?.bg || '#FAF6F0')}
                ${colorField('sc_testimonials_text', 'Texte', sc.testimonials?.text || '#2C2C2C')}
                ${colorField('sc_testimonials_title', 'Titre', sc.testimonials?.titleColor || '#996B2B')}
            </div>

            <div class="section-divider"><span>Devis (Formulaire)</span></div>
            <div class="form-row">
                ${colorField('sc_quote_bg', 'Fond', sc.quote?.bg || '#F5EFE6')}
                ${colorField('sc_quote_text', 'Texte', sc.quote?.text || '#2C2C2C')}
                ${colorField('sc_quote_title', 'Titre', sc.quote?.titleColor || '#996B2B')}
            </div>

            <div class="section-divider"><span>Contact</span></div>
            <div class="form-row">
                ${colorField('sc_contact_bg', 'Fond', sc.contact?.bg || '#FAF6F0')}
                ${colorField('sc_contact_text', 'Texte', sc.contact?.text || '#2C2C2C')}
                ${colorField('sc_contact_title', 'Titre', sc.contact?.titleColor || '#996B2B')}
            </div>

            <div class="section-divider"><span>Footer</span></div>
            <div class="form-row">
                ${colorField('sc_footer_bg', 'Fond', sc.footer?.bg || '#2C2420')}
                ${colorField('sc_footer_text', 'Texte', sc.footer?.text || '#E8D5A3')}
                ${colorField('sc_footer_title', 'Titre', sc.footer?.titleColor || '#C9A84C')}
            </div>
        `)}

        ${formCard('Bandeau Promo', 'colors-promo', `
            <div class="form-row">
                ${colorField('promo_bg', 'Fond Bandeau', c.promoBg || '#C9A84C')}
                ${colorField('promo_text', 'Texte Bandeau', c.promoText || '#FFFFFF')}
            </div>
        `)}
    `;

    syncAllColorInputs();
    document.getElementById('saveColorsBtn').addEventListener('click', saveColors);
}

async function saveColors() {
    showLoader();

    // Couleurs principales
    siteDesign.colors = {
        primary: val('color_primary_hex') || '#C9A84C',
        primaryLight: val('color_primaryLight_hex') || '#E8D5A3',
        primaryDark: val('color_primaryDark_hex') || '#8B6914',
        primaryBright: siteDesign.colors?.primaryBright || '#D4AF37',
        titleColor: val('color_titleColor_hex') || '#996B2B',
        background: val('color_background_hex') || '#FAF6F0',
        backgroundAlt: val('color_backgroundAlt_hex') || '#F5EFE6',
        backgroundDark: val('color_backgroundDark_hex') || '#2C2420',
        text: val('color_text_hex') || '#2C2C2C',
        textLight: val('color_textLight_hex') || '#5A5A5A',
        promoBg: val('promo_bg_hex') || '#C9A84C',
        promoText: val('promo_text_hex') || '#FFFFFF'
    };

    // Couleurs boutons
    siteDesign.buttonColors = {
        primaryBg: val('btn_primary_bg_hex') || '#C9A84C',
        primaryText: val('btn_primary_text_hex') || '#FFFFFF',
        secondaryBg: val('btn_secondary_bg_hex') || 'transparent',
        secondaryBorder: val('btn_secondary_border_hex') || '#C9A84C'
    };

    // Couleurs cartes
    siteDesign.cardColors = {
        bg: val('card_bg_hex') || '#FFFFFF',
        border: val('card_border_hex') || '#E8D5A3',
        title: val('card_title_hex') || '#2C2C2C',
        price: val('card_price_hex') || '#C9A84C',
        badgeBg: val('card_badge_bg_hex') || '#C9A84C',
        badgeText: val('card_badge_text_hex') || '#FFFFFF'
    };

    // Couleurs par section
    siteDesign.sectionColors = {
        hero: { bg: val('sc_hero_bg_hex'), text: val('sc_hero_text_hex'), titleColor: val('sc_hero_title_hex') },
        presentation: { bg: val('sc_presentation_bg_hex'), text: val('sc_presentation_text_hex'), titleColor: val('sc_presentation_title_hex') },
        products: { bg: val('sc_products_bg_hex'), text: val('sc_products_text_hex'), titleColor: val('sc_products_title_hex') },
        events: { bg: val('sc_events_bg_hex'), text: val('sc_events_text_hex'), titleColor: val('sc_events_title_hex') },
        testimonials: { bg: val('sc_testimonials_bg_hex'), text: val('sc_testimonials_text_hex'), titleColor: val('sc_testimonials_title_hex') },
        quote: { bg: val('sc_quote_bg_hex'), text: val('sc_quote_text_hex'), titleColor: val('sc_quote_title_hex') },
        contact: { bg: val('sc_contact_bg_hex'), text: val('sc_contact_text_hex'), titleColor: val('sc_contact_title_hex') },
        footer: { bg: val('sc_footer_bg_hex'), text: val('sc_footer_text_hex'), titleColor: val('sc_footer_title_hex') }
    };

    try {
        await saveFile('data/site-design.json', JSON.stringify(siteDesign, null, 2));
        showToast('Couleurs enregistrées !');
    } catch (err) {
        showToast('Erreur: ' + err.message, 'error');
    }
    hideLoader();
}

// ============================================
// POLICES
// ============================================
function renderFontsForm() {
    const d = siteDesign;
    const fonts = d.fonts || { title: 'Cormorant Garamond', body: 'Montserrat' };

    document.getElementById('fontsForm').innerHTML = `
        ${formCard('Police des Titres', 'font-title', `
            <p class="form-hint" style="margin-bottom:16px;">Choisissez la police pour tous les titres du site.</p>
            <div class="font-selector" id="fontTitleSelector">
                ${AVAILABLE_FONTS.filter(f => f.category === 'serif').map(f => `
                    <label class="font-option ${fonts.title === f.name ? 'selected' : ''}" onclick="selectFont(this, 'title')">
                        <input type="radio" name="fontTitle" value="${f.name}" ${fonts.title === f.name ? 'checked' : ''}>
                        <div class="font-option__name">${f.name}</div>
                        <div class="font-option__preview" style="font-family: '${f.name}', serif;">${f.preview}</div>
                    </label>
                `).join('')}
            </div>
        `)}

        ${formCard('Police du Texte', 'font-body', `
            <p class="form-hint" style="margin-bottom:16px;">Choisissez la police pour le texte courant.</p>
            <div class="font-selector" id="fontBodySelector">
                ${AVAILABLE_FONTS.filter(f => f.category === 'sans-serif').map(f => `
                    <label class="font-option ${fonts.body === f.name ? 'selected' : ''}" onclick="selectFont(this, 'body')">
                        <input type="radio" name="fontBody" value="${f.name}" ${fonts.body === f.name ? 'checked' : ''}>
                        <div class="font-option__name">${f.name}</div>
                        <div class="font-option__preview" style="font-family: '${f.name}', sans-serif;">${f.preview}</div>
                    </label>
                `).join('')}
            </div>
        `)}

        ${formCard('Aperçu', 'font-preview', `
            <div class="preview-box">
                <div class="preview-box__label">Aperçu des polices</div>
                <h3 style="font-family: '${fonts.title}', serif; font-size: 28px; margin-bottom: 12px; color: var(--gold);">Perle de Fès</h3>
                <p style="font-family: '${fonts.body}', sans-serif; font-size: 15px; color: var(--text-light);">
                    L'art marocain au service de vos événements. Créations artisanales uniques pour mariages et célébrations.
                </p>
            </div>
        `)}
    `;

    document.getElementById('saveFontsBtn').addEventListener('click', saveFonts);
}

function selectFont(label, type) {
    const selector = label.closest('.font-selector');
    selector.querySelectorAll('.font-option').forEach(o => o.classList.remove('selected'));
    label.classList.add('selected');
    label.querySelector('input').checked = true;
}

async function saveFonts() {
    showLoader();

    siteDesign.fonts = {
        title: document.querySelector('input[name="fontTitle"]:checked')?.value || 'Cormorant Garamond',
        body: document.querySelector('input[name="fontBody"]:checked')?.value || 'Montserrat'
    };

    try {
        await saveFile('data/site-design.json', JSON.stringify(siteDesign, null, 2));
        showToast('Polices enregistrées !');
        renderFontsForm(); // Refresh preview
    } catch (err) {
        showToast('Erreur: ' + err.message, 'error');
    }
    hideLoader();
}

// ============================================
// IMAGES
// ============================================
function renderImagesForm() {
    const c = siteContent;
    const d = siteDesign;

    document.getElementById('imagesForm').innerHTML = `
        ${formCard('Logo du Site', 'images-logo', `
            <div class="form-row">
                <div class="form-group">
                    <label>Logo</label>
                    <div class="image-upload image-upload--logo" id="logoUpload">
                        <img src="${esc(c.hero?.logo || '')}" alt="Logo" class="image-preview" id="logoPreview" style="display:${c.hero?.logo ? 'block' : 'none'}; object-fit:contain; padding:8px;">
                        <div class="image-placeholder" id="logoPlaceholder" style="display:${c.hero?.logo ? 'none' : 'flex'};">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                            <span>Choisir un logo</span>
                        </div>
                        <input type="file" accept="image/*" id="logoInput" style="display:none;">
                    </div>
                </div>
                <div class="form-group">
                    <label>Affichage dans le header</label>
                    <select id="headerDisplay">
                        <option value="text" ${c.hero?.headerDisplay === 'text' ? 'selected' : ''}>Nom du site uniquement</option>
                        <option value="logo" ${c.hero?.headerDisplay === 'logo' ? 'selected' : ''}>Logo uniquement</option>
                        <option value="both" ${c.hero?.headerDisplay === 'both' ? 'selected' : ''}>Logo + Nom</option>
                    </select>
                </div>
            </div>
        `)}

        ${formCard('Image de Fond (Hero)', 'images-hero', `
            <div class="form-group">
                <label>Image d'arrière-plan de la section d'accueil</label>
                <div class="image-upload image-upload--wide" id="heroImageUpload">
                    <img src="${esc(c.hero?.backgroundImage || '')}" alt="" class="image-preview" id="heroImagePreview" style="display:${c.hero?.backgroundImage ? 'block' : 'none'};">
                    <div class="image-placeholder" id="heroImagePlaceholder" style="display:${c.hero?.backgroundImage ? 'none' : 'flex'};">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                        <span>Choisir une image de fond</span>
                        <small>Format recommandé : 1920x900px</small>
                    </div>
                    <input type="file" accept="image/*" id="heroImageInput" style="display:none;">
                </div>
            </div>
        `)}

        ${formCard('Textures & Motifs', 'images-textures', `
            <div class="form-group">
                <label class="toggle-label">
                    <input type="checkbox" id="texture_hero_enabled" ${d.textures?.hero?.enabled !== false ? 'checked' : ''}>
                    <span>Texture zellige dans le Hero</span>
                </label>
                <div class="slider-group">
                    <label>Opacité <span id="texture_hero_val">${Math.round((d.textures?.hero?.opacity || 0.12) * 100)}%</span></label>
                    <input type="range" id="texture_hero_opacity" min="0" max="30" value="${Math.round((d.textures?.hero?.opacity || 0.12) * 100)}" oninput="document.getElementById('texture_hero_val').textContent = this.value + '%'">
                </div>
            </div>

            <div class="form-group">
                <label class="toggle-label">
                    <input type="checkbox" id="texture_presentation_enabled" ${d.textures?.presentation?.enabled !== false ? 'checked' : ''}>
                    <span>Texture dans la section Présentation</span>
                </label>
                <div class="slider-group">
                    <label>Opacité <span id="texture_presentation_val">${Math.round((d.textures?.presentation?.opacity || 0.10) * 100)}%</span></label>
                    <input type="range" id="texture_presentation_opacity" min="0" max="30" value="${Math.round((d.textures?.presentation?.opacity || 0.10) * 100)}" oninput="document.getElementById('texture_presentation_val').textContent = this.value + '%'">
                </div>
            </div>

            <div class="form-group">
                <label class="toggle-label">
                    <input type="checkbox" id="texture_events_enabled" ${d.textures?.events?.enabled !== false ? 'checked' : ''}>
                    <span>Texture dans la section Événements</span>
                </label>
                <div class="slider-group">
                    <label>Opacité <span id="texture_events_val">${Math.round((d.textures?.events?.opacity || 0.12) * 100)}%</span></label>
                    <input type="range" id="texture_events_opacity" min="0" max="30" value="${Math.round((d.textures?.events?.opacity || 0.12) * 100)}" oninput="document.getElementById('texture_events_val').textContent = this.value + '%'">
                </div>
            </div>
        `)}
    `;

    // Event listeners
    document.getElementById('logoUpload').addEventListener('click', () => document.getElementById('logoInput').click());
    document.getElementById('logoInput').addEventListener('change', e => handleImageUpload(e, 'logoPreview', 'logoPlaceholder', '_logo'));
    document.getElementById('heroImageUpload').addEventListener('click', () => document.getElementById('heroImageInput').click());
    document.getElementById('heroImageInput').addEventListener('change', e => handleImageUpload(e, 'heroImagePreview', 'heroImagePlaceholder', '_heroImage'));

    document.getElementById('saveImagesBtn').addEventListener('click', saveImages);
}

function handleImageUpload(e, previewId, placeholderId, key) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
        document.getElementById(previewId).src = ev.target.result;
        document.getElementById(previewId).style.display = 'block';
        document.getElementById(placeholderId).style.display = 'none';
        pendingUploads[key] = {
            base64: ev.target.result.split(',')[1],
            name: key.replace('_', '') + '-' + Date.now() + '-' + file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
        };
    };
    reader.readAsDataURL(file);
}

async function saveImages() {
    showLoader();

    let logoPath = siteContent.hero?.logo || '';
    let heroImagePath = siteContent.hero?.backgroundImage || '';

    try {
        if (pendingUploads._logo) {
            logoPath = await uploadFile('images/' + pendingUploads._logo.name, pendingUploads._logo.base64);
            delete pendingUploads._logo;
        }
        if (pendingUploads._heroImage) {
            heroImagePath = await uploadFile('images/' + pendingUploads._heroImage.name, pendingUploads._heroImage.base64);
            delete pendingUploads._heroImage;
        }
    } catch (err) {
        hideLoader();
        showToast('Erreur upload: ' + err.message, 'error');
        return;
    }

    siteContent.hero = {
        ...siteContent.hero,
        logo: logoPath,
        backgroundImage: heroImagePath,
        headerDisplay: document.getElementById('headerDisplay').value
    };

    siteDesign.textures = {
        hero: {
            enabled: document.getElementById('texture_hero_enabled').checked,
            opacity: parseInt(document.getElementById('texture_hero_opacity').value) / 100
        },
        presentation: {
            enabled: document.getElementById('texture_presentation_enabled').checked,
            opacity: parseInt(document.getElementById('texture_presentation_opacity').value) / 100
        },
        events: {
            enabled: document.getElementById('texture_events_enabled').checked,
            opacity: parseInt(document.getElementById('texture_events_opacity').value) / 100
        }
    };

    try {
        await Promise.all([
            saveFile('data/site-content.json', JSON.stringify(siteContent, null, 2)),
            saveFile('data/site-design.json', JSON.stringify(siteDesign, null, 2))
        ]);
        showToast('Images enregistrées !');
    } catch (err) {
        showToast('Erreur: ' + err.message, 'error');
    }
    hideLoader();
}

// ============================================
// EVENEMENTS
// ============================================
function renderEventsForm() {
    const events = siteContent.events?.cards || [
        { title: 'Mariages', description: 'Des créations uniques pour le plus beau jour de votre vie.', icon: 'heart' },
        { title: 'Henna Day', description: 'Célébrez la tradition avec élégance.', icon: 'star' },
        { title: 'Baby Shower', description: 'Accueillez bébé avec des cadeaux raffinés.', icon: 'gift' }
    ];

    document.getElementById('eventsForm').innerHTML = `
        ${formCard('Cartes Événements', 'events-cards', `
            <p class="form-hint" style="margin-bottom:16px;">Configurez les 3 types d'événements affichés sur le site.</p>
            <div class="events-grid" id="eventsCardsEditor">
                ${events.map((ev, i) => `
                    <div class="event-card-editor">
                        <div class="event-card-editor__header">
                            <span class="event-card-editor__title">Événement ${i + 1}</span>
                        </div>
                        <div class="form-group">
                            <label>Titre</label>
                            <input type="text" id="event_${i}_title" value="${esc(ev.title || '')}">
                        </div>
                        <div class="form-group">
                            <label>Description</label>
                            <textarea id="event_${i}_desc" rows="2">${esc(ev.description || '')}</textarea>
                        </div>
                        <div class="form-group">
                            <label>Icône</label>
                            <select id="event_${i}_icon">
                                <option value="heart" ${ev.icon === 'heart' ? 'selected' : ''}>Coeur</option>
                                <option value="star" ${ev.icon === 'star' ? 'selected' : ''}>Étoile</option>
                                <option value="gift" ${ev.icon === 'gift' ? 'selected' : ''}>Cadeau</option>
                                <option value="cake" ${ev.icon === 'cake' ? 'selected' : ''}>Gâteau</option>
                                <option value="ring" ${ev.icon === 'ring' ? 'selected' : ''}>Bague</option>
                            </select>
                        </div>
                    </div>
                `).join('')}
            </div>
        `)}
    `;

    document.getElementById('saveEventsBtn').addEventListener('click', saveEvents);
}

async function saveEvents() {
    showLoader();

    const cards = [0, 1, 2].map(i => ({
        title: val(`event_${i}_title`),
        description: val(`event_${i}_desc`),
        icon: document.getElementById(`event_${i}_icon`).value
    }));

    siteContent.events = {
        ...siteContent.events,
        cards
    };

    try {
        await saveFile('data/site-content.json', JSON.stringify(siteContent, null, 2));
        showToast('Événements enregistrés !');
    } catch (err) {
        showToast('Erreur: ' + err.message, 'error');
    }
    hideLoader();
}

// ============================================
// TEMOIGNAGES
// ============================================
function renderTestimonialsForm() {
    const testimonials = siteContent.testimonials?.items || [];

    document.getElementById('testimonialsForm').innerHTML = `
        <div class="testimonials-list" id="testimonialsList">
            ${testimonials.length === 0 ? `
                <div style="text-align:center; padding:40px; color:var(--text-muted);">
                    <p>Aucun témoignage. Cliquez sur "Ajouter un témoignage" pour commencer.</p>
                </div>
            ` : testimonials.map((t, i) => `
                <div class="testimonial-card">
                    <div class="testimonial-card__content">
                        <div class="testimonial-card__text">"${esc(t.text)}"</div>
                        <div class="testimonial-card__author">${esc(t.author)}</div>
                        <div class="testimonial-card__event">${esc(t.event || '')}</div>
                        <div class="testimonial-card__stars">${'★'.repeat(t.stars || 5)}${'☆'.repeat(5 - (t.stars || 5))}</div>
                    </div>
                    <div class="testimonial-card__actions">
                        <button class="btn btn-outline btn-sm" onclick="editTestimonial(${i})">Modifier</button>
                        <button class="btn btn-danger-outline btn-sm" onclick="confirmDeleteTestimonial(${i})">Supprimer</button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function initTestimonialModal() {
    document.getElementById('addTestimonialBtn').addEventListener('click', () => openTestimonialModal(-1));
    document.getElementById('testimonialModalClose').addEventListener('click', closeTestimonialModal);
    document.getElementById('testimonialModalCancel').addEventListener('click', closeTestimonialModal);
    document.getElementById('testimonialModalSave').addEventListener('click', saveTestimonial);
    document.getElementById('testimonialModal').addEventListener('click', e => { if (e.target.id === 'testimonialModal') closeTestimonialModal(); });

    // Stars selector
    document.querySelectorAll('.star-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const stars = parseInt(btn.dataset.stars);
            document.querySelectorAll('.star-btn').forEach((b, i) => {
                b.classList.toggle('active', i < stars);
            });
        });
    });
}

function openTestimonialModal(index) {
    editingTestimonialIndex = index;

    if (index === -1) {
        document.getElementById('testimonialModalTitle').textContent = 'Nouveau témoignage';
        document.getElementById('testimonialAuthor').value = '';
        document.getElementById('testimonialText').value = '';
        document.getElementById('testimonialEvent').value = '';
        document.querySelectorAll('.star-btn').forEach(b => b.classList.add('active'));
    } else {
        const t = siteContent.testimonials?.items?.[index] || {};
        document.getElementById('testimonialModalTitle').textContent = 'Modifier le témoignage';
        document.getElementById('testimonialAuthor').value = t.author || '';
        document.getElementById('testimonialText').value = t.text || '';
        document.getElementById('testimonialEvent').value = t.event || '';
        document.querySelectorAll('.star-btn').forEach((b, i) => {
            b.classList.toggle('active', i < (t.stars || 5));
        });
    }

    document.getElementById('testimonialModal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeTestimonialModal() {
    document.getElementById('testimonialModal').style.display = 'none';
    document.body.style.overflow = '';
}

async function saveTestimonial() {
    const author = document.getElementById('testimonialAuthor').value.trim();
    const text = document.getElementById('testimonialText').value.trim();

    if (!author || !text) {
        alert('Le nom et le témoignage sont obligatoires.');
        return;
    }

    showLoader();

    const stars = document.querySelectorAll('.star-btn.active').length;
    const event = document.getElementById('testimonialEvent').value.trim();

    const testimonial = { author, text, stars, event };

    if (!siteContent.testimonials) siteContent.testimonials = {};
    if (!siteContent.testimonials.items) siteContent.testimonials.items = [];

    if (editingTestimonialIndex === -1) {
        siteContent.testimonials.items.push(testimonial);
    } else {
        siteContent.testimonials.items[editingTestimonialIndex] = testimonial;
    }

    try {
        await saveFile('data/site-content.json', JSON.stringify(siteContent, null, 2));
        closeTestimonialModal();
        renderTestimonialsForm();
        showToast('Témoignage enregistré !');
    } catch (err) {
        showToast('Erreur: ' + err.message, 'error');
    }
    hideLoader();
}

function editTestimonial(index) {
    openTestimonialModal(index);
}

function confirmDeleteTestimonial(index) {
    const t = siteContent.testimonials?.items?.[index];
    openDeleteModal('Témoignage de "' + (t?.author || 'inconnu') + '"', async () => {
        showLoader();
        siteContent.testimonials.items.splice(index, 1);
        try {
            await saveFile('data/site-content.json', JSON.stringify(siteContent, null, 2));
            renderTestimonialsForm();
            showToast('Témoignage supprimé.');
        } catch (err) {
            showToast('Erreur: ' + err.message, 'error');
        }
        hideLoader();
    });
}

// ============================================
// ORNEMENTS
// ============================================
function renderOrnamentsForm() {
    const d = siteDesign;
    const orn = d.ornaments || {};
    const tex = d.textures || {};

    document.getElementById('ornamentsForm').innerHTML = `
        ${formCard('Textures Orientales (Zellige)', 'orn-textures', `
            <p class="form-hint" style="margin-bottom:16px;">Contrôlez les motifs orientaux de fond sur chaque section.</p>

            <div class="texture-controls">
                <div class="texture-row">
                    <label class="toggle-label">
                        <input type="checkbox" id="tex_hero" ${tex.hero?.enabled !== false ? 'checked' : ''}>
                        <span>Hero (accueil)</span>
                    </label>
                    <div class="slider-inline">
                        <input type="range" id="tex_hero_opacity" min="5" max="50" value="${Math.round((tex.hero?.opacity || 0.25) * 100)}" oninput="document.getElementById('tex_hero_opacity_val').textContent = this.value + '%'">
                        <span id="tex_hero_opacity_val">${Math.round((tex.hero?.opacity || 0.25) * 100)}%</span>
                    </div>
                </div>

                <div class="texture-row">
                    <label class="toggle-label">
                        <input type="checkbox" id="tex_presentation" ${tex.presentation?.enabled !== false ? 'checked' : ''}>
                        <span>Présentation</span>
                    </label>
                    <div class="slider-inline">
                        <input type="range" id="tex_presentation_opacity" min="5" max="50" value="${Math.round((tex.presentation?.opacity || 0.25) * 100)}" oninput="document.getElementById('tex_presentation_opacity_val').textContent = this.value + '%'">
                        <span id="tex_presentation_opacity_val">${Math.round((tex.presentation?.opacity || 0.25) * 100)}%</span>
                    </div>
                </div>

                <div class="texture-row">
                    <label class="toggle-label">
                        <input type="checkbox" id="tex_products" ${tex.products?.enabled !== false ? 'checked' : ''}>
                        <span>Produits</span>
                    </label>
                    <div class="slider-inline">
                        <input type="range" id="tex_products_opacity" min="5" max="50" value="${Math.round((tex.products?.opacity || 0.20) * 100)}" oninput="document.getElementById('tex_products_opacity_val').textContent = this.value + '%'">
                        <span id="tex_products_opacity_val">${Math.round((tex.products?.opacity || 0.20) * 100)}%</span>
                    </div>
                </div>

                <div class="texture-row">
                    <label class="toggle-label">
                        <input type="checkbox" id="tex_events" ${tex.events?.enabled !== false ? 'checked' : ''}>
                        <span>Événements</span>
                    </label>
                    <div class="slider-inline">
                        <input type="range" id="tex_events_opacity" min="5" max="50" value="${Math.round((tex.events?.opacity || 0.25) * 100)}" oninput="document.getElementById('tex_events_opacity_val').textContent = this.value + '%'">
                        <span id="tex_events_opacity_val">${Math.round((tex.events?.opacity || 0.25) * 100)}%</span>
                    </div>
                </div>

                <div class="texture-row">
                    <label class="toggle-label">
                        <input type="checkbox" id="tex_testimonials" ${tex.testimonials?.enabled !== false ? 'checked' : ''}>
                        <span>Témoignages</span>
                    </label>
                    <div class="slider-inline">
                        <input type="range" id="tex_testimonials_opacity" min="5" max="50" value="${Math.round((tex.testimonials?.opacity || 0.20) * 100)}" oninput="document.getElementById('tex_testimonials_opacity_val').textContent = this.value + '%'">
                        <span id="tex_testimonials_opacity_val">${Math.round((tex.testimonials?.opacity || 0.20) * 100)}%</span>
                    </div>
                </div>

                <div class="texture-row">
                    <label class="toggle-label">
                        <input type="checkbox" id="tex_quote" ${tex.quote?.enabled !== false ? 'checked' : ''}>
                        <span>Formulaire devis</span>
                    </label>
                    <div class="slider-inline">
                        <input type="range" id="tex_quote_opacity" min="5" max="50" value="${Math.round((tex.quote?.opacity || 0.20) * 100)}" oninput="document.getElementById('tex_quote_opacity_val').textContent = this.value + '%'">
                        <span id="tex_quote_opacity_val">${Math.round((tex.quote?.opacity || 0.20) * 100)}%</span>
                    </div>
                </div>

                <div class="texture-row">
                    <label class="toggle-label">
                        <input type="checkbox" id="tex_contact" ${tex.contact?.enabled !== false ? 'checked' : ''}>
                        <span>Contact</span>
                    </label>
                    <div class="slider-inline">
                        <input type="range" id="tex_contact_opacity" min="5" max="50" value="${Math.round((tex.contact?.opacity || 0.20) * 100)}" oninput="document.getElementById('tex_contact_opacity_val').textContent = this.value + '%'">
                        <span id="tex_contact_opacity_val">${Math.round((tex.contact?.opacity || 0.20) * 100)}%</span>
                    </div>
                </div>
            </div>
        `)}

        ${formCard('Séparateurs entre sections', 'orn-dividers', `
            <div class="form-group">
                <label>Style de séparateur</label>
                <select id="divider_style">
                    <option value="simple" ${orn.dividers?.style === 'simple' ? 'selected' : ''}>Simple (étoile marocaine)</option>
                    <option value="elaborate" ${orn.dividers?.style === 'elaborate' ? 'selected' : ''}>Élaboré (arc + motifs)</option>
                    <option value="minimal" ${orn.dividers?.style === 'minimal' ? 'selected' : ''}>Minimal (ligne simple)</option>
                    <option value="none" ${orn.dividers?.style === 'none' ? 'selected' : ''}>Aucun</option>
                </select>
            </div>
            <div class="slider-group">
                <label>Opacité <span id="divider_opacity_val">${Math.round((orn.dividers?.opacity || 0.6) * 100)}%</span></label>
                <input type="range" id="divider_opacity" min="20" max="100" value="${Math.round((orn.dividers?.opacity || 0.6) * 100)}" oninput="document.getElementById('divider_opacity_val').textContent = this.value + '%'">
            </div>
        `)}

        ${formCard('Étoiles marocaines', 'orn-stars', `
            <div class="form-group">
                <label class="toggle-label">
                    <input type="checkbox" id="stars_showOnTitles" ${orn.stars?.showOnTitles !== false ? 'checked' : ''}>
                    <span>Afficher une étoile au-dessus des titres de section</span>
                </label>
            </div>
            <div class="slider-group">
                <label>Opacité des étoiles <span id="stars_opacity_val">${Math.round((orn.stars?.opacity || 0.85) * 100)}%</span></label>
                <input type="range" id="stars_opacity" min="30" max="100" value="${Math.round((orn.stars?.opacity || 0.85) * 100)}" oninput="document.getElementById('stars_opacity_val').textContent = this.value + '%'">
            </div>
        `)}

        ${formCard('Lanternes décoratives', 'orn-lanterns', `
            <div class="form-group">
                <label class="toggle-label">
                    <input type="checkbox" id="lanterns_hero" ${orn.lanterns?.hero !== false ? 'checked' : ''}>
                    <span>Lanternes dans le Hero</span>
                </label>
            </div>
            <div class="form-group">
                <label class="toggle-label">
                    <input type="checkbox" id="lanterns_footer" ${orn.lanterns?.footer !== false ? 'checked' : ''}>
                    <span>Lanternes dans le Footer</span>
                </label>
            </div>
        `)}
    `;

    document.getElementById('saveOrnamentsBtn').addEventListener('click', saveOrnaments);
}

async function saveOrnaments() {
    showLoader();

    siteDesign.textures = {
        hero: {
            enabled: document.getElementById('tex_hero').checked,
            opacity: parseInt(document.getElementById('tex_hero_opacity').value) / 100
        },
        presentation: {
            enabled: document.getElementById('tex_presentation').checked,
            opacity: parseInt(document.getElementById('tex_presentation_opacity').value) / 100
        },
        products: {
            enabled: document.getElementById('tex_products').checked,
            opacity: parseInt(document.getElementById('tex_products_opacity').value) / 100
        },
        events: {
            enabled: document.getElementById('tex_events').checked,
            opacity: parseInt(document.getElementById('tex_events_opacity').value) / 100
        },
        testimonials: {
            enabled: document.getElementById('tex_testimonials').checked,
            opacity: parseInt(document.getElementById('tex_testimonials_opacity').value) / 100
        },
        quote: {
            enabled: document.getElementById('tex_quote').checked,
            opacity: parseInt(document.getElementById('tex_quote_opacity').value) / 100
        },
        contact: {
            enabled: document.getElementById('tex_contact').checked,
            opacity: parseInt(document.getElementById('tex_contact_opacity').value) / 100
        }
    };

    siteDesign.ornaments = {
        dividers: {
            style: document.getElementById('divider_style').value,
            opacity: parseInt(document.getElementById('divider_opacity').value) / 100
        },
        stars: {
            showOnTitles: document.getElementById('stars_showOnTitles').checked,
            opacity: parseInt(document.getElementById('stars_opacity').value) / 100
        },
        lanterns: {
            hero: document.getElementById('lanterns_hero').checked,
            footer: document.getElementById('lanterns_footer').checked
        }
    };

    try {
        await saveFile('data/site-design.json', JSON.stringify(siteDesign, null, 2));
        showToast('Ornements et textures enregistrés !');
    } catch (err) {
        showToast('Erreur: ' + err.message, 'error');
    }
    hideLoader();
}

// ============================================
// CONTACT
// ============================================
function renderContactForm() {
    const c = siteContent.contact || {};

    document.getElementById('contactForm').innerHTML = `
        ${formCard('Coordonnées', 'contact-info', `
            ${field('ct_title', 'Titre de la section', c.title)}
            ${textarea('ct_subtitle', 'Sous-titre', c.subtitle)}
            <div class="form-row">
                ${field('ct_whatsapp', 'WhatsApp (affiché)', c.whatsapp, 'Ex: 06 52 37 55 78')}
                ${field('ct_whatsappNumber', 'WhatsApp (international)', c.whatsappNumber, 'Ex: 33652375578')}
            </div>
            <div class="form-row">
                ${field('ct_instagram', 'Instagram', c.instagram, '@perledefes_creation')}
                ${field('ct_instagramUrl', 'URL Instagram', c.instagramUrl)}
            </div>
            ${field('ct_email', 'Email', c.email)}
        `)}

        ${formCard('Informations de livraison', 'contact-delivery', `
            <div class="form-group">
                <label>Lignes d'information</label>
                <div class="list-editor" id="deliveryEditor">
                    ${(c.deliveryInfo || []).map(line => `
                        <div class="list-editor-item">
                            <input type="text" value="${esc(line)}">
                            <button class="remove-btn" onclick="this.parentElement.remove()" type="button">&times;</button>
                        </div>
                    `).join('')}
                </div>
                <button class="btn btn-outline btn-sm" onclick="addDeliveryLine()" type="button">+ Ajouter une ligne</button>
            </div>
        `)}
    `;

    document.getElementById('saveContactBtn').addEventListener('click', saveContact);
}

function addDeliveryLine() {
    const div = document.createElement('div');
    div.className = 'list-editor-item';
    div.innerHTML = '<input type="text" value="" placeholder="Nouvelle ligne..."><button class="remove-btn" onclick="this.parentElement.remove()" type="button">&times;</button>';
    document.getElementById('deliveryEditor').appendChild(div);
    div.querySelector('input').focus();
}

async function saveContact() {
    showLoader();

    siteContent.contact = {
        title: val('ct_title'),
        subtitle: val('ct_subtitle'),
        whatsapp: val('ct_whatsapp'),
        whatsappNumber: val('ct_whatsappNumber'),
        instagram: val('ct_instagram'),
        instagramUrl: val('ct_instagramUrl'),
        email: val('ct_email'),
        deliveryInfo: Array.from(document.querySelectorAll('#deliveryEditor input')).map(i => i.value.trim()).filter(v => v)
    };

    try {
        await saveFile('data/site-content.json', JSON.stringify(siteContent, null, 2));
        showToast('Contact enregistré !');
    } catch (err) {
        showToast('Erreur: ' + err.message, 'error');
    }
    hideLoader();
}

// ============================================
// MODAL SUPPRESSION
// ============================================
function initDeleteModal() {
    document.getElementById('deleteCancelBtn').addEventListener('click', closeDeleteModal);
    document.getElementById('deleteConfirmBtn').addEventListener('click', executeDelete);
    document.getElementById('deleteModal').addEventListener('click', e => {
        if (e.target.id === 'deleteModal') closeDeleteModal();
    });
}

function openDeleteModal(itemName, callback) {
    deleteCallback = callback;
    document.getElementById('deleteItemName').textContent = itemName;
    document.getElementById('deleteModal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeDeleteModal() {
    document.getElementById('deleteModal').style.display = 'none';
    document.body.style.overflow = '';
    deleteCallback = null;
}

async function executeDelete() {
    closeDeleteModal();
    if (deleteCallback) {
        await deleteCallback();
    }
}

// ============================================
// SAUVEGARDE VIA NETLIFY FUNCTION
// ============================================
async function getIdentityToken() {
    try { await netlifyIdentity.refresh(); } catch (e) { /* */ }
    return netlifyIdentity.currentUser()?.token?.access_token;
}

async function callSaveFunction(body) {
    const token = await getIdentityToken();
    if (!token) throw new Error('Non authentifié. Reconnectez-vous.');

    const res = await fetch('/.netlify/functions/github-save', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });

    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.error || 'Erreur ' + res.status);
    }
    return data;
}

async function saveFile(path, content) {
    return callSaveFunction({
        action: 'save',
        path: path,
        content: content,
        message: 'Mise à jour ' + path.split('/').pop() + ' via admin'
    });
}

async function uploadFile(path, base64Data) {
    const result = await callSaveFunction({
        action: 'upload',
        path: path,
        base64: base64Data
    });
    return '/' + path;
}

// ============================================
// HELPERS
// ============================================
function esc(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function val(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : '';
}

function field(id, label, value, placeholder) {
    return `
        <div class="form-group">
            <label for="${id}">${label}</label>
            <input type="text" id="${id}" value="${esc(value || '')}" ${placeholder ? 'placeholder="' + esc(placeholder) + '"' : ''}>
        </div>
    `;
}

function textarea(id, label, value) {
    return `
        <div class="form-group">
            <label for="${id}">${label}</label>
            <textarea id="${id}">${esc(value || '')}</textarea>
        </div>
    `;
}

function colorField(id, label, value) {
    return `
        <div class="form-group">
            <label for="${id}">${label}</label>
            <div class="color-input-wrapper">
                <input type="color" id="${id}" value="${value}">
                <input type="text" id="${id}_hex" value="${value}" maxlength="7">
            </div>
        </div>
    `;
}

function formCard(title, id, body) {
    return `
        <div class="form-card" id="card-${id}">
            <div class="form-card__header" onclick="toggleCard(this)">
                <h3>${title}</h3>
                <span class="form-card__toggle">▼</span>
            </div>
            <div class="form-card__body">${body}</div>
        </div>
    `;
}

function toggleCard(header) {
    header.closest('.form-card').classList.toggle('collapsed');
}

function syncAllColorInputs() {
    document.querySelectorAll('.color-input-wrapper').forEach(wrapper => {
        const picker = wrapper.querySelector('input[type="color"]');
        const hex = wrapper.querySelector('input[type="text"]');
        if (picker && hex) {
            picker.addEventListener('input', () => { hex.value = picker.value; });
            hex.addEventListener('input', () => {
                if (/^#[0-9A-Fa-f]{6}$/.test(hex.value)) picker.value = hex.value;
            });
        }
    });
}

function showToast(text, type) {
    const toast = document.getElementById('toast');
    document.getElementById('toastText').textContent = text;
    document.getElementById('toastIcon').innerHTML = type === 'error' ? '✕' : '✓';
    toast.className = 'toast show' + (type === 'error' ? ' toast--error' : ' toast--success');
    setTimeout(() => { toast.className = 'toast'; }, 4000);
}

function showLoader() { document.getElementById('loader').style.display = 'flex'; }
function hideLoader() { document.getElementById('loader').style.display = 'none'; }
