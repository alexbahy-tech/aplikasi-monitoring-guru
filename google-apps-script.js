// Google Apps Script untuk Backend Monitoring Kehadiran Guru
// SMK Negeri 1 Maluku Tengah

// SPREADSHEET ID - Ganti dengan ID spreadsheet Anda
const SPREADSHEET_ID = '19yYtluVPOtltTK07RZdfm6eHaoiWI8OlkVKxyGkwAQk';

// Nama sheet untuk data kehadiran
const SHEET_NAME = 'Kehadiran';

/**
 * Handle POST request untuk menyimpan data kehadiran
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    // Validasi data
    if (!data.tanggal || !data.guru || !data.status) {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        message: 'Data tidak lengkap'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Simpan ke Google Sheets
    const result = saveAttendance(data);
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: 'Data berhasil disimpan',
      data: result
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handle GET request untuk mengambil data
 */
function doGet(e) {
  try {
    const action = e.parameter.action || 'stats';
    const period = e.parameter.period || 'month';
    const month = e.parameter.month || new Date().getMonth() + 1;
    const guru = e.parameter.guru || 'all';
    
    let result;
    
    if (action === 'rekap') {
      result = getRekapitulasi(period, guru);
    } else {
      result = getStatistics(period, month);
    }
    
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Simpan data kehadiran ke Google Sheets
 */
function saveAttendance(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);
  
  // Buat sheet jika belum ada
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    // Header
    sheet.getRange(1, 1, 1, 8).setValues([[
      'Tanggal', 'Hari', 'Jam', 'Kelas', 'Guru', 'Mata Pelajaran', 'Status', 'Timestamp'
    ]]);
    sheet.getRange(1, 1, 1, 8).setFontWeight('bold');
    sheet.getRange(1, 1, 1, 8).setBackground('#4f46e5');
    sheet.getRange(1, 1, 1, 8).setFontColor('#ffffff');
  }
  
  // Tambah data baru
  const newRow = [
    data.tanggal,
    data.hari,
    data.jam,
    data.kelas,
    data.guru,
    data.mapel,
    data.status,
    data.timestamp
  ];
  
  sheet.appendRow(newRow);
  
  // Format conditional untuk status
  const lastRow = sheet.getLastRow();
  const statusCell = sheet.getRange(lastRow, 7);
  
  switch(data.status) {
    case 'Hadir':
      statusCell.setBackground('#10b981');
      statusCell.setFontColor('#ffffff');
      break;
    case 'Sakit':
      statusCell.setBackground('#f59e0b');
      statusCell.setFontColor('#ffffff');
      break;
    case 'Ijin':
      statusCell.setBackground('#3b82f6');
      statusCell.setFontColor('#ffffff');
      break;
    case 'Alpha':
      statusCell.setBackground('#ef4444');
      statusCell.setFontColor('#ffffff');
      break;
  }
  
  return {
    row: lastRow,
    data: newRow
  };
}

/**
 * Ambil statistik kehadiran
 */
function getStatistics(period, month) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME);
  
  if (!sheet) {
    return [];
  }
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1);
  
  // Filter berdasarkan periode
  const filteredRows = filterByPeriod(rows, period, month);
  
  // Konversi ke object array
  return filteredRows.map(row => {
    const obj = {};
    headers.forEach((header, index) => {
      obj[header.toLowerCase()] = row[index];
    });
    return obj;
  });
}

/**
 * Ambil rekapitulasi kehadiran
 */
function getRekapitulasi(period, guruFilter) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME);
  
  if (!sheet) {
    return [];
  }
  
  const data = sheet.getDataRange().getValues();
  const rows = data.slice(1); // Skip header
  
  // Filter berdasarkan periode
  const filteredRows = filterByPeriod(rows, period);
  
  // Group by guru
  const guruStats = {};
  
  filteredRows.forEach(row => {
    const guru = row[4]; // Kolom Guru
    const status = row[6]; // Kolom Status
    
    if (guruFilter !== 'all' && guru !== guruFilter) {
      return;
    }
    
    if (!guruStats[guru]) {
      guruStats[guru] = {
        guru: guru,
        hadir: 0,
        sakit: 0,
        ijin: 0,
        alpha: 0,
        total: 0
      };
    }
    
    guruStats[guru].total++;
    
    switch(status) {
      case 'Hadir':
        guruStats[guru].hadir++;
        break;
      case 'Sakit':
        guruStats[guru].sakit++;
        break;
      case 'Ijin':
        guruStats[guru].ijin++;
        break;
      case 'Alpha':
        guruStats[guru].alpha++;
        break;
    }
  });
  
  // Convert to array dan hitung persentase
  const result = Object.values(guruStats).map(stat => {
    stat.percentage = stat.total > 0 
      ? ((stat.hadir / stat.total) * 100).toFixed(1)
      : 0;
    return stat;
  });
  
  // Sort by percentage descending
  result.sort((a, b) => parseFloat(b.percentage) - parseFloat(a.percentage));
  
  return result;
}

