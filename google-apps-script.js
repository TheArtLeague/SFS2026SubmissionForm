// Google Apps Script — paste this into Extensions > Apps Script in your Google Sheet
// Then: Deploy > New deployment > Web app > Execute as "Me" > Access "Anyone"
// IMPORTANT: After pasting, click Deploy > Manage deployments > Edit (pencil) >
//   Version: "New version" > Deploy  — so the live URL picks up the changes.

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    // Support both form-encoded data (e.parameter) and JSON (e.postData)
    var data;
    if (e.parameter && e.parameter.entryNumber) {
      // Form POST — fields arrive in e.parameter
      data = e.parameter;
    } else if (e.postData && e.postData.contents) {
      // JSON POST (fallback)
      data = JSON.parse(e.postData.contents);
    } else {
      throw new Error('No data received');
    }

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
      data.forSale === 'Yes' || data.forSale === true ? 'Yes' : 'No',
      data.price || '',
      data.signature || '',
      data.date || '',
      data.submittedAt || new Date().toISOString()
    ]);

    // Return a simple HTML page (form POSTs can't read JSON responses)
    return HtmlService.createHtmlOutput('<html><body>OK</body></html>');
  } catch (error) {
    return HtmlService.createHtmlOutput('<html><body>Error: ' + error.toString() + '</body></html>');
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
