-- ============================================================
-- KASIR MANDIRI (Self-Service POS) — Database Schema
-- Engine: MySQL 8.0+
-- ============================================================

CREATE DATABASE IF NOT EXISTS kantin_pos
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE kantin_pos;

-- ============================================================
-- 1. TABEL SISWA
-- Menyimpan data siswa beserta saldo digital mereka.
-- ============================================================
CREATE TABLE IF NOT EXISTS siswa (
    nis           VARCHAR(20)    PRIMARY KEY,
    nama          VARCHAR(100)   NOT NULL,
    kelas         VARCHAR(20)    NOT NULL,
    saldo         DECIMAL(12,2)  NOT NULL DEFAULT 0.00,
    pin           VARCHAR(6)     NOT NULL DEFAULT '000000',
    foto_url      VARCHAR(255)   DEFAULT NULL,
    is_active     TINYINT(1)     NOT NULL DEFAULT 1,
    created_at    TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_siswa_kelas (kelas),
    INDEX idx_siswa_active (is_active)
) ENGINE=InnoDB;

-- ============================================================
-- 2. TABEL BARANG
-- Menyimpan data produk kantin/koperasi.
-- Kolom `ai_label` digunakan untuk mapping dengan label output
-- dari model Teachable Machine.
-- ============================================================
CREATE TABLE IF NOT EXISTS barang (
    kode_barang   VARCHAR(20)    PRIMARY KEY,
    nama          VARCHAR(100)   NOT NULL,
    harga         DECIMAL(10,2)  NOT NULL,
    stok          INT            NOT NULL DEFAULT 0,
    ai_label      VARCHAR(50)    NOT NULL UNIQUE,
    kategori      VARCHAR(50)    DEFAULT 'Umum',
    gambar_url    VARCHAR(255)   DEFAULT NULL,
    is_active     TINYINT(1)     NOT NULL DEFAULT 1,
    created_at    TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_barang_label (ai_label),
    INDEX idx_barang_kategori (kategori),
    INDEX idx_barang_active (is_active)
) ENGINE=InnoDB;

-- ============================================================
-- 3. TABEL TRANSAKSI (Header)
-- Menyimpan ringkasan setiap transaksi checkout.
-- ============================================================
CREATE TABLE IF NOT EXISTS transaksi (
    id            VARCHAR(36)    PRIMARY KEY,  -- UUID
    nis           VARCHAR(20)    NOT NULL,
    total_harga   DECIMAL(12,2)  NOT NULL,
    total_item    INT            NOT NULL DEFAULT 0,
    status        ENUM('SUCCESS','FAILED','REFUNDED') NOT NULL DEFAULT 'SUCCESS',
    catatan       TEXT           DEFAULT NULL,
    created_at    TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (nis) REFERENCES siswa(nis)
        ON UPDATE CASCADE ON DELETE RESTRICT,

    INDEX idx_trx_nis (nis),
    INDEX idx_trx_status (status),
    INDEX idx_trx_created (created_at)
) ENGINE=InnoDB;

-- ============================================================
-- 4. TABEL TRANSAKSI_DETAIL
-- Menyimpan detail item per transaksi.
-- ============================================================
CREATE TABLE IF NOT EXISTS transaksi_detail (
    id            INT            AUTO_INCREMENT PRIMARY KEY,
    transaksi_id  VARCHAR(36)    NOT NULL,
    kode_barang   VARCHAR(20)    NOT NULL,
    nama_barang   VARCHAR(100)   NOT NULL,
    harga_satuan  DECIMAL(10,2)  NOT NULL,
    qty           INT            NOT NULL DEFAULT 1,
    subtotal      DECIMAL(12,2)  NOT NULL,

    FOREIGN KEY (transaksi_id) REFERENCES transaksi(id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (kode_barang) REFERENCES barang(kode_barang)
        ON UPDATE CASCADE ON DELETE RESTRICT,

    INDEX idx_detail_trx (transaksi_id),
    INDEX idx_detail_barang (kode_barang)
) ENGINE=InnoDB;

-- ============================================================
-- 5. TABEL MUTASI_SALDO
-- Mencatat setiap perubahan saldo siswa sebagai audit trail.
-- ============================================================
CREATE TABLE IF NOT EXISTS mutasi_saldo (
    id            INT            AUTO_INCREMENT PRIMARY KEY,
    nis           VARCHAR(20)    NOT NULL,
    tipe          ENUM('TOP_UP','PAYMENT','REFUND') NOT NULL,
    jumlah        DECIMAL(12,2)  NOT NULL,
    saldo_sebelum DECIMAL(12,2)  NOT NULL,
    saldo_sesudah DECIMAL(12,2)  NOT NULL,
    referensi_id  VARCHAR(36)    DEFAULT NULL,  -- ID transaksi terkait
    keterangan    VARCHAR(255)   DEFAULT NULL,
    created_at    TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (nis) REFERENCES siswa(nis)
        ON UPDATE CASCADE ON DELETE RESTRICT,

    INDEX idx_mutasi_nis (nis),
    INDEX idx_mutasi_tipe (tipe),
    INDEX idx_mutasi_created (created_at)
) ENGINE=InnoDB;
