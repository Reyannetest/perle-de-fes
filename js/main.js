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
// UTILITAIRES DE SÉCURITÉ
// ============================================
function isValidUrl(string) {
    try {
        const url = new URL(string);
        return ['http:', 'https:', 'mailto:', 'tel:'].includes(url.protocol);
    } catch (_) {
        return false;
    }
}

function sanitizeUrl(url) {
    if (!url) return '#';
    if (url.startsWith('mailto:') || url.startsWith('tel:') || url.startsWith('https://') || url.startsWith('http://')) {
        return url;
    }
    if (url.startsWith('/')) return url;
    return '#';
}

// ============================================
// DONNÉES (chargées dynamiquement)
// ============================================
let productsData = {};
let siteContent = {};
let siteDesign = {};

// ============================================
// CHARGEMENT DES DONNÉES
// ============================================
async function loadSiteContent() {
    try {
        const response = await fetch('/data/site-content.json');
        if (!response.ok) {
            throw new Error('HTTP ' + response.status);
        }
        siteContent = await response.json();
        applySiteContent();
    } catch (e) {
        console.warn('Contenu du site non chargé:', e.message, '— utilisation du HTML statique.');
    }
}

async function loadSiteDesign() {
    try {
        const response = await fetch('/data/site-design.json');
        if (response.ok) {
            siteDesign = await response.json();
            applyTextureSettings();
        }
    } catch (e) {
        console.warn('Design du site non chargé, utilisation des valeurs par défaut.');
    }
}

