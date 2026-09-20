/**
 * =========================================================
 * Mysuru Civic Connect — Google Sheets backend
 * =========================================================
 * Paste this whole file into the Apps Script editor
 * (Extensions > Apps Script) of a Google Sheet, then deploy
 * it as a Web App.
 *
 * Status flow: PENDING -> ACCEPTED or REJECTED -> COMPLETED
 *
 * This single script is the backend for all three pages:
 *   - report.html      -> action=create              (doPost)
 *   - complaints.html   -> action=list&citizenToken=…  (doGet)
 *   - worker.html       -> action=list                (doGet)
 *                       -> acceptComplaint / rejectComplaint /
 *                          assignWorker / markCompletion / verify (doPost)
 * =========================================================
 */

// ---------------------------------------------------------
// CONFIG
// ---------------------------------------------------------
const url = "https://docs.google.com/spreadsheets/d/1oZPcbxB89sTQAcSzofCIDEJmKg7-_6FQqjzBZxRuvgk/edit";
const ss = SpreadsheetApp.openByUrl(url);
const COMPLAINTS_TAB = 'Complaints';

// Drive folder to store uploaded complaint photos in.
const DRIVE_FOLDER_ID = '1BcGptZlOBSS9fvN4UWWoqpJr3ZCj3NRD';

// ---------------------------------------------------------
// Sheet schema
// ---------------------------------------------------------
// FIELD_KEYS = internal field names used throughout the code.
// HEADER_LABELS = what actually gets printed in row 1 of the sheet.
// Order must match 1:1 between the two arrays.
const FIELD_KEYS = [
  'id', 'timestamp', 'category', 'description', 'locality', 'address',
  'lat', 'lng', 'citizenToken', 'photos', 'status', 'wardId',
  'assignedWorkerId', 'priority', 'community', 'evidence', 'lastUpdated'
];

const HEADER_LABELS = [
  'Complaint ID', 'Timestamp', 'Problem Type', 'Description', 'Locality', 'Address',
  'Latitude', 'Longitude', 'Citizen Token', 'Photos', 'Status', 'Ward ID',
  'Assigned Worker', 'Priority', 'Community Report', 'Evidence Submitted', 'Last Updated'
];

const COL = {}; // {fieldKey: 1-based column index}
FIELD_KEYS.forEach((h, i) => COL[h] = i + 1);

// Status values used throughout the sheet
const STATUS = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
  COMPLETED: 'COMPLETED'
};

// Placeholder jurisdiction engine: maps a citizen-entered locality
// name to one of worker.html's ward IDs. Replace with a real GIS
// boundary lookup later — this keeps the "citizen never picks the
// authority" rule while giving worker.html something to group by.
const LOCALITY_TO_WARD = {
  'Vijayanagar': 4, 'Kuvempunagar': 3, 'Saraswathipuram': 6,
  'Jayalakshmipuram': 6, 'Gokulam': 8, 'Hebbal': 5, 'Hootagalli': 5,
  'Bogadi': 4, 'Dattagalli': 4, 'JP Nagar': 9, 'Bannimantap': 9,
  'Metagalli': 8, 'Rajiv Nagar': 1, 'Udayagiri': 1,
  'Devaraja Mohalla': 2, 'Lakshmipuram': 7, 'Vontikoppal': 2,
  'Yadavgiri': 8, 'Vidyaranyapuram': 10, 'Ramakrishnanagar': 10,
  'Srirampura': 1, 'Alanahalli': 10, 'Kadakola': 10
};

function localityToWard(locality) {
  return LOCALITY_TO_WARD[locality] || 0; // 0 = unmapped / "Other Mysuru Area"
}

// ---------------------------------------------------------
// Entry points
// ---------------------------------------------------------
function doGet(e) {
  try {
    const action = (e.parameter.action || 'list');
    if (action === 'list') return respond(listComplaints(e.parameter));
    if (action === 'get') return respond(getComplaintById(e.parameter.id));
    return respond({ error: 'Unknown action: ' + action });
  } catch (err) {
    return respond({ error: String(err) });
  }
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const action = body.action;
    if (action === 'create') return respond(createComplaint(body));
    if (action === 'acceptComplaint') return respond(setStatus(body.id, STATUS.ACCEPTED));
    if (action === 'rejectComplaint') return respond(setStatus(body.id, STATUS.REJECTED));
    if (action === 'assignWorker') return respond(assignWorker(body));
    if (action === 'markCompletion') return respond(markCompletion(body));
    if (action === 'verify') return respond(verifyComplaint(body));
    return respond({ error: 'Unknown action: ' + action });
  } catch (err) {
    return respond({ error: String(err) });
  }
}

