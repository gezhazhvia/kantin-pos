// ============================================================
// Payment.js — Flow Pembayaran
// Input NIS → fetch saldo → validasi → checkout → struk
// ============================================================

// ---- Inisialisasi Payment ----
function initPayment() {
    const btnCari  = document.getElementById('btnCariSiswa');
    const btnBayar = document.getElementById('btnBayar');
    const nisInput = document.getElementById('nisInput');

    btnCari?.addEventListener('click', lookupSiswa);
    btnBayar?.addEventListener('click', processPayment);

    // Enter key pada NIS input
    nisInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') lookupSiswa();
    });

    // Enter key pada PIN input
    document.getElementById('pinInput')?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') processPayment();
    });
}

// ---- Lookup Siswa by NIS ----
async function lookupSiswa() {
    const nisInput = document.getElementById('nisInput');
    const nis = nisInput?.value.trim();

    if (!nis) {
        showToast('warning', 'NIS Kosong', 'Masukkan Nomor Induk Siswa terlebih dahulu');
        nisInput?.focus();
        return;
    }

    showLoading('Mencari data siswa...');

    const result = await apiFetch(`/siswa/${nis}`);

    hideLoading();

    if (result.success && result.data) {
        const siswa = result.data;
        AppState.siswa = siswa;

        // Tampilkan info siswa
        const infoEl = document.getElementById('siswaInfo');
        document.getElementById('siswaInitial').textContent = siswa.nama.charAt(0).toUpperCase();
        document.getElementById('siswaNama').textContent = siswa.nama;
        document.getElementById('siswaKelas').textContent = siswa.kelas;
        document.getElementById('siswaSaldo').textContent = formatRupiah(siswa.saldo);

        infoEl.style.display = 'flex';

        // Tampilkan step PIN
        document.getElementById('paymentStep2').style.display = 'block';
        document.getElementById('pinInput').focus();

        checkPayButtonState();

        showToast('success', 'Siswa Ditemukan', `${siswa.nama} — ${siswa.kelas}`);

    } else {
        AppState.siswa = null;
        document.getElementById('siswaInfo').style.display = 'none';
        document.getElementById('paymentStep2').style.display = 'none';
        checkPayButtonState();

        showToast('error', 'Tidak Ditemukan', result.message || 'Siswa tidak ditemukan');
    }
}

// ---- Check Pay Button State ----
function checkPayButtonState() {
    const btnBayar = document.getElementById('btnBayar');
    if (!btnBayar) return;

    const hasSiswa = AppState.siswa !== null;
    const hasItems = AppState.cart.length > 0;

    btnBayar.disabled = !(hasSiswa && hasItems);
}

// ---- Proses Pembayaran ----
async function processPayment() {
    const pin = document.getElementById('pinInput')?.value.trim();

    if (!AppState.siswa) {
        showToast('warning', 'Siswa Belum Dipilih', 'Masukkan NIS terlebih dahulu');
        return;
    }

    if (AppState.cart.length === 0) {
        showToast('warning', 'Keranjang Kosong', 'Tambahkan produk ke keranjang');
        return;
    }

    if (!pin) {
        showToast('warning', 'PIN Kosong', 'Masukkan PIN untuk konfirmasi pembayaran');
        document.getElementById('pinInput')?.focus();
        return;
    }

    // Cek saldo cukup (client-side)
    const total = getCartTotal();
    if (parseFloat(AppState.siswa.saldo) < total) {
        showPaymentMessage('error', `Saldo tidak cukup! Saldo: ${formatRupiah(AppState.siswa.saldo)}, Total: ${formatRupiah(total)}`);
        return;
    }

    // Konfirmasi
    if (!confirm(`Konfirmasi pembayaran ${formatRupiah(total)} dari saldo ${AppState.siswa.nama}?`)) {
        return;
    }

    AppState.isProcessing = true;
    showLoading('Memproses transaksi...');

    // Kirim ke backend
    const checkoutData = {
        nis: AppState.siswa.nis,
        pin: pin,
        items: AppState.cart.map(item => ({
            kode_barang: item.kode_barang,
            qty: item.qty,
        })),
    };

    const result = await apiFetch('/checkout', {
        method: 'POST',
        body: JSON.stringify(checkoutData),
    });

    hideLoading();
    AppState.isProcessing = false;

    if (result.success) {
        showToast('success', 'Transaksi Berhasil!', `Total: ${formatRupiah(result.data.total_harga)}`);
        showPaymentMessage('success', 'Transaksi berhasil! Struk sedang disiapkan...');

        // Tampilkan struk
        generateReceipt(result.data);
        showReceiptModal();

        // Update saldo display
        AppState.siswa.saldo = result.data.siswa.saldo_sesudah;
        document.getElementById('siswaSaldo').textContent = formatRupiah(result.data.siswa.saldo_sesudah);

        // Kosongkan keranjang
        AppState.cart = [];
        renderCart();
        updatePayButton();

        // Reset PIN
        document.getElementById('pinInput').value = '';

    } else {
        showToast('error', 'Transaksi Gagal', result.message);
        showPaymentMessage('error', result.message);
    }
}

// ---- Payment Message ----
function showPaymentMessage(type, message) {
    const el = document.getElementById('paymentMessage');
    if (!el) return;

    el.className = `payment-message ${type}`;
    el.textContent = message;
    el.style.display = 'block';

    // Auto-hide after 6 seconds
    setTimeout(() => {
        el.style.display = 'none';
    }, 6000);
}
