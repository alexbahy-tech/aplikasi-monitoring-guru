// ============================================================
// Google Apps Script - Backend Monitoring Kehadiran Guru
// SMK Negeri 1 Maluku Tengah
// Versi 3.0 — Sinkronisasi Penuh UI ↔ Google Sheets
// ============================================================

const SPREADSHEET_ID = '19yYtluVPOtltTK07RZdfm6eHaoiWI8OlkVKxyGkwAQk';
const SHEET_KEHADIRAN = 'Kehadiran';
const SHEET_LIBUR = 'Hari_Libur';
const TIMEZONE = 'Asia/Jayapura';

// ============================================================
// HANDLE POST — Simpan/update data kehadiran atau libur
// ============================================================
function doPost(e) {
  try {
    let data;
    if (e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else if (e.parameter) {
      data = e.parameter;
    } else {
      return createJsonResponse({ status: 'error', message: 'No data received' });
    }

    const action = data.action || 'save-attendance';

    switch (action) {
      case 'save-attendance':
        return createJsonResponse(saveAttendance(data));

      case 'save-holiday':
        return createJsonResponse(saveHoliday(data));

      case 'delete-holiday':
        return createJsonResponse(deleteHoliday(data));

      default:
        return createJsonResponse({ status: 'error', message: 'Unknown action: ' + action });
    }

  } catch (error) {
    Logger.log('doPost error: ' + error.toString());
    return createJsonResponse({ status: 'error', message: error.toString() });
  }
}

// ============================================================
// HANDLE GET — Ambil data
// ============================================================
function doGet(e) {
  try {
    const action = param(e, 'action', 'stats');
    const period = param(e, 'period', 'month');
    const month = param(e, 'month', String(new Date().getMonth() + 1));
    const guru = param(e, 'guru', 'all');
    const tanggal = param(e, 'tanggal', '');

    let result;

    switch (action) {
      case 'stats':
        result = getStatistics(period, month);
        break;
      case 'rekap':
        result = getRekapitulasi(period, guru);
        break;
      case 'get-attendance-by-date':
        result = getAttendanceByDate(tanggal);
        break;
      case 'get-holidays':
        result = getAllHolidays();
        break;
      case 'check-holiday':
        result = checkHoliday(tanggal);
        break;
      default:
        result = getStatistics(period, month);
    }

    return createJsonResponse(result);

  } catch (error) {
    Logger.log('doGet error: ' + error.toString());
    return createJsonResponse({ status: 'error', message: error.toString() });
  }
}

// ============================================================
// HELPERS
// ============================================================
function param(e, key, defaultVal) {
  return (e.parameter && e.parameter[key]) || defaultVal;
}

function createJsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function getOrCreateSheet(name, headers) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length)
      .setFontWeight('bold')
      .setBackground('#4f46e5')
      .setFontColor('#ffffff');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function normalizeDate(dateVal) {
  if (dateVal instanceof Date) {
    return Utilities.formatDate(dateVal, TIMEZONE, 'yyyy-MM-dd');
  }
  return String(dateVal || '').trim();
}

// ============================================================
// SIMPAN KEHADIRAN — dengan upsert (update jika sudah ada)
// Key unik: tanggal + kelas + jam + guru
// ============================================================
function saveAttendance(data) {
  if (!data.tanggal || !data.guru || !data.status) {
    return { status: 'error', message: 'Data tidak lengkap. Wajib: tanggal, guru, status.' };
  }

  const headers = ['Tanggal', 'Hari', 'Jam', 'Kelas', 'Guru', 'Mata Pelajaran', 'Status', 'Keterangan', 'Timestamp'];
  const sheet = getOrCreateSheet(SHEET_KEHADIRAN, headers);
  migrateKehadiranIfNeeded(sheet);

  const tanggal = String(data.tanggal).trim();
  const kelas = String(data.kelas || '').trim();
  const jam = String(data.jam || '').trim();
  const guru = String(data.guru || '').trim();

  // Cari apakah sudah ada record dengan key yang sama (upsert)
  const lastRow = sheet.getLastRow();
  let existingRow = -1;

  if (lastRow > 1) {
    const allData = sheet.getRange(2, 1, lastRow - 1, 9).getValues();
    for (let i = 0; i < allData.length; i++) {
      const rowTanggal = normalizeDate(allData[i][0]);
      const rowKelas = String(allData[i][3]).trim();
      const rowJam = String(allData[i][2]).trim();
      const rowGuru = String(allData[i][4]).trim();

      if (rowTanggal === tanggal && rowKelas === kelas && rowJam === jam && rowGuru === guru) {
        existingRow = i + 2; // +2 karena array 0-based + header row
        break;
      }
    }
  }

  const rowData = [
    tanggal,
    data.hari || '',
    jam,
    kelas,
    guru,
    data.mapel || '',
    data.status || '',
    data.keterangan || '',
    data.timestamp || new Date().toISOString()
  ];

  if (existingRow > 0) {
    // UPDATE existing row
    sheet.getRange(existingRow, 1, 1, 9).setValues([rowData]);
    formatStatusCell(sheet, existingRow, data.status);
    return { status: 'success', message: 'Data diupdate', row: existingRow, mode: 'update' };
  } else {
    // INSERT new row
    sheet.appendRow(rowData);
    const newRow = sheet.getLastRow();
    formatStatusCell(sheet, newRow, data.status);
    return { status: 'success', message: 'Data disimpan', row: newRow, mode: 'insert' };
  }
}

