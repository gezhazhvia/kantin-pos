// ============================================================
// App.js — Orchestrator Utama
// Inisialisasi komponen, state management, utilitas
// ============================================================

const API_BASE = 'http://localhost:3000/api';

// ---- Global State ----
const AppState = {
    cart: [],
    siswa: null,
    isScanning: false,
    isProcessing: false,
};

// ---- Utilitas Format ----
function formatRupiah(amount) {
    return 'Rp ' + Math.round(amount).toLocaleString('id-ID');
}

function formatDateTime(isoString) {
    const d = new Date(isoString);
    return d.toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });
}

// ---- Live Clock ----
function updateClock() {
    const now = new Date();
    const clockEl = document.getElementById('liveClock');
    const dateEl  = document.getElementById('liveDate');

    if (clockEl) {
        clockEl.textContent = now.toLocaleTimeString('id-ID', {
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        });
    }
    if (dateEl) {
        dateEl.textContent = now.toLocaleDateString('id-ID', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
        });
    }
}

// ---- Toast Notifications ----
function showToast(type, title, message, duration = 4000) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const icons = {
        success: '✅',
        error: '❌',
        info: 'ℹ️',
        warning: '⚠️',
    };

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span class="toast-icon">${icons[type] || 'ℹ️'}</span>
        <div class="toast-body">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('removing');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// ---- Loading Overlay ----
function showLoading(text = 'Memproses...') {
    const overlay = document.getElementById('loadingOverlay');
    const textEl  = document.getElementById('loadingText');
    if (overlay) overlay.style.display = 'flex';
    if (textEl) textEl.textContent = text;
}

function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.style.display = 'none';
}

// ---- API Helper ----
async function apiFetch(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            headers: { 'Content-Type': 'application/json' },
            ...options,
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('API Error:', error);
        return { success: false, message: 'Gagal terhubung ke server' };
    }
}

// ---- Inisialisasi Aplikasi ----
document.addEventListener('DOMContentLoaded', () => {
    console.log('🏪 Kasir Mandiri — Initializing...');

    // Start clock
    updateClock();
    setInterval(updateClock, 1000);

    // Init komponen
    initCart();
    initPayment();
    initScanner();
    initRecommendations();

    // Quick actions
    document.getElementById('btnClearCart')?.addEventListener('click', clearCart);
    document.getElementById('btnResetAll')?.addEventListener('click', resetAll);

    console.log('✅ Kasir Mandiri — Ready!');
});

// ---- Reset Semua ----
function resetAll() {
    clearCart();
    AppState.siswa = null;

    // Reset payment UI
    document.getElementById('nisInput').value = '';
    document.getElementById('pinInput').value = '';
    document.getElementById('siswaInfo').style.display = 'none';
    document.getElementById('paymentStep2').style.display = 'none';
    document.getElementById('btnBayar').disabled = true;
    document.getElementById('btnPayAmount').textContent = 'Rp 0';

    // Hide payment message
    const msg = document.getElementById('paymentMessage');
    if (msg) msg.style.display = 'none';

    showToast('info', 'Reset', 'Semua data telah direset');
}

// ---- Rekomendasi Produk ----
async function initRecommendations() {
    const recList = document.getElementById('recommendationsList');
    if (!recList) return;

    try {
        const res = await apiFetch('/barang/rekomendasi?limit=4');
        if (res && res.success && res.data.length > 0) {
            recList.innerHTML = '';
            res.data.forEach(item => {
                // Determine image
                let imgSrc = 'https://via.placeholder.com/48?text=Item';
                if (item.gambar_url) {
                    imgSrc = item.gambar_url;
                } else if (item.kategori === 'Minuman') {
                    imgSrc = 'https://cdn-icons-png.flaticon.com/512/3050/3050119.png';
                } else if (item.kategori === 'Makanan') {
                    imgSrc = 'https://cdn-icons-png.flaticon.com/512/1046/1046786.png';
                } else if (item.kategori === 'Snack') {
                    imgSrc = 'https://cdn-icons-png.flaticon.com/512/2515/2515183.png';
                }

                const recItem = document.createElement('div');
                recItem.className = 'rec-item';
                recItem.innerHTML = `
                    <img src="${imgSrc}" class="rec-img" alt="${item.nama}">
                    <div class="rec-info">
                        <span class="rec-name">${item.nama}</span>
                        <span class="rec-price">${formatRupiah(item.harga)}</span>
                    </div>
                    <button class="rec-btn" title="Tambah ke keranjang">
                        <span>+</span>
                    </button>
                `;
                
                // Add to cart on click
                recItem.addEventListener('click', () => {
                    if (typeof addToCart === 'function') {
                        addToCart(item);
                    }
                });

                recList.appendChild(recItem);
            });
        } else {
            recList.innerHTML = '<div class="recommendations-loading">Belum ada data rekomendasi.</div>';
        }
    } catch (error) {
        console.error('Error fetching recommendations:', error);
        recList.innerHTML = '<div class="recommendations-loading">Gagal memuat rekomendasi.</div>';
    }
}
