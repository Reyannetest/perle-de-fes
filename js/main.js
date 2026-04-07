/* ============================================
   PERLE DE FÈS — JAVASCRIPT PRINCIPAL
   Navigation • Modales • Formulaire • Animations
   Données chargées dynamiquement depuis /data/
   ============================================ */

// ============================================
// EMAILJS CONFIGURATION — À REMPLACER
// ============================================
const EMAILJS_PUBLIC_KEY = "YOUR_PUBLIC_KEY";
const EMAILJS_SERVICE_ID = "YOUR_SERVICE_ID";
const EMAILJS_TEMPLATE_ID = "YOUR_TEMPLATE_ID";

// ============================================
// DONNÉES (chargées dynamiquement)
// ============================================
let productsData = {};
let siteContent = {};

// ============================================
// CHARGEMENT DES DONNÉES
// ============================================
async function loadSiteContent() {
    try {
        const response = await fetch('/data/site-content.json');
        if (response.ok) {
            siteContent = await response.json();
            applySiteContent();
        }
    } catch (e) {
        console.warn('Contenu du site non chargé, utilisation du HTML statique.');
    }
}

async function loadProducts() {
    try {
        const response = await fetch('/data/products.json');
        if (!response.ok) return;
        const data = await response.json();
        const products = Array.isArray(data) ? data : (data.items || []);

        // Trier par ordre
        products.sort((a, b) => (a.order || 0) - (b.order || 0));

        // Générer un slug pour chaque produit
        products.forEach(p => {
            if (!p.slug) {
                p.slug = p.title
                    .toLowerCase()
                    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/^-|-$/g, '');
            }
        });

        // Convertir en objet indexé par slug
        productsData = {};
        products.forEach(p => {
            productsData[p.slug] = p;
        });

        renderProducts(products);
        initProductModals();
    } catch (e) {
        console.warn('Produits non chargés:', e);
    }
}

// ============================================
// RENDU DES PRODUITS DANS LE DOM
// ============================================
function renderProducts(products) {
    const grid = document.querySelector('.products__grid');
    if (!grid) return;

    grid.innerHTML = '';

    products.forEach(product => {
        const article = document.createElement('article');
        article.className = 'product-card animate-on-scroll';
        article.dataset.product = product.slug;

        const shortPrice = product.price.length > 20
            ? product.price.substring(0, 18) + '…'
            : product.price;

        const shortTitle = product.title.length > 25
            ? product.title.substring(0, 23) + '…'
            : product.title;

        article.innerHTML = `
            <div class="product-card__image-wrapper">
                <img
                    src="${product.image}"
                    alt="${product.title}"
                    class="product-card__image"
                    loading="lazy"
                >
                <div class="product-card__overlay">
                    <span class="product-card__overlay-title">${shortTitle}</span>
                    <span class="product-card__overlay-price">${shortPrice}</span>
                </div>
            </div>
            <div class="product-card__content">
                <span class="product-card__badge">${product.badge}</span>
                <h3 class="product-card__title">${product.title}</h3>
                <p class="product-card__price">${product.price}</p>
            </div>
        `;

        grid.appendChild(article);
    });

    // Mettre à jour aussi le select du formulaire
    updateFormProductSelect(products);

    // Réinitialiser les animations
    initScrollEffects();
}

// ============================================
// METTRE À JOUR LE SELECT DU FORMULAIRE
// ============================================
function updateFormProductSelect(products) {
    const select = document.getElementById('productType');
    if (!select) return;

    // Garder la première option "Choisir un produit" et "Autre"
    select.innerHTML = '<option value="" disabled selected>Choisir un produit</option>';
    products.forEach(p => {
        const option = document.createElement('option');
        option.value = p.title;
        option.textContent = p.title;
        select.appendChild(option);
    });
    const autreOption = document.createElement('option');
    autreOption.value = 'Autre';
    autreOption.textContent = 'Autre';
    select.appendChild(autreOption);
}

