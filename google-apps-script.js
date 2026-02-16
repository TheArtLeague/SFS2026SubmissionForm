// Google Apps Script — paste this into Extensions > Apps Script in your Google Sheet
// Then: Deploy > Manage deployments > Edit (pencil) > Version: "New version" > Deploy
//
// This uses doGet for BOTH reading and writing to avoid CORS issues.
// When action=submit is passed, it writes a new row. Otherwise it reads all rows.

function doGet(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    // --- WRITE: action=submit ---
    if (e.parameter && e.parameter.action === 'submit') {
      var data = e.parameter;
      sheet.appendRow([
        data.entryNumber || '',
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

      return ContentService
        .createTextOutput(JSON.stringify({ status: 'success', entryNumber: data.entryNumber }))
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