// ---------------------------------------------------------
// Sheet helpers
// ---------------------------------------------------------
function getSheet() {
  let sheet = ss.getSheetByName(COMPLAINTS_TAB);
  if (!sheet) {
    sheet = ss.insertSheet(COMPLAINTS_TAB);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADER_LABELS);
  }
  return sheet;
}

function respond(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function rowToObj(row) {
  const obj = {};
  FIELD_KEYS.forEach((h, i) => obj[h] = row[i]);
  obj.lat = obj.lat === '' ? null : Number(obj.lat);
  obj.lng = obj.lng === '' ? null : Number(obj.lng);
  obj.wardId = obj.wardId === '' ? 0 : Number(obj.wardId);
  obj.community = obj.community === true || obj.community === 'TRUE';
  obj.evidence = obj.evidence === true || obj.evidence === 'TRUE';
  obj.photos = obj.photos ? String(obj.photos).split('|').filter(Boolean) : [];
  return obj;
}

function findRowIndexById(sheet, id) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;
  const ids = sheet.getRange(2, COL.id, lastRow - 1, 1).getValues();
  for (let i = 0; i < ids.length; i++) {
    if (ids[i][0] === id) return i + 2; // +2: header row + 1-based index
  }
  return -1;
}

function generateId() {
  const year = new Date().getFullYear();
  const n = Math.floor(10000 + Math.random() * 89999);
  return 'MYC-' + year + '-' + n;
}

// ---------------------------------------------------------
// Read operations
// ---------------------------------------------------------
function listComplaints(params) {
  const sheet = getSheet();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return { complaints: [] };

  const data = sheet.getRange(2, 1, lastRow - 1, FIELD_KEYS.length).getValues();
  let rows = data.map(rowToObj);

  if (params.citizenToken) {
    rows = rows.filter(r => r.citizenToken === params.citizenToken);
  }
  if (params.status && params.status !== 'All') {
    rows = rows.filter(r => r.status === params.status);
  }
  if (params.wardId && params.wardId !== 'All') {
    rows = rows.filter(r => String(r.wardId) === String(params.wardId));
  }

  rows.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  return { complaints: rows };
}

function getComplaintById(id) {
  const sheet = getSheet();
  const rowIdx = findRowIndexById(sheet, id);
  if (rowIdx === -1) return { error: 'Not found' };
  const row = sheet.getRange(rowIdx, 1, 1, FIELD_KEYS.length).getValues()[0];
  return rowToObj(row);
}

// ---------------------------------------------------------
// Write operations
// ---------------------------------------------------------
function createComplaint(body) {
  const sheet = getSheet();
  const id = generateId();
  const now = new Date().toISOString();

  let photoLinks = [];
  if (DRIVE_FOLDER_ID && body.photos && body.photos.length) {
    const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    body.photos.forEach((p, idx) => {
      try {
        const base64 = p.data.indexOf(',') !== -1 ? p.data.split(',')[1] : p.data;
        const bytes = Utilities.base64Decode(base64);
        const blob = Utilities.newBlob(bytes, p.type || 'image/jpeg', id + '_' + idx + '_' + (p.name || 'photo.jpg'));
        const file = folder.createFile(blob);
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        // uc?export=view serves the raw image bytes, so it works directly
        // in an <img src="..."> tag. file.getUrl() would NOT work here —
        // that returns Drive's HTML viewer page, not the image itself.
        photoLinks.push("https://drive.google.com/uc?export=view&id=" + file.getId());
      } catch (err) {
        // Skip a photo that fails to upload rather than failing the whole complaint
      }
    });
  }

  const wardId = localityToWard(body.locality);

  const row = [];
  row[COL.id - 1] = id;
  row[COL.timestamp - 1] = now;
  row[COL.category - 1] = body.category || '';
  row[COL.description - 1] = body.description || '';
  row[COL.locality - 1] = body.locality || '';
  row[COL.address - 1] = body.address || '';
  row[COL.lat - 1] = body.lat != null ? body.lat : '';
  row[COL.lng - 1] = body.lng != null ? body.lng : '';
  row[COL.citizenToken - 1] = body.citizenToken || '';
  row[COL.photos - 1] = photoLinks.join('|');
  row[COL.status - 1] = STATUS.PENDING;
  row[COL.wardId - 1] = wardId;
  row[COL.assignedWorkerId - 1] = '';
  row[COL.priority - 1] = body.priority || 'medium';
  row[COL.community - 1] = false;
  row[COL.evidence - 1] = false;
  row[COL.lastUpdated - 1] = now;

  sheet.appendRow(row);
  return { ok: true, id: id, status: STATUS.PENDING, wardId: wardId };
}

function setStatus(id, status) {
  const sheet = getSheet();
  const rowIdx = findRowIndexById(sheet, id);
  if (rowIdx === -1) return { error: 'Not found' };
  sheet.getRange(rowIdx, COL.status).setValue(status);
  sheet.getRange(rowIdx, COL.lastUpdated).setValue(new Date().toISOString());
  return { ok: true, id: id, status: status };
}

