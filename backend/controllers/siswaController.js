// ============================================================
// Controller: Siswa
// CRUD siswa dan top-up saldo
// ============================================================

const pool = require('../config/database');

/**
 * GET /api/siswa/:nis
 * Lookup siswa berdasarkan NIS
 */
async function getSiswaByNIS(req, res) {
    try {
        const { nis } = req.params;

        const [rows] = await pool.execute(
            'SELECT nis, nama, kelas, saldo, foto_url FROM siswa WHERE nis = ? AND is_active = 1',
            [nis]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Siswa tidak ditemukan'
            });
        }

        return res.status(200).json({
            success: true,
            data: rows[0]
        });

    } catch (error) {
        console.error('❌ Error get siswa:', error);
        return res.status(500).json({
            success: false,
            message: 'Gagal mengambil data siswa'
        });
    }
}

/**
 * POST /api/topup
 * Top-up saldo siswa (oleh admin)
 * Body: { nis, jumlah }
 */
async function topUpSaldo(req, res) {
    const { nis, jumlah } = req.body;

    if (!nis || !jumlah || jumlah <= 0) {
        return res.status(400).json({
            success: false,
            message: 'Data tidak valid. Diperlukan: nis dan jumlah (> 0)'
        });
    }

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // Ambil saldo saat ini
        const [siswaRows] = await connection.execute(
            'SELECT nis, nama, saldo FROM siswa WHERE nis = ? AND is_active = 1',
            [nis]
        );

        if (siswaRows.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'Siswa tidak ditemukan'
            });
        }

        const saldoSebelum = parseFloat(siswaRows[0].saldo);
        const saldoSesudah = saldoSebelum + parseFloat(jumlah);

        // Update saldo
        await connection.execute(
            'UPDATE siswa SET saldo = ? WHERE nis = ?',
            [saldoSesudah, nis]
        );

        // Catat mutasi
        await connection.execute(
            `INSERT INTO mutasi_saldo 
             (nis, tipe, jumlah, saldo_sebelum, saldo_sesudah, keterangan)
             VALUES (?, 'TOP_UP', ?, ?, ?, 'Top-up saldo oleh admin')`,
            [nis, jumlah, saldoSebelum, saldoSesudah]
        );

        await connection.commit();

        return res.status(200).json({
            success: true,
            message: 'Top-up berhasil',
            data: {
                nis: siswaRows[0].nis,
                nama: siswaRows[0].nama,
                saldo_sebelum: saldoSebelum,
                jumlah_topup: parseFloat(jumlah),
                saldo_sesudah: saldoSesudah
            }
        });

    } catch (error) {
        await connection.rollback();
        console.error('❌ Error top-up:', error);
        return res.status(500).json({
            success: false,
            message: 'Gagal melakukan top-up'
        });

    } finally {
        connection.release();
    }
}

module.exports = {
    getSiswaByNIS,
    topUpSaldo
};
