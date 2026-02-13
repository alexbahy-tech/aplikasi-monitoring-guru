# PANDUAN DEPLOYMENT SISTEM MONITORING KEHADIRAN GURU
## SMK Negeri 1 Maluku Tengah

---

## 📋 DAFTAR ISI
1. Setup Google Sheets & Apps Script
2. Deploy Web App
3. Upload ke GitHub
4. Konfigurasi HTML
5. Testing & Troubleshooting

---

## 🚀 LANGKAH 1: SETUP GOOGLE SHEETS & APPS SCRIPT

### A. Persiapan Google Sheets

1. **Buka Google Sheets Anda**
   - URL: https://docs.google.com/spreadsheets/d/19yYtluVPOtltTK07RZdfm6eHaoiWI8OlkVKxyGkwAQk/edit

2. **Pastikan Sheet Sudah Siap**
   - Buat sheet baru dengan nama: `Kehadiran`
   - Header akan dibuat otomatis oleh script

### B. Setup Google Apps Script

1. **Buka Apps Script Editor**
   - Di Google Sheets, klik: `Extensions` → `Apps Script`
   - Atau buka: https://script.google.com

2. **Copy Script Backend**
   - Hapus kode default yang ada
   - Copy seluruh isi file `google-apps-script.js`
   - Paste ke editor Apps Script
   - Klik `Save` (💾) atau tekan `Ctrl+S`

3. **Verifikasi SPREADSHEET_ID**
   - Lihat baris pertama script:
   ```javascript
   const SPREADSHEET_ID = '19yYtluVPOtltTK07RZdfm6eHaoiWI8OlkVKxyGkwAQk';
   ```
   - Pastikan ID sesuai dengan spreadsheet Anda

---

## 🌐 LANGKAH 2: DEPLOY WEB APP

### A. Deploy Apps Script sebagai Web App

1. **Klik Deploy**
   - Di Apps Script Editor, klik `Deploy` → `New deployment`

2. **Pilih Type**
   - Select type: `Web app`

3. **Konfigurasi Deployment**
   - **Description**: `Monitoring Kehadiran Guru v1.0`
   - **Execute as**: `Me (email Anda)`
   - **Who has access**: `Anyone`
   
   ⚠️ PENTING: Pilih "Anyone" agar bisa diakses tanpa login Google

4. **Deploy**
   - Klik `Deploy`
   - Jika diminta, klik `Authorize access`
   - Login dengan akun Google Anda
   - Klik `Advanced` → `Go to [Project Name] (unsafe)`
   - Klik `Allow`

5. **Copy Web App URL**
   - Setelah deploy berhasil, Anda akan mendapat URL seperti:
   ```
   https://script.google.com/macros/s/AKfycby.../exec
   ```
   - **SIMPAN URL INI!** Anda akan memerlukannya di langkah berikutnya

---

## 📤 LANGKAH 3: UPLOAD KE GITHUB

### A. Persiapan Repository

1. **Login ke GitHub**
   - Buka: https://github.com

2. **Buat Repository Baru**
   - Klik `New repository`
   - Nama: `monitoring-kehadiran-guru`
   - Description: `Sistem Monitoring Kehadiran Guru SMK Negeri 1 Maluku Tengah`
   - Public/Private: `Public` (agar bisa di-deploy di GitHub Pages)
   - ✅ Initialize with README
   - Klik `Create repository`

### B. Upload File HTML

1. **Upload File**
   - Di repository, klik `Add file` → `Upload files`
   - Upload file `monitoring-kehadiran.html`
   - Rename file menjadi: `index.html`
   - Commit message: `Initial commit - Monitoring Kehadiran Guru`
   - Klik `Commit changes`

---

## ⚙️ LANGKAH 4: KONFIGURASI HTML

### A. Edit File HTML di GitHub

1. **Buka index.html**
   - Di repository, klik file `index.html`
   - Klik icon pensil (✏️) untuk edit

2. **Ganti SCRIPT_URL**
   - Cari baris (sekitar baris 577):
   ```javascript
   const CONFIG = {
       PASSWORD: 'SMKBisaHebat',
       SCRIPT_URL: 'YOUR_WEB_APP_URL_HERE'
   };
   ```
   
   - Ganti `YOUR_WEB_APP_URL_HERE` dengan URL Web App yang Anda copy di Langkah 2
   - Contoh:
   ```javascript
   const CONFIG = {
       PASSWORD: 'SMKBisaHebat',
       SCRIPT_URL: 'https://script.google.com/macros/s/AKfycby.../exec'
   };
   ```

3. **Simpan Perubahan**
   - Scroll ke bawah
   - Commit message: `Update Web App URL`
   - Klik `Commit changes`

---

## 🔧 LANGKAH 5: AKTIFKAN GITHUB PAGES

### A. Enable GitHub Pages

1. **Buka Settings**
   - Di repository, klik tab `Settings`

2. **Pages Configuration**
   - Di menu kiri, klik `Pages`
   - Source: `Deploy from a branch`
   - Branch: `main` atau `master`
   - Folder: `/ (root)`
   - Klik `Save`

