// ============================================================
// Controller: Barang
// CRUD barang dan lookup berdasarkan AI label
// ============================================================

const pool = require('../config/database');

/**
 * GET /api/barang
 * List semua barang aktif
 */
async function getAllBarang(req, res) {
    try {
        const [rows] = await pool.execute(
            `SELECT kode_barang, nama, harga, stok, ai_label, kategori, gambar_url
             FROM barang
             WHERE is_active = 1
             ORDER BY kategori, nama`
        );

        return res.status(200).json({
            success: true,
            data: rows
        });

    } catch (error) {
        console.error('❌ Error get barang:', error);
        return res.status(500).json({
            success: false,
            message: 'Gagal mengambil data barang'
        });
    }
}

/**
 * GET /api/barang/label/:label
 * Cari barang berdasarkan AI label (dari Teachable Machine)
 */
async function getBarangByLabel(req, res) {
    try {
        const { label } = req.params;

        const [rows] = await pool.execute(
            `SELECT kode_barang, nama, harga, stok, ai_label, kategori, gambar_url
             FROM barang
             WHERE ai_label = ? AND is_active = 1`,
            [label]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: `Barang dengan label AI "${label}" tidak ditemukan`
            });
        }

        return res.status(200).json({
            success: true,
            data: rows[0]
        });

    } catch (error) {
        console.error('❌ Error get barang by label:', error);
        return res.status(500).json({
            success: false,
            message: 'Gagal mengambil data barang'
        });
    }
}

/**
 * GET /api/barang/rekomendasi
 * Ambil daftar barang yang paling sering dibeli
 */
async function getRekomendasiBarang(req, res) {
    try {
        const limit = parseInt(req.query.limit) || 4;

        // Query: Join transaksi_detail dan barang, hitung total qty per barang
        const [rows] = await pool.execute(
            `SELECT b.kode_barang, b.nama, b.harga, b.stok, b.ai_label, b.kategori, b.gambar_url, COALESCE(SUM(td.qty), 0) as total_terjual
             FROM barang b
             LEFT JOIN transaksi_detail td ON b.kode_barang = td.kode_barang
             WHERE b.is_active = 1
             GROUP BY b.kode_barang
             ORDER BY total_terjual DESC
             LIMIT ${limit}`
        );

        return res.status(200).json({
            success: true,
            data: rows
        });

    } catch (error) {
        console.error('❌ Error get rekomendasi barang:', error);
        return res.status(500).json({
            success: false,
            message: 'Gagal mengambil data rekomendasi barang'
        });
    }
}

module.exports = {
    getAllBarang,
    getBarangByLabel,
    getRekomendasiBarang
};
