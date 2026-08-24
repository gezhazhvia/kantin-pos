// ============================================================
// API Routes
// ============================================================

const express = require('express');
const router = express.Router();

const siswaController   = require('../controllers/siswaController');
const barangController  = require('../controllers/barangController');
const checkoutController = require('../controllers/checkoutController');

// --- Siswa ---
router.get('/siswa/:nis', siswaController.getSiswaByNIS);
router.post('/topup',     siswaController.topUpSaldo);

// --- Barang ---
router.get('/barang',              barangController.getAllBarang);
router.get('/barang/rekomendasi',  barangController.getRekomendasiBarang);
router.get('/barang/label/:label', barangController.getBarangByLabel);

// --- Checkout & Transaksi ---
router.post('/checkout',           checkoutController.processCheckout);
router.get('/transaksi/:id',       checkoutController.getTransaksiDetail);
router.get('/riwayat/:nis',        checkoutController.getRiwayatTransaksi);

module.exports = router;
