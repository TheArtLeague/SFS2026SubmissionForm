// Google Apps Script — paste this into Extensions > Apps Script in your Google Sheet
// Then: Deploy > Manage deployments > Edit (pencil) > Version: "New version" > Deploy
//
// This uses doGet for reading, writing, and assigning entry numbers.
// action=submit  → writes a new row (entry number assigned server-side)
// action=nextNumber&type=student|faculty → returns next available entry number
// (no action)    → returns all rows

function doGet(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var lock = LockService.getScriptLock();

    // --- NEXT NUMBER: action=nextNumber&type=student|faculty ---
    if (e.parameter && e.parameter.action === 'nextNumber') {
      lock.waitLock(10000); // prevent race conditions
      var nextNum = getNextEntryNumber(sheet, e.parameter.type || 'student');
      lock.releaseLock();
      return ContentService
        .createTextOutput(JSON.stringify({ status: 'success', entryNumber: nextNum }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // --- WRITE: action=submit ---
    if (e.parameter && e.parameter.action === 'submit') {
      lock.waitLock(10000);
      var data = e.parameter;

      // Assign entry number server-side if not provided or if placeholder
      var entryNumber = data.entryNumber;
      if (!entryNumber || entryNumber === 'PENDING') {
        entryNumber = getNextEntryNumber(sheet, data.type || 'student');
      }

      sheet.appendRow([
        entryNumber,
        data.type || '',
        data.firstName || '',
        data.lastName || '',
        data.email || '',
        data.phone || '',
        data.teacher || '',
        data.className || '',
        data.department || '',
        data.title || '',
        data.medium || '',
        data.forSale || 'No',
        data.price || '',
        data.signature || '',
        data.date || '',
        data.submittedAt || new Date().toISOString()
      ]);

      lock.releaseLock();

      return ContentService
        .createTextOutput(JSON.stringify({ status: 'success', entryNumber: entryNumber }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // --- READ: return all rows ---
    var allData = sheet.getDataRange().getValues();
    var headers = allData[0];
    var rows = [];

    for (var i = 1; i < allData.length; i++) {
      var row = {};
      for (var j = 0; j < headers.length; j++) {
        row[headers[j]] = allData[i][j];
      }
      rows.push(row);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'success', submissions: rows }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Scans the sheet to find the highest entry number for the given type
// and returns the next one. Students start at 500, faculty at 800.
function getNextEntryNumber(sheet, type) {
  var startNum = (type === 'faculty') ? 800 : 500;
  var data = sheet.getDataRange().getValues();
  var maxNum = startNum - 1; // so first entry will be 500 or 800

  for (var i = 1; i < data.length; i++) {
    var rowType = String(data[i][1]).toLowerCase(); // Type is column B
    var rowNum = Number(data[i][0]); // Entry No. is column A
    if (rowType === type && rowNum >= startNum && rowNum > maxNum) {
      maxNum = rowNum;
    }
  }

  return maxNum + 1;
}
