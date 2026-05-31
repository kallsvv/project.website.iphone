// Database Module for iSTORE E-Commerce
// Handles data storage inside LocalStorage and simulates DB operations

const DB_KEYS = {
  USERS: 'istore_users',
  PRODUCTS: 'istore_products',
  ORDERS: 'istore_orders',
  CURRENT_USER: 'istore_current_user'
};

// Initial Seed Data
const DEFAULT_PRODUCTS = [
  {
    id: 'prod-001',
    nama_produk: 'iPhone 15 Pro Max 256GB - Baru',
    seri_iphone: 'iPhone 15',
    kondisi: 'Baru',
    grade: 'Baru', // Baru / A / B / C
    harga: 22499000,
    storage: '256GB',
    warna: 'Titanium Alami',
    battery_health: 100,
    face_id: 'Normal',
    true_tone: 'Normal',
    kamera: 'Normal',
    speaker: 'Normal',
    imei_status: 'Terdaftar Kemenperin',
    icloud_status: 'Clean',
    stok: 12,
    deskripsi: 'iPhone 15 Pro Max Baru Segel Garansi Resmi iBox Indonesia 1 Tahun. Super Retina XDR display, Titanium design, A17 Pro Chip, 5x Telephoto camera.',
    gambar: [
      'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1695048133038-f9b7c251d182?auto=format&fit=crop&w=600&q=80'
    ],
    garansi: '1 Tahun Garansi Resmi iBox',
    kelengkapan: 'Box Original, Kabel USB-C ke USB-C, Buku Panduan'
  },
  {
    id: 'prod-002',
    nama_produk: 'iPhone 14 Pro 128GB - Deep Purple (Bekas Grade A)',
    seri_iphone: 'iPhone 14',
    kondisi: 'Bekas',
    grade: 'A',
    harga: 14299000,
    storage: '128GB',
    warna: 'Deep Purple',
    battery_health: 96,
    face_id: 'Normal',
    true_tone: 'Normal',
    kamera: 'Normal',
    speaker: 'Normal',
    imei_status: 'Terdaftar Kemenperin (Sinyal On)',
    icloud_status: 'Clean (Bebas Reset)',
    stok: 3,
    deskripsi: 'iPhone 14 Pro Bekas Pemakaian Sendiri. Kondisi fisik sangat mulus 98%, fungsionalitas 100% normal lancar jaya. Kamera jernih, sensor Face ID responsif.',
    gambar: [
      'https://images.unsplash.com/photo-1678685888221-cda773a3dcdb?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1678685888277-3a1ec4e50882?auto=format&fit=crop&w=600&q=80'
    ],
    garansi: '7 Hari Garansi Toko (iSTORE)',
    kelengkapan: 'Box OEM, Kabel Lightning to USB-C (Free Adaptor Charger)'
  },
  {
    id: 'prod-003',
    nama_produk: 'iPhone 13 128GB - Midnight (Bekas Grade B)',
    seri_iphone: 'iPhone 13',
    kondisi: 'Bekas',
    grade: 'B',
    harga: 8899000,
    storage: '128GB',
    warna: 'Midnight',
    battery_health: 87,
    face_id: 'Normal',
    true_tone: 'Normal',
    kamera: 'Normal',
    speaker: 'Normal',
    imei_status: 'Terdaftar Kemenperin (Sinyal On)',
    icloud_status: 'Clean (Bebas Reset)',
    stok: 5,
    deskripsi: 'iPhone 13 Bekas kondisi mulus sekitar 90-95% (ada sedikit lecet halus pemakaian wajar di bagian bezel). iCloud aman bebas reset, unit 100% original bukan rekondisi.',
    gambar: [
      'https://images.unsplash.com/photo-1632661674596-df8be070a5c5?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=600&q=80'
    ],
    garansi: '7 Hari Garansi Toko (iSTORE)',
    kelengkapan: 'Kabel Charger, Box Standard Toko'
  },
  {
    id: 'prod-004',
    nama_produk: 'iPhone 11 64GB - White (Bekas Grade C)',
    seri_iphone: 'iPhone 11',
    kondisi: 'Bekas',
    grade: 'C',
    harga: 4599000,
    storage: '64GB',
    warna: 'White',
    battery_health: 79,
    face_id: 'Normal',
    true_tone: 'Off (Pernah Ganti Layar)',
    kamera: 'Normal',
    speaker: 'Normal',
    imei_status: 'Sinyal Smartfren Only (IMEI Web Resmi)',
    icloud_status: 'Clean (Bebas Reset)',
    stok: 2,
    deskripsi: 'iPhone 11 Bekas kondisi fisik 80-85% (ada dent di pojok bawah, True Tone Off karena pergantian LCD sebelumnya). Mesin dan fungsional lain dijamin 100% normal. Cocok untuk HP cadangan.',
    gambar: [
      'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=600&q=80'
    ],
    garansi: '3 Hari Garansi Toko (iSTORE)',
    kelengkapan: 'Hanya Unit (Batangan / Charger OEM)'
  },
  {
    id: 'prod-005',
    nama_produk: 'iPhone 15 Pro 128GB - Blue Titanium (Baru)',
    seri_iphone: 'iPhone 15',
    kondisi: 'Baru',
    grade: 'Baru',
    harga: 18999000,
    storage: '128GB',
    warna: 'Blue Titanium',
    battery_health: 100,
    face_id: 'Normal',
    true_tone: 'Normal',
    kamera: 'Normal',
    speaker: 'Normal',
    imei_status: 'Terdaftar Kemenperin',
    icloud_status: 'Clean',
    stok: 8,
    deskripsi: 'iPhone 15 Pro 128GB Segel Baru Garansi iBox Indonesia 1 Tahun. Menggunakan A17 Pro Chip, bezel Titanium ringan, serta tombol Action Button multifungsi.',
    gambar: [
      'https://images.unsplash.com/photo-1695048133038-f9b7c251d182?auto=format&fit=crop&w=600&q=80'
    ],
    garansi: '1 Tahun Garansi Resmi iBox',
    kelengkapan: 'Box Original, Kabel USB-C ke USB-C, Buku Panduan'
  },
  {
    id: 'prod-006',
    nama_produk: 'iPhone 12 Pro Max 256GB - Pacific Blue (Bekas Grade A)',
    seri_iphone: 'iPhone 12',
    kondisi: 'Bekas',
    grade: 'A',
    harga: 11499000,
    storage: '256GB',
    warna: 'Pacific Blue',
    battery_health: 91,
    face_id: 'Normal',
    true_tone: 'Normal',
    kamera: 'Normal',
    speaker: 'Normal',
    imei_status: 'Terdaftar Kemenperin (Sinyal On)',
    icloud_status: 'Clean (Bebas Reset)',
    stok: 4,
    deskripsi: 'iPhone 12 Pro Max bekas kondisi premium 97% mulus. Layar lebar OLED 6.7 inci, kamera dengan LiDAR Scanner, sangat cocok untuk fotografer mobile.',
    gambar: [
      'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=600&q=80'
    ],
    garansi: '7 Hari Garansi Toko (iSTORE)',
    kelengkapan: 'Box Original, Kabel Lightning'
  }
];

