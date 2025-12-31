import * as XLSX from 'xlsx';
import * as fs from 'fs';

// Quick script to analyze DIAN Excel structure
const excelPath = 'e:\\0DESARROLLO\\studio\\temp-dian-analysis\\39f24ab0-0745-4ef2-a661-7a1e62956dc3.xlsx';
const buffer = fs.readFileSync(excelPath);
const workbook = XLSX.read(buffer);

// Get first sheet
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];

// Convert to JSON
const data = XLSX.utils.sheet_to_json(sheet);

console.log('📊 DIAN Excel Analysis');
console.log('=====================');
console.log(`Sheet Name: ${sheetName}`);
console.log(`Total Rows: ${data.length}`);
console.log('\n📋 Column Names:');
if (data.length > 0) {
    Object.keys(data[0]).forEach((col, idx) => {
        console.log(`  ${idx + 1}. ${col}`);
    });
}
console.log('\n📄 First Row Sample:');
console.log(JSON.stringify(data[0], null, 2));

console.log('\n📄 Second Row Sample:');
if (data.length > 1) {
    console.log(JSON.stringify(data[1], null, 2));
}
