import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const EXPECTED_HEADERS = [
  'Client ID', 'Client Name', 'Process Date', 'Consulate', 'End Date',
  'Worker ID', 'First Name', 'Last Name', 'Last Name 2', 'State',
  'Phone', 'Phone2', 'Email', 'Passport', 'DOB', 'Status In', 'Needs Y-E', 'Recr. ID'
];

function cleanPhoneNumber(phone) {
  if (!phone) return '';
  return String(phone).replace(/[^\d\s]/g, '').trim();
}

function formatDOB(dob) {
  if (!dob) return '';
  
  const dobStr = String(dob).trim();
  if (!dobStr) return '';
  
  if (/^\d{4}-\d{2}-\d{2}$/.test(dobStr)) {
    return dobStr;
  }
  
  const mdyMatch = dobStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (mdyMatch) {
    const month = mdyMatch[1].padStart(2, '0');
    const day = mdyMatch[2].padStart(2, '0');
    let year = mdyMatch[3];
    
    if (year.length === 2) {
      const yearNum = parseInt(year, 10);
      year = yearNum > 30 ? `19${year}` : `20${year}`;
    }
    
    return `${year}-${month}-${day}`;
  }
  
  const parsed = new Date(dobStr);
  if (!isNaN(parsed.getTime())) {
    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const day = String(parsed.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  return dobStr;
}

function parseTabSeparatedData(rawData) {
  const lines = rawData.trim().split(/\r?\n/).filter(line => line.trim());
  
  if (lines.length === 0) {
    throw new Error('No data provided');
  }
  
  const firstLine = lines[0].split('\t');
  const hasHeaders = firstLine.some(cell => 
    EXPECTED_HEADERS.some(header => 
      cell.trim().toLowerCase() === header.toLowerCase()
    )
  );
  
  let dataLines = lines;
  let headers = EXPECTED_HEADERS;
  
  if (hasHeaders) {
    dataLines = lines.slice(1);
  }
  
  if (dataLines.length === 0) {
    throw new Error('No data rows found');
  }
  
  return dataLines.map(line => {
    const cells = line.split('\t');
    const row = {};
    headers.forEach((header, index) => {
      row[header] = cells[index]?.trim() || '';
    });
    return row;
  });
}

function transformData(inputData) {
  return inputData.map(row => {
    const firstName = row['First Name'] || '';
    const lastName = row['Last Name'] || '';
    const lastName2 = row['Last Name 2'] || '';
    
    const fullLastName = lastName2 ? `${lastName} ${lastName2}` : lastName;
    
    const rawPhone = row['Phone'] || row['Phone2'] || '';
    const cleanedPhone = cleanPhoneNumber(rawPhone);
    
    const rawDOB = row['DOB'] || '';
    
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
    const body = await request.json();
    const { data } = body;
    
    if (!data || typeof data !== 'string' || !data.trim()) {
      return NextResponse.json(
        { message: 'No data provided. Please paste your tab-separated data.' },
        { status: 400 }
      );
    }

    let parsedData;
    try {
      parsedData = parseTabSeparatedData(data);
    } catch (e) {
      return NextResponse.json(
        { message: e.message || 'Failed to parse the pasted data.' },
        { status: 400 }
      );
    }

    if (!parsedData || parsedData.length === 0) {
      return NextResponse.json(
        { message: 'No valid data rows found.' },
        { status: 400 }
      );
    }

    const transformedData = transformData(parsedData);
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
