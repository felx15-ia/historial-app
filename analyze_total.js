const xlsx = require('xlsx');
const fs = require('fs');

try {
  const workbook = xlsx.readFile('total.xlsx');
  console.log("Sheet names:", workbook.SheetNames);
  
  const sheetName = 'total';
  const worksheet = workbook.Sheets[sheetName];
  
  const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
  console.log(`\nTotal Rows in ${sheetName}:`, data.length);
  
  if (data.length > 2) {
    const row = data[2];
    row.forEach((col, index) => {
      console.log(`Index ${index}:`, col);
    });
  }
} catch (error) {
  console.error("Error reading file:", error);
}
