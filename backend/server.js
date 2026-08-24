// ============================================================
// Server Entry Point — Kasir Mandiri POS
// ============================================================

require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const path    = require('path');

const apiRoutes = require('./routes/api');

const app  = express();
const PORT = process.env.PORT || 3000;

// --- Middleware ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Serve frontend secara statis ---
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// --- API Routes ---
app.use('/api', apiRoutes);

// --- Fallback: Serve index.html untuk SPA ---
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

// --- Error handler global ---
app.use((err, req, res, next) => {
    console.error('❌ Unhandled Error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal Server Error'
    });
});

// --- Start server ---
app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════╗
║   🏪 KASIR MANDIRI — Self-Service POS       ║
║   Server berjalan di http://localhost:${PORT}   ║
╚══════════════════════════════════════════════╝
    `);
});
