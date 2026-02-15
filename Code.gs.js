// ============================================================
// Google Apps Script - Backend Monitoring Kehadiran Guru
// SMK Negeri 1 Maluku Tengah
// Versi 2.0 — Dengan Fitur Hari Libur
// ============================================================

// SPREADSHEET ID
const SPREADSHEET_ID = '19yYtluVPOtltTK07RZdfm6eHaoiWI8OlkVKxyGkwAQk';

// Nama sheet
const SHEET_NAME = 'Kehadiran';

// ============================================================
// HANDLE POST — Simpan data kehadiran (termasuk Libur)
// ============================================================
function doPost(e) {
  try {
    let data;
    
    // Handle berbagai format content type
    if (e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else if (e.parameter) {
      data = e.parameter;
    } else {
      return createResponse({ status: 'error', message: 'No data received' });
    }
    
    // Validasi minimal
    if (!data.tanggal || !data.guru || !data.status) {
      return createResponse({ status: 'error', message: 'Data tidak lengkap. Wajib: tanggal, guru, status.' });
    }
    
    // Simpan ke Google Sheets
    const result = saveAttendance(data);
    
    return createResponse({
      status: 'success',
      message: 'Data berhasil disimpan',
      data: result
    });
    
  } catch (error) {
    Logger.log('doPost error: ' + error.toString());
    return createResponse({ status: 'error', message: error.toString() });
  }
}

// ============================================================
// HANDLE GET — Ambil data statistik/rekapitulasi
// ============================================================
function doGet(e) {
  try {
    const action = (e.parameter && e.parameter.action) || 'stats';
    const period = (e.parameter && e.parameter.period) || 'month';
    const month = (e.parameter && e.parameter.month) || (new Date().getMonth() + 1);
    const guru = (e.parameter && e.parameter.guru) || 'all';
    const tanggal = (e.parameter && e.parameter.tanggal) || '';
    
    let result;
    
    if (action === 'rekap') {
      result = getRekapitulasi(period, guru);
    } else if (action === 'check-holiday') {
      result = checkHoliday(tanggal);
    } else {
      result = getStatistics(period, month);
    }
    
    return createResponse(result);
    
  } catch (error) {
    Logger.log('doGet error: ' + error.toString());
    return createResponse({ status: 'error', message: error.toString() });
  }
}

// ============================================================
// HELPER: Buat response JSON dengan CORS headers
// ============================================================
function createResponse(data) {
  const output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

// ============================================================
// SIMPAN DATA KEHADIRAN
// Kolom: Tanggal | Hari | Jam | Kelas | Guru | Mata Pelajaran | Status | Keterangan | Timestamp
// ============================================================
function saveAttendance(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);
  
  // Buat sheet jika belum ada
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    const headers = ['Tanggal', 'Hari', 'Jam', 'Kelas', 'Guru', 'Mata Pelajaran', 'Status', 'Keterangan', 'Timestamp'];
    sheet.getRange(1, 1, 1, 9).setValues([headers]);
    sheet.getRange(1, 1, 1, 9).setFontWeight('bold');
    sheet.getRange(1, 1, 1, 9).setBackground('#4f46e5');
    sheet.getRange(1, 1, 1, 9).setFontColor('#ffffff');
    sheet.setFrozenRows(1);
  }
  
  // MIGRASI: Cek apakah header lama (8 kolom tanpa Keterangan)
  migrateIfNeeded(sheet);
  
  // Tambah data baru
  const newRow = [
    data.tanggal || '',
    data.hari || '',
    data.jam || '',
    data.kelas || '',
    data.guru || '',
    data.mapel || '',
    data.status || '',
    data.keterangan || '',
    data.timestamp || new Date().toISOString()
  ];
  
  sheet.appendRow(newRow);
  
  // Format warna status
  const lastRow = sheet.getLastRow();
  formatStatusCell(sheet, lastRow, data.status);
  
  return {
    row: lastRow,
    status: 'saved'
  };
}

// ============================================================
// FORMAT WARNA STATUS CELL
// ============================================================
function formatStatusCell(sheet, row, status) {
  const statusCell = sheet.getRange(row, 7);
  
  switch(status) {
    case 'Hadir':
      statusCell.setBackground('#10b981').setFontColor('#ffffff');
      break;
    case 'Sakit':
      statusCell.setBackground('#f59e0b').setFontColor('#ffffff');
      break;
    case 'Ijin':
      statusCell.setBackground('#3b82f6').setFontColor('#ffffff');
      break;
    case 'Alpha':
      statusCell.setBackground('#ef4444').setFontColor('#ffffff');
      break;
    case 'Libur':
      statusCell.setBackground('#a855f7').setFontColor('#ffffff');
      // Warnai juga kolom Keterangan
      sheet.getRange(row, 8).setBackground('#f3e8ff').setFontColor('#6b21a8');
      break;
  }
}

