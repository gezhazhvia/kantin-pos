// ============================================================
// Scanner.js — Integrasi Teachable Machine
// Load model, akses webcam, deteksi produk real-time
// ============================================================

// ============================================================
// KONFIGURASI MODEL
// Ganti URL ini dengan URL model Teachable Machine Anda.
// Cara mendapatkan URL:
// 1. Buka https://teachablemachine.withgoogle.com/
// 2. Pilih "Image Project"
// 3. Latih model dengan foto-foto produk kantin
// 4. Export → Upload model → Copy sharable link
//
// PENTING: Label kelas di Teachable Machine HARUS sama persis
// dengan kolom `ai_label` di tabel `barang` di database.
//
// Contoh: Jika di TM ada kelas "nasi_goreng", maka di DB
// kolom ai_label untuk Nasi Goreng juga harus "nasi_goreng"
// ============================================================

const TEACHABLE_MACHINE_URL = 'https://teachablemachine.withgoogle.com/models/YOUR_MODEL_ID/';

// Pengaturan deteksi
const SCAN_CONFIG = {
    confidenceThreshold: 0.85,   // Minimum confidence (85%)
    cooldownMs: 2500,            // Cooldown antar-deteksi (2.5 detik)
    predictionInterval: 200,     // Interval prediksi (ms)
    webcamSize: 400,             // Ukuran webcam (px)
    flipCamera: true,            // Mirror webcam
};

let model = null;
let webcam = null;
let maxPredictions = 0;
let lastDetectedLabel = '';
let lastDetectionTime = 0;
let animationFrameId = null;
let isModelLoaded = false;

// ---- Inisialisasi Scanner ----
function initScanner() {
    const btnStart = document.getElementById('btnStartScanner');
    const btnStop  = document.getElementById('btnStopScanner');
    const placeholder = document.getElementById('scannerPlaceholder');

    btnStart?.addEventListener('click', startScanner);
    btnStop?.addEventListener('click', stopScanner);
    placeholder?.addEventListener('click', startScanner);
}

// ---- Mulai Scanner ----
async function startScanner() {
    const btnStart = document.getElementById('btnStartScanner');
    const btnStop  = document.getElementById('btnStopScanner');
    const statusEl = document.getElementById('scannerStatus');

    if (AppState.isScanning) return;

    try {
        btnStart.disabled = true;
        btnStart.innerHTML = '<span>⏳</span> Memuat model...';

        // Load model Teachable Machine (hanya sekali)
        if (!isModelLoaded) {
            const modelURL = TEACHABLE_MACHINE_URL + 'model.json';
            const metadataURL = TEACHABLE_MACHINE_URL + 'metadata.json';

            model = await tmImage.load(modelURL, metadataURL);
            maxPredictions = model.getTotalClasses();
            isModelLoaded = true;
            console.log(`🤖 Model loaded: ${maxPredictions} classes`);
        }

        // Setup webcam
        webcam = new tmImage.Webcam(
            SCAN_CONFIG.webcamSize,
            SCAN_CONFIG.webcamSize,
            SCAN_CONFIG.flipCamera
        );

        await webcam.setup();
        await webcam.play();

        // Tampilkan webcam
        const container = document.getElementById('webcamContainer');
        const placeholder = document.getElementById('scannerPlaceholder');
        const overlay = document.getElementById('scanOverlay');

        container.innerHTML = '';
        container.appendChild(webcam.canvas);
        container.style.display = 'flex';
        placeholder.style.display = 'none';
        overlay.style.display = 'block';

        // Update UI
        AppState.isScanning = true;
        btnStart.disabled = true;
        btnStop.disabled = false;
        btnStart.innerHTML = '<span>▶</span> Mulai Scan';

        statusEl.innerHTML = '<span class="status-dot online"></span><span>Scanning</span>';

        // Tampilkan predictions card
        document.getElementById('predictionsCard').style.display = 'block';

        // Mulai loop prediksi
        predictionLoop();

        showToast('success', 'Scanner Aktif', 'Arahkan produk ke kamera untuk memindai');

    } catch (error) {
        console.error('❌ Scanner error:', error);
        btnStart.disabled = false;
        btnStart.innerHTML = '<span>▶</span> Mulai Scan';

        if (error.message?.includes('model')) {
            showToast('error', 'Model Error',
                'Gagal memuat model AI. Pastikan URL Teachable Machine sudah benar.');
        } else {
            showToast('error', 'Kamera Error',
                'Gagal mengakses kamera. Pastikan izin kamera sudah diberikan.');
        }
    }
}

