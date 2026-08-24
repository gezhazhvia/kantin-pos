// ============================================================
// Cart.js — Manajemen Keranjang Belanja
// Add, remove, update qty, hitung total
// ============================================================

// ---- Inisialisasi Cart ----
function initCart() {
    renderCart();
}

// ---- Tambah Barang ke Cart ----
function addToCart(barang) {
    const existing = AppState.cart.find(item => item.kode_barang === barang.kode_barang);

    if (existing) {
        // Jika sudah ada, tambah qty
        if (existing.qty < barang.stok) {
            existing.qty += 1;
            existing.subtotal = existing.qty * parseFloat(existing.harga);
        } else {
            showToast('warning', 'Batas Stok', `Stok ${barang.nama} tersisa ${barang.stok}`);
            return;
        }
    } else {
        // Tambah item baru
        AppState.cart.push({
            kode_barang: barang.kode_barang,
            nama: barang.nama,
            harga: parseFloat(barang.harga),
            qty: 1,
            subtotal: parseFloat(barang.harga),
            stok: barang.stok,
        });
    }

    renderCart();
    updatePayButton();
}

// ---- Update Qty ----
function updateCartQty(kodeBarang, delta) {
    const item = AppState.cart.find(i => i.kode_barang === kodeBarang);
    if (!item) return;

    const newQty = item.qty + delta;

    if (newQty <= 0) {
        removeFromCart(kodeBarang);
        return;
    }

    if (newQty > item.stok) {
        showToast('warning', 'Batas Stok', `Stok ${item.nama} tersisa ${item.stok}`);
        return;
    }

    item.qty = newQty;
    item.subtotal = item.qty * item.harga;
    renderCart();
    updatePayButton();
}

// ---- Hapus Item dari Cart ----
function removeFromCart(kodeBarang) {
    AppState.cart = AppState.cart.filter(i => i.kode_barang !== kodeBarang);
    renderCart();
    updatePayButton();
}

// ---- Kosongkan Cart ----
function clearCart() {
    AppState.cart = [];
    renderCart();
    updatePayButton();
    showToast('info', 'Keranjang Dikosongkan', 'Semua item telah dihapus');
}

// ---- Hitung Total ----
function getCartTotal() {
    return AppState.cart.reduce((sum, item) => sum + item.subtotal, 0);
}

function getCartItemCount() {
    return AppState.cart.reduce((sum, item) => sum + item.qty, 0);
}

// ---- Render Cart ----
function renderCart() {
    const container = document.getElementById('cartItems');
    const emptyEl   = document.getElementById('cartEmpty');
    const summaryEl = document.getElementById('cartSummary');
    const countEl   = document.getElementById('cartCount');

    if (!container) return;

    const count = getCartItemCount();
    const total = getCartTotal();

    // Update count badge
    if (countEl) countEl.textContent = count;

    if (AppState.cart.length === 0) {
        // Tampilkan empty state
        if (emptyEl) emptyEl.style.display = 'flex';
        if (summaryEl) summaryEl.style.display = 'none';

        // Hapus semua cart items (bukan empty state)
        container.querySelectorAll('.cart-item').forEach(el => el.remove());
        return;
    }

    // Sembunyikan empty state
    if (emptyEl) emptyEl.style.display = 'none';

    // Render items
    const itemsHTML = AppState.cart.map(item => `
        <div class="cart-item" data-kode="${item.kode_barang}">
            <div class="cart-item-info">
                <div class="cart-item-name">${item.nama}</div>
                <div class="cart-item-price">${formatRupiah(item.harga)} / pcs</div>
            </div>
            <div class="cart-item-qty">
                <button onclick="updateCartQty('${item.kode_barang}', -1)" title="Kurang">−</button>
                <span>${item.qty}</span>
                <button onclick="updateCartQty('${item.kode_barang}', 1)" title="Tambah">+</button>
            </div>
            <div class="cart-item-subtotal">${formatRupiah(item.subtotal)}</div>
            <button class="cart-item-remove" onclick="removeFromCart('${item.kode_barang}')" title="Hapus">
                ✕
            </button>
        </div>
    `).join('');

    // Preserve empty state element, replace items
    container.querySelectorAll('.cart-item').forEach(el => el.remove());
    container.insertAdjacentHTML('beforeend', itemsHTML);

    // Show summary
    if (summaryEl) {
        summaryEl.style.display = 'block';
        document.getElementById('subtotalDisplay').textContent = formatRupiah(total);
        document.getElementById('totalDisplay').textContent = formatRupiah(total);
    }
}

// ---- Update Pay Button Amount ----
function updatePayButton() {
    const total = getCartTotal();
    const btnAmount = document.getElementById('btnPayAmount');
    if (btnAmount) {
        btnAmount.textContent = formatRupiah(total);
    }

    // Enable/disable bayar button
    checkPayButtonState();
}