// ============================================================
// MIGRASI: Tambah kolom Keterangan jika belum ada
// ============================================================
function migrateIfNeeded(sheet) {
  const lastCol = sheet.getLastColumn();
  if (lastCol < 9) {
    const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    
    // Cek apakah kolom ke-8 adalah 'Timestamp' (berarti belum ada Keterangan)
    if (lastCol === 8 && headers[7] === 'Timestamp') {
      // Insert kolom Keterangan sebelum Timestamp
      sheet.insertColumnAfter(7);
      sheet.getRange(1, 8).setValue('Keterangan');
      sheet.getRange(1, 8).setFontWeight('bold');
      sheet.getRange(1, 8).setBackground('#4f46e5');
      sheet.getRange(1, 8).setFontColor('#ffffff');
      Logger.log('Migrasi berhasil: Kolom Keterangan ditambahkan.');
    }
    
    // Jika hanya 7 kolom atau kurang, tambahkan yang kurang
    if (lastCol < 8) {
      const neededHeaders = ['Tanggal', 'Hari', 'Jam', 'Kelas', 'Guru', 'Mata Pelajaran', 'Status', 'Keterangan', 'Timestamp'];
      for (let i = lastCol; i < 9; i++) {
        sheet.getRange(1, i + 1).setValue(neededHeaders[i]);
        sheet.getRange(1, i + 1).setFontWeight('bold');
        sheet.getRange(1, i + 1).setBackground('#4f46e5');
        sheet.getRange(1, i + 1).setFontColor('#ffffff');
      }
    }
  }
}

// ============================================================
// CEK APAKAH TANGGAL SUDAH DITANDAI LIBUR
// ============================================================
function checkHoliday(tanggal) {
  if (!tanggal) return { isHoliday: false };
  
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME);
  
  if (!sheet || sheet.getLastRow() <= 1) {
    return { isHoliday: false };
  }
  
  const data = sheet.getDataRange().getValues();
  const rows = data.slice(1);
  
  const holidayRows = rows.filter(row => {
    const rowDateStr = normalizeDate(row[0]);
    const status = String(row[6]).trim();
    return rowDateStr === tanggal && status === 'Libur';
  });
  
  if (holidayRows.length > 0) {
    return {
      isHoliday: true,
      count: holidayRows.length,
      keterangan: String(holidayRows[0][7] || '').trim()
    };
  }
  
  return { isHoliday: false };
}

// ============================================================
// AMBIL STATISTIK KEHADIRAN
// ============================================================
function getStatistics(period, month) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME);
  
  if (!sheet || sheet.getLastRow() <= 1) {
    return [];
  }
  
  const data = sheet.getDataRange().getValues();
  const rows = data.slice(1);
  
  const filteredRows = filterByPeriod(rows, period, month);
  
  // Kembalikan sebagai array of objects
  return filteredRows.map(row => ({
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
// REKAPITULASI KEHADIRAN (termasuk Libur)
// ============================================================
function getRekapitulasi(period, guruFilter) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME);
  
  if (!sheet || sheet.getLastRow() <= 1) {
    return [];
  }
  
  const data = sheet.getDataRange().getValues();
  const rows = data.slice(1);
  
  const filteredRows = filterByPeriod(rows, period);
  
  // Group by guru
  const guruStats = {};
  
  filteredRows.forEach(row => {
    const guru = String(row[4] || '').trim();
    const status = String(row[6] || '').trim();
    
    if (!guru) return;
    if (guruFilter !== 'all' && guru !== guruFilter) return;
    
    if (!guruStats[guru]) {
      guruStats[guru] = { guru, hadir:0, sakit:0, ijin:0, alpha:0, libur:0, total:0 };
    }
    
    guruStats[guru].total++;
    
    switch(status) {
      case 'Hadir': guruStats[guru].hadir++; break;
      case 'Sakit': guruStats[guru].sakit++; break;
      case 'Ijin':  guruStats[guru].ijin++;  break;
      case 'Alpha': guruStats[guru].alpha++; break;
      case 'Libur': guruStats[guru].libur++; break;
    }
  });
  
  // Hitung persentase (hadir / total non-libur)
  const result = Object.values(guruStats).map(stat => {
    const totalNonLibur = stat.total - stat.libur;
    stat.percentage = totalNonLibur > 0 
      ? ((stat.hadir / totalNonLibur) * 100).toFixed(1)
      : '0.0';
    return stat;
  });
  
  result.sort((a, b) => parseFloat(b.percentage) - parseFloat(a.percentage));
  
  return result;
}

// ============================================================
// FILTER DATA BERDASARKAN PERIODE
// ============================================================
function filterByPeriod(rows, period, month) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const tz = 'Asia/Jayapura';
  const todayStr = Utilities.formatDate(now, tz, 'yyyy-MM-dd');
  
  return rows.filter(row => {
    let tanggal;
    
    if (row[0] instanceof Date) {
      tanggal = row[0];
    } else {
      tanggal = new Date(String(row[0]));
    }
    
    if (isNaN(tanggal.getTime())) return false;
    
    const tanggalStr = Utilities.formatDate(tanggal, tz, 'yyyy-MM-dd');
    
    switch(period) {
      case 'today':
        return tanggalStr === todayStr;
        
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return tanggal >= weekAgo && tanggal <= now;
        
      case 'month':
        if (month) {
          return tanggal.getMonth() + 1 === parseInt(month) && tanggal.getFullYear() === currentYear;
        }
        return tanggal.getMonth() === now.getMonth() && tanggal.getFullYear() === currentYear;
        
      case 'semester':
        const sem = (now.getMonth() + 1) <= 6 ? 1 : 2;
        const semStart = sem === 1 ? 1 : 7;
        const semEnd = sem === 1 ? 6 : 12;
        const rowMonth = tanggal.getMonth() + 1;
        return rowMonth >= semStart && rowMonth <= semEnd && tanggal.getFullYear() === currentYear;
        
      case 'year':
        const ayStart = new Date(currentYear, 6, 1);
        const ayEnd = new Date(currentYear + 1, 5, 30);
        return tanggal >= ayStart && tanggal <= ayEnd;
        
      default:
        return true;
    }
  });
}