// ============================================
// APPLIQUER LE CONTENU DU SITE
// ============================================
function applySiteContent() {
    const c = siteContent;

    // Hero
    if (c.hero) {
        const heroTitle = document.querySelector('.hero__title');
        const heroSubtitle = document.querySelector('.hero__subtitle');
        const heroTagline = document.querySelector('.hero__tagline');
        const heroCta = document.querySelector('.hero__cta');
        if (heroTitle) heroTitle.textContent = c.hero.title;
        if (heroSubtitle) heroSubtitle.textContent = c.hero.subtitle;
        if (heroTagline) heroTagline.textContent = c.hero.tagline;
        if (heroCta) heroCta.textContent = c.hero.cta;

        // Image de fond hero
        if (c.hero.backgroundImage) {
            const heroSection = document.querySelector('.hero');
            if (heroSection) {
                heroSection.style.backgroundImage = `url('${c.hero.backgroundImage}')`;
            }
        }

        // Logo
        if (c.hero.logo) {
            const logoText = document.querySelector('.header__logo-text');
            if (logoText) {
                const logoImg = document.createElement('img');
                logoImg.src = c.hero.logo;
                logoImg.alt = c.hero.title;
                logoImg.className = 'header__logo-img';
                logoImg.style.height = '40px';
                logoText.parentNode.insertBefore(logoImg, logoText);
            }
        }
    }

    // Présentation
    if (c.presentation) {
        const presTitle = document.querySelector('.presentation .section__title');
        const presText = document.querySelector('.presentation__text p');
        if (presTitle) presTitle.textContent = c.presentation.title;
        if (presText) presText.textContent = c.presentation.text;
        if (c.presentation.features) {
            const featureTexts = document.querySelectorAll('.feature__text');
            c.presentation.features.forEach((text, i) => {
                if (featureTexts[i]) featureTexts[i].textContent = text;
            });
        }
    }

    // Produits header
    if (c.products) {
        const prodTitle = document.querySelector('.products .section__title');
        const prodSubtitle = document.querySelector('.products .section__subtitle');
        if (prodTitle) prodTitle.textContent = c.products.title;
        if (prodSubtitle) prodSubtitle.textContent = c.products.subtitle;
    }

    // Devis
    if (c.quote) {
        const quoteTitle = document.querySelector('.quote .section__title');
        const quoteSubtitle = document.querySelector('.quote .section__subtitle');
        const successText = document.querySelector('.quote__success-text');
        if (quoteTitle) quoteTitle.textContent = c.quote.title;
        if (quoteSubtitle) quoteSubtitle.textContent = c.quote.subtitle;
        if (successText) successText.textContent = c.quote.successMessage;
    }

    // Contact
    if (c.contact) {
        const contactTitle = document.querySelector('.contact .section__title');
        const contactSubtitle = document.querySelector('.contact .section__subtitle');
        if (contactTitle) contactTitle.textContent = c.contact.title;
        if (contactSubtitle) contactSubtitle.textContent = c.contact.subtitle;

        const whatsappCard = document.querySelector('.contact__icon--whatsapp');
        if (whatsappCard) {
            const card = whatsappCard.closest('.contact__card');
            if (card) {
                card.href = `https://wa.me/${c.contact.whatsappNumber}?text=${encodeURIComponent('Bonjour, je suis intéressée par vos créations Perle de Fès !')}`;
                const info = card.querySelector('.contact__info');
                if (info) info.textContent = c.contact.whatsapp;
            }
        }

        const instaCard = document.querySelector('.contact__icon--instagram');
        if (instaCard) {
            const card = instaCard.closest('.contact__card');
            if (card) {
                card.href = c.contact.instagramUrl;
                const info = card.querySelector('.contact__info');
                if (info) info.textContent = c.contact.instagram;
            }
        }

        const emailCard = document.querySelector('.contact__icon--email');
        if (emailCard) {
            const card = emailCard.closest('.contact__card');
            if (card) {
                card.href = `mailto:${c.contact.email}`;
                const info = card.querySelector('.contact__info');
                if (info) info.textContent = c.contact.email;
            }
        }

        if (c.contact.deliveryInfo) {
            const deliveryList = document.querySelector('.contact__delivery ul');
            if (deliveryList) {
                deliveryList.innerHTML = '';
                c.contact.deliveryInfo.forEach(item => {
                    const li = document.createElement('li');
                    li.innerHTML = item;
                    deliveryList.appendChild(li);
                });
            }
        }

        const whatsappFloat = document.querySelector('.whatsapp-float');
        if (whatsappFloat) {
            whatsappFloat.href = `https://wa.me/${c.contact.whatsappNumber}?text=${encodeURIComponent('Bonjour, je suis intéressée par vos créations Perle de Fès !')}`;
        }
    }

    // Footer
    if (c.footer) {
        const brand = document.querySelector('.footer__brand');
        const tagline = document.querySelector('.footer__tagline');
        const copy = document.querySelector('.footer__copy');
        if (brand) brand.textContent = c.footer.brand;
        if (tagline) tagline.textContent = c.footer.tagline;
        if (copy) copy.textContent = c.footer.copyright;

        if (c.contact) {
            const footerContact = document.querySelector('.footer__contact');
            if (footerContact) {
                footerContact.innerHTML = `
                    <a href="mailto:${c.contact.email}">${c.contact.email}</a>
                    <span>•</span>
                    <a href="tel:+${c.contact.whatsappNumber}">${c.contact.whatsapp}</a>
                    <span>•</span>
                    <a href="${c.contact.instagramUrl}" target="_blank" rel="noopener">Instagram : ${c.contact.instagram.replace('@', '')}</a>
                `;
            }
        }
    }

    // Logo header + sidebar
    if (c.hero && c.hero.title) {
        const logoText = document.querySelector('.header__logo-text');
        if (logoText) logoText.textContent = c.hero.title;
        const navLogo = document.querySelector('.nav__logo');
        if (navLogo) navLogo.textContent = c.hero.title;
    }
}