const DEFAULT_USERS = [
  {
    id: 'user-admin',
    nama: 'Admin iSTORE',
    email: 'admin@istore.com',
    password: 'admin123', // In a real app we would hash passwords
    alamat: 'iSTORE Headquarter, Jakarta, Indonesia',
    role: 'admin'
  },
  {
    id: 'user-cust1',
    nama: 'Budi Santoso',
    email: 'user@istore.com',
    password: 'user123',
    alamat: 'Jl. Merdeka No. 45, Kebayoran Baru, Jakarta Selatan',
    role: 'customer'
  }
];

const DEFAULT_ORDERS = [
  {
    id: 'ord-1001',
    user_id: 'user-cust1',
    tanggal: '2026-05-28T14:30:00Z',
    total_harga: 14299000,
    status: 'Selesai', // Menunggu Pembayaran, Diproses, Dikirim, Selesai
    alamat_pengiriman: 'Jl. Merdeka No. 45, Kebayoran Baru, Jakarta Selatan',
    metode_pembayaran: 'Bank Transfer (BCA)',
    detail_barang: [
      {
        product_id: 'prod-002',
        nama_produk: 'iPhone 14 Pro 128GB - Deep Purple (Bekas Grade A)',
        harga: 14299000,
        quantity: 1,
        subtotal: 14299000
      }
    ]
  },
  {
    id: 'ord-1002',
    user_id: 'user-cust1',
    tanggal: '2026-05-30T09:15:00Z',
    total_harga: 8899000,
    status: 'Diproses',
    alamat_pengiriman: 'Jl. Merdeka No. 45, Kebayoran Baru, Jakarta Selatan',
    metode_pembayaran: 'GoPay',
    detail_barang: [
      {
        product_id: 'prod-003',
        nama_produk: 'iPhone 13 128GB - Midnight (Bekas Grade B)',
        harga: 8899000,
        quantity: 1,
        subtotal: 8899000
      }
    ]
  }
];

