/* ============================================
   PERLE DE FES — ADMIN PANEL
   Auth + CRUD + Git Gateway
   ============================================ */

// ============================================
// STATE
// ============================================
let currentUser = null;
let productsData = { items: [] };
let siteContent = {};
let editingProductIndex = -1; // -1 = nouveau produit
let pendingImageBase64 = null;
let pendingImageName = null;

// ============================================
// INIT
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    initAuth();
    initTabs();
    initProductModal();
});

// ============================================
// AUTHENTIFICATION (Netlify Identity)
// ============================================
function initAuth() {
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');

    netlifyIdentity.on('init', user => {
        if (user) {
            currentUser = user;
            showAdmin();
        }
    });

    netlifyIdentity.on('login', user => {
        currentUser = user;
        netlifyIdentity.close();
        showAdmin();
    });

    netlifyIdentity.on('logout', () => {
        currentUser = null;
        document.getElementById('adminPanel').style.display = 'none';
        document.getElementById('loginScreen').style.display = 'flex';
    });

    loginBtn.addEventListener('click', () => {
        netlifyIdentity.open('login');
    });

    logoutBtn.addEventListener('click', () => {
        netlifyIdentity.logout();
    });

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
    try {
        const [productsRes, contentRes] = await Promise.all([
            fetch('/data/products.json'),
            fetch('/data/site-content.json')
        ]);
        productsData = await productsRes.json();
        siteContent = await contentRes.json();

        renderProductsList();
        renderTextsForm();
        renderContactForm();
    } catch (e) {
        console.error('Erreur chargement:', e);
    }
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

    list.innerHTML = items.map((p, i) => `
        <div class="product-item" data-index="${i}">
            <span class="product-item__order">${p.order || i + 1}</span>
            <img src="${p.image}" alt="${p.title}" class="product-item__image"
                 onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2280%22 height=%2280%22 fill=%22%23E8D5A3%22%3E%3Crect width=%2280%22 height=%2280%22/%3E%3C/svg%3E'">
            <div class="product-item__info">
                <div class="product-item__name">${p.title}</div>
                <div class="product-item__details">
                    <span class="product-item__price">${p.price}</span>
                    <span class="product-item__badge">${p.badge}</span>
                </div>
            </div>
            <div class="product-item__actions">
                <button class="btn btn-outline btn-sm" onclick="editProduct(${i})">Modifier</button>
                <button class="btn btn-danger btn-sm" onclick="deleteProduct(${i})">Supprimer</button>
            </div>
        </div>
    `).join('');
}

// ============================================
// PRODUITS — MODALE (AJOUT / MODIFICATION)
// ============================================
function initProductModal() {
    const modal = document.getElementById('productModal');
    const addBtn = document.getElementById('addProductBtn');
    const closeBtn = document.getElementById('modalClose');
    const cancelBtn = document.getElementById('modalCancel');
    const saveBtn = document.getElementById('modalSave');
    const addCompBtn = document.getElementById('addCompositionBtn');
    const imageUpload = document.getElementById('imageUpload');
    const imageInput = document.getElementById('imageInput');

    addBtn.addEventListener('click', () => openProductModal(-1));
    closeBtn.addEventListener('click', closeProductModal);
    cancelBtn.addEventListener('click', closeProductModal);
    saveBtn.addEventListener('click', saveProduct);
    addCompBtn.addEventListener('click', addCompositionItem);

    imageUpload.addEventListener('click', () => imageInput.click());
    imageInput.addEventListener('change', handleImageUpload);

    // Fermer en cliquant sur le fond
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeProductModal();
    });
}