// ============================================
// INITIALISATION AU CHARGEMENT
// ============================================
document.addEventListener('DOMContentLoaded', async function() {
    initNavigation();
    initScrollEffects();
    initFormValidation();
    initEmailJS();

    await Promise.all([
        loadSiteContent(),
        loadProducts()
    ]);
});

// ============================================
// NAVIGATION
// ============================================
function initNavigation() {
    const header = document.getElementById('header');
    const nav = document.getElementById('nav');
    const navToggle = document.getElementById('navToggle');
    const navLinks = document.querySelectorAll('.nav__link');

    if (navToggle) {
        navToggle.addEventListener('click', function() {
            this.classList.toggle('active');
            nav.classList.toggle('active');
            document.body.style.overflow = nav.classList.contains('active') ? 'hidden' : '';
        });
    }

    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            navToggle.classList.remove('active');
            nav.classList.remove('active');
            document.body.style.overflow = '';
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
        });
    });

    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            header.classList.add('header--scrolled');
        } else {
            header.classList.remove('header--scrolled');
        }
        updateActiveNavLink();
    });
}

function updateActiveNavLink() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav__link');
    const scrollPosition = window.scrollY + 100;

    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;
        const sectionId = section.getAttribute('id');

        if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${sectionId}`) {
                    link.classList.add('active');
                }
            });
        }
    });
}

// ============================================
// EFFETS DE SCROLL
// ============================================
function initScrollEffects() {
    const animatedElements = document.querySelectorAll('.animate-on-scroll');

    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    animatedElements.forEach(element => {
        observer.observe(element);
    });
}

// ============================================
// MODALES PRODUITS
// ============================================
function initProductModals() {
    const productCards = document.querySelectorAll('.product-card');
    const modal = document.getElementById('modal');
    const modalBackdrop = modal.querySelector('.modal__backdrop');
    const modalClose = modal.querySelector('.modal__close');

    productCards.forEach(card => {
        card.addEventListener('click', function() {
            const productKey = this.dataset.product;
            openProductModal(productKey);
        });
    });

    modalClose.addEventListener('click', closeModal);
    modalBackdrop.addEventListener('click', closeModal);

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeModal();
        }
    });
}

function openProductModal(productKey) {
    const product = productsData[productKey];
    if (!product) return;

    const modal = document.getElementById('modal');
    const modalImage = document.getElementById('modalImage');
    const modalTitle = document.getElementById('modalTitle');
    const modalPrice = document.getElementById('modalPrice');
    const modalBadge = document.getElementById('modalBadge');
    const modalComposition = document.getElementById('modalComposition');
    const modalDelay = document.getElementById('modalDelay');
    const modalCta = document.getElementById('modalCta');

    modalImage.src = product.image;
    modalImage.alt = product.title;
    modalTitle.textContent = product.title;
    modalPrice.textContent = product.price;
    modalBadge.textContent = product.badge;

    const delaySpan = modalDelay.querySelector('span');
    if (delaySpan) {
        delaySpan.textContent = product.delay;
    } else {
        modalDelay.textContent = product.delay;
    }

    modalComposition.innerHTML = '';
    product.composition.forEach((item, index) => {
        const li = document.createElement('li');
        li.textContent = item;
        li.style.animationDelay = `${index * 0.05}s`;
        modalComposition.appendChild(li);
    });

    const whatsappNumber = siteContent.contact
        ? siteContent.contact.whatsappNumber
        : '33652375578';
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(product.whatsappMessage)}`;
    modalCta.href = whatsappUrl;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    const modal = document.getElementById('modal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

// ============================================
// FORMULAIRE DE DEVIS
// ============================================
function initFormValidation() {
    const form = document.getElementById('quoteForm');
    if (!form) return;

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        if (validateForm()) {
            sendEmail();
        }
    });

    const eventDateInput = document.getElementById('eventDate');
    if (eventDateInput) {
        const today = new Date().toISOString().split('T')[0];
        eventDateInput.setAttribute('min', today);
    }
}

