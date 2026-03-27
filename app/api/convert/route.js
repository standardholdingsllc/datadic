import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function cleanPhoneNumber(phone) {
  if (!phone) return '';
  return String(phone).replace(/[^\d\s]/g, '').trim();
}

function formatDOB(dob) {
  if (!dob) return '';
  
  // If it's already a string in YYYY-MM-DD format, return as-is
  if (typeof dob === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dob)) {
    return dob;
  }
  
  // If it's an Excel serial date number, convert it
  if (typeof dob === 'number') {
    const excelEpoch = new Date(1899, 11, 30);
    const date = new Date(excelEpoch.getTime() + dob * 86400000);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  // Try to parse as date string
  const parsed = new Date(dob);
  if (!isNaN(parsed.getTime())) {
    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const day = String(parsed.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  return String(dob);
}

function transformData(inputData) {
  return inputData.map(row => {
    const firstName = row['First Name'] || '';
    const lastName = row['Last Name'] || '';
    const lastName2 = row['Last Name 2'] || '';
    
    const fullLastName = lastName2 ? `${lastName} ${lastName2}` : lastName;
    
    const rawPhone = row['Phone'] || row['Phone1'] || '';
    const cleanedPhone = cleanPhoneNumber(rawPhone);
    
    const rawDOB = row['DOB'] || row['dob'] || row['Date of Birth'] || '';
    
    return {
      identification_number: '',
      first_name: firstName,
      last_name: fullLastName,
      email: row['Email'] || '',
      dob: formatDOB(rawDOB),
      phone_country_code: 52,
      phone: cleanedPhone,
      nationality: 'MX',
      passport_number: row['Passport'] || '',
      occupation: 'FarmerFishermanForester',
      income: 'Between25kAnd50k',
      source_of_income: 'EmploymentOrPayrollIncome',
      address_line1: '',
      address_line2: '',
      city: '',
      state: '',
      zip: ''
    };
  });
}

function arrayToCSV(data) {
  if (!data || data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];
  
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      if (value === null || value === undefined) return '';
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    });
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    
    if (!file) {
      return NextResponse.json(
        { message: 'No file uploaded' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    let workbook;
    try {
      workbook = XLSX.read(buffer, { type: 'buffer' });
    } catch (e) {
      return NextResponse.json(
        { message: 'Failed to parse file. Please ensure it is a valid CSV or Excel file.' },
        { status: 400 }
      );
    }

    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const inputData = XLSX.utils.sheet_to_json(worksheet);

    if (!inputData || inputData.length === 0) {
      return NextResponse.json(
        { message: 'The file appears to be empty or has no data rows.' },
        { status: 400 }
      );
    }

    const requiredColumns = ['First Name', 'Last Name'];
    const firstRow = inputData[0];
    const missingColumns = requiredColumns.filter(col => !(col in firstRow));
    
    if (missingColumns.length > 0) {
      return NextResponse.json(
        { message: `Missing required columns: ${missingColumns.join(', ')}` },
        { status: 400 }
      );
    }

    const transformedData = transformData(inputData);
    const csvContent = arrayToCSV(transformedData);

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="converted.csv"'
      }
    });

  } catch (error) {
    console.error('Conversion error:', error);
    return NextResponse.json(
      { message: 'An error occurred during conversion. Please try again.' },
      { status: 500 }
    );
  }
}

