// ============================================================
// Receipt.js — Generate & Cetak Struk
// HTML receipt + window.print() dengan format thermal printer
// ============================================================

// ---- Generate Receipt HTML ----
function generateReceipt(transactionData) {
    const receiptEl = document.getElementById('receiptContent');
    if (!receiptEl) return;

    const { transaksi_id, siswa, items, total_harga, total_item, waktu } = transactionData;

    // Format waktu
    const trxDate = new Date(waktu);
    const dateStr = trxDate.toLocaleDateString('id-ID', {
        day: '2-digit', month: 'short', year: 'numeric'
    });
    const timeStr = trxDate.toLocaleTimeString('id-ID', {
        hour: '2-digit', minute: '2-digit', second: '2-digit'
    });

    // Short transaction ID
    const shortId = transaksi_id.substring(0, 8).toUpperCase();

    receiptEl.innerHTML = `
        <!-- Header Struk -->
        <div class="receipt-header">
            <h3>🏪 KANTIN SEKOLAH</h3>
            <p>Jl. Pendidikan No. 1</p>
            <p>Kasir Mandiri — Self Service POS</p>
        </div>

        <!-- Info Transaksi -->
        <div class="receipt-meta">
            <div class="receipt-meta-row">
                <span class="label">No. Trx</span>
                <span>#${shortId}</span>
            </div>
            <div class="receipt-meta-row">
                <span class="label">Tanggal</span>
                <span>${dateStr}</span>
            </div>
            <div class="receipt-meta-row">
                <span class="label">Jam</span>
                <span>${timeStr}</span>
            </div>
            <div class="receipt-meta-row">
                <span class="label">Siswa</span>
                <span>${siswa.nama}</span>
            </div>
            <div class="receipt-meta-row">
                <span class="label">NIS</span>
                <span>${siswa.nis}</span>
            </div>
            <div class="receipt-meta-row">
                <span class="label">Kelas</span>
                <span>${siswa.kelas}</span>
            </div>
        </div>

        <!-- Detail Item -->
        <div class="receipt-items">
            ${items.map(item => `
                <div class="receipt-item">
                    <div>
                        <div class="receipt-item-name">${item.nama_barang}</div>
                        <div class="receipt-item-detail">
                            ${item.qty} x ${formatRupiah(item.harga_satuan)}
                        </div>
                    </div>
                    <div class="receipt-item-subtotal">${formatRupiah(item.subtotal)}</div>
                </div>
            `).join('')}
        </div>

        <!-- Total -->
        <div class="receipt-total">
            <span>TOTAL (${total_item} item)</span>
            <span>${formatRupiah(total_harga)}</span>
        </div>

        <!-- Saldo Info -->
        <div class="receipt-saldo">
            <span>Saldo Sebelum</span>
            <span>${formatRupiah(siswa.saldo_sebelum)}</span>
        </div>
        <div class="receipt-saldo">
            <span>Pembayaran</span>
            <span>- ${formatRupiah(total_harga)}</span>
        </div>
        <div class="receipt-saldo" style="font-weight:700; color:#111; font-size:12px;">
            <span>Saldo Sesudah</span>
            <span>${formatRupiah(siswa.saldo_sesudah)}</span>
        </div>

        <!-- Footer -->
        <div class="receipt-footer">
            <p>Pembayaran: Saldo Digital (Cashless)</p>
            <p>──────────────────</p>
            <p>Terima kasih atas kunjungan Anda!</p>
            <p>Barang yang sudah dibeli tidak dapat</p>
            <p>dikembalikan kecuali cacat/rusak.</p>
            <p>──────────────────</p>
            <p style="margin-top: 8px; font-size: 10px;">
                Powered by Kasir Mandiri POS v1.0
            </p>
        </div>
    `;
}

// ---- Tampilkan Modal Struk ----
function showReceiptModal() {
    const modal = document.getElementById('receiptModal');
    if (modal) modal.style.display = 'flex';

    // Bind tombol
    document.getElementById('btnPrintReceipt')?.addEventListener('click', printReceipt);
    document.getElementById('btnCloseReceipt')?.addEventListener('click', closeReceiptModal);
}

// ---- Tutup Modal Struk ----
function closeReceiptModal() {
    const modal = document.getElementById('receiptModal');
    if (modal) modal.style.display = 'none';
}

// ---- Cetak Struk ----
function printReceipt() {
    window.print();
}