function validateForm() {
    const form = document.getElementById('quoteForm');
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;

    requiredFields.forEach(field => {
        field.classList.remove('error');

        if (!field.value.trim()) {
            field.classList.add('error');
            isValid = false;
        }

        if (field.type === 'email' && field.value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(field.value)) {
                field.classList.add('error');
                isValid = false;
            }
        }

        if (field.type === 'tel' && field.value) {
            const phoneRegex = /^[0-9\s\-\+\(\)]{8,}$/;
            if (!phoneRegex.test(field.value)) {
                field.classList.add('error');
                isValid = false;
            }
        }
    });

    return isValid;
}

// ============================================
// EMAILJS
// ============================================
function initEmailJS() {
    if (typeof emailjs !== 'undefined' && EMAILJS_PUBLIC_KEY !== 'YOUR_PUBLIC_KEY') {
        emailjs.init(EMAILJS_PUBLIC_KEY);
    }
}

function sendEmail() {
    const form = document.getElementById('quoteForm');
    const submitButton = form.querySelector('.form__submit');

    if (EMAILJS_PUBLIC_KEY === 'YOUR_PUBLIC_KEY') {
        console.warn('EmailJS non configuré. Veuillez remplacer les clés dans main.js');
        showSuccessMessage();
        return;
    }

    submitButton.disabled = true;
    submitButton.textContent = 'Envoi en cours...';

    const templateParams = {
        from_name: document.getElementById('name').value,
        from_email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        product_type: document.getElementById('productType').value,
        quantity: document.getElementById('quantity').value,
        event_date: document.getElementById('eventDate').value,
        event_type: document.getElementById('eventType').value,
        personalization: document.getElementById('personalization').value || 'Non spécifié',
        message: document.getElementById('message').value || 'Aucun message'
    };

    emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams)
        .then(function() {
            showSuccessMessage();
        })
        .catch(function() {
            submitButton.disabled = false;
            submitButton.textContent = 'Envoyer ma demande';
            alert('Une erreur est survenue. Veuillez réessayer ou nous contacter directement par WhatsApp.');
        });
}

function showSuccessMessage() {
    const form = document.getElementById('quoteForm');
    const formSuccess = document.getElementById('formSuccess');

    form.style.display = 'none';
    formSuccess.classList.add('active');
    formSuccess.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// ============================================
// SMOOTH SCROLL
// ============================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        const targetElement = document.querySelector(targetId);

        if (targetElement) {
            const headerHeight = document.getElementById('header').offsetHeight;
            const targetPosition = targetElement.offsetTop - headerHeight;

            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// ============================================
// PRELOAD DES IMAGES
// ============================================
function preloadImages() {
    const imageUrls = Object.values(productsData).map(product => product.image);
    imageUrls.forEach(url => {
        const img = new Image();
        img.src = url;
    });
}

window.addEventListener('load', preloadImages);