class Database {
  constructor() {
    this.init();
  }

  init() {
    if (!localStorage.getItem(DB_KEYS.PRODUCTS)) {
      localStorage.setItem(DB_KEYS.PRODUCTS, JSON.stringify(DEFAULT_PRODUCTS));
    }
    if (!localStorage.getItem(DB_KEYS.USERS)) {
      localStorage.setItem(DB_KEYS.USERS, JSON.stringify(DEFAULT_USERS));
    }
    if (!localStorage.getItem(DB_KEYS.ORDERS)) {
      localStorage.setItem(DB_KEYS.ORDERS, JSON.stringify(DEFAULT_ORDERS));
    }
  }

  // --- PRODUCTS ---
  getProducts() {
    return JSON.parse(localStorage.getItem(DB_KEYS.PRODUCTS)) || [];
  }

  saveProducts(products) {
    localStorage.setItem(DB_KEYS.PRODUCTS, JSON.stringify(products));
  }

  getProductById(id) {
    return this.getProducts().find(p => p.id === id);
  }

  addProduct(product) {
    const products = this.getProducts();
    const newProduct = {
      ...product,
      id: `prod-${Date.now()}`
    };
    products.push(newProduct);
    this.saveProducts(products);
    return newProduct;
  }

  updateProduct(id, updatedData) {
    const products = this.getProducts();
    const index = products.findIndex(p => p.id === id);
    if (index !== -1) {
      products[index] = { ...products[index], ...updatedData };
      this.saveProducts(products);
      return products[index];
    }
    return null;
  }

  deleteProduct(id) {
    let products = this.getProducts();
    products = products.filter(p => p.id !== id);
    this.saveProducts(products);
    return true;
  }

  // --- USERS & AUTH ---
  getUsers() {
    return JSON.parse(localStorage.getItem(DB_KEYS.USERS)) || [];
  }

  saveUsers(users) {
    localStorage.setItem(DB_KEYS.USERS, JSON.stringify(users));
  }