function assignWorker(body) {
  const sheet = getSheet();
  const rowIdx = findRowIndexById(sheet, body.id);
  if (rowIdx === -1) return { error: 'Not found' };
  sheet.getRange(rowIdx, COL.assignedWorkerId).setValue(body.workerId || '');
  sheet.getRange(rowIdx, COL.lastUpdated).setValue(new Date().toISOString());
  // Assigning a worker does not change status — it stays ACCEPTED until completed.
  return { ok: true, id: body.id, workerId: body.workerId || '' };
}

function markCompletion(body) {
  const sheet = getSheet();
  const rowIdx = findRowIndexById(sheet, body.id);
  if (rowIdx === -1) return { error: 'Not found' };
  // Worker has submitted proof of completion, but an officer still needs to verify it.
  sheet.getRange(rowIdx, COL.evidence).setValue(true);
  sheet.getRange(rowIdx, COL.lastUpdated).setValue(new Date().toISOString());
  return { ok: true, id: body.id, evidence: true };
}

function verifyComplaint(body) {
  const sheet = getSheet();
  const rowIdx = findRowIndexById(sheet, body.id);
  if (rowIdx === -1) return { error: 'Not found' };
  sheet.getRange(rowIdx, COL.status).setValue(STATUS.COMPLETED);
  sheet.getRange(rowIdx, COL.lastUpdated).setValue(new Date().toISOString());
  return { ok: true, id: body.id, status: STATUS.COMPLETED };
}

// ---------------------------------------------------------
// One-time sheet formatting/organization
// ---------------------------------------------------------
// Run this ONCE from the Apps Script editor: select "setupSheet"
// in the function dropdown at the top, then click "Run".
// Safe to re-run any time — it just reapplies formatting.
function setupSheet() {
  const sheet = getSheet();

  // Freeze header row + the ID column
  sheet.setFrozenRows(1);
  sheet.setFrozenColumns(1);

  // Bold, colored header row
  const headerRange = sheet.getRange(1, 1, 1, FIELD_KEYS.length);
  headerRange
    .setValues([HEADER_LABELS])
    .setFontWeight('bold')
    .setBackground('#1f2933')
    .setFontColor('#ffffff')
    .setHorizontalAlignment('center');

  // Reasonable column widths per field
  const widths = {
    id: 130, timestamp: 150, category: 130, description: 260,
    locality: 130, address: 200, lat: 90, lng: 90,
    citizenToken: 160, photos: 220, status: 110, wardId: 70,
    assignedWorkerId: 130, priority: 90, community: 130,
    evidence: 140, lastUpdated: 150
  };
  FIELD_KEYS.forEach((h, i) => {
    sheet.setColumnWidth(i + 1, widths[h] || 120);
  });

  // Wrap long text columns
  sheet.getRange(1, COL.description, sheet.getMaxRows(), 1).setWrap(true);
  sheet.getRange(1, COL.address, sheet.getMaxRows(), 1).setWrap(true);

  // Format timestamp / lastUpdated as readable date-time
  const lastRow = Math.max(sheet.getLastRow(), 2);
  sheet.getRange(2, COL.timestamp, lastRow - 1, 1).setNumberFormat('yyyy-mm-dd hh:mm:ss');
  sheet.getRange(2, COL.lastUpdated, lastRow - 1, 1).setNumberFormat('yyyy-mm-dd hh:mm:ss');

  // Data validation dropdown for status
  const statusValues = [STATUS.PENDING, STATUS.ACCEPTED, STATUS.REJECTED, STATUS.COMPLETED];
  const statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(statusValues, true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange(2, COL.status, sheet.getMaxRows() - 1, 1).setDataValidation(statusRule);

  // Clear old conditional formatting, then color-code status cells
  sheet.clearConditionalFormatRules();
  const statusRange = sheet.getRange(2, COL.status, sheet.getMaxRows() - 1, 1);
  const colorMap = {
    PENDING: '#fff3d6',   // amber
    ACCEPTED: '#dbeafe',  // blue
    REJECTED: '#fbd5d5',  // red
    COMPLETED: '#dff3e3'  // green
  };
  const rules = Object.keys(colorMap).map(status =>
    SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo(status)
      .setBackground(colorMap[status])
      .setRanges([statusRange])
      .build()
  );
  sheet.setConditionalFormatRules(rules);

  // Alternating row banding for readability
  const dataRange = sheet.getRange(1, 1, Math.max(sheet.getLastRow(), 2), FIELD_KEYS.length);
  sheet.getBandings().forEach(b => b.remove());
  dataRange.applyRowBanding(SpreadsheetApp.BandingTheme.LIGHT_GREY, true, false);

  SpreadsheetApp.flush();
}