// ============================================================
// FORMAT STATUS CELL
// ============================================================
function formatStatusCell(sheet, row, status) {
  const statusCell = sheet.getRange(row, 7);
  const colors = {
    'Hadir': { bg: '#10b981', fg: '#ffffff' },
    'Sakit': { bg: '#f59e0b', fg: '#ffffff' },
    'Ijin':  { bg: '#3b82f6', fg: '#ffffff' },
    'Alpha': { bg: '#ef4444', fg: '#ffffff' },
    'Libur': { bg: '#a855f7', fg: '#ffffff' }
  };

  const c = colors[status];
  if (c) {
    statusCell.setBackground(c.bg).setFontColor(c.fg);
  }

  if (status === 'Libur') {
    sheet.getRange(row, 8).setBackground('#f3e8ff').setFontColor('#6b21a8');
  }
}

// ============================================================
// MIGRASI SHEET KEHADIRAN (tambah kolom Keterangan jika perlu)
// ============================================================
function migrateKehadiranIfNeeded(sheet) {
  const lastCol = sheet.getLastColumn();
  if (lastCol >= 9) return;

  const neededHeaders = ['Tanggal', 'Hari', 'Jam', 'Kelas', 'Guru', 'Mata Pelajaran', 'Status', 'Keterangan', 'Timestamp'];

  if (lastCol === 8) {
    const h8 = sheet.getRange(1, 8).getValue();
    if (h8 === 'Timestamp') {
      sheet.insertColumnAfter(7);
      sheet.getRange(1, 8).setValue('Keterangan').setFontWeight('bold').setBackground('#4f46e5').setFontColor('#ffffff');
    }
  }

  for (let i = sheet.getLastColumn(); i < 9; i++) {
    sheet.getRange(1, i + 1).setValue(neededHeaders[i]).setFontWeight('bold').setBackground('#4f46e5').setFontColor('#ffffff');
  }
}

// ============================================================
// GET ATTENDANCE BY DATE — Ambil semua kehadiran pada tanggal tertentu
// Digunakan untuk menampilkan status yang sudah diinput di UI
// ============================================================
function getAttendanceByDate(tanggal) {
  if (!tanggal) return { status: 'error', message: 'Tanggal wajib diisi', data: [] };

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_KEHADIRAN);

  if (!sheet || sheet.getLastRow() <= 1) {
    return { status: 'success', data: [] };
  }

  const allData = sheet.getRange(2, 1, sheet.getLastRow() - 1, 9).getValues();
  const results = [];

  for (let i = 0; i < allData.length; i++) {
    const rowDate = normalizeDate(allData[i][0]);
    if (rowDate === tanggal) {
      results.push({
        tanggal: rowDate,
        hari: String(allData[i][1] || ''),
        jam: String(allData[i][2] || ''),
        kelas: String(allData[i][3] || ''),
        guru: String(allData[i][4] || ''),
        mapel: String(allData[i][5] || ''),
        status: String(allData[i][6] || ''),
        keterangan: String(allData[i][7] || ''),
        timestamp: String(allData[i][8] || '')
      });
    }
  }

  return { status: 'success', data: results };
}