/**
 * Filter data berdasarkan periode
 */
function filterByPeriod(rows, period, month) {
  const now = new Date();
  const currentYear = now.getFullYear();
  
  return rows.filter(row => {
    const tanggal = new Date(row[0]); // Kolom Tanggal
    
    if (isNaN(tanggal.getTime())) {
      return false;
    }
    
    switch(period) {
      case 'today':
        return tanggal.toDateString() === now.toDateString();
        
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return tanggal >= weekAgo && tanggal <= now;
        
      case 'month':
        if (month) {
          return tanggal.getMonth() + 1 === parseInt(month) && 
                 tanggal.getFullYear() === currentYear;
        }
        return tanggal.getMonth() === now.getMonth() && 
               tanggal.getFullYear() === currentYear;
        
      case 'semester':
        const currentMonth = now.getMonth() + 1;
        const semester = currentMonth <= 6 ? 1 : 2;
        const semesterStart = semester === 1 ? 1 : 7;
        const semesterEnd = semester === 1 ? 6 : 12;
        const rowMonth = tanggal.getMonth() + 1;
        return rowMonth >= semesterStart && 
               rowMonth <= semesterEnd && 
               tanggal.getFullYear() === currentYear;
        
      case 'year':
        // Tahun pelajaran: Juli - Juni
        const academicYearStart = new Date(currentYear, 6, 1); // 1 Juli
        const academicYearEnd = new Date(currentYear + 1, 5, 30); // 30 Juni tahun depan
        return tanggal >= academicYearStart && tanggal <= academicYearEnd;
        
      default:
        return true;
    }
  });
}

/**
 * Fungsi untuk membuat laporan otomatis (opsional)
 */
function generateMonthlyReport() {
  const rekap = getRekapitulasi('month', 'all');
  
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const reportSheet = ss.getSheetByName('Laporan Bulanan') || 
                      ss.insertSheet('Laporan Bulanan');
  
  // Clear existing data
  reportSheet.clear();
  
  // Headers
  reportSheet.getRange(1, 1, 1, 8).setValues([[
    'No', 'Nama Guru', 'Hadir', 'Sakit', 'Ijin', 'Alpha', 'Total', 'Persentase'
  ]]);
  
  // Format headers
  reportSheet.getRange(1, 1, 1, 8).setFontWeight('bold');
  reportSheet.getRange(1, 1, 1, 8).setBackground('#4f46e5');
  reportSheet.getRange(1, 1, 1, 8).setFontColor('#ffffff');
  
  // Add data
  rekap.forEach((row, index) => {
    reportSheet.getRange(index + 2, 1, 1, 8).setValues([[
      index + 1,
      row.guru,
      row.hadir,
      row.sakit,
      row.ijin,
      row.alpha,
      row.total,
      row.percentage + '%'
    ]]);
  });
  
  // Auto-resize columns
  reportSheet.autoResizeColumns(1, 8);
  
  Logger.log('Laporan bulanan berhasil dibuat!');
}

/**
 * Fungsi untuk set trigger otomatis (jalankan sekali untuk setup)
 */
function setupMonthlyTrigger() {
  // Hapus trigger lama jika ada
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'generateMonthlyReport') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  
  // Buat trigger baru: setiap tanggal 1 jam 00:00
  ScriptApp.newTrigger('generateMonthlyReport')
    .timeBased()
    .onMonthDay(1)
    .atHour(0)
    .create();
    
  Logger.log('Trigger bulanan berhasil dibuat!');
}