function applyTextureSettings() {
    const tex = siteDesign.textures || {};

    // Appliquer les réglages de textures pour chaque section
    const sections = ['hero', 'presentation', 'products', 'events', 'testimonials', 'quote', 'contact'];

    sections.forEach(section => {
        const sectionEl = document.querySelector(`.${section}`);
        if (sectionEl && tex[section]) {
            if (tex[section].enabled === false) {
                sectionEl.style.setProperty('--texture-opacity', '0');
            } else {
                sectionEl.style.setProperty('--texture-opacity', tex[section].opacity || 0.25);
            }
        }
    });
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
let cardSlideshowIntervals = [];

function renderProducts(products) {
    const grid = document.querySelector('.products__grid');
    if (!grid) return;

    // Arrêter les slideshows existants
    cardSlideshowIntervals.forEach(interval => clearInterval(interval));
    cardSlideshowIntervals = [];

    grid.innerHTML = '';

    products.forEach((product, productIndex) => {
        const article = document.createElement('article');
        article.className = 'product-card animate-on-scroll';
        article.dataset.product = product.slug;

        const shortPrice = product.price.length > 20
            ? product.price.substring(0, 18) + '…'
            : product.price;

        const shortTitle = product.title.length > 25
            ? product.title.substring(0, 23) + '…'
            : product.title;

        // Utiliser toutes les images disponibles
        const images = product.images && product.images.length > 0 ? product.images : [product.image];
        const imagesHtml = images.map((img, i) => `
            <img
                src="${img}"
                alt="${product.title}"
                class="product-card__image ${i === 0 ? 'active' : ''}"
                loading="lazy"
                data-index="${i}"
            >
        `).join('');

        article.innerHTML = `
            <span class="product-card__badge">${product.badge}</span>
            <div class="product-card__image-wrapper" data-card-index="${productIndex}">
                ${imagesHtml}
            </div>
            <div class="product-card__content">
                <h3 class="product-card__title">${product.title}</h3>
                <p class="product-card__price">${product.price}</p>
            </div>
        `;

        grid.appendChild(article);

        // Démarrer le slideshow si plusieurs images
        if (images.length > 1) {
            startCardSlideshow(article, images.length);
        }
    });

    // Mettre à jour aussi le select du formulaire
    updateFormProductSelect(products);

    // Réinitialiser les animations
    initScrollEffects();
}

// Défilement automatique pour les cartes produits
function startCardSlideshow(card, totalImages) {
    let currentIndex = 0;
    const wrapper = card.querySelector('.product-card__image-wrapper');

    const interval = setInterval(() => {
        const images = wrapper.querySelectorAll('.product-card__image');
        images.forEach(img => img.classList.remove('active'));

        currentIndex = (currentIndex + 1) % totalImages;
        images[currentIndex].classList.add('active');
    }, 2000);

    cardSlideshowIntervals.push(interval);
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

        // Header display (text, logo, both)
        const headerDisplay = c.hero.headerDisplay || 'text';
        const logoText = document.querySelector('.header__logo-text');
        if (logoText && c.hero.logo) {
            if (headerDisplay === 'logo' || headerDisplay === 'both') {
                // Ajouter le logo si pas déjà present
                if (!document.querySelector('.header__logo-img')) {
                    const logoImg = document.createElement('img');
                    logoImg.src = c.hero.logo;
                    logoImg.alt = c.hero.title;
                    logoImg.className = 'header__logo-img';
                    logoImg.style.height = '40px';
                    logoText.parentNode.insertBefore(logoImg, logoText);
                }
            }
            if (headerDisplay === 'logo') {
                logoText.style.display = 'none';
            }
        }

        // Sidebar display (text, logo, both)
        // Logo dans la sidebar mobile
        const navLogo = document.querySelector('.nav__logo-img');
        if (navLogo && c.hero.logo) {
            navLogo.src = c.hero.logo;
            navLogo.alt = c.hero.title;
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
                    li.textContent = item;
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
                footerContact.textContent = '';

                const emailLink = document.createElement('a');
                emailLink.href = 'mailto:' + c.contact.email;
                emailLink.textContent = c.contact.email;

                const sep1 = document.createElement('span');
                sep1.textContent = '•';

                const phoneLink = document.createElement('a');
                phoneLink.href = 'tel:+' + c.contact.whatsappNumber;
                phoneLink.textContent = c.contact.whatsapp;

                const sep2 = document.createElement('span');
                sep2.textContent = '•';

                const instaLink = document.createElement('a');
                instaLink.href = c.contact.instagramUrl;
                instaLink.target = '_blank';
                instaLink.rel = 'noopener noreferrer';
                instaLink.textContent = 'Instagram : ' + c.contact.instagram.replace('@', '');

                footerContact.appendChild(emailLink);
                footerContact.appendChild(sep1);
                footerContact.appendChild(phoneLink);
                footerContact.appendChild(sep2);
                footerContact.appendChild(instaLink);
            }
        }
    }

    // Logo header text (si pas géré par headerDisplay)
    if (c.hero && c.hero.title) {
        const headerDisplay = c.hero.headerDisplay || 'text';
        if (headerDisplay !== 'logo') {
            const logoText = document.querySelector('.header__logo-text');
            if (logoText) logoText.textContent = c.hero.title;
        }
    }

    // Événements
    if (c.events) {
        const eventsTitle = document.querySelector('.events .section__title');
        const eventsSubtitle = document.querySelector('.events .section__subtitle');
        if (eventsTitle) eventsTitle.textContent = c.events.title;
        if (eventsSubtitle) eventsSubtitle.textContent = c.events.subtitle;

        if (c.events.cards) {
            const eventCards = document.querySelectorAll('.events__card');
            c.events.cards.forEach((event, i) => {
                if (eventCards[i]) {
                    const title = eventCards[i].querySelector('.events__card-title');
                    const desc = eventCards[i].querySelector('.events__card-desc');
                    if (title) title.textContent = event.title;
                    if (desc) desc.textContent = event.description;
                }
            });
        }
    }

    // Témoignages
    if (c.testimonials) {
        const testTitle = document.querySelector('.testimonials .section__title');
        const testSubtitle = document.querySelector('.testimonials .section__subtitle');
        if (testTitle) testTitle.textContent = c.testimonials.title;
        if (testSubtitle) testSubtitle.textContent = c.testimonials.subtitle;

        if (c.testimonials.items) {
            const testimonialCards = document.querySelectorAll('.testimonial__card');
            c.testimonials.items.forEach((item, i) => {
                if (testimonialCards[i]) {
                    const text = testimonialCards[i].querySelector('.testimonial__text');
                    const author = testimonialCards[i].querySelector('.testimonial__author');
                    if (text) {
                        text.textContent = item.text;
                    }
                    if (author) author.textContent = '— ' + item.author;
                }
            });
        }
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
    initGoldenParticles();
    initCounterAnimation();
    initCustomCursor();

    await Promise.all([
        loadSiteContent(),
        loadSiteDesign(),
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
            const isOpen = nav.classList.contains('active');
            document.body.style.overflow = isOpen ? 'hidden' : '';
            document.body.classList.toggle('nav-open', isOpen);
        });
    }

    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            navToggle.classList.remove('active');
            nav.classList.remove('active');
            document.body.style.overflow = '';
            document.body.classList.remove('nav-open');
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

    // Carousel navigation
    const prevBtn = document.getElementById('modalPrev');
    const nextBtn = document.getElementById('modalNext');
    if (prevBtn) prevBtn.addEventListener('click', () => goToCarouselSlide(currentCarouselIndex - 1, true));
    if (nextBtn) nextBtn.addEventListener('click', () => goToCarouselSlide(currentCarouselIndex + 1, true));

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeModal();
        }
        if (e.key === 'ArrowLeft' && modal.classList.contains('active')) {
            goToCarouselSlide(currentCarouselIndex - 1);
        }
        if (e.key === 'ArrowRight' && modal.classList.contains('active')) {
            goToCarouselSlide(currentCarouselIndex + 1);
        }
    });
}

let currentCarouselIndex = 0;
let currentCarouselImages = [];
let carouselAutoSlideInterval = null;

