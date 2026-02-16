// Google Apps Script — paste this into Extensions > Apps Script in your Google Sheet
// This handles both receiving new submissions (POST) and reading all submissions (GET)

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);

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
      data.forSale ? 'Yes' : 'No',
      data.price || '',
      data.signature || '',
      data.date || '',
      data.submittedAt || new Date().toISOString()
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'success', entryNumber: data.entryNumber }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var rows = [];

    for (var i = 1; i < data.length; i++) {
      var row = {};
      for (var j = 0; j < headers.length; j++) {
        row[headers[j]] = data[i][j];
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