  register(nama, email, password, alamat = '') {
    const users = this.getUsers();
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error('Email sudah terdaftar!');
    }
    const newUser = {
      id: `user-${Date.now()}`,
      nama,
      email: email.toLowerCase(),
      password, // Plain text simulation
      alamat,
      role: 'customer'
    };
    users.push(newUser);
    this.saveUsers(users);
    this.setCurrentUser(newUser);
    return newUser;
  }

  login(email, password) {
    const users = this.getUsers();
    const user = users.find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );
    if (!user) {
      throw new Error('Email atau password salah!');
    }
    this.setCurrentUser(user);
    return user;
  }

  logout() {
    localStorage.removeItem(DB_KEYS.CURRENT_USER);
  }

  getCurrentUser() {
    return JSON.parse(localStorage.getItem(DB_KEYS.CURRENT_USER)) || null;
  }

  setCurrentUser(user) {
    localStorage.setItem(DB_KEYS.CURRENT_USER, JSON.stringify(user));
  }

  updateProfile(id, data) {
    const users = this.getUsers();
    const index = users.findIndex(u => u.id === id);
    if (index !== -1) {
      users[index] = { ...users[index], ...data };
      this.saveUsers(users);

      const curr = this.getCurrentUser();
      if (curr && curr.id === id) {
        this.setCurrentUser(users[index]);
      }
      return users[index];
    }
    return null;
  }

  resetPassword(email, newPassword) {
    const users = this.getUsers();
    const index = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
    if (index !== -1) {
      users[index].password = newPassword;
      this.saveUsers(users);
      return true;
    }
    throw new Error('Email tidak ditemukan!');
  }

  // --- ORDERS ---
  getOrders() {
    return JSON.parse(localStorage.getItem(DB_KEYS.ORDERS)) || [];
  }

  saveOrders(orders) {
    localStorage.setItem(DB_KEYS.ORDERS, JSON.stringify(orders));
  }

  createOrder(userId, items, deliveryAddress, paymentMethod) {
    const orders = this.getOrders();
    const products = this.getProducts();

    // Validate stock
    const detailBarang = [];
    let totalHarga = 0;

    for (const item of items) {
      const product = products.find(p => p.id === item.productId);
      if (!product) throw new Error('Produk tidak ditemukan!');
      if (product.stok < item.quantity) {
        throw new Error(`Stok ${product.nama_produk} tidak mencukupi! Sisa stok: ${product.stok}`);
      }

      // Deduct stock
      product.stok -= item.quantity;

      const subtotal = product.harga * item.quantity;
      totalHarga += subtotal;

      detailBarang.push({
        product_id: product.id,
        nama_produk: product.nama_produk,
        harga: product.harga,
        quantity: item.quantity,
        subtotal: subtotal
      });
    }

    // Save updated stock
    this.saveProducts(products);

    const newOrder = {
      id: `ord-${Math.floor(1000 + Math.random() * 9000)}`,
      user_id: userId,
      tanggal: new Date().toISOString(),
      total_harga: totalHarga,
      status: 'Menunggu Pembayaran',
      alamat_pengiriman: deliveryAddress,
      metode_pembayaran: paymentMethod,
      detail_barang: detailBarang
    };

    orders.push(newOrder);
    this.saveOrders(orders);
    return newOrder;
  }

  getUserOrders(userId) {
    return this.getOrders()
      .filter(o => o.user_id === userId)
      .sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
  }

  updateOrderStatus(orderId, status) {
    const orders = this.getOrders();
    const index = orders.findIndex(o => o.id === orderId);
    if (index !== -1) {
      orders[index].status = status;
      this.saveOrders(orders);
      return orders[index];
    }
    return null;
  }

  getSalesSummary() {
    const orders = this.getOrders();
    // Filter out waiting orders from successful revenue, only count Diproses, Dikirim, Selesai
    const activeOrders = orders.filter(o => o.status !== 'Menunggu Pembayaran');
    const totalSales = activeOrders.reduce((sum, o) => sum + o.total_harga, 0);
    const totalOrdersCount = orders.length;
    const totalProductsCount = this.getProducts().length;
    const totalCustomersCount = this.getUsers().filter(u => u.role === 'customer').length;

    return {
      totalSales,
      totalOrdersCount,
      totalProductsCount,
      totalCustomersCount
    };
  }
}

// Export database instance
window.db = new Database();
