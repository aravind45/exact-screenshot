const XLSX = require('xlsx');
const workbook = XLSX.readFile('Estate_Path_Combinations_With_Roadmap.xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(worksheet);
console.log(JSON.stringify(data, null, 2));