// ============================================================
// HARI LIBUR — Sheet terpisah untuk management libur
// Kolom: Tanggal | Hari | Keterangan | Jumlah_Jadwal | Created_At
// ============================================================
function saveHoliday(data) {
  if (!data.tanggal || !data.keterangan) {
    return { status: 'error', message: 'Tanggal dan keterangan wajib diisi.' };
  }

  const headers = ['Tanggal', 'Hari', 'Keterangan', 'Jumlah_Jadwal', 'Created_At'];
  const sheet = getOrCreateSheet(SHEET_LIBUR, headers);

  const tanggal = String(data.tanggal).trim();

  // Cek duplikat
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    const existing = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (let i = 0; i < existing.length; i++) {
      if (normalizeDate(existing[i][0]) === tanggal) {
        return { status: 'error', message: 'Tanggal ini sudah ditandai libur.', existing: true };
      }
    }
  }

  // Simpan data libur
  sheet.appendRow([
    tanggal,
    data.hari || '',
    data.keterangan || '',
    parseInt(data.jumlah_jadwal) || 0,
    new Date().toISOString()
  ]);

  const newRow = sheet.getLastRow();
  sheet.getRange(newRow, 1, 1, 5).setBackground('#f3e8ff').setFontColor('#6b21a8');

  return { status: 'success', message: 'Hari libur berhasil disimpan.' };
}

function deleteHoliday(data) {
  if (!data.tanggal) return { status: 'error', message: 'Tanggal wajib diisi.' };

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_LIBUR);
  if (!sheet || sheet.getLastRow() <= 1) return { status: 'error', message: 'Sheet libur kosong.' };

  const tanggal = String(data.tanggal).trim();
  const allData = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues();

  for (let i = allData.length - 1; i >= 0; i--) {
    if (normalizeDate(allData[i][0]) === tanggal) {
      sheet.deleteRow(i + 2);

      // Juga hapus semua record "Libur" di sheet Kehadiran untuk tanggal ini
      const kSheet = ss.getSheetByName(SHEET_KEHADIRAN);
      if (kSheet && kSheet.getLastRow() > 1) {
        const kData = kSheet.getRange(2, 1, kSheet.getLastRow() - 1, 7).getValues();
        for (let j = kData.length - 1; j >= 0; j--) {
          if (normalizeDate(kData[j][0]) === tanggal && String(kData[j][6]).trim() === 'Libur') {
            kSheet.deleteRow(j + 2);
          }
        }
      }

      return { status: 'success', message: 'Hari libur berhasil dihapus.' };
    }
  }

  return { status: 'error', message: 'Tanggal libur tidak ditemukan.' };
}

function checkHoliday(tanggal) {
  if (!tanggal) return { isHoliday: false };

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_LIBUR);
  if (!sheet || sheet.getLastRow() <= 1) return { isHoliday: false };

  const allData = sheet.getRange(2, 1, sheet.getLastRow() - 1, 5).getValues();
  for (let i = 0; i < allData.length; i++) {
    if (normalizeDate(allData[i][0]) === tanggal) {
      return {
        isHoliday: true,
        keterangan: String(allData[i][2] || ''),
        jumlah_jadwal: parseInt(allData[i][3]) || 0
      };
    }
  }

  return { isHoliday: false };
}

function getAllHolidays() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_LIBUR);

  if (!sheet || sheet.getLastRow() <= 1) {
    return { status: 'success', data: [] };
  }

  const allData = sheet.getRange(2, 1, sheet.getLastRow() - 1, 5).getValues();
  const holidays = allData.map(row => ({
    tanggal: normalizeDate(row[0]),
    hari: String(row[1] || ''),
    keterangan: String(row[2] || ''),
    jumlah_jadwal: parseInt(row[3]) || 0,
    created_at: String(row[4] || '')
  }));

  return { status: 'success', data: holidays };
}

// ============================================================
// STATISTIK KEHADIRAN
// ============================================================
function getStatistics(period, month) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_KEHADIRAN);

  if (!sheet || sheet.getLastRow() <= 1) return [];

  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 9).getValues();
  const filtered = filterByPeriod(rows, period, month);

  return filtered.map(row => ({
    tanggal: normalizeDate(row[0]),
    hari: String(row[1] || ''),
    jam: String(row[2] || ''),
    kelas: String(row[3] || ''),
    guru: String(row[4] || ''),
    mapel: String(row[5] || ''),
    status: String(row[6] || ''),
    keterangan: String(row[7] || ''),
    timestamp: String(row[8] || '')
  }));
}

