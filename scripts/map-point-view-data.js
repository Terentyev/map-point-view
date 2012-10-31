/**
 * Main function.
 * Test file extension and load data from file_data by file format.
 */
function MapPointViewLoadData(file_name, file_data) {
  var data = [];
  var ext_pattern = /\.[^.]*$/;
  var ext = ext_pattern.exec(file_name);

  ext = (ext + "").toLowerCase();

  switch (ext) {
    case '.dbf':
      data = MapPointViewLoadData_from_dBase(file_data);
      break;
    case '.csv':
      data = MapPointViewLoadData_from_CSV(file_data);
      break;
    default:
      alert('Unsupported file type: ' + ext);
      return;
  }

  var result = {};
  result.headers = data.shift();
  result.data = data;
  return result;
};

/**
 * Parse file data and extract geodata from dBase (DBF).
 */
function MapPointViewLoadData_from_dBase(file_data) {
  var dbf = new DBF(file_data);
  var data = [];
  var row = [];

  // Collect column names
  for (var i in dbf.fields) {
    row.push(dbf.fields[i].name);
  }
  data.push(row);

  // Collect data
  for (var i in dbf.records) {
    row = [];
    for (var j in dbf.fields) {
      row.push(dbf.records[i][dbf.fields[j].name]);
    }
    data.push(row);
  }

  return data;
}

/**
 * Parse file data and extract geodata from CSV.
 */
function MapPointViewLoadData_from_CSV(file_data) {
  var data = CSVToArray(file_data);
  data.pop();
  return data;
}