function openProductModal(index) {
    editingProductIndex = index;
    pendingImageBase64 = null;
    pendingImageName = null;

    const modal = document.getElementById('productModal');
    const title = document.getElementById('modalProductTitle');
    const preview = document.getElementById('imagePreview');
    const placeholder = document.getElementById('imagePlaceholder');

    if (index === -1) {
        title.textContent = 'Ajouter un produit';
        document.getElementById('editTitle').value = '';
        document.getElementById('editPrice').value = '';
        document.getElementById('editBadge').value = '';
        document.getElementById('editDelay').value = 'Délai : 2 semaines maximum';
        document.getElementById('editOrder').value = (productsData.items || []).length + 1;
        document.getElementById('editWhatsapp').value = '';
        preview.style.display = 'none';
        placeholder.style.display = 'flex';
        renderCompositionList([]);
    } else {
        const p = productsData.items[index];
        title.textContent = 'Modifier : ' + p.title;
        document.getElementById('editTitle').value = p.title || '';
        document.getElementById('editPrice').value = p.price || '';
        document.getElementById('editBadge').value = p.badge || '';
        document.getElementById('editDelay').value = p.delay || '';
        document.getElementById('editOrder').value = p.order || index + 1;
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

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeProductModal() {
    document.getElementById('productModal').style.display = 'none';
    document.body.style.overflow = '';
}

function renderCompositionList(items) {
    const container = document.getElementById('compositionList');
    container.innerHTML = items.map((item, i) => `
        <div class="composition-item">
            <input type="text" value="${escapeHtml(item)}" data-comp-index="${i}">
            <button class="composition-remove" onclick="removeCompositionItem(${i})">&times;</button>
        </div>
    `).join('');
}

function addCompositionItem() {
    const container = document.getElementById('compositionList');
    const div = document.createElement('div');
    div.className = 'composition-item';
    div.innerHTML = `
        <input type="text" value="" placeholder="Nouvel élément...">
        <button class="composition-remove" onclick="this.parentElement.remove()">&times;</button>
    `;
    container.appendChild(div);
    div.querySelector('input').focus();
}

function removeCompositionItem(index) {
    const items = document.querySelectorAll('#compositionList .composition-item');
    if (items[index]) items[index].remove();
}

function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const preview = document.getElementById('imagePreview');
    const placeholder = document.getElementById('imagePlaceholder');

    // Afficher le preview
    const reader = new FileReader();
    reader.onload = (ev) => {
        preview.src = ev.target.result;
        preview.style.display = 'block';
        placeholder.style.display = 'none';

        // Stocker le base64 pour l'upload
        pendingImageBase64 = ev.target.result.split(',')[1];
        pendingImageName = 'product-' + Date.now() + '-' + file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    };
    reader.readAsDataURL(file);
}

async function saveProduct() {
    const title = document.getElementById('editTitle').value.trim();
    const price = document.getElementById('editPrice').value.trim();
    const badge = document.getElementById('editBadge').value.trim();
    const delay = document.getElementById('editDelay').value.trim();
    const order = parseInt(document.getElementById('editOrder').value) || 1;
    const whatsappMessage = document.getElementById('editWhatsapp').value.trim();

    if (!title || !price) {
        alert('Le nom et le prix sont obligatoires.');
        return;
    }

    // Récupérer la composition
    const compInputs = document.querySelectorAll('#compositionList .composition-item input');
    const composition = Array.from(compInputs).map(i => i.value.trim()).filter(v => v);

    showLoader();

    let imagePath = '';

    // Upload image si nouvelle
    if (pendingImageBase64 && pendingImageName) {
        try {
            imagePath = await uploadImage(pendingImageName, pendingImageBase64);
        } catch (err) {
            hideLoader();
            alert('Erreur lors de l\'upload de l\'image: ' + err.message);
            return;
        }
    }

    // Construire l'objet produit
    const product = {
        title,
        price,
        badge,
        delay,
        image: imagePath || (editingProductIndex >= 0 ? productsData.items[editingProductIndex].image : ''),
        order,
        composition,
        whatsappMessage: whatsappMessage || `Bonjour, je suis intéressée par ${title}.`
    };

    if (editingProductIndex === -1) {
        productsData.items.push(product);
    } else {
        productsData.items[editingProductIndex] = product;
    }

    try {
        await saveFile('data/products.json', JSON.stringify(productsData, null, 2));
        closeProductModal();
        renderProductsList();
        showToast('Produit enregistré !');
    } catch (err) {
        alert('Erreur lors de l\'enregistrement: ' + err.message);
    }

    hideLoader();
}

function deleteProduct(index) {
    const p = productsData.items[index];
    if (!confirm(`Supprimer "${p.title}" ?`)) return;

    productsData.items.splice(index, 1);

    showLoader();
    saveFile('data/products.json', JSON.stringify(productsData, null, 2))
        .then(() => {
            renderProductsList();
            showToast('Produit supprimé.');
            hideLoader();
        })
        .catch(err => {
            alert('Erreur: ' + err.message);
            hideLoader();
        });
}

// ============================================
// TEXTES DU SITE
// ============================================
function renderTextsForm() {
    const container = document.getElementById('textsForm');
    const c = siteContent;

    container.innerHTML = `
        <div class="form-card">
            <div class="form-card__header" onclick="toggleCard(this)">
                <h3>Section Accueil</h3>
                <span class="form-card__toggle">&#9660;</span>
            </div>
            <div class="form-card__body">
                <div class="form-group">
                    <label>Titre principal</label>
                    <input type="text" id="txt_hero_title" value="${escapeHtml(c.hero?.title || '')}">
                </div>
                <div class="form-group">
                    <label>Sous-titre</label>
                    <input type="text" id="txt_hero_subtitle" value="${escapeHtml(c.hero?.subtitle || '')}">
                </div>
                <div class="form-group">
                    <label>Phrase d'accroche</label>
                    <textarea id="txt_hero_tagline">${escapeHtml(c.hero?.tagline || '')}</textarea>
                </div>
                <div class="form-group">
                    <label>Texte du bouton</label>
                    <input type="text" id="txt_hero_cta" value="${escapeHtml(c.hero?.cta || '')}">
                </div>
            </div>
        </div>

        <div class="form-card">
            <div class="form-card__header" onclick="toggleCard(this)">
                <h3>Section Présentation</h3>
                <span class="form-card__toggle">&#9660;</span>
            </div>
            <div class="form-card__body">
                <div class="form-group">
                    <label>Titre</label>
                    <input type="text" id="txt_pres_title" value="${escapeHtml(c.presentation?.title || '')}">
                </div>
                <div class="form-group">
                    <label>Texte de présentation</label>
                    <textarea id="txt_pres_text">${escapeHtml(c.presentation?.text || '')}</textarea>
                </div>
                <div class="form-group">
                    <label>3 points forts</label>
                    <div class="list-editor" id="featuresEditor">
                        ${(c.presentation?.features || []).map((f, i) => `
                            <div class="list-editor-item">
                                <input type="text" value="${escapeHtml(f)}" data-feature="${i}">
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>

        <div class="form-card">
            <div class="form-card__header" onclick="toggleCard(this)">
                <h3>Section Produits (en-tête)</h3>
                <span class="form-card__toggle">&#9660;</span>
            </div>
            <div class="form-card__body">
                <div class="form-group">
                    <label>Titre</label>
                    <input type="text" id="txt_prod_title" value="${escapeHtml(c.products?.title || '')}">
                </div>
                <div class="form-group">
                    <label>Sous-titre</label>
                    <textarea id="txt_prod_subtitle">${escapeHtml(c.products?.subtitle || '')}</textarea>
                </div>
            </div>
        </div>

        <div class="form-card">
            <div class="form-card__header" onclick="toggleCard(this)">
                <h3>Section Devis</h3>
                <span class="form-card__toggle">&#9660;</span>
            </div>
            <div class="form-card__body">
                <div class="form-group">
                    <label>Titre</label>
                    <input type="text" id="txt_quote_title" value="${escapeHtml(c.quote?.title || '')}">
                </div>
                <div class="form-group">
                    <label>Sous-titre</label>
                    <input type="text" id="txt_quote_subtitle" value="${escapeHtml(c.quote?.subtitle || '')}">
                </div>
                <div class="form-group">
                    <label>Message de confirmation</label>
                    <textarea id="txt_quote_success">${escapeHtml(c.quote?.successMessage || '')}</textarea>
                </div>
            </div>
        </div>

        <div class="form-card">
            <div class="form-card__header" onclick="toggleCard(this)">
                <h3>Pied de page</h3>
                <span class="form-card__toggle">&#9660;</span>
            </div>
            <div class="form-card__body">
                <div class="form-group">
                    <label>Nom de la marque</label>
                    <input type="text" id="txt_footer_brand" value="${escapeHtml(c.footer?.brand || '')}">
                </div>
                <div class="form-group">
                    <label>Slogan</label>
                    <input type="text" id="txt_footer_tagline" value="${escapeHtml(c.footer?.tagline || '')}">
                </div>
                <div class="form-group">
                    <label>Copyright</label>
                    <input type="text" id="txt_footer_copyright" value="${escapeHtml(c.footer?.copyright || '')}">
                </div>
            </div>
        </div>
    `;

    document.getElementById('saveTextsBtn').addEventListener('click', saveTexts);
}

async function saveTexts() {
    showLoader();

    siteContent.hero = {
        ...siteContent.hero,
        title: document.getElementById('txt_hero_title').value,
        subtitle: document.getElementById('txt_hero_subtitle').value,
        tagline: document.getElementById('txt_hero_tagline').value,
        cta: document.getElementById('txt_hero_cta').value
    };

    siteContent.presentation = {
        ...siteContent.presentation,
        title: document.getElementById('txt_pres_title').value,
        text: document.getElementById('txt_pres_text').value,
        features: Array.from(document.querySelectorAll('#featuresEditor input')).map(i => i.value.trim()).filter(v => v)
    };

    siteContent.products = {
        title: document.getElementById('txt_prod_title').value,
        subtitle: document.getElementById('txt_prod_subtitle').value
    };

    siteContent.quote = {
        title: document.getElementById('txt_quote_title').value,
        subtitle: document.getElementById('txt_quote_subtitle').value,
        successMessage: document.getElementById('txt_quote_success').value
    };

    siteContent.footer = {
        brand: document.getElementById('txt_footer_brand').value,
        tagline: document.getElementById('txt_footer_tagline').value,
        copyright: document.getElementById('txt_footer_copyright').value
    };

    try {
        await saveFile('data/site-content.json', JSON.stringify(siteContent, null, 2));
        showToast('Textes enregistrés !');
    } catch (err) {
        alert('Erreur: ' + err.message);
    }

    hideLoader();
}

// ============================================
// CONTACT & INFOS
// ============================================
function renderContactForm() {
    const container = document.getElementById('contactForm');
    const c = siteContent.contact || {};

    container.innerHTML = `
        <div class="form-card">
            <div class="form-card__header" onclick="toggleCard(this)">
                <h3>Coordonnées</h3>
                <span class="form-card__toggle">&#9660;</span>
            </div>
            <div class="form-card__body">
                <div class="form-group">
                    <label>Titre de la section</label>
                    <input type="text" id="ct_title" value="${escapeHtml(c.title || '')}">
                </div>
                <div class="form-group">
                    <label>Sous-titre</label>
                    <textarea id="ct_subtitle">${escapeHtml(c.subtitle || '')}</textarea>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>WhatsApp (affiché)</label>
                        <input type="text" id="ct_whatsapp" value="${escapeHtml(c.whatsapp || '')}" placeholder="06 52 37 55 78">
                    </div>
                    <div class="form-group">
                        <label>WhatsApp (international, sans +)</label>
                        <input type="text" id="ct_whatsappNumber" value="${escapeHtml(c.whatsappNumber || '')}" placeholder="33652375578">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Instagram</label>
                        <input type="text" id="ct_instagram" value="${escapeHtml(c.instagram || '')}" placeholder="@perledefes.creation">
                    </div>
                    <div class="form-group">
                        <label>URL Instagram</label>
                        <input type="text" id="ct_instagramUrl" value="${escapeHtml(c.instagramUrl || '')}">
                    </div>
                </div>
                <div class="form-group">
                    <label>Email</label>
                    <input type="text" id="ct_email" value="${escapeHtml(c.email || '')}">
                </div>
            </div>
        </div>

        <div class="form-card">
            <div class="form-card__header" onclick="toggleCard(this)">
                <h3>Informations livraison</h3>
                <span class="form-card__toggle">&#9660;</span>
            </div>
            <div class="form-card__body">
                <div class="form-group">
                    <label>Lignes d'info livraison</label>
                    <div class="list-editor" id="deliveryEditor">
                        ${(c.deliveryInfo || []).map((line, i) => `
                            <div class="list-editor-item">
                                <input type="text" value="${escapeHtml(line)}">
                                <button class="composition-remove" onclick="this.parentElement.remove()">&times;</button>
                            </div>
                        `).join('')}
                    </div>
                    <button class="btn btn-outline btn-sm" onclick="addDeliveryLine()" style="margin-top:8px;">+ Ajouter une ligne</button>
                </div>
            </div>
        </div>
    `;

    document.getElementById('saveContactBtn').addEventListener('click', saveContact);
}

function addDeliveryLine() {
    const editor = document.getElementById('deliveryEditor');
    const div = document.createElement('div');
    div.className = 'list-editor-item';
    div.innerHTML = `
        <input type="text" value="" placeholder="Nouvelle ligne...">
        <button class="composition-remove" onclick="this.parentElement.remove()">&times;</button>
    `;
    editor.appendChild(div);
    div.querySelector('input').focus();
}

async function saveContact() {
    showLoader();

    siteContent.contact = {
        title: document.getElementById('ct_title').value,
        subtitle: document.getElementById('ct_subtitle').value,
        whatsapp: document.getElementById('ct_whatsapp').value,
        whatsappNumber: document.getElementById('ct_whatsappNumber').value,
        instagram: document.getElementById('ct_instagram').value,
        instagramUrl: document.getElementById('ct_instagramUrl').value,
        email: document.getElementById('ct_email').value,
        deliveryInfo: Array.from(document.querySelectorAll('#deliveryEditor input')).map(i => i.value.trim()).filter(v => v)
    };

    try {
        await saveFile('data/site-content.json', JSON.stringify(siteContent, null, 2));
        showToast('Contact enregistré !');
    } catch (err) {
        alert('Erreur: ' + err.message);
    }

    hideLoader();
}

// ============================================
// GIT GATEWAY API
// ============================================
function getGatewayUrl() {
    return '/.netlify/git/gateway';
}

async function getToken() {
    // Rafraichir le token si besoin
    await netlifyIdentity.refresh();
    const user = netlifyIdentity.currentUser();
    return user?.token?.access_token;
}

async function getFileSHA(path) {
    const token = await getToken();
    const res = await fetch(`${getGatewayUrl()}/github/contents/${path}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.sha;
}

async function saveFile(path, content) {
    const token = await getToken();
    const sha = await getFileSHA(path);

    const body = {
        message: `Mise à jour ${path} via admin`,
        content: btoa(unescape(encodeURIComponent(content))),
        branch: 'main'
    };

    if (sha) body.sha = sha;

    const res = await fetch(`${getGatewayUrl()}/github/contents/${path}`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(err);
    }

    return res.json();
}

async function uploadImage(filename, base64Data) {
    const path = `images/${filename}`;
    const token = await getToken();

    const body = {
        message: `Upload image ${filename} via admin`,
        content: base64Data,
        branch: 'main'
    };

    const res = await fetch(`${getGatewayUrl()}/github/contents/${path}`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(err);
    }

    return '/' + path;
}

// ============================================
// UI HELPERS
// ============================================
function toggleCard(header) {
    header.closest('.form-card').classList.toggle('collapsed');
}

function showToast(text) {
    const toast = document.getElementById('toast');
    document.getElementById('toastText').textContent = text;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

function showLoader() {
    document.getElementById('loader').style.display = 'flex';
}

function hideLoader() {
    document.getElementById('loader').style.display = 'none';
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
