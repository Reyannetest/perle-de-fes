/* ============================================
   PERLE DE FES — ADMIN PANEL
   ============================================ */

let currentUser = null;
let productsData = { items: [] };
let siteContent = {};
let editingProductIndex = -1;
let pendingImageBase64 = null;
let pendingImageName = null;
let deleteTargetIndex = -1;
let gatewayAvailable = null; // null = not checked, true/false

// ============================================
// INIT
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    initAuth();
    initTabs();
    initProductModal();
    initDeleteModal();
});

// ============================================
// AUTH
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
    checkGateway();
}

async function checkGateway() {
    try {
        const res = await gwFetch('/git/refs/heads/main');
        gatewayAvailable = res.ok;
    } catch (e) {
        gatewayAvailable = false;
    }
    document.getElementById('setupBanner').style.display = gatewayAvailable ? 'none' : 'flex';
    if (gatewayAvailable) console.log('Git Gateway OK');
    else console.error('Git Gateway non disponible');
}

// ============================================
// CHARGEMENT DONNEES
// ============================================
async function loadAllData() {
    try {
        const [pRes, cRes] = await Promise.all([
            fetch('/data/products.json'),
            fetch('/data/site-content.json')
        ]);
        productsData = await pRes.json();
        siteContent = await cRes.json();
    } catch (e) {
        console.error('Erreur chargement:', e);
    }
    renderProductsList();
    renderAppearanceForm();
    renderTextsForm();
    renderContactForm();
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
// PRODUITS — LISTE
// ============================================
function renderProductsList() {
    const list = document.getElementById('productsList');
    const items = productsData.items || [];
    items.sort((a, b) => (a.order || 0) - (b.order || 0));

    if (items.length === 0) {
        list.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-muted);">Aucun produit. Cliquez sur "+ Nouveau produit" pour commencer.</div>';
        return;
    }

    list.innerHTML = items.map((p, i) => `
        <div class="product-item">
            <div class="product-item__order-controls">
                <button class="btn-icon btn-xs" onclick="moveProduct(${i}, -1)" ${i === 0 ? 'disabled' : ''} title="Monter">&#9650;</button>
                <button class="btn-icon btn-xs" onclick="moveProduct(${i}, 1)" ${i === items.length - 1 ? 'disabled' : ''} title="Descendre">&#9660;</button>
            </div>
            <img src="${esc(p.image)}" alt="${esc(p.title)}" class="product-item__image"
                 onerror="this.style.background='var(--bg-section)';this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2264%22 height=%2264%22%3E%3Crect fill=%22%23F5EFE6%22 width=%2264%22 height=%2264%22/%3E%3Ctext x=%2232%22 y=%2236%22 text-anchor=%22middle%22 fill=%22%23C9A84C%22 font-size=%2212%22%3EPhoto%3C/text%3E%3C/svg%3E'">
            <div class="product-item__info">
                <div class="product-item__name">${esc(p.title)}</div>
                <div class="product-item__meta">
                    <span class="product-item__price">${esc(p.price)}</span>
                    <span class="product-item__badge">${esc(p.badge)}</span>
                </div>
            </div>
            <div class="product-item__actions">
                <button class="btn btn-outline btn-sm" onclick="editProduct(${i})">Modifier</button>
                <button class="btn btn-danger-outline btn-sm" onclick="confirmDelete(${i})">Supprimer</button>
            </div>
        </div>
    `).join('');
}

function editProduct(index) {
    openProductModal(index);
}

// ============================================
// PRODUITS — REORDER
// ============================================
function moveProduct(index, direction) {
    const items = productsData.items;
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= items.length) return;

    [items[index], items[newIndex]] = [items[newIndex], items[index]];

    // Recalculer les ordres
    items.forEach((item, i) => { item.order = i + 1; });

    renderProductsList();
    saveProducts();
}

// ============================================
// PRODUITS — MODALE EDITION
// ============================================
function initProductModal() {
    const modal = document.getElementById('productModal');
    document.getElementById('addProductBtn').addEventListener('click', () => openProductModal(-1));
    document.getElementById('modalClose').addEventListener('click', closeProductModal);
    document.getElementById('modalCancel').addEventListener('click', closeProductModal);
    document.getElementById('modalSave').addEventListener('click', saveProduct);
    document.getElementById('addCompositionBtn').addEventListener('click', addCompositionItem);

    document.getElementById('imageUpload').addEventListener('click', () => document.getElementById('imageInput').click());
    document.getElementById('imageInput').addEventListener('change', handleImageUpload);
    modal.addEventListener('click', e => { if (e.target === modal) closeProductModal(); });
}