// Démarrer le défilement automatique
function startCarouselAutoSlide() {
    stopCarouselAutoSlide();
    if (currentCarouselImages.length > 1) {
        carouselAutoSlideInterval = setInterval(() => {
            goToCarouselSlide(currentCarouselIndex + 1);
        }, 2000); // 2 secondes
    }
}

// Arrêter le défilement automatique
function stopCarouselAutoSlide() {
    if (carouselAutoSlideInterval) {
        clearInterval(carouselAutoSlideInterval);
        carouselAutoSlideInterval = null;
    }
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
    const carouselNav = document.getElementById('modalCarouselNav');
    const dotsContainer = document.getElementById('modalDots');

    // Carousel setup
    currentCarouselImages = product.images && product.images.length > 1
        ? product.images
        : [product.image];
    currentCarouselIndex = 0;

    modalImage.src = currentCarouselImages[0];
    modalImage.alt = product.title;
    modalTitle.textContent = product.title;
    modalPrice.textContent = product.price;
    modalBadge.textContent = product.badge;

    // Show/hide carousel nav
    if (currentCarouselImages.length > 1) {
        carouselNav.classList.remove('hidden');
        dotsContainer.innerHTML = '';
        currentCarouselImages.forEach((_, i) => {
            const dot = document.createElement('button');
            dot.className = 'modal__carousel-dot' + (i === 0 ? ' active' : '');
            dot.setAttribute('aria-label', `Image ${i + 1}`);
            dot.addEventListener('click', () => goToCarouselSlide(i, true));
            dotsContainer.appendChild(dot);
        });
    } else {
        carouselNav.classList.add('hidden');
    }

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
    document.body.classList.add('modal-open');

    // Démarrer le défilement automatique
    startCarouselAutoSlide();
}

function goToCarouselSlide(index, resetTimer = false) {
    if (index < 0) index = currentCarouselImages.length - 1;
    if (index >= currentCarouselImages.length) index = 0;
    currentCarouselIndex = index;

    const modalImage = document.getElementById('modalImage');
    modalImage.style.opacity = '0';
    setTimeout(() => {
        modalImage.src = currentCarouselImages[index];
        modalImage.style.opacity = '1';
    }, 200);

    const dots = document.querySelectorAll('.modal__carousel-dot');
    dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === index);
    });

    // Redémarrer le timer si interaction manuelle
    if (resetTimer) {
        startCarouselAutoSlide();
    }
}

function closeModal() {
    const modal = document.getElementById('modal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
    document.body.classList.remove('modal-open');

    // Arrêter le défilement automatique
    stopCarouselAutoSlide();
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
// GOLDEN PARTICLES ON HERO
// ============================================
function initGoldenParticles() {
    const container = document.getElementById('heroParticles');
    if (!container) return;

    for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.className = 'hero__particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDuration = (6 + Math.random() * 8) + 's';
        particle.style.animationDelay = Math.random() * 10 + 's';
        container.appendChild(particle);
    }
}

// ============================================
// COUNTER ANIMATION (chiffres section)
// ============================================
function initCounterAnimation() {
    const counters = document.querySelectorAll('.chiffres__value[data-target]');
    if (!counters.length) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                const target = parseInt(el.dataset.target);
                animateCounter(el, target);
                observer.unobserve(el);
            }
        });
    }, { threshold: 0.5 });

    counters.forEach(counter => observer.observe(counter));
}

function animateCounter(element, target) {
    let current = 0;
    const duration = 2000;
    const stepTime = 20;
    const steps = duration / stepTime;
    const increment = target / steps;

    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        element.textContent = Math.floor(current);
    }, stepTime);
}

// ============================================
// CUSTOM CURSOR (bonus)
// ============================================
function initCustomCursor() {
    const cursor = document.getElementById('customCursor');
    if (!cursor || window.matchMedia('(max-width: 768px)').matches || window.matchMedia('(pointer: coarse)').matches) return;

    document.body.classList.add('custom-cursor-active');

    document.addEventListener('mousemove', (e) => {
        cursor.style.left = e.clientX + 'px';
        cursor.style.top = e.clientY + 'px';
        if (!cursor.classList.contains('visible')) {
            cursor.classList.add('visible');
        }
    });

    document.addEventListener('mouseleave', () => {
        cursor.classList.remove('visible');
    });

    document.addEventListener('mouseenter', () => {
        cursor.classList.add('visible');
    });
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
    // Ne précharger que si des produits sont chargés
    if (!Object.keys(productsData).length) return;

    const imageUrls = Object.values(productsData).flatMap(product => {
        const urls = [];
        if (product.image) urls.push(product.image);
        if (product.images && Array.isArray(product.images)) {
            urls.push(...product.images);
        }
        return urls;
    });

    imageUrls.forEach(url => {
        if (url) {
            const img = new Image();
            img.src = url;
        }
    });
}

// Précharger les images après le chargement complet
window.addEventListener('load', () => {
    // Délayer le preload pour ne pas bloquer le rendu initial
    setTimeout(preloadImages, 1000);
});
