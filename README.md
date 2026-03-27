# Griffin Data Converter

A web tool to convert worker data files from the input format to the required output format.

## Features

- Upload CSV or Excel files (.csv, .xlsx, .xls)
- Automatic transformation to the required output format
- Download converted data as CSV
- Drag & drop file upload
- Deployed on Vercel

## Input Format

The tool expects files with these columns:
- Client ID
- Client Name
- Process Date
- Consulate
- End Date
- Worker ID
- First Name
- Last Name
- Last Name 2
- State
- Phone
- Phone2
- Email
- Passport
- DOB
- Status In
- Needs Y-E
- Recr. ID

## Output Format

The converted CSV will have these columns:
- identification_number (empty)
- first_name
- last_name (combines Last Name + Last Name 2)
- email
- dob (empty)
- phone_country_code (52)
- phone (cleaned, letters removed)
- nationality (MX)
- passport_number
- occupation (FarmerFishermanForester)
- income (Between25kAnd50k)
- source_of_income (EmploymentOrPayrollIncome)
- address_line1 (empty)
- address_line2 (empty)
- city (empty)
- state (empty)
- zip (empty)

## Deployment to Vercel

1. Push this folder to a GitHub repository
2. Go to [vercel.com](https://vercel.com) and sign in
3. Click "New Project"
4. Import your GitHub repository
5. Vercel will auto-detect Next.js and configure the build
6. Click "Deploy"

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to use the converter.