function openProductModal(index) {
    editingProductIndex = index;
    pendingImageBase64 = null;
    pendingImageName = null;

    const preview = document.getElementById('imagePreview');
    const placeholder = document.getElementById('imagePlaceholder');

    if (index === -1) {
        document.getElementById('modalProductTitle').textContent = 'Nouveau produit';
        document.getElementById('editTitle').value = '';
        document.getElementById('editPrice').value = '';
        document.getElementById('editBadge').value = '';
        document.getElementById('editDelay').value = 'Délai : 2 semaines maximum';
        document.getElementById('editWhatsapp').value = '';
        preview.style.display = 'none';
        placeholder.style.display = 'flex';
        renderCompositionList([]);
    } else {
        const p = productsData.items[index];
        document.getElementById('modalProductTitle').textContent = 'Modifier : ' + p.title;
        document.getElementById('editTitle').value = p.title || '';
        document.getElementById('editPrice').value = p.price || '';
        document.getElementById('editBadge').value = p.badge || '';
        document.getElementById('editDelay').value = p.delay || '';
        document.getElementById('editWhatsapp').value = p.whatsappMessage || '';

        if (p.image) {
            preview.src = p.image;
            preview.style.display = 'block';
            placeholder.style.display = 'none';
        } else {
            preview.style.display = 'none';
            placeholder.style.display = 'flex';
        }
        renderCompositionList(p.composition || []);
    }

    document.getElementById('imageInput').value = '';
    document.getElementById('productModal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeProductModal() {
    document.getElementById('productModal').style.display = 'none';
    document.body.style.overflow = '';
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

function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
        document.getElementById('imagePreview').src = ev.target.result;
        document.getElementById('imagePreview').style.display = 'block';
        document.getElementById('imagePlaceholder').style.display = 'none';
        pendingImageBase64 = ev.target.result.split(',')[1];
        pendingImageName = 'product-' + Date.now() + '-' + file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    };
    reader.readAsDataURL(file);
}

