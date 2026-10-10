const xlsx = require('xlsx');

/**
 * Parses an uploaded Excel buffer into student objects
 * Expected columns: Name, Email, RollNumber, Department, Semester, Section, Batch
 */
const parseStudentsExcel = (buffer) => {
  const workbook = xlsx.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rawData = xlsx.utils.sheet_to_json(sheet);

  return rawData.map((row) => ({
    name: row['Name'] || row['name'] || row['Full Name'] || '',
    email: (row['Email'] || row['email'] || '').toString().trim().toLowerCase(),
    rollNumber: (row['RollNumber'] || row['Roll Number'] || row['rollNumber'] || '').toString().trim().toUpperCase(),
    department: row['Department'] || row['department'] || 'Computer Science',
    semester: Number(row['Semester'] || row['semester'] || 1),
    section: (row['Section'] || row['section'] || 'A').toString().trim().toUpperCase(),
    batch: (row['Batch'] || row['batch'] || '2023-2027').toString().trim(),
    phone: (row['Phone'] || row['phone'] || '').toString().trim(),
  }));
};

/**
 * Generates an Excel buffer from an array of JSON objects
 */
const generateExcelBuffer = (data, sheetTitle = 'Attendance Report') => {
  const worksheet = xlsx.utils.json_to_sheet(data);
  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, worksheet, sheetTitle.substring(0, 31));
  return xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
};

module.exports = {
  parseStudentsExcel,
  generateExcelBuffer,
};