// ============================================================
// NORMALIZE DATE — konversi Date object ke string yyyy-MM-dd
// ============================================================
function normalizeDate(dateVal) {
  if (dateVal instanceof Date) {
    return Utilities.formatDate(dateVal, 'Asia/Jayapura', 'yyyy-MM-dd');
  }
  return String(dateVal || '');
}

// ============================================================
// LAPORAN BULANAN OTOMATIS (termasuk Libur)
// ============================================================
function generateMonthlyReport() {
  const rekap = getRekapitulasi('month', 'all');
  
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const reportSheet = ss.getSheetByName('Laporan Bulanan') || ss.insertSheet('Laporan Bulanan');
  
  reportSheet.clear();
  
  const headers = ['No', 'Nama Guru', 'Hadir', 'Sakit', 'Ijin', 'Alpha', 'Libur', 'Total', 'Persentase'];
  reportSheet.getRange(1, 1, 1, 9).setValues([headers]);
  reportSheet.getRange(1, 1, 1, 9).setFontWeight('bold');
  reportSheet.getRange(1, 1, 1, 9).setBackground('#4f46e5');
  reportSheet.getRange(1, 1, 1, 9).setFontColor('#ffffff');
  
  rekap.forEach((row, index) => {
    reportSheet.getRange(index + 2, 1, 1, 9).setValues([[
      index + 1, row.guru, row.hadir, row.sakit, row.ijin, row.alpha, row.libur, row.total, row.percentage + '%'
    ]]);
    
    if (row.libur > 0) {
      reportSheet.getRange(index + 2, 7).setBackground('#f3e8ff').setFontColor('#6b21a8');
    }
  });
  
  reportSheet.autoResizeColumns(1, 9);
  reportSheet.setFrozenRows(1);
  
  Logger.log('Laporan bulanan berhasil dibuat pada ' + new Date().toISOString());
}

// ============================================================
// SETUP TRIGGER BULANAN
// ============================================================
function setupMonthlyTrigger() {
  ScriptApp.getProjectTriggers().forEach(trigger => {
    if (trigger.getHandlerFunction() === 'generateMonthlyReport') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  
  ScriptApp.newTrigger('generateMonthlyReport')
    .timeBased()
    .onMonthDay(1)
    .atHour(0)
    .create();
    
  Logger.log('Trigger bulanan berhasil dibuat!');
}

// ============================================================
// TEST FUNCTION — Jalankan manual untuk test
// ============================================================
function testSave() {
  const testData = {
    tanggal: '2026-02-15',
    hari: 'Minggu',
    jam: '07:30-09:00',
    kelas: 'X-TKJ',
    guru: 'Test Guru',
    mapel: 'Test Mapel',
    status: 'Libur',
    keterangan: 'Hari Raya Test',
    timestamp: new Date().toISOString()
  };
  
  const result = saveAttendance(testData);
  Logger.log('Test result: ' + JSON.stringify(result));
}
