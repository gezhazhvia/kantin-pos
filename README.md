# 🏪 Kasir Mandiri — Self-Service POS

Sistem Point of Sale (POS) kasir mandiri berbasis web untuk kantin/koperasi sekolah. Siswa memindai produk dengan kamera AI (Teachable Machine), membayar menggunakan saldo digital yang tertaut NIS, dan mencetak struk secara otomatis.

---

## ✨ Fitur Utama

- **🤖 AI Product Scanner** — Deteksi produk otomatis via webcam menggunakan Google Teachable Machine (TensorFlow.js)
- **💳 Pembayaran Cashless** — Potong saldo digital siswa secara otomatis (tertaut NIS)
- **📦 Sinkronisasi Stok** — Stok berkurang otomatis setelah transaksi berhasil
- **🧾 Cetak Struk** — Struk digital yang bisa dicetak ke printer thermal
- **📊 Riwayat Transaksi** — Log lengkap setiap transaksi untuk laporan sekolah
- **🔒 Atomic Transactions** — MySQL Transaction untuk menjamin konsistensi data

---

## 🛠 Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Frontend | HTML5, CSS3, Vanilla JS |
| AI/ML | TensorFlow.js, Teachable Machine |
| Backend | Node.js, Express.js |
| Database | MySQL 8.0+ |
| Auth | PIN-based (per siswa) |

---

## 📁 Struktur Proyek

```
kantin-pos/
├── database/
│   ├── schema.sql          # DDL (5 tabel)
│   └── seed.sql            # Data dummy
├── backend/
│   ├── server.js           # Express entry point
│   ├── package.json
│   ├── .env.example
│   ├── config/
│   │   └── database.js     # MySQL connection pool
│   ├── controllers/
│   │   ├── checkoutController.js   # ⭐ Atomic checkout
│   │   ├── siswaController.js
│   │   └── barangController.js
│   └── routes/
│       └── api.js
├── frontend/
│   ├── index.html
│   ├── css/
│   │   └── styles.css
│   └── js/
│       ├── app.js          # Orchestrator + utilities
│       ├── scanner.js      # Teachable Machine integration
│       ├── cart.js          # Cart management
│       ├── payment.js      # Payment flow
│       └── receipt.js      # Receipt generation
└── README.md
```

---

## 🚀 Cara Menjalankan

### 1. Prasyarat

- **Node.js** v18+ → [Download](https://nodejs.org/)
- **MySQL** 8.0+ → [Download](https://dev.mysql.com/downloads/)

### 2. Setup Database

```bash
# Login ke MySQL
mysql -u root -p

# Jalankan schema & seed
source database/schema.sql
source database/seed.sql
```

### 3. Setup Backend

```bash
cd backend

# Copy dan edit konfigurasi
cp .env.example .env
# Edit .env sesuai kredensial MySQL Anda

# Install dependencies
npm install

# Jalankan server
npm run dev
```

Server akan berjalan di `http://localhost:3000`

### 4. Akses Frontend

Buka browser dan kunjungi `http://localhost:3000`. Frontend di-serve secara statis oleh Express.

---

## 🤖 Setup Model Teachable Machine

1. Buka [Teachable Machine](https://teachablemachine.withgoogle.com/)
2. Pilih **Image Project** → **Standard image model**
3. Buat kelas-kelas sesuai produk kantin (contoh: `nasi_goreng`, `roti_cokelat`, `es_teh`, dll.)
4. Latih model dengan foto-foto produk (minimal 50 foto per kelas)
5. **Export model** → pilih **Upload (shareable link)**
6. Copy URL model, contoh: `https://teachablemachine.withgoogle.com/models/ABC123xyz/`
7. Edit file `frontend/js/scanner.js`, ganti `YOUR_MODEL_ID` dengan ID model Anda:

```javascript
const TEACHABLE_MACHINE_URL = 'https://teachablemachine.withgoogle.com/models/ABC123xyz/';
```

> **PENTING:** Nama kelas di Teachable Machine **HARUS cocok persis** dengan kolom `ai_label` di tabel `barang` di database.

---

## 📡 API Endpoints

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `GET` | `/api/siswa/:nis` | Ambil data siswa |
| `POST` | `/api/topup` | Top-up saldo siswa |
| `GET` | `/api/barang` | List semua barang |
| `GET` | `/api/barang/label/:label` | Cari barang by AI label |
| `POST` | `/api/checkout` | Proses checkout (atomic) |
| `GET` | `/api/transaksi/:id` | Detail transaksi (struk) |
| `GET` | `/api/riwayat/:nis` | Riwayat transaksi |

### Contoh Request Checkout

```json
POST /api/checkout
{
    "nis": "240001",
    "pin": "123456",
    "items": [
        { "kode_barang": "MKN001", "qty": 1 },
        { "kode_barang": "MNM001", "qty": 2 }
    ]
}
```

---

## 👥 Data Dummy (Untuk Testing)

| NIS | Nama | Kelas | Saldo | PIN |
|-----|------|-------|-------|-----|
| 240001 | Ahmad Rizky Pratama | XII-IPA-1 | Rp 150.000 | 123456 |
| 240002 | Siti Nurhaliza | XI-IPA-2 | Rp 85.000 | 234567 |
| 240003 | Budi Santoso | X-IPS-1 | Rp 200.000 | 345678 |
| 240004 | Dewi Lestari | XII-IPA-3 | Rp 50.000 | 456789 |
| 240005 | Farhan Maulana | XI-IPS-2 | Rp 120.000 | 567890 |

---

## 📝 Lisensi

MIT License — Bebas digunakan untuk keperluan pendidikan.