// ============================================================
// REKAPITULASI
// ============================================================
function getRekapitulasi(period, guruFilter) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_KEHADIRAN);

  if (!sheet || sheet.getLastRow() <= 1) return [];

  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 9).getValues();
  const filtered = filterByPeriod(rows, period);

  const guruStats = {};

  filtered.forEach(row => {
    const guru = String(row[4] || '').trim();
    const status = String(row[6] || '').trim();
    if (!guru) return;
    if (guruFilter !== 'all' && guru !== guruFilter) return;

    if (!guruStats[guru]) {
      guruStats[guru] = { guru, hadir: 0, sakit: 0, ijin: 0, alpha: 0, libur: 0, total: 0 };
    }

    guruStats[guru].total++;
    switch (status) {
      case 'Hadir': guruStats[guru].hadir++; break;
      case 'Sakit': guruStats[guru].sakit++; break;
      case 'Ijin':  guruStats[guru].ijin++;  break;
      case 'Alpha': guruStats[guru].alpha++; break;
      case 'Libur': guruStats[guru].libur++; break;
    }
  });

  return Object.values(guruStats).map(stat => {
    const nonLibur = stat.total - stat.libur;
    stat.percentage = nonLibur > 0 ? ((stat.hadir / nonLibur) * 100).toFixed(1) : '0.0';
    return stat;
  }).sort((a, b) => parseFloat(b.percentage) - parseFloat(a.percentage));
}

// ============================================================
// FILTER BERDASARKAN PERIODE
// ============================================================
function filterByPeriod(rows, period, month) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const todayStr = Utilities.formatDate(now, TIMEZONE, 'yyyy-MM-dd');

  return rows.filter(row => {
    let tanggal = row[0] instanceof Date ? row[0] : new Date(String(row[0]));
    if (isNaN(tanggal.getTime())) return false;

    const tanggalStr = Utilities.formatDate(tanggal, TIMEZONE, 'yyyy-MM-dd');

    switch (period) {
      case 'today':
        return tanggalStr === todayStr;
      case 'week':
        return tanggal >= new Date(now.getTime() - 7 * 86400000) && tanggal <= now;
      case 'month':
        if (month) return tanggal.getMonth() + 1 === parseInt(month) && tanggal.getFullYear() === currentYear;
        return tanggal.getMonth() === now.getMonth() && tanggal.getFullYear() === currentYear;
      case 'semester':
        const sem = now.getMonth() < 6 ? [1, 6] : [7, 12];
        const rm = tanggal.getMonth() + 1;
        return rm >= sem[0] && rm <= sem[1] && tanggal.getFullYear() === currentYear;
      case 'year':
        return tanggal >= new Date(currentYear, 6, 1) && tanggal <= new Date(currentYear + 1, 5, 30);
      default:
        return true;
    }
  });
}

// ============================================================
// LAPORAN BULANAN OTOMATIS
// ============================================================
function generateMonthlyReport() {
  const rekap = getRekapitulasi('month', 'all');
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const reportSheet = ss.getSheetByName('Laporan Bulanan') || ss.insertSheet('Laporan Bulanan');

  reportSheet.clear();

  const headers = ['No', 'Nama Guru', 'Hadir', 'Sakit', 'Ijin', 'Alpha', 'Libur', 'Total', 'Persentase'];
  reportSheet.getRange(1, 1, 1, 9).setValues([headers])
    .setFontWeight('bold').setBackground('#4f46e5').setFontColor('#ffffff');

  rekap.forEach((row, i) => {
    reportSheet.getRange(i + 2, 1, 1, 9).setValues([[
      i + 1, row.guru, row.hadir, row.sakit, row.ijin, row.alpha, row.libur, row.total, row.percentage + '%'
    ]]);
    if (row.libur > 0) {
      reportSheet.getRange(i + 2, 7).setBackground('#f3e8ff').setFontColor('#6b21a8');
    }
  });

  reportSheet.autoResizeColumns(1, 9);
  reportSheet.setFrozenRows(1);
}

function setupMonthlyTrigger() {
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction() === 'generateMonthlyReport') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('generateMonthlyReport').timeBased().onMonthDay(1).atHour(0).create();
}
