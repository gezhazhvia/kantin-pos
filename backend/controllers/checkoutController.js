// ============================================================
// Controller: Checkout (Proses Transaksi)
// Menggunakan MySQL Transaction untuk menjamin atomicity
// ============================================================

const { v4: uuidv4 } = require('uuid');
const pool = require('../config/database');

/**
 * POST /api/checkout
 * Body: { nis, pin, items: [{ kode_barang, qty }] }
 *
 * Flow:
 * 1. Validasi NIS dan PIN
 * 2. Validasi saldo cukup
 * 3. Validasi stok setiap item
 * 4. INSERT transaksi header
 * 5. INSERT transaksi detail (per item)
 * 6. UPDATE stok barang (decrement)
 * 7. UPDATE saldo siswa (decrement)
 * 8. INSERT mutasi saldo
 * 9. COMMIT / ROLLBACK
 */
async function processCheckout(req, res) {
    const { nis, pin, items } = req.body;

    // --- Validasi input dasar ---
    if (!nis || !pin || !items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'Data tidak lengkap. Diperlukan: nis, pin, dan items[]'
        });
    }

    const connection = await pool.getConnection();

    try {
        // === MULAI TRANSAKSI DATABASE ===
        await connection.beginTransaction();

        // --- 1. Validasi siswa ---
        const [siswaRows] = await connection.execute(
            'SELECT nis, nama, kelas, saldo, pin FROM siswa WHERE nis = ? AND is_active = 1',
            [nis]
        );

        if (siswaRows.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'Siswa tidak ditemukan atau tidak aktif'
            });
        }

        const siswa = siswaRows[0];

        // --- 2. Validasi PIN ---
        if (siswa.pin !== pin) {
            await connection.rollback();
            return res.status(401).json({
                success: false,
                message: 'PIN salah'
            });
        }

        // --- 3. Ambil data semua barang yang dipesan ---
        const kodaBarangList = items.map(i => i.kode_barang);
        const placeholders = kodaBarangList.map(() => '?').join(',');

        const [barangRows] = await connection.execute(
            `SELECT kode_barang, nama, harga, stok 
             FROM barang 
             WHERE kode_barang IN (${placeholders}) AND is_active = 1`,
            kodaBarangList
        );

        // Buat map untuk lookup cepat
        const barangMap = {};
        barangRows.forEach(b => { barangMap[b.kode_barang] = b; });

        // --- 4. Validasi stok & hitung total ---
        let totalHarga = 0;
        let totalItem = 0;
        const detailItems = [];

        for (const item of items) {
            const barang = barangMap[item.kode_barang];

            if (!barang) {
                await connection.rollback();
                return res.status(404).json({
                    success: false,
                    message: `Barang ${item.kode_barang} tidak ditemukan`
                });
            }

            if (barang.stok < item.qty) {
                await connection.rollback();
                return res.status(400).json({
                    success: false,
                    message: `Stok ${barang.nama} tidak cukup (tersisa: ${barang.stok})`
                });
            }

            const subtotal = parseFloat(barang.harga) * item.qty;
            totalHarga += subtotal;
            totalItem += item.qty;

            detailItems.push({
                kode_barang: barang.kode_barang,
                nama_barang: barang.nama,
                harga_satuan: barang.harga,
                qty: item.qty,
                subtotal: subtotal
            });
        }

        // --- 5. Validasi saldo cukup ---
        const saldoSebelum = parseFloat(siswa.saldo);
        if (saldoSebelum < totalHarga) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: `Saldo tidak cukup. Saldo: Rp ${saldoSebelum.toLocaleString('id-ID')}, Total: Rp ${totalHarga.toLocaleString('id-ID')}`
            });
        }

        // --- 6. INSERT header transaksi ---
        const transaksiId = uuidv4();

        await connection.execute(
            `INSERT INTO transaksi (id, nis, total_harga, total_item, status)
             VALUES (?, ?, ?, ?, 'SUCCESS')`,
            [transaksiId, nis, totalHarga, totalItem]
        );

        // --- 7. INSERT detail transaksi ---
        for (const detail of detailItems) {
            await connection.execute(
                `INSERT INTO transaksi_detail 
                 (transaksi_id, kode_barang, nama_barang, harga_satuan, qty, subtotal)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    transaksiId,
                    detail.kode_barang,
                    detail.nama_barang,
                    detail.harga_satuan,
                    detail.qty,
                    detail.subtotal
                ]
            );
        }

        // --- 8. UPDATE stok barang ---
        for (const item of items) {
            await connection.execute(
                'UPDATE barang SET stok = stok - ? WHERE kode_barang = ?',
                [item.qty, item.kode_barang]
            );
        }

        // --- 9. UPDATE saldo siswa ---
        const saldoSesudah = saldoSebelum - totalHarga;

        await connection.execute(
            'UPDATE siswa SET saldo = ? WHERE nis = ?',
            [saldoSesudah, nis]
        );

        // --- 10. INSERT mutasi saldo ---
        await connection.execute(
            `INSERT INTO mutasi_saldo 
             (nis, tipe, jumlah, saldo_sebelum, saldo_sesudah, referensi_id, keterangan)
             VALUES (?, 'PAYMENT', ?, ?, ?, ?, ?)`,
            [
                nis,
                totalHarga,
                saldoSebelum,
                saldoSesudah,
                transaksiId,
                `Pembelian ${totalItem} item di kantin`
            ]
        );

        // === COMMIT TRANSAKSI ===
        await connection.commit();

        // --- Response sukses ---
        return res.status(200).json({
            success: true,
            message: 'Transaksi berhasil!',
            data: {
                transaksi_id: transaksiId,
                siswa: {
                    nis: siswa.nis,
                    nama: siswa.nama,
                    kelas: siswa.kelas,
                    saldo_sebelum: saldoSebelum,
                    saldo_sesudah: saldoSesudah
                },
                items: detailItems,
                total_harga: totalHarga,
                total_item: totalItem,
                waktu: new Date().toISOString()
            }
        });

    } catch (error) {
        // ROLLBACK jika terjadi error
        await connection.rollback();
        console.error('❌ Error checkout:', error);

        return res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server saat memproses transaksi',
            error: error.message
        });

    } finally {
        connection.release();
    }
}

/**
 * GET /api/transaksi/:id
 * Ambil detail transaksi (untuk struk)
 */
async function getTransaksiDetail(req, res) {
    try {
        const { id } = req.params;

        // Header transaksi + data siswa
        const [trxRows] = await pool.execute(
            `SELECT t.*, s.nama AS nama_siswa, s.kelas
             FROM transaksi t
             JOIN siswa s ON t.nis = s.nis
             WHERE t.id = ?`,
            [id]
        );

        if (trxRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Transaksi tidak ditemukan'
            });
        }

        // Detail items
        const [detailRows] = await pool.execute(
            'SELECT * FROM transaksi_detail WHERE transaksi_id = ?',
            [id]
        );

        return res.status(200).json({
            success: true,
            data: {
                ...trxRows[0],
                items: detailRows
            }
        });

    } catch (error) {
        console.error('❌ Error get transaksi:', error);
        return res.status(500).json({
            success: false,
            message: 'Gagal mengambil data transaksi'
        });
    }
}

/**
 * GET /api/riwayat/:nis
 * Riwayat transaksi siswa
 */
async function getRiwayatTransaksi(req, res) {
    try {
        const { nis } = req.params;

        const [rows] = await pool.execute(
            `SELECT t.id, t.total_harga, t.total_item, t.status, t.created_at
             FROM transaksi t
             WHERE t.nis = ?
             ORDER BY t.created_at DESC
             LIMIT 50`,
            [nis]
        );

        return res.status(200).json({
            success: true,
            data: rows
        });

    } catch (error) {
        console.error('❌ Error riwayat:', error);
        return res.status(500).json({
            success: false,
            message: 'Gagal mengambil riwayat transaksi'
        });
    }
}

module.exports = {
    processCheckout,
    getTransaksiDetail,
    getRiwayatTransaksi
};
