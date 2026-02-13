# 📋 Sistem Monitoring Kehadiran Guru

<div align="center">

![SMK Negeri 1 Maluku Tengah](https://img.shields.io/badge/SMK-Negeri%201%20Maluku%20Tengah-blue?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Active-success?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)

**Sistem monitoring kehadiran guru yang terintegrasi dengan Google Sheets**

[Demo](https://alexbahy-tech.github.io/monitoring-kehadiran-guru/) • [Dokumentasi](#dokumentasi) • [Support](#support)

</div>

---

## 🌟 Fitur Utama

- ✅ **Login Terproteksi** - Hanya petugas monitoring yang bisa akses
- 📝 **Input Kehadiran Real-time** - Pencatatan kehadiran langsung per jam pelajaran
- 📊 **Dashboard Statistik** - Visualisasi data kehadiran harian, mingguan, bulanan
- 📈 **Rekapitulasi Lengkap** - Laporan bulanan, semester, dan tahunan
- 💾 **Auto-Save to Google Sheets** - Data otomatis tersimpan di cloud
- 📱 **Responsive Design** - Bisa diakses dari HP, tablet, atau komputer
- 🎨 **UI Modern** - Tampilan menarik dengan gradient dan animasi
- 🔒 **Aman & Terpercaya** - Data terenkripsi dan tersimpan aman

---

## 🖼️ Screenshot

### Login Page
![Login](https://via.placeholder.com/800x400/667eea/ffffff?text=Login+Page)

### Input Kehadiran
![Input](https://via.placeholder.com/800x400/764ba2/ffffff?text=Input+Kehadiran)

### Dashboard
![Dashboard](https://via.placeholder.com/800x400/f093fb/ffffff?text=Dashboard+Statistik)

### Rekapitulasi
![Rekap](https://via.placeholder.com/800x400/4facfe/ffffff?text=Rekapitulasi)

---

## 🚀 Quick Start

### 1. Clone Repository
```bash
git clone https://github.com/[username]/monitoring-kehadiran-guru.git
cd monitoring-kehadiran-guru
```

### 2. Setup Google Apps Script
1. Buka Google Sheets Anda
2. Extensions → Apps Script
3. Copy code dari `google-apps-script.js`
4. Deploy sebagai Web App
5. Copy Web App URL

### 3. Konfigurasi
Edit `index.html`, ganti:
```javascript
const CONFIG = {
    PASSWORD: 'SMKBisaHebat',
    SCRIPT_URL: 'YOUR_WEB_APP_URL_HERE' // Ganti dengan URL Anda
};
```

### 4. Deploy ke GitHub Pages
1. Push ke GitHub
2. Settings → Pages
3. Source: main branch
4. Save

### 5. Akses Website
```
https://[username].github.io/monitoring-kehadiran-guru/
```

---

## 📖 Dokumentasi

### Status Kehadiran

| Status | Icon | Keterangan |
|--------|------|------------|
| Hadir | ✅ | Guru hadir mengajar |
| Sakit | 🤒 | Guru sakit (ada surat) |
| Ijin | 📄 | Guru ijin (ada surat) |
| Alpha | ❌ | Tanpa keterangan |

### Login Credentials

**Default Password:** `SMKBisaHebat`

> ⚠️ Ganti password di file HTML untuk keamanan

### Filter Dashboard

- **Hari Ini** - Data kehadiran hari ini
- **Minggu Ini** - 7 hari terakhir
- **Bulan Ini** - Bulan berjalan
- **Pilih Bulan** - Bulan tertentu

### Periode Rekapitulasi

- **Bulanan** - Per bulan
- **Semester** - Semester 1 (Jan-Jun) atau 2 (Jul-Des)
- **Tahun Pelajaran** - Juli - Juni tahun depan

---

## 🗂️ Struktur File

```
monitoring-kehadiran-guru/
├── index.html                  # File utama website
├── google-apps-script.js       # Backend script
├── PANDUAN-DEPLOYMENT.md       # Panduan lengkap
├── README.md                   # File ini
└── assets/
    └── screenshots/            # Screenshot untuk dokumentasi
```

---

## 🔧 Teknologi yang Digunakan

- **Frontend:**
  - HTML5
  - CSS3 (Custom Design System)
  - Vanilla JavaScript (No Framework)
  - Google Fonts (Inter)

- **Backend:**
  - Google Apps Script
  - Google Sheets API

- **Hosting:**
  - GitHub Pages

---

## 📊 Database Schema

### Sheet: Kehadiran

| Kolom | Type | Keterangan |
|-------|------|------------|
| Tanggal | Date | YYYY-MM-DD |
| Hari | String | Senin, Selasa, dst |
| Jam | String | 07:30 - 09:30 |
| Kelas | String | X MPLB, XI AKL, dst |
| Guru | String | Nama lengkap |
| Mata Pelajaran | String | Nama mapel |
| Status | String | Hadir/Sakit/Ijin/Alpha |
| Timestamp | DateTime | Waktu input |

---

## 🎯 Roadmap

### Version 1.0 (Current) ✅
- [x] Login system
- [x] Input kehadiran
- [x] Dashboard statistik
- [x] Rekapitulasi

### Version 1.1 (Planned)
- [ ] Export to Excel/PDF
- [ ] Print laporan
- [ ] Grafik visualisasi
- [ ] Notifikasi email otomatis

### Version 2.0 (Future)
- [ ] Multi-user roles (Admin, Petugas, Kepala Sekolah)
- [ ] Scan QR Code untuk absen
- [ ] Mobile app (PWA)
- [ ] Integrasi dengan sistem akademik

---

## 🤝 Contributing

Kontribusi sangat diterima! Jika Anda ingin berkontribusi:

1. Fork repository ini
2. Buat branch baru (`git checkout -b feature/AmazingFeature`)
3. Commit perubahan (`git commit -m 'Add some AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buat Pull Request

---

## 🐛 Bug Reports

Menemukan bug? Silakan buat [Issue](https://github.com/[username]/monitoring-kehadiran-guru/issues) dengan detail:

- Deskripsi bug
- Langkah reproduksi
- Expected behavior
- Screenshot (jika ada)
- Browser & OS

---

## 💡 FAQ

<details>
<summary><b>Apakah data aman?</b></summary>
Ya, data tersimpan di Google Sheets milik Anda sendiri. Hanya Anda yang punya akses penuh.
</details>

<details>
<summary><b>Bisa digunakan offline?</b></summary>
Tidak, sistem memerlukan koneksi internet untuk sync dengan Google Sheets.
</details>

<details>
<summary><b>Apakah bisa untuk banyak sekolah?</b></summary>
Ya, tinggal clone dan ganti database untuk setiap sekolah.
</details>

<details>
<summary><b>Biaya berapa?</b></summary>
100% GRATIS! Menggunakan Google Sheets (gratis) dan GitHub Pages (gratis).
</details>

<details>
<summary><b>Support berapa user?</b></summary>
Unlimited. Google Sheets bisa handle jutaan baris data.
</details>

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

## 👨‍💻 Author

**Tim IT SMK Negeri 1 Maluku Tengah**

- Website: [SMK Negeri 1 Maluku Tengah](https://alexbahy-tech.github.io/smartkurikulumsmkn1mt/)
- Email: contact@smkn1mt.sch.id

---

## 🙏 Acknowledgments

- [Google Apps Script](https://developers.google.com/apps-script)
- [GitHub Pages](https://pages.github.com/)
- [Inter Font](https://fonts.google.com/specimen/Inter)
- Seluruh guru dan staff SMK Negeri 1 Maluku Tengah

---

## ⭐ Support

Jika project ini membantu, berikan ⭐️ dan share ke teman-teman!

<div align="center">

**Made with ❤️ for Education**

![Visitors](https://visitor-badge.laobi.icu/badge?page_id=monitoring-kehadiran-guru)

</div>
