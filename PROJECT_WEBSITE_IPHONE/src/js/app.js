// iSTORE - Main Application Logic, Router, and Rendering Engine

class App {
  constructor() {
    this.currentUser = null;
    this.cart = []; // Array of { productId, quantity }
    this.activeFilters = {
      series: [],
      conditions: [],
      grades: [],
      storages: [],
      colors: [],
      minPrice: '',
      maxPrice: '',
      bhMin: '',
      search: ''
    };
    this.sortBy = 'default';
    this.activeAdminTab = 'dashboard';

    this.init();
  }

  init() {
    // Load auth state from database
    this.currentUser = window.db.getCurrentUser();

    // Load cart from LocalStorage
    const storedCart = localStorage.getItem('istore_cart');
    if (storedCart) {
      this.cart = JSON.parse(storedCart);
    }

    // Initialize Theme
    this.initTheme();

    // Event Listeners
    window.addEventListener('hashchange', () => this.handleRouting());
    window.addEventListener('load', () => this.handleRouting());

    // Theme toggle button
    document.getElementById('theme-toggle').addEventListener('click', () => this.toggleTheme());

    // Search input
    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', (e) => {
      this.activeFilters.search = e.target.value;
      if (window.location.hash.startsWith('#catalog')) {
        this.renderCatalog();
      } else {
        // If not on catalog page, hit enter/typing takes you to catalog
        searchInput.addEventListener('keypress', (keypressEvent) => {
          if (keypressEvent.key === 'Enter') {
            window.location.hash = `#catalog?search=${encodeURIComponent(e.target.value)}`;
          }
        });
      }
    });

    // Close modal when clicking overlay
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          overlay.classList.remove('active');
        }
      });
    });

    // Form Submissions
    document.getElementById('login-form').addEventListener('submit', (e) => this.handleLogin(e));
    document.getElementById('register-form').addEventListener('submit', (e) => this.handleRegister(e));
    document.getElementById('reset-form').addEventListener('submit', (e) => this.handleResetPassword(e));
    document.getElementById('admin-product-form').addEventListener('submit', (e) => this.handleProductSave(e));

    // Initial render of UI elements
    this.updateNavbarUserMenu();
    this.updateCartCount();
  }

  // --- ROUTING ENGINE ---
  handleRouting() {
    const hashStr = window.location.hash || '#home';
    const cleanHash = hashStr.split('?')[0];
    const queryParams = this.parseQueryParams(hashStr);

    // Apply URL search query if exists
    if (queryParams.search) {
      this.activeFilters.search = decodeURIComponent(queryParams.search);
      document.getElementById('search-input').value = this.activeFilters.search;
    }
    if (queryParams.kondisi) {
      this.activeFilters.conditions = [queryParams.kondisi];
    }
    if (queryParams.grade) {
      this.activeFilters.grades = [queryParams.grade];
    }

    const viewport = document.getElementById('app-viewport');

    // Fade out viewport, swap content, fade back in
    viewport.style.opacity = 0;
    setTimeout(() => {
      if (cleanHash === '#home') {
        this.renderHome();
      } else if (cleanHash === '#catalog') {
        this.renderCatalog();
      } else if (cleanHash.startsWith('#product/')) {
        const id = cleanHash.split('/')[1];
        this.renderProductDetail(id);
      } else if (cleanHash === '#cart') {
        this.renderCart();
      } else if (cleanHash === '#checkout') {
        this.renderCheckout();
      } else if (cleanHash === '#profile') {
        this.renderProfile();
      } else if (cleanHash === '#admin') {
        this.renderAdmin();
      } else if (cleanHash === '#about') {
        this.renderAbout();
      } else if (cleanHash === '#how-to-buy') {
        this.renderHowToBuy();
      } else if (cleanHash === '#warranty') {
        this.renderWarranty();
      } else if (cleanHash === '#faq') {
        this.renderFAQ();
      } else if (cleanHash === '#contact') {
        this.renderContact();
      } else if (cleanHash === '#returns') {
        this.renderReturns();
      } else {
        this.renderHome();
      }
      viewport.style.opacity = 1;
      window.scrollTo(0, 0);
    }, 150);
  }

  parseQueryParams(hash) {
    const params = {};
    const parts = hash.split('?');
    if (parts.length > 1) {
      const searchParams = new URLSearchParams(parts[1]);
      for (const [key, value] of searchParams.entries()) {
        params[key] = value;
      }
    }
    return params;
  }

  // --- THEME / STYLE MANIPULATION ---
  initTheme() {
    const storedTheme = localStorage.getItem('istore_theme') || 'light';
    document.documentElement.setAttribute('data-theme', storedTheme);
    this.updateThemeIcons(storedTheme);
  }

  toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('istore_theme', newTheme);
    this.updateThemeIcons(newTheme);
    this.showToast(`Mode ${newTheme === 'dark' ? 'Gelap' : 'Terang'} diaktifkan`, 'success');
  }

  updateThemeIcons(theme) {
    const sunIcon = document.querySelector('#theme-toggle .sun-icon');
    const moonIcon = document.querySelector('#theme-toggle .moon-icon');
    if (theme === 'dark') {
      sunIcon.style.display = 'block';
      moonIcon.style.display = 'none';
    } else {
      sunIcon.style.display = 'none';
      moonIcon.style.display = 'block';
    }
  }

  // --- NOTIFICATION TOASTS ---
  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type === 'success' ? 'toast-success' : ''}`;

    // Set icon type
    let icon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
    if (type === 'success') {
      icon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color:var(--grade-a);"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
    } else if (type === 'error') {
      icon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color:var(--grade-c);"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
    }

    toast.innerHTML = `${icon} <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // --- AUTH DIALOG CONTROLS ---
  openAuthModal(view = 'login') {
    document.getElementById('auth-modal').classList.add('active');
    this.switchAuthView(view);
  }

  closeAuthModal() {
    document.getElementById('auth-modal').classList.remove('active');
  }

  switchAuthView(view) {
    this.activeAuthView = view;
    document.getElementById('auth-view-login').style.display = view === 'login' ? 'block' : 'none';
    document.getElementById('auth-view-register').style.display = view === 'register' ? 'block' : 'none';
    document.getElementById('auth-view-reset').style.display = view === 'reset' ? 'block' : 'none';
  }

  handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-password').value;

    try {
      const user = window.db.login(email, pass);
      this.currentUser = user;
      this.updateNavbarUserMenu();
      this.closeAuthModal();
      this.showToast(`Selamat datang kembali, ${user.nama}!`, 'success');

      // Clear inputs
      document.getElementById('login-email').value = '';
      document.getElementById('login-password').value = '';

      // Redirect if needed
      if (user.role === 'admin') {
        window.location.hash = '#admin';
      } else {
        this.handleRouting();
      }
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const pass = document.getElementById('register-password').value;
    const address = document.getElementById('register-address').value;

    try {
      const user = window.db.register(name, email, pass, address);
      this.currentUser = user;
      this.updateNavbarUserMenu();
      this.closeAuthModal();
      this.showToast('Akun berhasil dibuat!', 'success');

      // Clear inputs
      document.getElementById('register-name').value = '';
      document.getElementById('register-email').value = '';
      document.getElementById('register-password').value = '';
      document.getElementById('register-address').value = '';

      this.handleRouting();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  handleResetPassword(e) {
    e.preventDefault();
    const email = document.getElementById('reset-email').value;
    const newPass = document.getElementById('reset-new-password').value;

    try {
      window.db.resetPassword(email, newPass);
      this.showToast('Password baru berhasil disimpan! Silakan masuk.', 'success');

      document.getElementById('reset-email').value = '';
      document.getElementById('reset-new-password').value = '';

      this.switchAuthView('login');
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  handleLogout() {
    window.db.logout();
    this.currentUser = null;
    this.updateNavbarUserMenu();
    this.showToast('Berhasil keluar akun', 'success');
    window.location.hash = '#home';
  }

  updateNavbarUserMenu() {
    const dropdown = document.getElementById('user-dropdown');

    if (this.currentUser) {
      let adminLink = '';
      if (this.currentUser.role === 'admin') {
        adminLink = `<a href="#admin" class="dropdown-item">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></svg>
          Admin Dashboard
        </a>
        <div class="dropdown-divider"></div>`;
      }

      dropdown.innerHTML = `
        <div style="padding: 12px 16px;">
          <div style="font-weight:600; font-size:14px; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">${this.currentUser.nama}</div>
          <div style="font-size:11px; color:var(--text-secondary); text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">${this.currentUser.email}</div>
        </div>
        <div class="dropdown-divider"></div>
        ${adminLink}
        <a href="#profile" class="dropdown-item">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
          Profil Saya
        </a>
        <div class="dropdown-divider"></div>
        <a class="dropdown-item" onclick="app.handleLogout()" style="color: var(--grade-c);">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
          Keluar
        </a>
      `;
    } else {
      dropdown.innerHTML = `
        <a class="dropdown-item" onclick="app.openAuthModal('login')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><polyline points="10 17 15 12 10 7"></polyline><line x1="15" y1="12" x2="3" y2="12"></line></svg>
          Masuk Akun
        </a>
        <a class="dropdown-item" onclick="app.openAuthModal('register')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
          Daftar Baru
        </a>
      `;
    }
  }

  // --- CART MANAGEMENT ---
  updateCartCount() {
    const badge = document.getElementById('cart-count-badge');
    const totalCount = this.cart.reduce((sum, item) => sum + item.quantity, 0);

    if (totalCount > 0) {
      badge.textContent = totalCount;
      badge.style.display = 'block';
    } else {
      badge.style.display = 'none';
    }
  }

  saveCart() {
    localStorage.setItem('istore_cart', JSON.stringify(this.cart));
    this.updateCartCount();
  }

  addToCart(productId, quantity = 1, silent = false) {
    const product = window.db.getProductById(productId);
    if (!product) return;

    if (product.stok < 1) {
      this.showToast('Maaf, produk ini sedang habis!', 'error');
      return;
    }

    const existing = this.cart.find(item => item.productId === productId);
    const currentQtyInCart = existing ? existing.quantity : 0;

    if (product.stok < (currentQtyInCart + quantity)) {
      this.showToast(`Stok terbatas! Sisa stok yang tersedia: ${product.stok}`, 'error');
      return;
    }

    if (existing) {
      existing.quantity += quantity;
    } else {
      this.cart.push({ productId, quantity });
    }

    this.saveCart();
    if (!silent) {
      this.showToast(`${product.nama_produk} ditambahkan ke keranjang`, 'success');
    }
  }

  removeFromCart(productId) {
    this.cart = this.cart.filter(item => item.productId !== productId);
    this.saveCart();
    this.showToast('Produk dihapus dari keranjang', 'info');
    if (window.location.hash === '#cart') {
      this.renderCart();
    }
  }

  changeCartQuantity(productId, delta) {
    const existing = this.cart.find(item => item.productId === productId);
    if (!existing) return;

    const product = window.db.getProductById(productId);

    const newQty = existing.quantity + delta;
    if (newQty <= 0) {
      this.removeFromCart(productId);
      return;
    }

    if (delta > 0 && product.stok < newQty) {
      this.showToast(`Maksimal stok tercapai (${product.stok} unit)`, 'error');
      return;
    }

    existing.quantity = newQty;
    this.saveCart();
    if (window.location.hash === '#cart') {
      this.renderCart();
    }
  }

  clearCart() {
    this.cart = [];
    localStorage.removeItem('istore_cart');
    this.updateCartCount();
  }

  // --- RENDER VIEWS ---

  // 1. HOME VIEW
  renderHome() {
    const products = window.db.getProducts();
    const newProducts = products.filter(p => p.kondisi === 'Baru').slice(0, 3);
    const usedProducts = products.filter(p => p.kondisi === 'Bekas').slice(0, 3);

    const viewport = document.getElementById('app-viewport');
    viewport.innerHTML = `
      <!-- Hero Section -->
      <div class="hero" style="border-radius: 28px; margin-bottom: 40px; box-shadow: var(--shadow-sm);">
        <div class="container hero-grid">
          <div class="hero-content">
            <span style="font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:2px; color:var(--accent); display:block; margin-bottom:12px;">Premium & Bergaransi</span>
            <h1>iPhone 15 Pro<br><span>Titanium.</span></h1>
            <p>Didesain dengan Titanium kelas kedirgantaraan, kekuatan luar biasa, chip A17 Pro revolusioner, dan sistem kamera Pro tercanggih kami.</p>
            <div class="hero-buttons">
              <a href="#product/prod-001" class="btn-primary">Beli Sekarang</a>
              <a href="#catalog" class="btn-secondary">Lihat Semua Katalog</a>
            </div>
          </div>
          <div class="hero-image-container">
            <div class="hero-image-wrapper">
              <img src="https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=600&q=80" alt="iPhone 15 Pro Max" class="hero-image">
            </div>
          </div>
        </div>
      </div>

      <!-- Categories Quick Selection -->
      <section style="padding: 30px 0 50px;">
        <div class="category-grid">
          <div class="category-card" onclick="window.location.hash='#catalog?kondisi=Baru'">
            <div>
              <span class="icon-badge">100% Segel Resmi</span>
              <h3 style="margin-top: 16px;">Koleksi iPhone Baru</h3>
              <p>Garansi Resmi iBox Indonesia 1 Tahun. Lengkap bersegel utuh.</p>
            </div>
            <img src="https://images.unsplash.com/photo-1695048133038-f9b7c251d182?auto=format&fit=crop&w=600&q=80" class="category-card-img" alt="iPhone Baru">
          </div>
          <div class="category-card" onclick="window.location.hash='#catalog?kondisi=Bekas'">
            <div>
              <span class="icon-badge" style="background-color:var(--text-primary); color:var(--bg-secondary);">3 Cek Diagnostik</span>
              <h3 style="margin-top: 16px;">Koleksi iPhone Bekas</h3>
              <p>Kondisi transparan, IMEI terdaftar Kemenperin, bergaransi retur.</p>
            </div>
            <img src="https://images.unsplash.com/photo-1678685888221-cda773a3dcdb?auto=format&fit=crop&w=600&q=80" class="category-card-img" alt="iPhone Bekas">
          </div>
        </div>
      </section>

      <!-- New / Featured Products -->
      <section style="padding: 20px 0;">
        <div class="section-header">
          <div>
            <h2 class="section-title">iPhone Seri Baru</h2>
            <p class="section-subtitle">Dapatkan jaminan produk 100% original, bersegel, garansi resmi iBox.</p>
          </div>
          <a href="#catalog?kondisi=Baru" class="btn-secondary" style="border-radius: 12px; font-size:12px; padding: 6px 12px;">Lihat Semua</a>
        </div>
        <div class="product-grid">
          ${newProducts.map(p => this.createProductCardHTML(p)).join('')}
        </div>
      </section>

      <!-- Used / Bekas Products -->
      <section style="padding: 40px 0;">
        <div class="section-header">
          <div>
            <h2 class="section-title">iPhone Bekas / Second Pilihan</h2>
            <p class="section-subtitle">Diuji ketat secara transparan. Grade Fisik, BH, Face ID & True Tone dijamin normal.</p>
          </div>
          <a href="#catalog?kondisi=Bekas" class="btn-secondary" style="border-radius: 12px; font-size:12px; padding: 6px 12px;">Lihat Semua</a>
        </div>
        <div class="product-grid">
          ${usedProducts.map(p => this.createProductCardHTML(p)).join('')}
        </div>
      </section>

      <!-- Promotion / Trust Banner -->
      <div style="background-color: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 24px; padding: 40px; text-align: center; margin-top: 40px; box-shadow: var(--shadow-sm);">
        <h3 style="font-size:24px; font-weight:700; margin-bottom:12px;">Mengapa Harus Membeli iPhone di iSTORE?</h3>
        <p style="color:var(--text-secondary); max-width: 700px; margin: 0 auto 28px; line-height: 1.6;">Kami adalah pelopor toko online khusus iPhone baru & bekas yang mengedepankan keterbukaan kondisi unit secara 100%. Setiap unit bekas melewati 10 tahap Quality Control.</p>
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px;">
          <div>
            <h4 style="font-size:15px; font-weight:600; margin-bottom:8px;">IMEI Terjamin Aktif</h4>
            <p style="color:var(--text-secondary); font-size:12px;">Sinyal On seumur hidup dengan garansi IMEI resmi Kemenperin.</p>
          </div>
          <div>
            <h4 style="font-size:15px; font-weight:600; margin-bottom:8px;">Bebas Reset iCloud</h4>
            <p style="color:var(--text-secondary); font-size:12px;">iCloud bersih 100% dan bebas reset/pembatasan di kemudian hari.</p>
          </div>
          <div>
            <h4 style="font-size:15px; font-weight:600; margin-bottom:8px;">Baterai Sehat & Awet</h4>
            <p style="color:var(--text-secondary); font-size:12px;">Setiap unit second dipastikan memiliki Battery Health di atas 80%.</p>
          </div>
          <div>
            <h4 style="font-size:15px; font-weight:600; margin-bottom:8px;">Aksesoris Lengkap</h4>
            <p style="color:var(--text-secondary); font-size:12px;">Dilengkapi box pengiriman, kabel charger, dan kelengkapan lengkap.</p>
          </div>
        </div>
      </div>
    `;
  }

  createProductCardHTML(product) {
    const isBekas = product.kondisi === 'Bekas';
    const tagClass = isBekas ? 'tag-bekas' : 'tag-new';
    const conditionTag = isBekas ? 'Bekas' : 'Baru';
    const gradeBadge = isBekas ? `<span class="tag-grade grade-${product.grade.toLowerCase()}">Grade ${product.grade}</span>` : '';

    // Spec pills representation
    const bhText = isBekas ? `
      <div class="product-bh">
        <svg class="bh-heart" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
        <span>BH ${product.battery_health}%</span>
      </div>
    ` : `
      <div class="product-bh">
        <span style="color:var(--grade-baru); font-size: 11px; font-weight: 600;">Resmi iBox</span>
      </div>
    `;

    const formattedPrice = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(product.harga);

    return `
      <div class="product-card" onclick="window.location.hash='#product/${product.id}'" style="cursor: pointer;">
        <span class="product-tag ${tagClass}">${conditionTag}</span>
        ${gradeBadge}
        <div class="product-image-container">
          <img src="${product.gambar[0]}" alt="${product.nama_produk}" class="product-image">
        </div>
        <div class="product-info">
          <h3 class="product-title">${product.nama_produk}</h3>
          <div class="product-specs">
            <span class="spec-pill">${product.storage}</span>
            <span class="spec-pill">${product.warna}</span>
          </div>
          ${bhText}
          <div class="product-price-row">
            <div class="product-price">${formattedPrice}</div>
            <button class="btn-icon" onclick="event.stopPropagation(); app.addToCart('${product.id}')" title="Tambah Ke Keranjang" style="background-color: var(--accent); color: white;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"></path></svg>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // 2. CATALOG VIEW WITH ADVANCED FILTERS AND SORTING
  renderCatalog() {
    const viewport = document.getElementById('app-viewport');

    // Render Shell structure
    viewport.innerHTML = `
      <h1 class="section-title">Katalog Lengkap iPhone</h1>
      <p class="section-subtitle">Filter produk berdasarkan kebutuhan spesifikasi, warna, atau tingkat kelayakan fisik bekas.</p>
      
      <div class="catalog-layout">
        <!-- Sidebar Filters -->
        <aside class="catalog-sidebar" id="catalog-filters-sidebar">
          <div class="filter-group">
            <h4 class="filter-title">Kondisi Perangkat</h4>
            <div class="filter-options">
              <label class="checkbox-label">
                <input type="checkbox" value="Baru" class="filter-condition-checkbox" ${this.activeFilters.conditions.includes('Baru') ? 'checked' : ''}>
                <span>iPhone Baru</span>
              </label>
              <label class="checkbox-label">
                <input type="checkbox" value="Bekas" class="filter-condition-checkbox" ${this.activeFilters.conditions.includes('Bekas') ? 'checked' : ''}>
                <span>iPhone Bekas / Second</span>
              </label>
            </div>
          </div>

          <div class="filter-group" id="filter-grade-group" style="display: ${this.activeFilters.conditions.includes('Baru') && !this.activeFilters.conditions.includes('Bekas') ? 'none' : 'block'};">
            <h4 class="filter-title">Physical Grade (Bekas)</h4>
            <div class="filter-options">
              <label class="checkbox-label">
                <input type="checkbox" value="A" class="filter-grade-checkbox" ${this.activeFilters.grades.includes('A') ? 'checked' : ''}>
                <span class="badge-status status-completed">Grade A (95%-100%)</span>
              </label>
              <label class="checkbox-label">
                <input type="checkbox" value="B" class="filter-grade-checkbox" ${this.activeFilters.grades.includes('B') ? 'checked' : ''}>
                <span class="badge-status status-pending">Grade B (85%-94%)</span>
              </label>
              <label class="checkbox-label">
                <input type="checkbox" value="C" class="filter-grade-checkbox" ${this.activeFilters.grades.includes('C') ? 'checked' : ''}>
                <span class="badge-status status-danger">Grade C (75%-84%)</span>
              </label>
            </div>
          </div>

          <div class="filter-group">
            <h4 class="filter-title">Seri iPhone</h4>
            <div class="filter-options">
              <label class="checkbox-label">
                <input type="checkbox" value="iPhone 15" class="filter-series-checkbox" ${this.activeFilters.series.includes('iPhone 15') ? 'checked' : ''}>
                <span>iPhone 15 Series</span>
              </label>
              <label class="checkbox-label">
                <input type="checkbox" value="iPhone 14" class="filter-series-checkbox" ${this.activeFilters.series.includes('iPhone 14') ? 'checked' : ''}>
                <span>iPhone 14 Series</span>
              </label>
              <label class="checkbox-label">
                <input type="checkbox" value="iPhone 13" class="filter-series-checkbox" ${this.activeFilters.series.includes('iPhone 13') ? 'checked' : ''}>
                <span>iPhone 13 Series</span>
              </label>
              <label class="checkbox-label">
                <input type="checkbox" value="iPhone 12" class="filter-series-checkbox" ${this.activeFilters.series.includes('iPhone 12') ? 'checked' : ''}>
                <span>iPhone 12 Series</span>
              </label>
              <label class="checkbox-label">
                <input type="checkbox" value="iPhone 11" class="filter-series-checkbox" ${this.activeFilters.series.includes('iPhone 11') ? 'checked' : ''}>
                <span>iPhone 11 Series</span>
              </label>
            </div>
          </div>

          <div class="filter-group">
            <h4 class="filter-title">Storage / Kapasitas</h4>
            <div class="filter-options">
              <label class="checkbox-label">
                <input type="checkbox" value="64GB" class="filter-storage-checkbox" ${this.activeFilters.storages.includes('64GB') ? 'checked' : ''}>
                <span>64 GB</span>
              </label>
              <label class="checkbox-label">
                <input type="checkbox" value="128GB" class="filter-storage-checkbox" ${this.activeFilters.storages.includes('128GB') ? 'checked' : ''}>
                <span>128 GB</span>
              </label>
              <label class="checkbox-label">
                <input type="checkbox" value="256GB" class="filter-storage-checkbox" ${this.activeFilters.storages.includes('256GB') ? 'checked' : ''}>
                <span>256 GB</span>
              </label>
              <label class="checkbox-label">
                <input type="checkbox" value="512GB" class="filter-storage-checkbox" ${this.activeFilters.storages.includes('512GB') ? 'checked' : ''}>
                <span>512 GB</span>
              </label>
              <label class="checkbox-label">
                <input type="checkbox" value="1TB" class="filter-storage-checkbox" ${this.activeFilters.storages.includes('1TB') ? 'checked' : ''}>
                <span>1 TB</span>
              </label>
            </div>
          </div>

          <div class="filter-group">
            <h4 class="filter-title">Harga Batas</h4>
            <div class="price-inputs">
              <input type="number" id="filter-min-price" placeholder="Min Rp" class="price-input" value="${this.activeFilters.minPrice}">
              <span>-</span>
              <input type="number" id="filter-max-price" placeholder="Max Rp" class="price-input" value="${this.activeFilters.maxPrice}">
            </div>
          </div>

          <div class="filter-group" id="filter-bh-group">
            <h4 class="filter-title">Battery Health Minimal</h4>
            <select id="filter-bh-select" class="select-custom" style="width:100%;">
              <option value="">Semua Kondisi</option>
              <option value="95" ${this.activeFilters.bhMin === '95' ? 'selected' : ''}>&ge; 95% (Hampir Sempurna)</option>
              <option value="90" ${this.activeFilters.bhMin === '90' ? 'selected' : ''}>&ge; 90% (Sangat Baik)</option>
              <option value="85" ${this.activeFilters.bhMin === '85' ? 'selected' : ''}>&ge; 85% (Kondisi Sehat)</option>
              <option value="80" ${this.activeFilters.bhMin === '80' ? 'selected' : ''}>&ge; 80% (Standar Penggunaan)</option>
            </select>
          </div>

          <button id="btn-clear-filters" class="btn-secondary" style="width:100%; border-radius:12px; justify-content:center; padding:8px 0; font-size:13px;">Bersihkan Filter</button>
        </aside>

        <!-- Product Grid Results Area -->
        <div>
          <div class="catalog-header">
            <div id="catalog-count" style="font-size:14px; font-weight:600; color:var(--text-secondary);">Menampilkan 0 produk</div>
            <div class="catalog-actions">
              <span style="font-size:13px; color:var(--text-secondary);">Urutkan:</span>
              <select id="catalog-sort" class="select-custom">
                <option value="default" ${this.sortBy === 'default' ? 'selected' : ''}>Terbaru / Rekomendasi</option>
                <option value="price_asc" ${this.sortBy === 'price_asc' ? 'selected' : ''}>Harga: Termurah</option>
                <option value="price_desc" ${this.sortBy === 'price_desc' ? 'selected' : ''}>Harga: Termahal</option>
              </select>
            </div>
          </div>

          <div class="product-grid" id="catalog-grid-viewport">
            <!-- Dynamic products will be rendered here -->
          </div>
        </div>
      </div>
    `;

    // Hook listeners for catalog controls
    this.hookCatalogFilterListeners();
    this.updateCatalogGrid();
  }

  hookCatalogFilterListeners() {
    const sidebar = document.getElementById('catalog-filters-sidebar');
    if (!sidebar) return;

    // Checkbox arrays updating
    const updateCheckboxes = (selector, filterKey) => {
      sidebar.querySelectorAll(selector).forEach(checkbox => {
        checkbox.addEventListener('change', () => {
          const values = [];
          sidebar.querySelectorAll(selector).forEach(cb => {
            if (cb.checked) values.push(cb.value);
          });
          this.activeFilters[filterKey] = values;

          // Toggle grade display contextually
          if (filterKey === 'conditions') {
            const gradeGroup = document.getElementById('filter-grade-group');
            if (values.includes('Bekas') || values.length === 0) {
              gradeGroup.style.display = 'block';
            } else {
              gradeGroup.style.display = 'none';
              // clear grade filters if condition is only Baru
              this.activeFilters.grades = [];
              sidebar.querySelectorAll('.filter-grade-checkbox').forEach(c => c.checked = false);
            }
          }
          this.updateCatalogGrid();
        });
      });
    };

    updateCheckboxes('.filter-condition-checkbox', 'conditions');
    updateCheckboxes('.filter-grade-checkbox', 'grades');
    updateCheckboxes('.filter-series-checkbox', 'series');
    updateCheckboxes('.filter-storage-checkbox', 'storages');

    // Price updates
    document.getElementById('filter-min-price').addEventListener('input', (e) => {
      this.activeFilters.minPrice = e.target.value;
      this.updateCatalogGrid();
    });
    document.getElementById('filter-max-price').addEventListener('input', (e) => {
      this.activeFilters.maxPrice = e.target.value;
      this.updateCatalogGrid();
    });

    // BH minimal selection
    document.getElementById('filter-bh-select').addEventListener('change', (e) => {
      this.activeFilters.bhMin = e.target.value;
      this.updateCatalogGrid();
    });

    // Sort Dropdown
    document.getElementById('catalog-sort').addEventListener('change', (e) => {
      this.sortBy = e.target.value;
      this.updateCatalogGrid();
    });

    // Clear filters button
    document.getElementById('btn-clear-filters').addEventListener('click', () => {
      this.activeFilters = {
        series: [],
        conditions: [],
        grades: [],
        storages: [],
        colors: [],
        minPrice: '',
        maxPrice: '',
        bhMin: '',
        search: ''
      };
      this.sortBy = 'default';

      // Update header input
      document.getElementById('search-input').value = '';

      // Redraw catalog view (clearing checkbox ticks UI-side)
      this.renderCatalog();
    });
  }

  updateCatalogGrid() {
    const products = window.db.getProducts();

    // Filter logic
    let filtered = products.filter(product => {
      // 1. Search Query
      if (this.activeFilters.search) {
        const query = this.activeFilters.search.toLowerCase();
        const inName = product.nama_produk.toLowerCase().includes(query);
        const inDesc = product.deskripsi.toLowerCase().includes(query);
        const inSeries = product.seri_iphone.toLowerCase().includes(query);
        const inColor = product.warna.toLowerCase().includes(query);
        if (!inName && !inDesc && !inSeries && !inColor) return false;
      }

      // 2. Conditions
      if (this.activeFilters.conditions.length > 0) {
        if (!this.activeFilters.conditions.includes(product.kondisi)) return false;
      }

      // 3. Grades
      if (this.activeFilters.grades.length > 0) {
        if (product.kondisi === 'Baru' || !this.activeFilters.grades.includes(product.grade)) return false;
      }

      // 4. Series
      if (this.activeFilters.series.length > 0) {
        if (!this.activeFilters.series.includes(product.seri_iphone)) return false;
      }

      // 5. Storages
      if (this.activeFilters.storages.length > 0) {
        if (!this.activeFilters.storages.includes(product.storage)) return false;
      }

      // 6. Price Batas
      if (this.activeFilters.minPrice) {
        if (product.harga < parseFloat(this.activeFilters.minPrice)) return false;
      }
      if (this.activeFilters.maxPrice) {
        if (product.harga > parseFloat(this.activeFilters.maxPrice)) return false;
      }

      // 7. Battery Health Minimal
      if (this.activeFilters.bhMin) {
        if (product.battery_health < parseInt(this.activeFilters.bhMin)) return false;
      }

      return true;
    });

    // Sort logic
    if (this.sortBy === 'price_asc') {
      filtered.sort((a, b) => a.harga - b.harga);
    } else if (this.sortBy === 'price_desc') {
      filtered.sort((a, b) => b.harga - a.harga);
    }

    // Update count labels
    document.getElementById('catalog-count').textContent = `Menampilkan ${filtered.length} produk`;

    const grid = document.getElementById('catalog-grid-viewport');
    if (filtered.length > 0) {
      grid.innerHTML = filtered.map(p => this.createProductCardHTML(p)).join('');
    } else {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 60px 0;">
          <svg style="color:var(--text-tertiary); margin-bottom:16px;" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
          <h3 style="font-size:18px; font-weight:600;">Produk Tidak Ditemukan</h3>
          <p style="color:var(--text-secondary); font-size:14px; margin-top:8px;">Silakan coba sesuaikan pencarian atau bersihkan filter Anda.</p>
        </div>
      `;
    }
  }

  // 3. PRODUCT DETAIL VIEW WITH EXPANDED SPECS FOR USED PHONES
  renderProductDetail(productId) {
    const product = window.db.getProductById(productId);
    const viewport = document.getElementById('app-viewport');

    if (!product) {
      viewport.innerHTML = `
        <div style="text-align: center; padding: 80px 0;">
          <h2>Oops! Produk tidak ditemukan.</h2>
          <a href="#catalog" class="btn-primary" style="margin-top:20px;">Kembali ke Katalog</a>
        </div>
      `;
      return;
    }

    const isBekas = product.kondisi === 'Bekas';
    const tagLabel = isBekas ? `Second (Grade ${product.grade})` : 'Baru (100% Segel)';
    const tagClass = isBekas ? 'status-pending' : 'status-completed';

    // Image gallery thumbnails injection
    const thumbsHTML = product.gambar.map((img, idx) => `
      <div class="gallery-thumb ${idx === 0 ? 'active' : ''}" onclick="app.setDetailMainImage(this, '${img}')">
        <img src="${img}" alt="Preview ${idx + 1}">
      </div>
    `).join('');

    // Specific Diagnostics parameters for Used Units
    let conditionBoxHTML = '';
    if (isBekas) {
      // Helper to generate spec diagnostics
      const getCheckBadge = (status) => {
        if (status.toLowerCase().includes('normal') || status.toLowerCase().includes('clean') || status.toLowerCase().includes('terdaftar')) {
          return `<span class="check-status-normal"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> ${status}</span>`;
        }
        return `<span class="check-status-warning"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg> ${status}</span>`;
      };

      conditionBoxHTML = `
        <div class="condition-box">
          <div class="condition-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--accent);"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            Laporan Keterbukaan Kondisi Bekas (Grade ${product.grade})
          </div>
          <div class="condition-check-grid">
            <div class="check-item"><span>iCloud Status</span> ${getCheckBadge(product.icloud_status)}</div>
            <div class="check-item"><span>Status IMEI</span> ${getCheckBadge(product.imei_status)}</div>
            <div class="check-item"><span>Face ID Sensor</span> ${getCheckBadge(product.face_id)}</div>
            <div class="check-item"><span>True Tone</span> ${getCheckBadge(product.true_tone)}</div>
            <div class="check-item"><span>Fungsi Kamera</span> ${getCheckBadge(product.kamera || 'Normal')}</div>
            <div class="check-item"><span>Fungsi Speaker</span> ${getCheckBadge(product.speaker || 'Normal')}</div>
          </div>
          <div style="margin-top: 16px; font-size:12px; color:var(--text-secondary); line-height: 1.5;">
            * <strong>Grading System:</strong> Grade A (Sangat mulus seperti baru 95%-100%), Grade B (Mulus wajar pemakaian 85%-94%), Grade C (Fisik bersahabat 75%-84% / ada minus fungsional kecil).
          </div>
        </div>
      `;
    }

    const formattedPrice = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(product.harga);

    viewport.innerHTML = `
      <div style="margin-bottom: 20px;">
        <a href="#catalog" style="text-decoration:none; color:var(--text-secondary); font-size:14px; display:inline-flex; align-items:center; gap:6px;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          Kembali ke Katalog
        </a>
      </div>

      <div class="product-details-container">
        <!-- Gallery Images Left Side -->
        <div class="details-gallery">
          <div class="gallery-main">
            <img id="detail-main-img-element" src="${product.gambar[0]}" alt="${product.nama_produk}">
          </div>
          <div class="gallery-thumbs">
            ${thumbsHTML}
          </div>
        </div>

        <!-- Info Details Right Side -->
        <div class="details-info">
          <div class="details-tag-row">
            <span class="badge-status ${tagClass}" style="text-transform:uppercase;">${tagLabel}</span>
            <span class="badge-status" style="background-color: var(--bg-tertiary); color: var(--text-primary); border: 1px solid var(--border-color);">Stok: ${product.stok} unit</span>
          </div>

          <h1 class="details-title">${product.nama_produk}</h1>
          <div class="details-price">${formattedPrice}</div>
          
          <!-- Storage, Color and BH visual displays -->
          <div class="spec-grid-premium">
            <div class="spec-item-premium">
              <div class="spec-icon-box">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>
              </div>
              <div>
                <div class="spec-label">Storage</div>
                <div class="spec-value">${product.storage}</div>
              </div>
            </div>
            
            <div class="spec-item-premium">
              <div class="spec-icon-box">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
              </div>
              <div>
                <div class="spec-label">Warna</div>
                <div class="spec-value">${product.warna}</div>
              </div>
            </div>

            <div class="spec-item-premium">
              <div class="spec-icon-box">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
              </div>
              <div>
                <div class="spec-label">Garansi</div>
                <div class="spec-value" style="font-size:13px;">${product.garansi}</div>
              </div>
            </div>

            <div class="spec-item-premium">
              <div class="spec-icon-box">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="16" height="10" rx="2" ry="2"></rect><line x1="22" y1="11" x2="22" y2="13"></line><line x1="6" y1="11" x2="10" y2="11"></line></svg>
              </div>
              <div>
                <div class="spec-label">Battery Health</div>
                <div class="spec-value">${product.battery_health}%</div>
              </div>
            </div>
          </div>

          <!-- Used condition diagnostic panel if second -->
          ${conditionBoxHTML}

          <!-- Package contents display -->
          <div style="border: 1px solid var(--border-color); border-radius:16px; padding:16px; margin-bottom: 24px; background-color: var(--bg-tertiary);">
            <div style="font-size:12px; font-weight:700; text-transform:uppercase; color:var(--text-secondary); margin-bottom:8px;">Kelengkapan Paket (Box & Aksesoris)</div>
            <div style="font-size:14px; font-weight:500;">${product.kelengkapan}</div>
          </div>

          <!-- Buy actions -->
          <div class="details-actions">
            <button class="btn-primary" onclick="app.addToCart('${product.id}')" style="flex-grow: 1; justify-content: center; height: 50px; border-radius: 25px; font-size:16px;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
              Masukkan Keranjang
            </button>
          </div>
        </div>
      </div>

      <!-- Description Block -->
      <div class="details-description">
        <h3>Rincian & Deskripsi Produk</h3>
        <p>${product.deskripsi.replace(/\n/g, '<br>')}</p>
      </div>
    `;
  }

  setDetailMainImage(thumbElement, imageSrc) {
    document.querySelectorAll('.gallery-thumb').forEach(t => t.classList.remove('active'));
    thumbElement.classList.add('active');
    document.getElementById('detail-main-img-element').src = imageSrc;
  }

  // 4. CART VIEW
  renderCart() {
    const viewport = document.getElementById('app-viewport');

    if (this.cart.length === 0) {
      viewport.innerHTML = `
        <div style="text-align: center; padding: 80px 0;">
          <svg style="color:var(--text-tertiary); margin-bottom: 16px;" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
          <h2>Keranjang Belanja Kosong</h2>
          <p style="color:var(--text-secondary); margin-top:8px;">Silakan jelajahi katalog kami untuk menambahkan produk.</p>
          <a href="#catalog" class="btn-primary" style="margin-top:24px;">Mulai Belanja</a>
        </div>
      `;
      return;
    }

    let subtotal = 0;
    const cartItemsHTML = this.cart.map(item => {
      const product = window.db.getProductById(item.productId);
      if (!product) return '';

      const itemSubtotal = product.harga * item.quantity;
      subtotal += itemSubtotal;

      const formattedPrice = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(product.harga);

      return `
        <div class="cart-item">
          <img src="${product.gambar[0]}" alt="${product.nama_produk}" class="cart-item-img">
          <div class="cart-item-info">
            <div class="cart-item-title">${product.nama_produk}</div>
            <div class="cart-item-spec">Spesifikasi: ${product.storage} | ${product.warna} (${product.kondisi})</div>
            <div class="cart-item-price">${formattedPrice}</div>
          </div>
          
          <!-- Quantity Controls -->
          <div class="quantity-controls">
            <button class="qty-btn" onclick="app.changeCartQuantity('${product.id}', -1)">&minus;</button>
            <span class="qty-value">${item.quantity}</span>
            <button class="qty-btn" onclick="app.changeCartQuantity('${product.id}', 1)">&plus;</button>
          </div>

          <!-- Delete Trigger -->
          <button class="btn-icon" onclick="app.removeFromCart('${product.id}')" style="color:var(--grade-c); padding:10px;" title="Hapus Barang">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        </div>
      `;
    }).join('');

    const formattedSubtotal = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(subtotal);

    viewport.innerHTML = `
      <h1 class="section-title">Keranjang Belanja</h1>
      <p class="section-subtitle">Tinjau daftar barang belanjaan Anda sebelum melanjutkan ke checkout pembayaran.</p>
      
      <div class="cart-layout">
        <!-- Items Column -->
        <div class="cart-items">
          ${cartItemsHTML}
        </div>

        <!-- Order Summary Column -->
        <div class="cart-summary">
          <h3 class="summary-title">Ringkasan Belanja</h3>
          <div class="summary-row">
            <span>Total Barang</span>
            <span>${this.cart.reduce((sum, item) => sum + item.quantity, 0)} Pcs</span>
          </div>
          <div class="summary-row">
            <span>Subtotal Produk</span>
            <span>${formattedSubtotal}</span>
          </div>
          <div class="summary-row">
            <span>Biaya Pengiriman</span>
            <span style="color:var(--grade-a); font-weight:600;">Gratis Ongkir</span>
          </div>
          
          <div class="summary-row total">
            <span>Total Bayar</span>
            <span>${formattedSubtotal}</span>
          </div>

          <button onclick="app.proceedToCheckout()" class="btn-primary" style="width:100%; justify-content:center; height:46px; border-radius:23px; margin-top:20px; font-size:15px;">
            Lanjut ke Checkout
          </button>
        </div>
      </div>
    `;
  }

  proceedToCheckout() {
    if (!this.currentUser) {
      this.showToast('Silakan masuk akun terlebih dahulu untuk melakukan checkout!', 'info');
      this.openAuthModal('login');
      return;
    }
    window.location.hash = '#checkout';
  }

  // 5. CHECKOUT VIEW
  renderCheckout() {
    const viewport = document.getElementById('app-viewport');

    if (!this.currentUser) {
      viewport.innerHTML = `
        <div style="text-align: center; padding: 80px 0;">
          <h2>Akses Ditolak</h2>
          <p style="color:var(--text-secondary); margin-top:8px;">Silakan login untuk mengakses halaman checkout.</p>
          <button class="btn-primary" style="margin-top:20px;" onclick="app.openAuthModal('login')">Masuk Akun</button>
        </div>
      `;
      return;
    }

    if (this.cart.length === 0) {
      window.location.hash = '#cart';
      return;
    }

    let subtotal = 0;
    const checkoutItemsHTML = this.cart.map(item => {
      const product = window.db.getProductById(item.productId);
      if (!product) return '';
      subtotal += product.harga * item.quantity;

      const formattedPrice = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(product.harga * item.quantity);

      return `
        <div style="display:flex; justify-content:space-between; font-size:14px; margin-bottom:12px; border-bottom:1px solid var(--border-color); padding-bottom:8px;">
          <div>
            <div style="font-weight:600;">${product.nama_produk}</div>
            <div style="font-size:12px; color:var(--text-secondary);">${item.quantity} x ${product.storage}</div>
          </div>
          <span style="font-weight:500;">${formattedPrice}</span>
        </div>
      `;
    }).join('');

    const formattedSubtotal = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(subtotal);

    viewport.innerHTML = `
      <h1 class="section-title">Checkout Pesanan</h1>
      <p class="section-subtitle">Lengkapi detail pengiriman dan selesaikan transaksi belanja Anda.</p>

      <div class="cart-layout">
        <!-- Form Delivery Details -->
        <div class="cart-summary" style="padding: 30px;">
          <h3 class="summary-title" style="border-bottom: 1px solid var(--border-color); padding-bottom: 12px; margin-bottom: 24px;">Detail Pengiriman</h3>
          
          <form id="checkout-form" onsubmit="app.handleOrderSubmit(event)">
            <div class="form-group">
              <label class="form-label">Nama Penerima</label>
              <input type="text" class="form-input" value="${this.currentUser.nama}" required>
            </div>
            
            <div class="form-group">
              <label class="form-label">Alamat Lengkap Pengiriman</label>
              <textarea id="checkout-address" class="form-textarea" required style="height: 90px;">${this.currentUser.alamat}</textarea>
            </div>

            <h3 class="summary-title" style="border-bottom: 1px solid var(--border-color); padding-bottom: 12px; margin-top:30px; margin-bottom: 20px;">Metode Pembayaran</h3>
            
            <div style="display:flex; flex-direction:column; gap:12px;">
              <label class="checkbox-label" style="border: 1px solid var(--border-color); border-radius:12px; padding: 14px 18px; color:var(--text-primary);">
                <input type="radio" name="payment_method" value="Bank Transfer (BCA)" checked style="width:18px; height:18px; accent-color:var(--accent);">
                <div style="margin-left:8px;">
                  <strong style="display:block;">Transfer Bank BCA</strong>
                  <span style="font-size:12px; color:var(--text-secondary);">No. Rek: 123-4567-890 a/n PT iSTORE INDONESIA</span>
                </div>
              </label>

              <label class="checkbox-label" style="border: 1px solid var(--border-color); border-radius:12px; padding: 14px 18px; color:var(--text-primary);">
                <input type="radio" name="payment_method" value="GoPay" style="width:18px; height:18px; accent-color:var(--accent);">
                <div style="margin-left:8px;">
                  <strong style="display:block;">GoPay / QRIS</strong>
                  <span style="font-size:12px; color:var(--text-secondary);">Scan kode QRIS instan di langkah verifikasi</span>
                </div>
              </label>

              <label class="checkbox-label" style="border: 1px solid var(--border-color); border-radius:12px; padding: 14px 18px; color:var(--text-primary);">
                <input type="radio" name="payment_method" value="Kartu Kredit" style="width:18px; height:18px; accent-color:var(--accent);">
                <div style="margin-left:8px;">
                  <strong style="display:block;">Kartu Kredit (Visa/Mastercard)</strong>
                  <span style="font-size:12px; color:var(--text-secondary);">Pembayaran aman terenkripsi 3D-Secure</span>
                </div>
              </label>
            </div>

            <button type="submit" class="btn-primary" style="width:100%; justify-content:center; height:48px; border-radius:24px; margin-top:32px; font-size:16px;">
              Konfirmasi & Buat Pesanan
            </button>
          </form>
        </div>

        <!-- Summary Order column -->
        <div class="cart-summary">
          <h3 class="summary-title">Ringkasan Pesanan</h3>
          
          <div style="margin-bottom: 24px;">
            ${checkoutItemsHTML}
          </div>

          <div class="summary-row">
            <span>Subtotal Produk</span>
            <span>${formattedSubtotal}</span>
          </div>
          <div class="summary-row">
            <span>Ongkos Kirim</span>
            <span style="color:var(--grade-a); font-weight:600;">Gratis</span>
          </div>
          
          <div class="summary-row total" style="border-top:1px solid var(--border-color); padding-top:16px; margin-top:16px;">
            <span>Total Belanja</span>
            <span>${formattedSubtotal}</span>
          </div>
        </div>
      </div>
    `;
  }

  handleOrderSubmit(e) {
    e.preventDefault();
    const address = document.getElementById('checkout-address').value;
    const paymentMethod = document.querySelector('input[name="payment_method"]:checked').value;

    try {
      const order = window.db.createOrder(this.currentUser.id, this.cart.map(i => ({ productId: i.productId, quantity: i.quantity })), address, paymentMethod);
      this.clearCart();
      this.showToast(`Pesanan #${order.id} berhasil dibuat!`, 'success');
      window.location.hash = '#profile';
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  // 6. CUSTOMER PROFILE & ORDER HISTORY VIEW
  renderProfile() {
    const viewport = document.getElementById('app-viewport');

    if (!this.currentUser) {
      viewport.innerHTML = `
        <div style="text-align: center; padding: 80px 0;">
          <h2>Akses Ditolak</h2>
          <p style="color:var(--text-secondary); margin-top:8px;">Silakan login terlebih dahulu untuk mengakses data profil.</p>
          <button class="btn-primary" style="margin-top:20px;" onclick="app.openAuthModal('login')">Masuk Akun</button>
        </div>
      `;
      return;
    }

    const orders = window.db.getUserOrders(this.currentUser.id);

    let ordersListHTML = '';
    if (orders.length === 0) {
      ordersListHTML = `
        <tr>
          <td colspan="5" style="text-align:center; padding: 30px; color:var(--text-secondary);">Belum ada riwayat pemesanan.</td>
        </tr>
      `;
    } else {
      ordersListHTML = orders.map(ord => {
        const formattedDate = new Date(ord.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
        const formattedPrice = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(ord.total_harga);

        let statusBadge = '';
        if (ord.status === 'Menunggu Pembayaran') {
          statusBadge = `<span class="badge-status status-pending">Menunggu Pembayaran</span>`;
        } else if (ord.status === 'Diproses') {
          statusBadge = `<span class="badge-status status-processing">Diproses</span>`;
        } else if (ord.status === 'Dikirim') {
          statusBadge = `<span class="badge-status status-shipping">Dikirim</span>`;
        } else {
          statusBadge = `<span class="badge-status status-completed">Selesai</span>`;
        }

        const itemsSummary = ord.detail_barang.map(item => `${item.nama_produk} (x${item.quantity})`).join(', ');

        return `
          <tr>
            <td style="font-weight:600;">#${ord.id}</td>
            <td>${formattedDate}</td>
            <td style="max-width:240px; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">${itemsSummary}</td>
            <td style="font-weight:600;">${formattedPrice}</td>
            <td>${statusBadge}</td>
            <td>
              <button class="btn-secondary" style="padding: 6px 12px; font-size: 12px; border-radius: 8px;" onclick="app.openInvoiceModal('${ord.id}')">Invoice</button>
            </td>
          </tr>
        `;
      }).join('');
    }

    viewport.innerHTML = `
      <h1 class="section-title">Profil Pengguna & Transaksi</h1>
      <p class="section-subtitle">Kelola alamat pengiriman utama Anda dan pantau status pengiriman pesanan Anda secara real-time.</p>

      <div class="admin-layout" style="margin-top:30px;">
        <!-- Left panel form -->
        <div class="admin-main" style="padding: 24px;">
          <h3 style="font-size:18px; font-weight:700; margin-bottom:20px; border-bottom:1px solid var(--border-color); padding-bottom:10px;">Data Diri & Alamat</h3>
          <form id="profile-update-form" onsubmit="app.handleProfileUpdate(event)">
            <div class="form-group">
              <label class="form-label">Nama Lengkap</label>
              <input type="text" id="profile-name" class="form-input" value="${this.currentUser.nama}" required>
            </div>
            
            <div class="form-group">
              <label class="form-label">Alamat Email</label>
              <input type="email" class="form-input" value="${this.currentUser.email}" disabled style="background-color:var(--bg-primary); cursor:not-allowed;">
            </div>

            <div class="form-group">
              <label class="form-label">Alamat Pengiriman Utama</label>
              <textarea id="profile-address" class="form-textarea" style="height:100px;" required>${this.currentUser.alamat}</textarea>
            </div>

            <button type="submit" class="btn-primary" style="width:100%; justify-content:center; border-radius:20px;">
              Simpan Perubahan
            </button>
          </form>
        </div>

        <!-- Right panel orders history -->
        <div class="admin-main" style="padding: 24px; flex-grow:1;">
          <h3 style="font-size:18px; font-weight:700; margin-bottom:20px; border-bottom:1px solid var(--border-color); padding-bottom:10px;">Riwayat Transaksi Saya</h3>
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>No Order</th>
                  <th>Tanggal</th>
                  <th>Daftar Item</th>
                  <th>Total Harga</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                ${ordersListHTML}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  handleProfileUpdate(e) {
    e.preventDefault();
    const nama = document.getElementById('profile-name').value;
    const alamat = document.getElementById('profile-address').value;

    try {
      const updated = window.db.updateProfile(this.currentUser.id, { nama, alamat });
      this.currentUser = updated;
      this.updateNavbarUserMenu();
      this.showToast('Profil berhasil diperbaharui!', 'success');
      this.renderProfile();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  // INVOICE POPUP DRAWING
  openInvoiceModal(orderId) {
    const orders = window.db.getOrders();
    const ord = orders.find(o => o.id === orderId);
    if (!ord) return;

    const modal = document.getElementById('admin-invoice-modal');
    const modalBody = document.getElementById('invoice-modal-body');

    const formattedDate = new Date(ord.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const formattedTotal = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(ord.total_harga);

    const itemsHTML = ord.detail_barang.map(item => {
      const formattedPrice = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(item.harga);
      const formattedSub = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(item.subtotal);
      return `
        <tr style="border-bottom: 1px solid var(--border-color);">
          <td style="padding: 10px 0;">${item.nama_produk}</td>
          <td style="padding: 10px 0; text-align:center;">${item.quantity}</td>
          <td style="padding: 10px 0; text-align:right;">${formattedPrice}</td>
          <td style="padding: 10px 0; text-align:right; font-weight:600;">${formattedSub}</td>
        </tr>
      `;
    }).join('');

    modalBody.innerHTML = `
      <div style="padding: 10px; font-size:14px; line-height:1.5;">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid var(--text-primary); padding-bottom:16px;">
          <div>
            <h2 style="font-weight:800; font-size:24px;">iSTORE<span>.</span></h2>
            <p style="color:var(--text-secondary); font-size:12px;">invoice@istore.com | Jakarta, ID</p>
          </div>
          <div style="text-align:right;">
            <div style="font-size:18px; font-weight:700; color:var(--accent);">INVOICE</div>
            <div style="font-weight:600; font-size:14px; margin-top:4px;">#${ord.id}</div>
          </div>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-top:20px; margin-bottom:24px;">
          <div>
            <div style="font-weight:700; color:var(--text-secondary); font-size:11px; text-transform:uppercase; margin-bottom:6px;">DITAGIHKAN KEPADA:</div>
            <div style="font-weight:600;">${this.currentUser.nama}</div>
            <div style="color:var(--text-secondary); font-size:12px; margin-top:4px;">${ord.alamat_pengiriman}</div>
          </div>
          <div style="text-align:right;">
            <div style="font-weight:700; color:var(--text-secondary); font-size:11px; text-transform:uppercase; margin-bottom:6px;">DETAIL PEMBAYARAN:</div>
            <div>Metode: <strong>${ord.metode_pembayaran}</strong></div>
            <div style="margin-top:4px;">Tanggal: <strong>${formattedDate}</strong></div>
            <div style="margin-top:4px;">Status: <span class="badge-status ${ord.status === 'Menunggu Pembayaran' ? 'status-pending' : ord.status === 'Diproses' ? 'status-processing' : ord.status === 'Dikirim' ? 'status-shipping' : 'status-completed'}" style="font-size:10px; padding:2px 6px;">${ord.status}</span></div>
          </div>
        </div>

        <table style="width:100%; margin-bottom:20px;">
          <thead>
            <tr style="border-bottom:1.5px solid var(--text-primary);">
              <th style="padding: 8px 0; background:none; color:var(--text-primary);">Item Produk</th>
              <th style="padding: 8px 0; background:none; color:var(--text-primary); text-align:center;">Qty</th>
              <th style="padding: 8px 0; background:none; color:var(--text-primary); text-align:right;">Harga Satuan</th>
              <th style="padding: 8px 0; background:none; color:var(--text-primary); text-align:right;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHTML}
          </tbody>
        </table>

        <div style="display:flex; justify-content:flex-end; border-top:1.5px solid var(--border-color); padding-top:16px;">
          <div style="text-align:right; min-width:180px;">
            <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
              <span style="color:var(--text-secondary);">Subtotal:</span>
              <span style="font-weight:600;">${formattedTotal}</span>
            </div>
            <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
              <span style="color:var(--text-secondary);">Ongkir:</span>
              <span style="font-weight:600; color:var(--grade-a);">GRATIS</span>
            </div>
            <div style="display:flex; justify-content:space-between; border-top:1px solid var(--text-primary); padding-top:8px; font-weight:700; font-size:16px;">
              <span>Total Bayar:</span>
              <span>${formattedTotal}</span>
            </div>
          </div>
        </div>

        <div style="margin-top:32px; border-top:1px dashed var(--border-color); padding-top:16px; text-align:center; font-size:11px; color:var(--text-secondary);">
          Terima kasih atas kepercayaan Anda berbelanja di iSTORE Indonesia. Simpan Invoice ini sebagai bukti transaksi pembelian sah.
        </div>
      </div>
    `;

    modal.classList.add('active');
  }

  closeInvoiceModal() {
    document.getElementById('admin-invoice-modal').classList.remove('active');
  }

  // 7. ADMIN BACKOFFICE VIEW (WITH DABS, CRUD, REPORTS)
  renderAdmin() {
    const viewport = document.getElementById('app-viewport');

    if (!this.currentUser || this.currentUser.role !== 'admin') {
      viewport.innerHTML = `
        <div style="text-align: center; padding: 80px 0;">
          <h2>Akses Ditolak</h2>
          <p style="color:var(--text-secondary); margin-top:8px;">Maaf, area ini khusus untuk Administrator.</p>
          <a href="#home" class="btn-primary" style="margin-top:20px;">Kembali ke Home</a>
        </div>
      `;
      return;
    }

    viewport.innerHTML = `
      <h1 class="section-title">Panel Administrator iSTORE</h1>
      <p class="section-subtitle">Manajemen produk, pelacakan pesanan masuk, log customer, dan laporan analisis laba penjualan.</p>

      <div class="admin-layout">
        <!-- Sidebar Menu -->
        <aside class="admin-nav">
          <div class="admin-nav-item ${this.activeAdminTab === 'dashboard' ? 'active' : ''}" onclick="app.switchAdminTab('dashboard')">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></svg>
            Dashboard
          </div>
          <div class="admin-nav-item ${this.activeAdminTab === 'products' ? 'active' : ''}" onclick="app.switchAdminTab('products')">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
            Manajemen Produk
          </div>
          <div class="admin-nav-item ${this.activeAdminTab === 'orders' ? 'active' : ''}" onclick="app.switchAdminTab('orders')">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            Manajemen Pesanan
          </div>
          <div class="admin-nav-item ${this.activeAdminTab === 'customers' ? 'active' : ''}" onclick="app.switchAdminTab('customers')">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            Data Pelanggan
          </div>
          <div class="admin-nav-item ${this.activeAdminTab === 'reports' ? 'active' : ''}" onclick="app.switchAdminTab('reports')">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
            Laporan Penjualan
          </div>
        </aside>

        <!-- Main Content Panel -->
        <section class="admin-main" id="admin-main-panel" style="padding:0; border:none; background:none;">
          <!-- Active Tab renders here -->
        </section>
      </div>
    `;

    this.renderActiveAdminTab();
  }

  switchAdminTab(tab) {
    this.activeAdminTab = tab;
    this.renderAdmin();
  }

  renderActiveAdminTab() {
    const container = document.getElementById('admin-main-panel');
    if (!container) return;

    if (this.activeAdminTab === 'dashboard') {
      this.renderAdminDashboard(container);
    } else if (this.activeAdminTab === 'products') {
      this.renderAdminProducts(container);
    } else if (this.activeAdminTab === 'orders') {
      this.renderAdminOrders(container);
    } else if (this.activeAdminTab === 'customers') {
      this.renderAdminCustomers(container);
    } else if (this.activeAdminTab === 'reports') {
      this.renderAdminReports(container);
    }
  }

  // TAB 1: ADMIN DASHBOARD
  renderAdminDashboard(el) {
    const stats = window.db.getSalesSummary();
    const orders = window.db.getOrders();
    const latestOrders = orders.slice(0, 5);

    const formattedRevenue = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(stats.totalSales);

    el.innerHTML = `
      <div class="admin-stats-grid">
        <div class="stat-card">
          <div class="stat-header">
            <span>Total Pendapatan</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
          </div>
          <div class="stat-value">${formattedRevenue}</div>
          <span class="stat-trend">&uarr; 12% Bulan ini</span>
        </div>
        <div class="stat-card">
          <div class="stat-header">
            <span>Total Pesanan</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
          </div>
          <div class="stat-value">${stats.totalOrdersCount}</div>
          <span class="stat-trend" style="color:var(--text-secondary);">Dari database</span>
        </div>
        <div class="stat-card">
          <div class="stat-header">
            <span>Pelanggan Terdaftar</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>
          </div>
          <div class="stat-value">${stats.totalCustomersCount}</div>
          <span class="stat-trend" style="color:var(--text-secondary);">Akun aktif</span>
        </div>
        <div class="stat-card">
          <div class="stat-header">
            <span>Jumlah SKU iPhone</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
          </div>
          <div class="stat-value">${stats.totalProductsCount}</div>
          <span class="stat-trend" style="color:var(--text-secondary);">Terdaftar di toko</span>
        </div>
      </div>

      <div class="admin-main" style="background-color: var(--bg-secondary); border: 1px solid var(--border-color); border-radius:24px; padding: 24px;">
        <h3 style="font-size:16px; font-weight:700; margin-bottom:16px;">5 Pesanan Terakhir Masuk</h3>
        <div class="table-container" style="margin-top:0;">
          <table>
            <thead>
              <tr>
                <th>No Order</th>
                <th>Tanggal</th>
                <th>Total Harga</th>
                <th>Pembayaran</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              ${latestOrders.map(ord => {
      const formattedDate = new Date(ord.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
      const price = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(ord.total_harga);

      let badge = '';
      if (ord.status === 'Menunggu Pembayaran') {
        badge = `<span class="badge-status status-pending">${ord.status}</span>`;
      } else if (ord.status === 'Diproses') {
        badge = `<span class="badge-status status-processing">${ord.status}</span>`;
      } else if (ord.status === 'Dikirim') {
        badge = `<span class="badge-status status-shipping">${ord.status}</span>`;
      } else {
        badge = `<span class="badge-status status-completed">${ord.status}</span>`;
      }

      return `
                  <tr>
                    <td style="font-weight:600;">#${ord.id}</td>
                    <td>${formattedDate}</td>
                    <td style="font-weight:600;">${price}</td>
                    <td>${ord.metode_pembayaran}</td>
                    <td>${badge}</td>
                    <td>
                      <button class="btn-secondary" style="padding:4px 8px; font-size:12px;" onclick="app.switchAdminTab('orders')">Kelola</button>
                    </td>
                  </tr>
                `;
    }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // TAB 2: MANAGE PRODUCTS (CRUD)
  renderAdminProducts(el) {
    const products = window.db.getProducts();

    el.innerHTML = `
      <div class="admin-main" style="background-color: var(--bg-secondary); border: 1px solid var(--border-color); border-radius:24px; padding: 24px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
          <h3 style="font-size:18px; font-weight:700;">Daftar Produk iPhone</h3>
          <button class="btn-primary" onclick="app.openAdminProductModal('add')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"></path></svg>
            Tambah Produk
          </button>
        </div>

        <div class="table-container" style="margin-top:0;">
          <table>
            <thead>
              <tr>
                <th>Gambar</th>
                <th>Nama Produk</th>
                <th>Seri</th>
                <th>Kondisi</th>
                <th>Stok</th>
                <th>Harga</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              ${products.map(p => {
      const formattedPrice = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(p.harga);
      const isBekas = p.kondisi === 'Bekas';
      const condBadge = isBekas ? `<span class="badge-status status-pending">Bekas (Grd ${p.grade})</span>` : `<span class="badge-status status-completed">Baru</span>`;

      return `
                  <tr>
                    <td><img src="${p.gambar[0]}" style="width:40px; height:40px; object-fit:contain; background-color:var(--bg-primary); padding:4px; border-radius:6px;"></td>
                    <td style="font-weight:600;">${p.nama_produk}</td>
                    <td>${p.seri_iphone}</td>
                    <td>${condBadge}</td>
                    <td><strong>${p.stok}</strong> pcs</td>
                    <td style="font-weight:700;">${formattedPrice}</td>
                    <td>
                      <button class="btn-secondary" style="padding:6px; min-width:unset; border-radius:8px;" onclick="app.openAdminProductModal('edit', '${p.id}')" title="Edit">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                      </button>
                      <button class="btn-danger" style="padding:6px; min-width:unset; border-radius:8px; margin-left:4px;" onclick="app.handleProductDelete('${p.id}')" title="Hapus">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                      </button>
                    </td>
                  </tr>
                `;
    }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // TAB 3: MANAGE ORDERS
  renderAdminOrders(el) {
    const orders = window.db.getOrders();

    el.innerHTML = `
      <div class="admin-main" style="background-color: var(--bg-secondary); border: 1px solid var(--border-color); border-radius:24px; padding: 24px;">
        <h3 style="font-size:18px; font-weight:700; margin-bottom:20px;">Daftar Pesanan Customer</h3>

        <div class="table-container" style="margin-top:0;">
          <table>
            <thead>
              <tr>
                <th>No Order</th>
                <th>Tanggal</th>
                <th>Penerima</th>
                <th>Metode</th>
                <th>Total Tagihan</th>
                <th>Status</th>
                <th>Aksi Kelola</th>
              </tr>
            </thead>
            <tbody>
              ${orders.map(ord => {
      const formattedDate = new Date(ord.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
      const formattedPrice = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(ord.total_harga);

      let badge = '';
      let actionBtn = '';

      if (ord.status === 'Menunggu Pembayaran') {
        badge = `<span class="badge-status status-pending">${ord.status}</span>`;
        actionBtn = `<button class="btn-primary" style="padding:6px 12px; font-size:11px; border-radius:8px;" onclick="app.updateOrderStatusFlow('${ord.id}', 'Diproses')">Verifikasi Pembayaran</button>`;
      } else if (ord.status === 'Diproses') {
        badge = `<span class="badge-status status-processing">${ord.status}</span>`;
        actionBtn = `<button class="btn-primary" style="padding:6px 12px; font-size:11px; border-radius:8px; background-color:#1a73e8;" onclick="app.updateOrderStatusFlow('${ord.id}', 'Dikirim')">Kirim Barang</button>`;
      } else if (ord.status === 'Dikirim') {
        badge = `<span class="badge-status status-shipping">${ord.status}</span>`;
        actionBtn = `<button class="btn-primary" style="padding:6px 12px; font-size:11px; border-radius:8px; background-color:var(--grade-a);" onclick="app.updateOrderStatusFlow('${ord.id}', 'Selesai')">Selesaikan Order</button>`;
      } else {
        badge = `<span class="badge-status status-completed">${ord.status}</span>`;
        actionBtn = `<span style="color:var(--text-secondary); font-size:12px; font-weight:600;">Transaksi Selesai</span>`;
      }

      // Retrieve customer name by user_id
      const users = window.db.getUsers();
      const u = users.find(user => user.id === ord.user_id);
      const customerName = u ? u.nama : 'Unknown';

      return `
                  <tr>
                    <td style="font-weight:600;">#${ord.id}</td>
                    <td>${formattedDate}</td>
                    <td><strong>${customerName}</strong></td>
                    <td style="font-size:12px;">${ord.metode_pembayaran}</td>
                    <td style="font-weight:600;">${formattedPrice}</td>
                    <td>${badge}</td>
                    <td style="display:flex; align-items:center; gap:8px;">
                      ${actionBtn}
                      <button class="btn-secondary" style="padding:6px 10px; font-size:11px; border-radius:8px;" onclick="app.openInvoiceModal('${ord.id}')">Cetak</button>
                    </td>
                  </tr>
                `;
    }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  updateOrderStatusFlow(orderId, nextStatus) {
    window.db.updateOrderStatus(orderId, nextStatus);
    this.showToast(`Status Order #${orderId} diubah menjadi: ${nextStatus}`, 'success');
    this.renderActiveAdminTab();
  }

  // TAB 4: CUSTOMERS DIRECTORY
  renderAdminCustomers(el) {
    const customers = window.db.getUsers().filter(u => u.role === 'customer');
    const orders = window.db.getOrders();

    el.innerHTML = `
      <div class="admin-main" style="background-color: var(--bg-secondary); border: 1px solid var(--border-color); border-radius:24px; padding: 24px;">
        <h3 style="font-size:18px; font-weight:700; margin-bottom:20px;">Daftar Pelanggan Terdaftar</h3>

        <div class="table-container" style="margin-top:0;">
          <table>
            <thead>
              <tr>
                <th>Nama Pelanggan</th>
                <th>Email</th>
                <th>Alamat Pengiriman Utama</th>
                <th>Jumlah Belanja</th>
                <th>Total Transaksi</th>
              </tr>
            </thead>
            <tbody>
              ${customers.map(c => {
      const customerOrders = orders.filter(o => o.user_id === c.id);
      const totalSpent = customerOrders.filter(o => o.status !== 'Menunggu Pembayaran').reduce((sum, o) => sum + o.total_harga, 0);
      const formattedSpent = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(totalSpent);

      return `
                  <tr>
                    <td><strong>${c.nama}</strong></td>
                    <td>${c.email}</td>
                    <td style="max-width:300px; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">${c.alamat || '-'}</td>
                    <td><strong>${customerOrders.length}</strong> pesanan</td>
                    <td style="font-weight:700; color:var(--accent);">${formattedSpent}</td>
                  </tr>
                `;
    }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // TAB 5: SALES REPORT (DAILY, MONTHLY, YEARLY BREAKDOWNS)
  renderAdminReports(el) {
    const orders = window.db.getOrders().filter(o => o.status !== 'Menunggu Pembayaran');

    // Sort transactions chronologically
    orders.sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal));

    // Daily breakdown
    const dailyData = {};
    // Monthly breakdown
    const monthlyData = {};

    orders.forEach(o => {
      const dateStr = new Date(o.tanggal).toISOString().split('T')[0];
      const monthStr = dateStr.substring(0, 7); // YYYY-MM

      dailyData[dateStr] = (dailyData[dateStr] || 0) + o.total_harga;
      monthlyData[monthStr] = (monthlyData[monthStr] || 0) + o.total_harga;
    });

    const formatRupiah = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

    // Let's create visual SVG Bar Charts for reporting
    const renderChart = (dataMap) => {
      const entries = Object.entries(dataMap);
      if (entries.length === 0) return '<p style="color:var(--text-secondary); font-size:14px;">Belum ada data grafik transaksi.</p>';

      const maxVal = Math.max(...entries.map(e => e[1]));

      return `
        <div style="display:flex; align-items:flex-end; gap:20px; height:180px; padding:20px 10px; border-bottom:1px solid var(--border-color); overflow-x:auto;">
          ${entries.map(([label, val]) => {
        const heightPct = maxVal > 0 ? (val / maxVal) * 100 : 0;
        return `
              <div style="display:flex; flex-direction:column; align-items:center; flex-grow:1; min-width:70px;">
                <span style="font-size:10px; font-weight:600; margin-bottom:4px;">${formatRupiah(val)}</span>
                <div style="width:100%; height:${heightPct * 1.2}px; max-height:120px; background-color:var(--accent); border-radius:6px 6px 0 0; transition:var(--transition-smooth);"></div>
                <span style="font-size:11px; color:var(--text-secondary); margin-top:8px; font-weight:500;">${label}</span>
              </div>
            `;
      }).join('')}
        </div>
      `;
    };

    el.innerHTML = `
      <div class="admin-main" style="background-color: var(--bg-secondary); border: 1px solid var(--border-color); border-radius:24px; padding: 24px;">
        <h3 style="font-size:18px; font-weight:700; margin-bottom:24px;">Analisis Laporan Laba Penjualan</h3>

        <!-- Chart Section -->
        <h4 style="font-size:14px; font-weight:700; text-transform:uppercase; color:var(--text-secondary); margin-bottom:12px;">Visualisasi Penjualan Bulanan</h4>
        <div style="background-color:var(--bg-primary); border:1px solid var(--border-color); border-radius:16px; padding:16px; margin-bottom:30px;">
          ${renderChart(monthlyData)}
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:24px;">
          <!-- Left list: Daily reports -->
          <div>
            <h4 style="font-size:14px; font-weight:700; text-transform:uppercase; color:var(--text-secondary); margin-bottom:12px;">Pemasukan Harian</h4>
            <div class="table-container" style="margin-top:0; max-height:250px; overflow-y:auto;">
              <table>
                <thead>
                  <tr>
                    <th>Tanggal</th>
                    <th style="text-align:right;">Total Pendapatan</th>
                  </tr>
                </thead>
                <tbody>
                  ${Object.entries(dailyData).reverse().map(([date, total]) => `
                    <tr>
                      <td><strong>${new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</strong></td>
                      <td style="text-align:right; font-weight:700; color:var(--accent);">${formatRupiah(total)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>

          <!-- Right list: Monthly reports -->
          <div>
            <h4 style="font-size:14px; font-weight:700; text-transform:uppercase; color:var(--text-secondary); margin-bottom:12px;">Pemasukan Bulanan</h4>
            <div class="table-container" style="margin-top:0; max-height:250px; overflow-y:auto;">
              <table>
                <thead>
                  <tr>
                    <th>Bulan</th>
                    <th style="text-align:right;">Total Pendapatan</th>
                  </tr>
                </thead>
                <tbody>
                  ${Object.entries(monthlyData).reverse().map(([month, total]) => {
      const [year, m] = month.split('-');
      const dateObj = new Date(year, m - 1, 1);
      const formattedMonth = dateObj.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
      return `
                      <tr>
                        <td><strong>${formattedMonth}</strong></td>
                        <td style="text-align:right; font-weight:700; color:var(--accent);">${formatRupiah(total)}</td>
                      </tr>
                    `;
    }).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // --- CRUD MODAL CONTROLS ---
  openAdminProductModal(mode, productId = null) {
    const modal = document.getElementById('admin-product-modal');
    const form = document.getElementById('admin-product-form');

    // Clear form
    form.reset();
    document.getElementById('admin-prod-id').value = '';

    if (mode === 'add') {
      document.getElementById('admin-product-modal-title').textContent = 'Tambah Produk iPhone';
      this.toggleAdminUsedSpecs('Baru');
    } else {
      document.getElementById('admin-product-modal-title').textContent = 'Ubah Detail Produk';
      const p = window.db.getProductById(productId);
      if (!p) return;

      document.getElementById('admin-prod-id').value = p.id;
      document.getElementById('admin-prod-name').value = p.nama_produk;
      document.getElementById('admin-prod-series').value = p.seri_iphone;
      document.getElementById('admin-prod-condition').value = p.kondisi;
      document.getElementById('admin-prod-price').value = p.harga;
      document.getElementById('admin-prod-storage').value = p.storage;
      document.getElementById('admin-prod-color').value = p.warna;
      document.getElementById('admin-prod-stock').value = p.stok;
      document.getElementById('admin-prod-warranty').value = p.garansi;
      document.getElementById('admin-prod-package').value = p.kelengkapan;
      document.getElementById('admin-prod-images').value = p.gambar.join('\n');
      document.getElementById('admin-prod-desc').value = p.deskripsi;

      this.toggleAdminUsedSpecs(p.kondisi);

      if (p.kondisi === 'Bekas') {
        document.getElementById('admin-prod-grade').value = p.grade;
        document.getElementById('admin-prod-bh').value = p.battery_health;
        document.getElementById('admin-prod-icloud').value = p.icloud_status.includes('Clean') ? 'Clean' : 'Locked';
        document.getElementById('admin-prod-faceid').value = p.face_id;
        document.getElementById('admin-prod-truetone').value = p.true_tone.includes('Off') ? 'Off / Rusak' : 'Normal';
        document.getElementById('admin-prod-camera-speaker').value = p.kamera.includes('Bermasalah') ? 'Kamera Bermasalah' : p.speaker.includes('Bermasalah') ? 'Speaker Bermasalah' : 'Normal';
        document.getElementById('admin-prod-imei').value = p.imei_status;
      }
    }

    modal.classList.add('active');
  }

  closeAdminProductModal() {
    document.getElementById('admin-product-modal').classList.remove('active');
  }

  toggleAdminUsedSpecs(condition) {
    const section = document.getElementById('admin-used-specs-section');
    const grade = document.getElementById('admin-prod-grade');
    const bh = document.getElementById('admin-prod-bh');
    const icloud = document.getElementById('admin-prod-icloud');
    const faceid = document.getElementById('admin-prod-faceid');
    const truetone = document.getElementById('admin-prod-truetone');
    const cameraSpeaker = document.getElementById('admin-prod-camera-speaker');
    const imei = document.getElementById('admin-prod-imei');

    if (condition === 'Bekas') {
      section.style.display = 'block';
      grade.required = true;
      bh.required = true;
      imei.required = true;
    } else {
      section.style.display = 'none';
      grade.required = false;
      bh.required = false;
      imei.required = false;
    }
  }

  handleProductSave(e) {
    e.preventDefault();

    const id = document.getElementById('admin-prod-id').value;
    const kondisi = document.getElementById('admin-prod-condition').value;

    const data = {
      nama_produk: document.getElementById('admin-prod-name').value,
      seri_iphone: document.getElementById('admin-prod-series').value,
      kondisi: kondisi,
      harga: parseFloat(document.getElementById('admin-prod-price').value),
      storage: document.getElementById('admin-prod-storage').value,
      warna: document.getElementById('admin-prod-color').value,
      stok: parseInt(document.getElementById('admin-prod-stock').value),
      garansi: document.getElementById('admin-prod-warranty').value,
      kelengkapan: document.getElementById('admin-prod-package').value,
      gambar: document.getElementById('admin-prod-images').value.split('\n').filter(url => url.trim() !== ''),
      deskripsi: document.getElementById('admin-prod-desc').value,
    };

    if (kondisi === 'Bekas') {
      data.grade = document.getElementById('admin-prod-grade').value;
      data.battery_health = parseInt(document.getElementById('admin-prod-bh').value) || 100;
      data.icloud_status = document.getElementById('admin-prod-icloud').value === 'Clean' ? 'Clean (Bebas Reset)' : 'Locked';
      data.face_id = document.getElementById('admin-prod-faceid').value;
      data.true_tone = document.getElementById('admin-prod-truetone').value === 'Normal' ? 'Normal' : 'Off (Pernah Ganti Layar)';

      const csVal = document.getElementById('admin-prod-camera-speaker').value;
      data.kamera = csVal === 'Kamera Bermasalah' ? 'Kamera Bermasalah' : 'Normal';
      data.speaker = csVal === 'Speaker Bermasalah' ? 'Speaker Bermasalah' : 'Normal';

      data.imei_status = document.getElementById('admin-prod-imei').value || 'Terdaftar Kemenperin (Sinyal On)';
    } else {
      data.grade = 'Baru';
      data.battery_health = 100;
      data.icloud_status = 'Clean';
      data.face_id = 'Normal';
      data.true_tone = 'Normal';
      data.kamera = 'Normal';
      data.speaker = 'Normal';
      data.imei_status = 'Terdaftar Kemenperin';
    }

    try {
      if (id) {
        window.db.updateProduct(id, data);
        this.showToast('Produk berhasil diperbarui!', 'success');
      } else {
        window.db.addProduct(data);
        this.showToast('Produk baru berhasil ditambahkan!', 'success');
      }
      this.closeAdminProductModal();
      this.renderActiveAdminTab();
    } catch (err) {
      this.showToast('Gagal menyimpan produk: ' + err.message, 'error');
    }
  }

  handleProductDelete(productId) {
    if (confirm('Apakah Anda yakin ingin menghapus produk ini secara permanen?')) {
      window.db.deleteProduct(productId);
      this.showToast('Produk berhasil dihapus!', 'success');
      this.renderActiveAdminTab();
    }
  }

  // --- STATIC VIEWS (ABOUT, FAQ, WARRANTY, HOW-TO-BUY, CONTACT, RETURNS) ---
  renderAbout() {
    document.getElementById('app-viewport').innerHTML = `
      <div class="static-page">
        <h1>Tentang iSTORE</h1>
        <p><strong>iSTORE</strong> adalah platform e-commerce terpercaya di Indonesia yang secara khusus berfokus pada penyediaan perangkat iPhone baru dan bekas berkualitas tinggi.</p>
        <p>Didirikan dengan visi untuk memecahkan masalah kekhawatiran pembeli saat membeli iPhone bekas di pasar sekunder, kami hadir dengan sistem standarisasi diagnosis fisik dan fungsional yang ketat dan transparan. Tidak ada lagi kekhawatiran tentang IMEI terblokir, layar tiruan yang menyembunyikan kerusakan Face ID/True Tone, ataupun status iCloud terkunci.</p>
        <h2>Keunggulan Kami</h2>
        <ul>
          <li style="margin-bottom:10px;"><strong>Transparansi 100%:</strong> Kami merinci setiap kondisi fisik grade, persentase battery health asli, serta kelengkapan box dan aksesoris bawaan.</li>
          <li style="margin-bottom:10px;"><strong>Lolos Uji Diagnostik:</strong> Tim teknisi kami melakukan pengecekan menyeluruh terhadap seluruh modul Face ID, True Tone, kamera, microphone, speaker, dan sensitivitas layar sentuh.</li>
          <li style="margin-bottom:10px;"><strong>Legalitas IMEI:</strong> Kami hanya menjual unit yang terdaftar secara resmi di database Kemenperin RI untuk menjamin sinyal aktif selamanya.</li>
        </ul>
      </div>
    `;
  }

  renderHowToBuy() {
    document.getElementById('app-viewport').innerHTML = `
      <div class="static-page">
        <h1>Cara Pembelian di iSTORE</h1>
        <p>Berbelanja produk iPhone impian Anda di iSTORE sangat mudah dan aman. Ikuti langkah praktis berikut:</p>
        
        <h2>Langkah Belanja Online:</h2>
        <ol style="margin-left: 20px; line-height: 1.8;">
          <li>Jelajahi menu <strong>Katalog</strong> untuk mencari seri iPhone baru atau bekas yang Anda inginkan.</li>
          <li>Gunakan filter di bilah samping kiri untuk memilih kapasitas penyimpanan (storage), warna kesukaan, batasan harga, atau minimal Battery Health.</li>
          <li>Klik produk untuk melihat galeri foto lengkap, hasil laporan grading bekas, dan detail fungsional perangkat.</li>
          <li>Klik <strong>Masukkan Keranjang</strong> jika telah sesuai.</li>
          <li>Buka menu keranjang di kanan atas, lakukan peninjauan jumlah, lalu klik <strong>Lanjut ke Checkout</strong>.</li>
          <li>Daftar akun baru jika belum memiliki akun, atau masuk (login) untuk mengisi alamat tujuan pengantaran Anda.</li>
          <li>Pilih metode pembayaran (Transfer Bank BCA, E-wallet QRIS/GoPay, atau Kartu Kredit) lalu buat pesanan.</li>
          <li>Lakukan pembayaran sesuai detail instruksi. Pesanan Anda akan diverifikasi oleh Admin dalam waktu kurang dari 15 menit dan segera dikirim ke kurir rekanan!</li>
        </ol>
      </div>
    `;
  }

  renderWarranty() {
    document.getElementById('app-viewport').innerHTML = `
      <div class="static-page">
        <h1>Kebijakan Garansi Produk</h1>
        <p>Kami memberikan jaminan garansi yang jelas untuk memberikan ketenangan pikiran sepenuhnya bagi seluruh pelanggan setia iSTORE.</p>
        
        <h2>1. iPhone Kondisi Baru (Segel)</h2>
        <p>Setiap iPhone baru dilindungi oleh <strong>Garansi Resmi iBox / Apple Authorized Service Provider Indonesia selama 1 Tahun</strong>. Anda dapat melakukan klaim kerusakan secara langsung ke service center resmi terdekat di seluruh kota di Indonesia dengan membawa nota pembelian dari kami.</p>

        <h2>2. iPhone Kondisi Bekas (Second)</h2>
        <p>Kami memberikan perlindungan jaminan toko internal berupa:</p>
        <ul>
          <li style="margin-bottom:8px;"><strong>Garansi Fungsional Toko:</strong> Berlaku selama 7 hari kalender sejak barang diterima. Jika ditemukan kendala fungsional mesin, kamera, Face ID, atau speaker yang tidak sesuai deskripsi, unit akan kami ganti baru atau dikembalikan uang (refund) 100%.</li>
          <li style="margin-bottom:8px;"><strong>Garansi IMEI Sinyal:</strong> Berlaku seumur hidup (lifetime). Jika suatu saat sinyal terblokir oleh operator seluler, kami berikan jaminan bantuan pembukaan blokir secara permanen atau penggantian unit.</li>
        </ul>
      </div>
    `;
  }

  renderFAQ() {
    document.getElementById('app-viewport').innerHTML = `
      <div class="static-page">
        <h1>Frequently Asked Questions (FAQ)</h1>
        
        <div class="faq-item">
          <div class="faq-question">Apakah semua iPhone bekas di iSTORE bergaransi?</div>
          <div class="faq-answer">Ya, seluruh unit iPhone bekas di iSTORE mendapatkan garansi fungsional toko selama 7 hari setelah barang diterima dan garansi IMEI sinyal aktif seumur hidup.</div>
        </div>

        <div class="faq-item">
          <div class="faq-question">Bagaimana penentuan Grade A, B, dan C untuk unit bekas?</div>
          <div class="faq-answer">Grade A memiliki kemulusan fisik 95%-100% (seperti baru tanpa lecet). Grade B memiliki kemulusan 85%-94% (ada goresan halus tipis bekas pemakaian). Grade C memiliki kemulusan 75%-84% (ada dent atau lecet terlihat namun fungsional mesin tetap bekerja normal).</div>
        </div>

        <div class="faq-item">
          <div class="faq-question">Apakah aksesoris yang didapat orisinil?</div>
          <div class="faq-answer">Untuk iPhone Baru, aksesoris di dalam box 100% orisinil pabrikan Apple. Untuk iPhone Bekas, kelengkapan disesuaikan dengan deskripsi produk (bisa berupa box OEM beserta adaptor dan kabel charger kualitas premium berkualitas tinggi).</div>
        </div>

        <div class="faq-item">
          <div class="faq-question">Apakah bisa melakukan COD (Cash on Delivery)?</div>
          <div class="faq-answer">Saat ini iSTORE memfokuskan penjualan secara online melalui transfer bank, kartu kredit, dan dompet digital terenkripsi dengan pengiriman ekspedisi berasuransi penuh ke seluruh penjuru Indonesia.</div>
        </div>
      </div>
    `;
  }

  renderContact() {
    document.getElementById('app-viewport').innerHTML = `
      <div class="static-page">
        <h1>Hubungi Layanan Kontak Kami</h1>
        <p>Ada kendala terkait pemesanan, klaim garansi toko, atau butuh bantuan konsultasi pemilihan seri iPhone? Hubungi layanan customer support iSTORE:</p>
        
        <div style="margin-top:24px; display:grid; grid-template-columns:1fr 1fr; gap:20px;">
          <div style="border: 1px solid var(--border-color); padding: 20px; border-radius: 16px;">
            <h3 style="font-size:16px; margin-bottom:8px;">Layanan WhatsApp Chat</h3>
            <p style="font-size:20px; font-weight:700; color:var(--accent);">0812-3456-7890</p>
            <p style="font-size:12px; color:var(--text-secondary); margin-top:4px;">Jam operasional: Setiap hari (08.00 - 22.00 WIB)</p>
          </div>
          <div style="border: 1px solid var(--border-color); padding: 20px; border-radius: 16px;">
            <h3 style="font-size:16px; margin-bottom:8px;">Surat Elektronik (Email)</h3>
            <p style="font-size:20px; font-weight:700; color:var(--accent);">support@istore.com</p>
            <p style="font-size:12px; color:var(--text-secondary); margin-top:4px;">Untuk pengajuan kerja sama atau keluhan garansi resmi.</p>
          </div>
        </div>
      </div>
    `;
  }

  renderReturns() {
    document.getElementById('app-viewport').innerHTML = `
      <div class="static-page">
        <h1>Kebijakan Pengembalian Barang</h1>
        <p>iSTORE berkomitmen menjaga kepuasan belanja Anda dengan memberikan jaminan pengembalian barang yang mudah dan transparan.</p>
        
        <h2>Ketentuan Pengembalian (Retur):</h2>
        <ul>
          <li style="margin-bottom:8px;">Pengembalian unit hanya dilayani jika diajukan maksimal <strong>3 hari</strong> setelah status pengiriman kurir dinyatakan diterima oleh pelanggan.</li>
          <li style="margin-bottom:8px;">Wajib menyertakan video unboxing paket utuh tanpa jeda/editing saat pertama kali membuka kiriman sebagai bukti lampiran sah.</li>
          <li style="margin-bottom:8px;">Kerusakan harus murni dari kendala fungsional internal perangkat (misal: layar bergaris tiba-tiba, kamera blur, Face ID mati) dan bukan disebabkan kelalaian pengguna seperti terjatuh, terkena air, atau dibongkar sendiri.</li>
        </ul>
      </div>
    `;
  }
}

// Global initialization
window.app = new App();
