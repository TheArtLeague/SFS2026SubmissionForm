// Google Apps Script — paste this into Extensions > Apps Script in your Google Sheet
// Then: Deploy > Manage deployments > Edit (pencil) > Version: "New version" > Deploy
//
// Supports JSONP (callback parameter) to bypass CORS restrictions.
// action=submit  → writes a new row (entry number assigned server-side)
// (no action)    → returns all rows

function doGet(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var lock = LockService.getScriptLock();
    var callback = e.parameter ? e.parameter.callback : null;
    var result;

    // --- WRITE: action=submit ---
    if (e.parameter && e.parameter.action === 'submit') {
      lock.waitLock(10000);
      var data = e.parameter;

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
      result = { status: 'success', entryNumber: entryNumber };
      return jsonpResponse(callback, result);
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

    result = { status: 'success', submissions: rows };
    return jsonpResponse(callback, result);
  } catch (error) {
    var errResult = { status: 'error', message: error.toString() };
    var cb = (e && e.parameter) ? e.parameter.callback : null;
    return jsonpResponse(cb, errResult);
  }
}

// Returns JSONP if callback is provided, otherwise plain JSON
function jsonpResponse(callback, data) {
  var json = JSON.stringify(data);
  if (callback) {
    return ContentService
      .createTextOutput(callback + '(' + json + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService
    .createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}

function getNextEntryNumber(sheet, type) {
  var startNum = (type === 'faculty') ? 800 : 500;
  var data = sheet.getDataRange().getValues();
  var maxNum = startNum - 1;

  for (var i = 1; i < data.length; i++) {
    var rowType = String(data[i][1]).toLowerCase();
    var rowNum = Number(data[i][0]);
    if (rowType === type && rowNum >= startNum && rowNum > maxNum) {
      maxNum = rowNum;
    }
  }

  return maxNum + 1;
}

// ONE-TIME: Run from editor to renumber students starting at 500.
// Select "renumberStudents" from dropdown, click Run.
function renumberStudents() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = sheet.getDataRange().getValues();
  var rowsToDelete = [];
  for (var i = 1; i < data.length; i++) {
    var firstName = String(data[i][2]).trim();
    if (firstName === 'CurlTest' || firstName === 'TimeoutTest' || firstName === 'NumberTest') {
      rowsToDelete.push(i + 1);
    }
  }
  rowsToDelete.sort(function(a, b) { return b - a; });
  for (var d = 0; d < rowsToDelete.length; d++) {
    sheet.deleteRow(rowsToDelete[d]);
  }
  data = sheet.getDataRange().getValues();
  var studentRows = [];
  for (var i = 1; i < data.length; i++) {
    var rowType = String(data[i][1]).toLowerCase();
    if (rowType === 'student') {
      studentRows.push({ rowIndex: i, submittedAt: String(data[i][15]) });
    }
  }
  studentRows.sort(function(a, b) {
    return a.submittedAt < b.submittedAt ? -1 : (a.submittedAt > b.submittedAt ? 1 : 0);
  });
  for (var s = 0; s < studentRows.length; s++) {
    sheet.getRange(studentRows[s].rowIndex + 1, 1).setValue(500 + s);
  }
  SpreadsheetApp.getUi().alert('Renumbered ' + studentRows.length + ' students (500-' + (499 + studentRows.length) + '). Deleted ' + rowsToDelete.length + ' test rows.');
}