async function saveProduct() {
    const title = document.getElementById('editTitle').value.trim();
    const price = document.getElementById('editPrice').value.trim();

    if (!title || !price) {
        alert('Le nom et le prix sont obligatoires.');
        return;
    }

    const badge = document.getElementById('editBadge').value.trim();
    const delay = document.getElementById('editDelay').value.trim();
    const whatsapp = document.getElementById('editWhatsapp').value.trim();
    const composition = Array.from(document.querySelectorAll('#compositionList .composition-item input'))
        .map(i => i.value.trim()).filter(v => v);

    showLoader();

    let imagePath = editingProductIndex >= 0 ? productsData.items[editingProductIndex].image : '';

    if (pendingImageBase64 && pendingImageName) {
        try {
            imagePath = await uploadFile('images/' + pendingImageName, pendingImageBase64);
        } catch (err) {
            hideLoader();
            showToast('Erreur upload image : ' + err.message, 'error');
            return;
        }
    }

    const product = {
        title, price, badge, delay, image: imagePath,
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

// ============================================
// PRODUITS — SUPPRESSION AVEC CONFIRMATION
// ============================================
function initDeleteModal() {
    document.getElementById('deleteCancelBtn').addEventListener('click', closeDeleteModal);
    document.getElementById('deleteConfirmBtn').addEventListener('click', executeDelete);
    document.getElementById('deleteModal').addEventListener('click', e => {
        if (e.target.id === 'deleteModal') closeDeleteModal();
    });
}

function confirmDelete(index) {
    deleteTargetIndex = index;
    const p = productsData.items[index];
    document.getElementById('deleteProductName').textContent = '"' + p.title + '" — ' + p.price;
    document.getElementById('deleteModal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeDeleteModal() {
    document.getElementById('deleteModal').style.display = 'none';
    document.body.style.overflow = '';
    deleteTargetIndex = -1;
}

async function executeDelete() {
    if (deleteTargetIndex < 0) return;
    closeDeleteModal();
    showLoader();

    productsData.items.splice(deleteTargetIndex, 1);
    productsData.items.forEach((item, i) => { item.order = i + 1; });

    const ok = await saveProducts();
    hideLoader();
    if (ok) {
        renderProductsList();
        showToast('Produit supprimé.');
    }
}

// ============================================
// APPARENCE (logos, images)
// ============================================
function renderAppearanceForm() {
    const c = siteContent;
    const headerDisplay = c.hero?.headerDisplay || 'text';
    const sidebarDisplay = c.hero?.sidebarDisplay || 'text';

    document.getElementById('appearanceForm').innerHTML = `
        <div class="form-card">
            <div class="form-card__header" onclick="toggleCard(this)">
                <h3>Logo du Header</h3>
                <span class="form-card__toggle">&#9660;</span>
            </div>
            <div class="form-card__body">
                <div class="form-group">
                    <label>Afficher dans le header</label>
                    <div class="radio-group" id="headerDisplayRadio">
                        <label class="radio-option ${headerDisplay === 'text' ? 'selected' : ''}" onclick="selectRadio(this, 'headerDisplay')">
                            <input type="radio" name="headerDisplay" value="text" ${headerDisplay === 'text' ? 'checked' : ''}>
                            Nom du site uniquement
                        </label>
                        <label class="radio-option ${headerDisplay === 'logo' ? 'selected' : ''}" onclick="selectRadio(this, 'headerDisplay')">
                            <input type="radio" name="headerDisplay" value="logo" ${headerDisplay === 'logo' ? 'checked' : ''}>
                            Logo uniquement
                        </label>
                        <label class="radio-option ${headerDisplay === 'both' ? 'selected' : ''}" onclick="selectRadio(this, 'headerDisplay')">
                            <input type="radio" name="headerDisplay" value="both" ${headerDisplay === 'both' ? 'checked' : ''}>
                            Logo + Nom
                        </label>
                    </div>
                </div>
                <div class="form-group">
                    <label>Image du logo</label>
                    <div class="image-upload image-upload--logo" id="logoUpload">
                        <img src="${esc(c.hero?.logo || '')}" alt="Logo" class="image-preview" id="logoPreview" style="display:${c.hero?.logo ? 'block' : 'none'}; object-fit:contain; padding:8px;">
                        <div class="image-placeholder" id="logoPlaceholder" style="display:${c.hero?.logo ? 'none' : 'flex'};">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="24" height="24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                            <span>Choisir un logo</span>
                        </div>
                        <input type="file" accept="image/*" id="logoInput" style="display:none;">
                    </div>
                </div>
            </div>
        </div>

        <div class="form-card">
            <div class="form-card__header" onclick="toggleCard(this)">
                <h3>Logo de la Sidebar (mobile)</h3>
                <span class="form-card__toggle">&#9660;</span>
            </div>
            <div class="form-card__body">
                <div class="form-group">
                    <label>Afficher dans la sidebar mobile</label>
                    <div class="radio-group" id="sidebarDisplayRadio">
                        <label class="radio-option ${sidebarDisplay === 'text' ? 'selected' : ''}" onclick="selectRadio(this, 'sidebarDisplay')">
                            <input type="radio" name="sidebarDisplay" value="text" ${sidebarDisplay === 'text' ? 'checked' : ''}>
                            Nom du site uniquement
                        </label>
                        <label class="radio-option ${sidebarDisplay === 'logo' ? 'selected' : ''}" onclick="selectRadio(this, 'sidebarDisplay')">
                            <input type="radio" name="sidebarDisplay" value="logo" ${sidebarDisplay === 'logo' ? 'checked' : ''}>
                            Logo uniquement
                        </label>
                        <label class="radio-option ${sidebarDisplay === 'both' ? 'selected' : ''}" onclick="selectRadio(this, 'sidebarDisplay')">
                            <input type="radio" name="sidebarDisplay" value="both" ${sidebarDisplay === 'both' ? 'checked' : ''}>
                            Logo + Nom
                        </label>
                    </div>
                </div>
            </div>
        </div>

        <div class="form-card">
            <div class="form-card__header" onclick="toggleCard(this)">
                <h3>Image de fond (Hero)</h3>
                <span class="form-card__toggle">&#9660;</span>
            </div>
            <div class="form-card__body">
                <div class="form-group">
                    <label>Image d'arrière-plan de la section d'accueil</label>
                    <div class="image-upload" id="heroImageUpload">
                        <img src="${esc(c.hero?.backgroundImage || '')}" alt="" class="image-preview" id="heroImagePreview" style="display:${c.hero?.backgroundImage ? 'block' : 'none'};">
                        <div class="image-placeholder" id="heroImagePlaceholder" style="display:${c.hero?.backgroundImage ? 'none' : 'flex'};">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="32" height="32"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                            <span>Choisir une image</span>
                            <small>Format recommandé : 1920x900px</small>
                        </div>
                        <input type="file" accept="image/*" id="heroImageInput" style="display:none;">
                    </div>
                </div>
            </div>
        </div>
    `;

    // Listeners pour upload logo
    document.getElementById('logoUpload').addEventListener('click', () => document.getElementById('logoInput').click());
    document.getElementById('logoInput').addEventListener('change', e => handleGenericImageUpload(e, 'logoPreview', 'logoPlaceholder', '_logo'));
    document.getElementById('heroImageUpload').addEventListener('click', () => document.getElementById('heroImageInput').click());
    document.getElementById('heroImageInput').addEventListener('change', e => handleGenericImageUpload(e, 'heroImagePreview', 'heroImagePlaceholder', '_hero'));

    document.getElementById('saveAppearanceBtn').addEventListener('click', saveAppearance);
}

function selectRadio(label, group) {
    label.closest('.radio-group').querySelectorAll('.radio-option').forEach(o => o.classList.remove('selected'));
    label.classList.add('selected');
    label.querySelector('input').checked = true;
}

let pendingUploads = {};

function handleGenericImageUpload(e, previewId, placeholderId, key) {
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

async function saveAppearance() {
    showLoader();

    const headerDisplay = document.querySelector('input[name="headerDisplay"]:checked')?.value || 'text';
    const sidebarDisplay = document.querySelector('input[name="sidebarDisplay"]:checked')?.value || 'text';

    let logoPath = siteContent.hero?.logo || '';
    let heroImagePath = siteContent.hero?.backgroundImage || '';

    try {
        if (pendingUploads._logo) {
            logoPath = await uploadFile('images/' + pendingUploads._logo.name, pendingUploads._logo.base64);
            delete pendingUploads._logo;
        }
        if (pendingUploads._hero) {
            heroImagePath = await uploadFile('images/' + pendingUploads._hero.name, pendingUploads._hero.base64);
            delete pendingUploads._hero;
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
        headerDisplay,
        sidebarDisplay
    };

    try {
        await saveFile('data/site-content.json', JSON.stringify(siteContent, null, 2));
        showToast('Apparence enregistrée !');
    } catch (err) {
        showToast('Erreur: ' + err.message, 'error');
    }
    hideLoader();
}

// ============================================
// TEXTES DU SITE
// ============================================
function renderTextsForm() {
    const c = siteContent;
    document.getElementById('textsForm').innerHTML = `
        ${textCard('Section Accueil', `
            ${field('txt_hero_title', 'Titre principal', c.hero?.title)}
            ${field('txt_hero_subtitle', 'Sous-titre', c.hero?.subtitle)}
            ${textarea('txt_hero_tagline', "Phrase d'accroche", c.hero?.tagline)}
            ${field('txt_hero_cta', 'Texte du bouton', c.hero?.cta)}
        `)}
        ${textCard('Section Présentation', `
            ${field('txt_pres_title', 'Titre', c.presentation?.title)}
            ${textarea('txt_pres_text', 'Texte de présentation', c.presentation?.text)}
            <div class="form-group">
                <label>3 POINTS FORTS</label>
                <div class="list-editor" id="featuresEditor">
                    ${(c.presentation?.features || []).map(f => `<div class="list-editor-item"><input type="text" value="${esc(f)}"></div>`).join('')}
                </div>
            </div>
        `)}
        ${textCard('Section Produits (en-tête)', `
            ${field('txt_prod_title', 'Titre', c.products?.title)}
            ${textarea('txt_prod_subtitle', 'Sous-titre', c.products?.subtitle)}
        `)}
        ${textCard('Section Devis', `
            ${field('txt_quote_title', 'Titre', c.quote?.title)}
            ${field('txt_quote_subtitle', 'Sous-titre', c.quote?.subtitle)}
            ${textarea('txt_quote_success', 'Message de confirmation', c.quote?.successMessage)}
        `)}
        ${textCard('Pied de page', `
            ${field('txt_footer_brand', 'Nom de la marque', c.footer?.brand)}
            ${field('txt_footer_tagline', 'Slogan', c.footer?.tagline)}
            ${field('txt_footer_copyright', 'Copyright', c.footer?.copyright)}
        `)}
    `;

    document.getElementById('saveTextsBtn').onclick = saveTexts;
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
    siteContent.products = { title: val('txt_prod_title'), subtitle: val('txt_prod_subtitle') };
    siteContent.quote = { title: val('txt_quote_title'), subtitle: val('txt_quote_subtitle'), successMessage: val('txt_quote_success') };
    siteContent.footer = { brand: val('txt_footer_brand'), tagline: val('txt_footer_tagline'), copyright: val('txt_footer_copyright') };

    try {
        await saveFile('data/site-content.json', JSON.stringify(siteContent, null, 2));
        showToast('Textes enregistrés !');
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
        ${textCard('Coordonnées', `
            ${field('ct_title', 'Titre de la section', c.title)}
            ${textarea('ct_subtitle', 'Sous-titre', c.subtitle)}
            <div class="form-row">
                ${field('ct_whatsapp', 'WhatsApp (affiché)', c.whatsapp, 'Ex: 06 52 37 55 78')}
                ${field('ct_whatsappNumber', 'WhatsApp (international)', c.whatsappNumber, 'Ex: 33652375578')}
            </div>
            <div class="form-row">
                ${field('ct_instagram', 'Instagram', c.instagram, '@perledefes.creation')}
                ${field('ct_instagramUrl', 'URL Instagram', c.instagramUrl)}
            </div>
            ${field('ct_email', 'Email', c.email)}
        `)}
        ${textCard('Informations livraison', `
            <div class="form-group">
                <label>LIGNES D'INFO LIVRAISON</label>
                <div class="list-editor" id="deliveryEditor">
                    ${(c.deliveryInfo || []).map(line => `
                        <div class="list-editor-item">
                            <input type="text" value="${esc(line)}">
                            <button class="remove-btn" onclick="this.parentElement.remove()" type="button">&times;</button>
                        </div>
                    `).join('')}
                </div>
                <button class="btn btn-outline btn-sm" onclick="addDeliveryLine()" type="button" style="margin-top:6px;">+ Ajouter une ligne</button>
            </div>
        `)}
    `;

    document.getElementById('saveContactBtn').onclick = saveContact;
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
        title: val('ct_title'), subtitle: val('ct_subtitle'),
        whatsapp: val('ct_whatsapp'), whatsappNumber: val('ct_whatsappNumber'),
        instagram: val('ct_instagram'), instagramUrl: val('ct_instagramUrl'),
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
// GIT GATEWAY — API Git Data
// Même approche que Decap CMS : blobs/trees/commits
// ============================================
const GW = '/.netlify/git/gateway/github';

async function getToken() {
    try { await netlifyIdentity.refresh(); } catch (e) { /* */ }
    return netlifyIdentity.currentUser()?.token?.access_token;
}

async function gwFetch(endpoint, options = {}) {
    const token = await getToken();
    if (!token) throw new Error('Non authentifié. Reconnectez-vous.');

    const res = await fetch(GW + endpoint, {
        ...options,
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json',
            ...(options.headers || {})
        }
    });
    return res;
}

/**
 * Sauvegarde un fichier via l'API Git Data (comme Decap CMS)
 * 1. Crée un blob avec le contenu
 * 2. Récupère le commit actuel de la branche
 * 3. Crée un nouveau tree avec le fichier modifié
 * 4. Crée un nouveau commit
 * 5. Met à jour la référence de la branche
 */
async function saveFile(path, content) {
    // 1. Créer le blob
    const blobRes = await gwFetch('/git/blobs', {
        method: 'POST',
        body: JSON.stringify({
            content: utf8ToBase64(content),
            encoding: 'base64'
        })
    });
    if (!blobRes.ok) {
        const err = await blobRes.text();
        console.error('Erreur blob:', blobRes.status, err);
        throw new Error('Erreur création blob (' + blobRes.status + ')');
    }
    const blob = await blobRes.json();

    // 2. Récupérer la ref actuelle
    const refRes = await gwFetch('/git/refs/heads/main');
    if (!refRes.ok) throw new Error('Impossible de lire la branche main (' + refRes.status + ')');
    const ref = await refRes.json();
    const latestCommitSha = ref.object.sha;

    // 3. Récupérer le tree du commit actuel
    const commitRes = await gwFetch('/git/commits/' + latestCommitSha);
    if (!commitRes.ok) throw new Error('Impossible de lire le commit');
    const commit = await commitRes.json();
    const baseTreeSha = commit.tree.sha;

    // 4. Créer un nouveau tree avec le fichier modifié
    const treeRes = await gwFetch('/git/trees', {
        method: 'POST',
        body: JSON.stringify({
            base_tree: baseTreeSha,
            tree: [{
                path: path,
                mode: '100644',
                type: 'blob',
                sha: blob.sha
            }]
        })
    });
    if (!treeRes.ok) throw new Error('Erreur création tree (' + treeRes.status + ')');
    const newTree = await treeRes.json();

    // 5. Créer le commit
    const newCommitRes = await gwFetch('/git/commits', {
        method: 'POST',
        body: JSON.stringify({
            message: 'Mise à jour ' + path.split('/').pop() + ' via admin',
            tree: newTree.sha,
            parents: [latestCommitSha]
        })
    });
    if (!newCommitRes.ok) throw new Error('Erreur création commit (' + newCommitRes.status + ')');
    const newCommit = await newCommitRes.json();

    // 6. Mettre à jour la ref
    const updateRefRes = await gwFetch('/git/refs/heads/main', {
        method: 'PATCH',
        body: JSON.stringify({ sha: newCommit.sha })
    });
    if (!updateRefRes.ok) throw new Error('Erreur mise à jour branche (' + updateRefRes.status + ')');

    return newCommit;
}

/**
 * Upload un fichier binaire (image) via la même méthode
 */
async function uploadFile(path, base64Data) {
    // 1. Créer le blob (déjà en base64)
    const blobRes = await gwFetch('/git/blobs', {
        method: 'POST',
        body: JSON.stringify({
            content: base64Data,
            encoding: 'base64'
        })
    });
    if (!blobRes.ok) throw new Error('Erreur upload blob (' + blobRes.status + ')');
    const blob = await blobRes.json();

    // 2-6. Même flow que saveFile
    const refRes = await gwFetch('/git/refs/heads/main');
    if (!refRes.ok) throw new Error('Erreur ref');
    const ref = await refRes.json();

    const commitRes = await gwFetch('/git/commits/' + ref.object.sha);
    const commit = await commitRes.json();

    const treeRes = await gwFetch('/git/trees', {
        method: 'POST',
        body: JSON.stringify({
            base_tree: commit.tree.sha,
            tree: [{ path, mode: '100644', type: 'blob', sha: blob.sha }]
        })
    });
    if (!treeRes.ok) throw new Error('Erreur tree upload');
    const newTree = await treeRes.json();

    const newCommitRes = await gwFetch('/git/commits', {
        method: 'POST',
        body: JSON.stringify({
            message: 'Upload ' + path.split('/').pop() + ' via admin',
            tree: newTree.sha,
            parents: [ref.object.sha]
        })
    });
    if (!newCommitRes.ok) throw new Error('Erreur commit upload');
    const newCommit = await newCommitRes.json();

    await gwFetch('/git/refs/heads/main', {
        method: 'PATCH',
        body: JSON.stringify({ sha: newCommit.sha })
    });

    return '/' + path;
}

// ============================================
// HELPERS
// ============================================
function utf8ToBase64(str) {
    return btoa(unescape(encodeURIComponent(str)));
}

function esc(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function val(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : '';
}

function field(id, label, value, placeholder) {
    return `<div class="form-group"><label for="${id}">${label.toUpperCase()}</label><input type="text" id="${id}" value="${esc(value || '')}" ${placeholder ? 'placeholder="' + esc(placeholder) + '"' : ''}></div>`;
}

function textarea(id, label, value) {
    return `<div class="form-group"><label for="${id}">${label.toUpperCase()}</label><textarea id="${id}">${esc(value || '')}</textarea></div>`;
}

function textCard(title, body) {
    return `<div class="form-card"><div class="form-card__header" onclick="toggleCard(this)"><h3>${title}</h3><span class="form-card__toggle">&#9660;</span></div><div class="form-card__body">${body}</div></div>`;
}

function toggleCard(header) {
    header.closest('.form-card').classList.toggle('collapsed');
}

function showToast(text, type) {
    const toast = document.getElementById('toast');
    document.getElementById('toastText').textContent = text;
    document.getElementById('toastIcon').innerHTML = type === 'error' ? '&#10007;' : '&#10003;';
    toast.className = 'toast show' + (type === 'error' ? ' toast--error' : ' toast--success');
    setTimeout(() => { toast.className = 'toast'; }, 4000);
}

function showLoader() { document.getElementById('loader').style.display = 'flex'; }
function hideLoader() { document.getElementById('loader').style.display = 'none'; }
