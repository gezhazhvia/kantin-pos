-- ============================================================
-- KASIR MANDIRI (Self-Service POS) — Seed Data
-- Jalankan setelah schema.sql
-- ============================================================

USE kantin_pos;

-- ============================================================
-- DATA SISWA (5 siswa dengan saldo awal)
-- ============================================================
INSERT INTO siswa (nis, nama, kelas, saldo, pin) VALUES
('240001', 'Ahmad Rizky Pratama',   'XII-IPA-1', 150000.00, '123456'),
('240002', 'Siti Nurhaliza',        'XI-IPA-2',   85000.00, '234567'),
('240003', 'Budi Santoso',          'X-IPS-1',   200000.00, '345678'),
('240004', 'Dewi Lestari',          'XII-IPA-3',  50000.00, '456789'),
('240005', 'Farhan Maulana',        'XI-IPS-2',  120000.00, '567890');

-- ============================================================
-- DATA BARANG (12 produk kantin)
-- Kolom ai_label HARUS cocok dengan label di model Teachable Machine
-- ============================================================
INSERT INTO barang (kode_barang, nama, harga, stok, ai_label, kategori) VALUES
('MKN001', 'Nasi Goreng',          15000.00, 50, 'nasi_goreng',       'Makanan'),
('MKN002', 'Mie Goreng',           12000.00, 40, 'mie_goreng',        'Makanan'),
('MKN003', 'Roti Cokelat',          5000.00, 80, 'roti_cokelat',      'Roti'),
('MKN004', 'Roti Keju',             6000.00, 60, 'roti_keju',         'Roti'),
('MKN005', 'Sate Ayam',            18000.00, 30, 'sate_ayam',         'Makanan'),
('MNM001', 'Es Teh Manis',          4000.00, 100, 'es_teh',           'Minuman'),
('MNM002', 'Jus Jeruk',             8000.00, 45, 'jus_jeruk',         'Minuman'),
('MNM003', 'Air Mineral 600ml',     3000.00, 200, 'air_mineral',      'Minuman'),
('MNM004', 'Susu Kotak Cokelat',    5000.00, 75, 'susu_kotak',        'Minuman'),
('SNK001', 'Keripik Singkong',      7000.00, 60, 'keripik_singkong',  'Snack'),
('SNK002', 'Kacang Kulit',          6000.00, 50, 'kacang_kulit',      'Snack'),
('SNK003', 'Pisang Goreng',         5000.00, 40, 'pisang_goreng',     'Snack');

-- ============================================================
-- DATA MUTASI AWAL (Top-up pertama masing-masing siswa)
-- ============================================================
INSERT INTO mutasi_saldo (nis, tipe, jumlah, saldo_sebelum, saldo_sesudah, keterangan) VALUES
('240001', 'TOP_UP', 150000.00, 0.00, 150000.00, 'Saldo awal'),
('240002', 'TOP_UP',  85000.00, 0.00,  85000.00, 'Saldo awal'),
('240003', 'TOP_UP', 200000.00, 0.00, 200000.00, 'Saldo awal'),
('240004', 'TOP_UP',  50000.00, 0.00,  50000.00, 'Saldo awal'),
('240005', 'TOP_UP', 120000.00, 0.00, 120000.00, 'Saldo awal');