// ---- Stop Scanner ----
function stopScanner() {
    const btnStart = document.getElementById('btnStartScanner');
    const btnStop  = document.getElementById('btnStopScanner');
    const statusEl = document.getElementById('scannerStatus');

    if (webcam) {
        webcam.stop();
        webcam = null;
    }

    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }

    AppState.isScanning = false;

    // Reset UI
    const container = document.getElementById('webcamContainer');
    const placeholder = document.getElementById('scannerPlaceholder');
    const overlay = document.getElementById('scanOverlay');
    const badge = document.getElementById('detectionBadge');

    container.style.display = 'none';
    placeholder.style.display = 'flex';
    overlay.style.display = 'none';
    badge.style.display = 'none';
    document.getElementById('predictionsCard').style.display = 'none';

    btnStart.disabled = false;
    btnStop.disabled = true;
    statusEl.innerHTML = '<span class="status-dot offline"></span><span>Offline</span>';

    showToast('info', 'Scanner Berhenti', 'Pemindai kamera dimatikan');
}

// ---- Loop Prediksi Real-time ----
async function predictionLoop() {
    if (!AppState.isScanning || !webcam || !model) return;

    webcam.update(); // Update frame webcam

    try {
        const predictions = await model.predict(webcam.canvas);

        // Render semua prediksi
        renderPredictions(predictions);

        // Cari prediksi tertinggi
        let topPrediction = null;
        let topProbability = 0;

        for (const pred of predictions) {
            if (pred.probability > topProbability) {
                topProbability = pred.probability;
                topPrediction = pred;
            }
        }

        // Jika confidence > threshold → deteksi produk
        if (topPrediction && topProbability >= SCAN_CONFIG.confidenceThreshold) {
            handleDetection(topPrediction.className, topProbability);
        } else {
            // Hilangkan badge jika tidak ada deteksi kuat
            document.getElementById('detectionBadge').style.display = 'none';
        }

    } catch (err) {
        console.error('Prediction error:', err);
    }

    // Jadwalkan frame berikutnya
    animationFrameId = requestAnimationFrame(() => {
        setTimeout(predictionLoop, SCAN_CONFIG.predictionInterval);
    });
}

// ---- Handle Deteksi Produk ----
async function handleDetection(label, confidence) {
    const now = Date.now();
    const badge = document.getElementById('detectionBadge');
    const badgeLabel = document.getElementById('badgeLabel');
    const badgeConf = document.getElementById('badgeConfidence');

    // Tampilkan badge
    badge.style.display = 'flex';
    badgeLabel.textContent = label.replace(/_/g, ' ');
    badgeConf.textContent = Math.round(confidence * 100) + '%';

    // Cooldown: jangan tambah barang yang sama terlalu cepat
    if (label === lastDetectedLabel && (now - lastDetectionTime) < SCAN_CONFIG.cooldownMs) {
        return;
    }

    // Update cooldown tracking
    lastDetectedLabel = label;
    lastDetectionTime = now;

    // Cari barang di backend berdasarkan AI label
    const result = await apiFetch(`/barang/label/${encodeURIComponent(label)}`);

    if (result.success && result.data) {
        const barang = result.data;

        // Cek stok
        if (barang.stok <= 0) {
            showToast('warning', 'Stok Habis', `${barang.nama} tidak tersedia`);
            return;
        }

        // Tambahkan ke keranjang
        addToCart(barang);
        showToast('success', 'Produk Terdeteksi', `${barang.nama} ditambahkan ke keranjang`);

    } else {
        showToast('warning', 'Tidak Dikenali', `Label "${label}" tidak terdaftar di database`);
    }
}

// ---- Render Prediction Bars ----
function renderPredictions(predictions) {
    const container = document.getElementById('predictionsList');
    if (!container) return;

    // Sort by probability (descending)
    const sorted = [...predictions].sort((a, b) => b.probability - a.probability);

    // Tampilkan top 5
    const top = sorted.slice(0, 5);

    container.innerHTML = top.map(pred => {
        const pct = Math.round(pred.probability * 100);
        const isHigh = pred.probability >= SCAN_CONFIG.confidenceThreshold;

        return `
            <div class="prediction-item">
                <span class="prediction-label">${pred.className.replace(/_/g, ' ')}</span>
                <div class="prediction-bar-container">
                    <div class="prediction-bar ${isHigh ? 'high' : ''}" 
                         style="width: ${pct}%"></div>
                </div>
                <span class="prediction-value">${pct}%</span>
            </div>
        `;
    }).join('');
}