3. **Tunggu Deploy**
   - GitHub akan memproses (±1-2 menit)
   - Refresh halaman
   - URL website Anda akan muncul:
   ```
   https://[username].github.io/monitoring-kehadiran-guru/
   ```

### B. Akses Website

1. **Buka URL GitHub Pages**
   - Klik link yang muncul di Settings → Pages
   - Atau ketik manual di browser

2. **Test Login**
   - Password: `SMKBisaHebat`
   - Jika berhasil, Anda akan masuk ke halaman monitoring

---

## ✅ TESTING & TROUBLESHOOTING

### Test Fungsi-Fungsi Utama

#### 1. Test Login
- ✅ Password benar: masuk ke sistem
- ❌ Password salah: muncul pesan error

#### 2. Test Input Kehadiran
- Pilih tab "Input Kehadiran"
- Klik salah satu tombol status
- Cek Google Sheets: data harus masuk

#### 3. Test Dashboard
- Pilih tab "Dashboard"
- Filter periode: hari ini, minggu ini, bulan ini
- Statistik harus ter-update

#### 4. Test Rekapitulasi
- Pilih tab "Rekapitulasi"
- Filter: bulanan, semester, tahun
- Tabel harus menampilkan data

### Common Issues & Solutions

#### ❌ Issue 1: Data tidak masuk ke Google Sheets
**Solusi:**
1. Cek Web App URL di HTML (pastikan benar)
2. Cek permission Apps Script (pastikan "Anyone")
3. Re-deploy Apps Script (Deploy → Manage deployments → Edit → Version: New version)

#### ❌ Issue 2: CORS Error di Console
**Solusi:**
- Ini normal untuk `mode: 'no-cors'`
- Data tetap terkirim meskipun muncul error di console
- Cek langsung di Google Sheets untuk konfirmasi

#### ❌ Issue 3: Statistik tidak muncul
**Solusi:**
1. Pastikan ada data di sheet "Kehadiran"
2. Cek format tanggal di kolom A (harus format: YYYY-MM-DD)
3. Refresh browser (Ctrl + F5)

#### ❌ Issue 4: GitHub Pages tidak muncul
**Solusi:**
1. Tunggu 5-10 menit (proses deploy)
2. Pastikan repository Public
3. Pastikan file bernama `index.html` (bukan monitoring-kehadiran.html)

---

## 📱 CUSTOM DOMAIN (OPSIONAL)

Jika ingin menggunakan domain sendiri:

1. **Beli Domain**
   - Contoh: `kehadiran-guru-smkn1mt.com`

2. **Setting DNS**
   - Type: `A`
   - Host: `@`
   - Value: 
     - `185.199.108.153`
     - `185.199.109.153`
     - `185.199.110.153`
     - `185.199.111.153`

3. **Setting di GitHub**
   - Settings → Pages → Custom domain
   - Masukkan domain Anda
   - Save

---

## 🔒 KEAMANAN

### Password Management
- Default password: `SMKBisaHebat`
- Untuk ganti password, edit file HTML:
  ```javascript
  const CONFIG = {
      PASSWORD: 'PasswordBaruAnda',
      SCRIPT_URL: '...'
  };
  ```

### Data Privacy
- Data tersimpan di Google Sheets milik Anda
- Hanya Anda yang punya akses penuh
- Petugas monitoring hanya bisa input, tidak bisa edit/hapus

---

## 📊 FITUR TAMBAHAN

### Auto Report Bulanan

1. **Setup Trigger**
   - Di Apps Script Editor
   - Jalankan function: `setupMonthlyTrigger()`
   - Run → Authorize
   
2. **Hasil**
   - Setiap tanggal 1, otomatis generate laporan di sheet "Laporan Bulanan"

### Export Data

**Cara 1: Manual**
- Buka Google Sheets
- File → Download → Excel (.xlsx) atau PDF

**Cara 2: Script**
- Bisa ditambahkan tombol export di HTML
- Data langsung download sebagai Excel

---

## 📞 SUPPORT

Jika ada masalah:

1. **Cek Console Browser**
   - Tekan F12 → Console
   - Lihat error message

2. **Cek Apps Script Logs**
   - Apps Script Editor → Execution log
   - Lihat error/warning

3. **Test Manual**
   - Buka Web App URL langsung di browser
   - Test dengan Postman

---

## 📝 CHANGELOG

### Version 1.0 (Initial Release)
- ✅ Login petugas monitoring
- ✅ Input kehadiran real-time
- ✅ Dashboard statistik
- ✅ Rekapitulasi bulanan/semester/tahunan
- ✅ Integrasi Google Sheets
- ✅ UI Modern & Responsif

---

## 🎉 SELESAI!

Sistem Monitoring Kehadiran Guru Anda sudah siap digunakan!

**URL Akses:**
- https://[username].github.io/monitoring-kehadiran-guru/

**Login:**
- Password: SMKBisaHebat

**Data:**
- https://docs.google.com/spreadsheets/d/19yYtluVPOtltTK07RZdfm6eHaoiWI8OlkVKxyGkwAQk/

---

**Dibuat dengan ❤️ untuk SMK Negeri 1 Maluku Tengah**
